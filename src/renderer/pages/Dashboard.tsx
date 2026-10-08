import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LogIn, UserPlus } from 'lucide-react';
import type { Customer, CustomerDetails, Product, RoomType, SessionRow, SettingsMap } from '../../shared/types';
import { useLang } from '../App';
import { Modal, SubscriptionAlert, LiveTimer, fmtMoney } from '../components/ui';

export default function Dashboard() {
  const { tr } = useLang();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [search, setSearch] = useState('');
  const [checkInTarget, setCheckInTarget] = useState<CustomerDetails | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<SessionRow | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const currency = settings.currency || 'EGP';

  const load = async () => {
    const [s, c, r, st] = await Promise.all([
      window.api.sessions.active(),
      window.api.customers.list(),
      window.api.rooms.list(),
      window.api.settings.get(),
    ]);
    setSessions(s); setCustomers(c); setRooms(r); setSettings(st);
  };
  useEffect(() => { load().catch((e) => toast.error(String(e))); }, []);

  const activeIds = useMemo(() => new Set(sessions.map((s) => s.customer_id)), [sessions]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q));
  }, [customers, search]);

  const openCheckIn = async (c: Customer) => {
    try { setCheckInTarget(await window.api.customers.details(c.id)); }
    catch (e) { toast.error(String(e)); }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">{tr('dashboard')}</div>
          <div className="muted">{new Date().toLocaleDateString()}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewCustomer(true)}>
          <UserPlus size={17} /> {tr('newCustomer')}
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">{tr('activeNow')}</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{tr('totalCustomers')}</div>
          <div className="stat-value">{customers.length}</div>
        </div>
      </div>

      <div className="section-title">{tr('activeNow')}</div>
      {sessions.length === 0 ? (
        <div className="card empty">{tr('noActiveSessions')}</div>
      ) : (
        <div className="grid">
          {sessions.map((s) => (
            <div className="session-card" key={s.id}>
              <div className="top">
                <h3>{s.customer_name}</h3>
                {!!s.is_subscriber && <span className="badge green">{tr('subscriber')}</span>}
              </div>
              <LiveTimer since={s.check_in_time} />
              <div className="meta">
                <span>{tr('room')}: {s.room_name}</span>
                <span>{tr('inTime')}: {s.check_in_time}</span>
                {!s.is_subscriber && <span>{tr('rate')}: {fmtMoney(s.hourly_rate, currency)}/{tr('visitHours')}</span>}
              </div>
              <button className="btn btn-green btn-block" onClick={() => setCheckoutTarget(s)}>
                {tr('checkOut')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">{tr('checkIn')}</div>
      <div className="card">
        <input className="search-box" placeholder={tr('searchCustomer')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid" style={{ marginTop: 14 }}>
          {filtered.slice(0, 24).map((c) => (
            <div className="session-card" key={c.id}>
              <div className="top">
                <h3>{c.name}</h3>
                {activeIds.has(c.id) && <span className="badge blue">{tr('activeNow')}</span>}
              </div>
              <div className="meta" style={{ marginTop: 8 }}>
                {c.phone && <span>📞 {c.phone}</span>}
              </div>
              <button className="btn btn-primary btn-block" disabled={activeIds.has(c.id)} onClick={() => openCheckIn(c)}>
                <LogIn size={16} /> {activeIds.has(c.id) ? tr('alreadyCheckedIn') : tr('checkIn')}
              </button>
            </div>
          ))}
          {customers.length === 0 && <div className="empty">{tr('emptyCustomers')}</div>}
        </div>
      </div>

      {checkInTarget && (
        <CheckInModal
          details={checkInTarget}
          rooms={rooms}
          currency={currency}
          onClose={() => setCheckInTarget(null)}
          onDone={() => { setCheckInTarget(null); load(); }}
        />
      )}
      {checkoutTarget && (
        <CheckoutModal
          session={checkoutTarget}
          currency={currency}
          onClose={() => setCheckoutTarget(null)}
          onDone={() => { setCheckoutTarget(null); load(); }}
        />
      )}
      {showNewCustomer && (
        <NewCustomerModal onClose={() => setShowNewCustomer(false)} onDone={() => { setShowNewCustomer(false); load(); }} />
      )}
    </div>
  );
}

function CheckInModal({ details, rooms, currency, onClose, onDone }: {
  details: CustomerDetails; rooms: RoomType[]; currency: string;
  onClose: () => void; onDone: () => void;
}) {
  const { tr } = useLang();
  const [roomId, setRoomId] = useState<number>(rooms[0]?.id ?? 0);
  const [busy, setBusy] = useState(false);

  const doCheckIn = async () => {
    setBusy(true);
    try {
      await window.api.sessions.checkIn({ customerId: details.customer.id, roomTypeId: roomId });
      toast.success(tr('checkedInOk'));
      onDone();
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={`${tr('checkIn')} — ${details.customer.name}`} onClose={onClose}>
      <SubscriptionAlert sub={details.activeSubscription} />
      {details.totalDebt > 0 && (
        <div className="alert-strip danger">💰 {tr('totalDebt')}: {fmtMoney(details.totalDebt, currency)}</div>
      )}
      {details.notes.filter((n) => !n.is_debt).slice(0, 3).map((n) => (
        <div className="alert-strip warn" key={n.id}>📝 {n.note}</div>
      ))}
      <label className="field">
        {tr('selectRoom')}
        <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {fmtMoney(r.hourly_rate, currency)}/{tr('visitHours')}
              {details.activeSubscription ? ` (${tr('freeTimeSub')})` : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>{tr('cancel')}</button>
        <button className="btn btn-primary" disabled={busy || !roomId} onClick={doCheckIn}>
          <LogIn size={16} /> {tr('checkIn')}
        </button>
      </div>
    </Modal>
  );
}

function CheckoutModal({ session, currency, onClose, onDone }: {
  session: SessionRow; currency: string; onClose: () => void; onDone: () => void;
}) {
  const { tr } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [receipt, setReceipt] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { window.api.products.list().then(setProducts).catch((e) => toast.error(String(e))); }, []);

  const mins = Math.max(1, Math.floor((Date.now() - new Date(session.check_in_time.replace(' ', 'T')).getTime()) / 60000));
  const timeCharge = session.is_subscriber ? 0 : Math.round((mins / 60) * session.hourly_rate * 100) / 100;
  const itemsTotal = products.reduce((sum, p) => sum + (qty[p.id] || 0) * p.price, 0);
  const total = Math.round((timeCharge + itemsTotal) * 100) / 100;

  const changeQty = (id: number, delta: number, max: number) =>
    setQty((q) => ({ ...q, [id]: Math.min(max, Math.max(0, (q[id] || 0) + delta)) }));

  const confirm = async () => {
    setBusy(true);
    try {
      const items = Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ productId: Number(id), quantity: q }));
      const result = await window.api.sessions.checkout({ sessionId: session.id, items });
      setReceipt(result);
      toast.success(tr('checkedOutOk'));
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  };

  if (receipt) {
    return (
      <Modal title={`🧾 ${tr('receipt')}`} onClose={onDone}>
        <div className="totals">
          <div className="row"><span>{tr('customer')}</span><b>{session.customer_name}</b></div>
          <div className="row"><span>{tr('duration')}</span><b>{Math.floor(receipt.durationMinutes / 60)}h {receipt.durationMinutes % 60}m</b></div>
          <div className="row"><span>{tr('timeCharge')}</span>
            <b className={receipt.isSubscriber ? 'free-line' : ''}>
              {receipt.isSubscriber ? tr('freeTimeSub') : fmtMoney(receipt.timeCharge, currency)}
            </b>
          </div>
          <div className="row"><span>{tr('items')}</span><b>{fmtMoney(receipt.productsCharge, currency)}</b></div>
          <div className="row grand"><span>{tr('total')}</span><span>{fmtMoney(receipt.total, currency)}</span></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onDone}>{tr('close')}</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`${tr('checkoutTitle')} — ${session.customer_name}`} onClose={onClose} wide>
      <div className="row muted" style={{ marginBottom: 10 }}>
        <span>{tr('inTime')}: {session.check_in_time}</span>
        <span>·</span>
        <span>{tr('duration')}: {Math.floor(mins / 60)}h {mins % 60}m</span>
      </div>
      {!!session.is_subscriber && <div className="alert-strip ok">✅ {tr('freeTimeSub')}</div>}

      <div className="section-title" style={{ marginTop: 4 }}>{tr('items')}</div>
      {products.map((p) => (
        <div className="item-row" key={p.id}>
          <span>{p.name} <span className="muted">({fmtMoney(p.price, currency)} · {tr('stock')}: {p.stock})</span></span>
          <div className="qty-ctrl">
            <button onClick={() => changeQty(p.id, -1, p.stock)} disabled={!qty[p.id]}>−</button>
            <b className="mono" style={{ minWidth: 22, textAlign: 'center' }}>{qty[p.id] || 0}</b>
            <button onClick={() => changeQty(p.id, 1, p.stock)} disabled={(qty[p.id] || 0) >= p.stock}>+</button>
          </div>
        </div>
      ))}

      <div className="totals">
        <div className="row">
          <span>{tr('timeCharge')} ({Math.floor(mins / 60)}h {mins % 60}m)</span>
          <b className={session.is_subscriber ? 'free-line' : ''}>
            {session.is_subscriber ? tr('freeTimeSub') : fmtMoney(timeCharge, currency)}
          </b>
        </div>
        <div className="row"><span>{tr('items')}</span><b>{fmtMoney(itemsTotal, currency)}</b></div>
        <div className="row grand"><span>{tr('total')}</span><span>{fmtMoney(total, currency)}</span></div>
      </div>

      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>{tr('cancel')}</button>
        <button className="btn btn-green" disabled={busy} onClick={confirm}>{tr('confirmCheckout')}</button>
      </div>
    </Modal>
  );
}

export function NewCustomerModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { tr } = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error(tr('name'));
    setBusy(true);
    try {
      await window.api.customers.create({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      toast.success(tr('saved'));
      onDone();
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={tr('newCustomer')} onClose={onClose}>
      <label className="field">{tr('name')} *<input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
      <label className="field">{tr('phone')}<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <label className="field">{tr('email')}<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>{tr('cancel')}</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{tr('save')}</button>
      </div>
    </Modal>
  );
}
