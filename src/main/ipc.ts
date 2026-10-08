import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { getDb, getDbPath } from './db';
import { addDays, addMonths, format } from 'date-fns';
import type { CheckoutItem, Subscription } from '../shared/types';

function activeSubFor(db: ReturnType<typeof getDb>, customerId: number) {
  return db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE customer_id = ? AND is_active = 1
         AND date('now','localtime') BETWEEN date(start_date) AND date(end_date)
       ORDER BY end_date DESC LIMIT 1`
    )
    .get(customerId) as Subscription | undefined;
}

export function registerIpc() {
  const db = getDb();

  // ---------- Customers ----------
  ipcMain.handle('customers:list', () =>
    db.prepare('SELECT * FROM customers ORDER BY name').all()
  );

  ipcMain.handle('customers:create', (_e, d: { name: string; phone?: string; email?: string }) => {
    if (!d.name?.trim()) throw new Error('Name is required');
    const info = db
      .prepare('INSERT INTO customers (name, phone, email) VALUES (?,?,?)')
      .run(d.name.trim(), d.phone || null, d.email || null);
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
  });

  ipcMain.handle('customers:update', (_e, d: { id: number; name: string; phone?: string; email?: string }) => {
    db.prepare('UPDATE customers SET name=?, phone=?, email=? WHERE id=?').run(
      d.name.trim(), d.phone || null, d.email || null, d.id
    );
  });

  ipcMain.handle('customers:remove', (_e, id: number) => {
    const open = db
      .prepare("SELECT COUNT(*) c FROM sessions WHERE customer_id=? AND status='active'")
      .get(id) as { c: number };
    if (open.c > 0) throw new Error('Customer has an active session. Check them out first.');
    db.prepare('DELETE FROM customers WHERE id=?').run(id);
  });

  ipcMain.handle('customers:details', (_e, id: number) => {
    const customer = db.prepare('SELECT * FROM customers WHERE id=?').get(id);
    if (!customer) throw new Error('Customer not found');
    const activeSubscription = activeSubFor(db, id) || null;
    const notes = db
      .prepare('SELECT * FROM customer_notes WHERE customer_id=? ORDER BY created_at DESC')
      .all(id);
    const debt = db
      .prepare('SELECT COALESCE(SUM(debt_amount),0) t FROM customer_notes WHERE customer_id=? AND is_debt=1')
      .get(id) as { t: number };
    return { customer, activeSubscription, notes, totalDebt: debt.t };
  });

  ipcMain.handle(
    'customers:addNote',
    (_e, d: { customerId: number; note: string; isDebt: boolean; debtAmount: number }) => {
      db.prepare(
        'INSERT INTO customer_notes (customer_id, note, is_debt, debt_amount) VALUES (?,?,?,?)'
      ).run(d.customerId, d.note, d.isDebt ? 1 : 0, d.debtAmount || 0);
    }
  );

  ipcMain.handle('customers:deleteNote', (_e, id: number) => {
    db.prepare('DELETE FROM customer_notes WHERE id=?').run(id);
  });

  ipcMain.handle('customers:clearDebt', (_e, noteId: number) => {
    db.prepare('UPDATE customer_notes SET is_debt=0, debt_amount=0 WHERE id=?').run(noteId);
  });

  // ---------- Sessions ----------
  ipcMain.handle('sessions:active', () =>
    db
      .prepare(
        `SELECT s.*, c.name AS customer_name, r.name AS room_name
         FROM sessions s
         JOIN customers c ON c.id = s.customer_id
         JOIN room_types r ON r.id = s.room_type_id
         WHERE s.status='active' ORDER BY s.check_in_time`
      )
      .all()
  );

  ipcMain.handle('sessions:history', (_e, limit = 200) =>
    db
      .prepare(
        `SELECT s.*, c.name AS customer_name, r.name AS room_name
         FROM sessions s
         JOIN customers c ON c.id = s.customer_id
         JOIN room_types r ON r.id = s.room_type_id
         ORDER BY s.check_in_time DESC LIMIT ?`
      )
      .all(limit)
  );

  ipcMain.handle('sessions:checkIn', (_e, d: { customerId: number; roomTypeId: number }) => {
    const existing = db
      .prepare("SELECT id FROM sessions WHERE customer_id=? AND status='active'")
      .get(d.customerId);
    if (existing) throw new Error('Customer is already checked in.');

    const room = db.prepare('SELECT * FROM room_types WHERE id=? AND is_active=1').get(d.roomTypeId) as
      | { hourly_rate: number }
      | undefined;
    if (!room) throw new Error('Invalid room type');

    const sub = activeSubFor(db, d.customerId);
    const isSub = sub ? 1 : 0;

    const info = db
      .prepare(
        `INSERT INTO sessions (customer_id, room_type_id, hourly_rate, is_subscriber)
         VALUES (?,?,?,?)`
      )
      .run(d.customerId, d.roomTypeId, room.hourly_rate, isSub);
    return { id: Number(info.lastInsertRowid), isSubscriber: !!sub };
  });

  ipcMain.handle('sessions:checkout', (_e, d: { sessionId: number; items: CheckoutItem[] }) => {
    const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(d.sessionId) as any;
    if (!session) throw new Error('Session not found');
    if (session.status !== 'active') throw new Error('Session already completed');

    const tx = db.transaction(() => {
      const row = db
        .prepare(
          `SELECT CAST((julianday(datetime('now','localtime')) - julianday(check_in_time)) * 1440 AS INTEGER) AS mins
           FROM sessions WHERE id=?`
        )
        .get(d.sessionId) as { mins: number };
      const mins = Math.max(1, row.mins);

      // Subscribers: time is free. Otherwise round up to the started half hour? Keep simple: per-minute rate.
      const timeCharge = session.is_subscriber
        ? 0
        : Math.round(((mins / 60) * session.hourly_rate) * 100) / 100;

      let productsCharge = 0;
      const insItem = db.prepare(
        'INSERT INTO session_products (session_id, product_id, quantity, unit_price) VALUES (?,?,?,?)'
      );
      const decStock = db.prepare(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
      );
      const getP = db.prepare('SELECT * FROM products WHERE id=? AND is_active=1');

      for (const item of d.items) {
        if (item.quantity <= 0) continue;
        const p = getP.get(item.productId) as any;
        if (!p) throw new Error(`Product ${item.productId} not found`);
        const res = decStock.run(item.quantity, item.productId, item.quantity);
        if (res.changes === 0) throw new Error(`Not enough stock for ${p.name}`);
        insItem.run(d.sessionId, item.productId, item.quantity, p.price);
        productsCharge += p.price * item.quantity;
      }

      productsCharge = Math.round(productsCharge * 100) / 100;
      const total = Math.round((timeCharge + productsCharge) * 100) / 100;

      db.prepare(
        `UPDATE sessions SET check_out_time = datetime('now','localtime'),
           duration_minutes=?, time_charge=?, products_charge=?, total_amount=?, status='completed'
         WHERE id=?`
      ).run(mins, timeCharge, productsCharge, total, d.sessionId);

      return {
        sessionId: d.sessionId,
        durationMinutes: mins,
        timeCharge,
        productsCharge,
        total,
        isSubscriber: !!session.is_subscriber,
      };
    });

    return tx();
  });

  // ---------- Subscriptions ----------
  ipcMain.handle('subs:list', () =>
    db
      .prepare(
        `SELECT s.*, c.name AS customer_name FROM subscriptions s
         JOIN customers c ON c.id = s.customer_id
         ORDER BY s.created_at DESC LIMIT 300`
      )
      .all()
  );

  ipcMain.handle(
    'subs:create',
    (_e, d: { customerId: number; type: Subscription['type']; price: number }) => {
      const today = new Date();
      const end =
        d.type === 'weekly' ? addDays(today, 7) : d.type === 'biweekly' ? addDays(today, 14) : addMonths(today, 1);
      const startStr = format(today, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');
      // Deactivate old subscriptions for this customer
      db.prepare('UPDATE subscriptions SET is_active=0 WHERE customer_id=? AND is_active=1').run(d.customerId);
      const info = db
        .prepare(
          'INSERT INTO subscriptions (customer_id, type, start_date, end_date, price, is_active) VALUES (?,?,?,?,?,1)'
        )
        .run(d.customerId, d.type, startStr, endStr, d.price || 0);
      return db.prepare('SELECT * FROM subscriptions WHERE id=?').get(info.lastInsertRowid);
    }
  );

  ipcMain.handle('subs:deactivate', (_e, id: number) => {
    db.prepare('UPDATE subscriptions SET is_active=0 WHERE id=?').run(id);
  });

  // ---------- Products ----------
  ipcMain.handle('products:list', () =>
    db.prepare('SELECT * FROM products WHERE is_active=1 ORDER BY category, name').all()
  );

  ipcMain.handle(
    'products:create',
    (_e, d: { name: string; category: string; price: number; stock: number }) => {
      const info = db
        .prepare('INSERT INTO products (name, category, price, stock) VALUES (?,?,?,?)')
        .run(d.name, d.category || 'drink', d.price, d.stock || 0);
      return db.prepare('SELECT * FROM products WHERE id=?').get(info.lastInsertRowid);
    }
  );

  ipcMain.handle('products:update', (_e, d: { id: number; name: string; category: string; price: number }) => {
    db.prepare('UPDATE products SET name=?, category=?, price=? WHERE id=?').run(
      d.name, d.category, d.price, d.id
    );
  });

  ipcMain.handle('products:restock', (_e, id: number, qty: number) => {
    db.prepare('UPDATE products SET stock = stock + ? WHERE id=?').run(qty, id);
  });

  ipcMain.handle('products:remove', (_e, id: number) => {
    db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(id);
  });

  // ---------- Rooms ----------
  ipcMain.handle('rooms:list', () =>
    db.prepare('SELECT * FROM room_types WHERE is_active=1 ORDER BY hourly_rate').all()
  );

  ipcMain.handle('rooms:updateRate', (_e, id: number, rate: number) => {
    db.prepare('UPDATE room_types SET hourly_rate=? WHERE id=?').run(rate, id);
  });

  // ---------- Settings ----------
  ipcMain.handle('settings:get', () => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  });

  ipcMain.handle('settings:set', (_e, key: string, value: string) => {
    db.prepare('INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
  });

  // ---------- Reports ----------
  ipcMain.handle('reports:summary', (_e, from: string, to: string) => {
    const totals = db
      .prepare(
        `SELECT COALESCE(SUM(total_amount),0) totalRevenue,
                COALESCE(SUM(time_charge),0) timeRevenue,
                COALESCE(SUM(products_charge),0) productsRevenue,
                COUNT(*) sessionCount
         FROM sessions
         WHERE status='completed' AND date(check_in_time) BETWEEN date(?) AND date(?)`
      )
      .get(from, to) as any;
    const daily = db
      .prepare(
        `SELECT date(check_in_time) AS day,
                COALESCE(SUM(total_amount),0) AS revenue,
                COUNT(*) AS sessions
         FROM sessions
         WHERE status='completed' AND date(check_in_time) BETWEEN date(?) AND date(?)
         GROUP BY date(check_in_time) ORDER BY day DESC`
      )
      .all(from, to);
    return {
      totalRevenue: totals.totalRevenue,
      timeRevenue: totals.timeRevenue,
      productsRevenue: totals.productsRevenue,
      sessionCount: totals.sessionCount,
      avgSession: totals.sessionCount ? totals.totalRevenue / totals.sessionCount : 0,
      daily,
    };
  });

  // ---------- Backup ----------
  ipcMain.handle('db:backup', async () => {
    const win = BrowserWindow.getAllWindows()[0];
    const res = await dialog.showSaveDialog(win, {
      title: 'Backup database',
      defaultPath: `library-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.db`,
      filters: [{ name: 'SQLite DB', extensions: ['db'] }],
    });
    if (res.canceled || !res.filePath) return null;
    fs.copyFileSync(getDbPath(), res.filePath);
    return res.filePath;
  });
}
