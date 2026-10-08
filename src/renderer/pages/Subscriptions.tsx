import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { differenceInDays, parseISO } from 'date-fns';
import type { Customer, SettingsMap, Subscription } from '../../shared/types';
import { useLang } from '../App';
import { Modal, fmtMoney } from '../components/ui';

export default function Subscriptions() {
  const { tr } = useLang();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [currency, setCurrency] = useState('EGP');

  const load = () => window.api.subscriptions.list().then(setSubs).catch((e) => toast.error(String(e)));
  useEffect(() => {
    load();
    window.api.settings.get().then((s) => setCurrency(s.currency || 'EGP'));
  }, []);

  const deactivate = async (id: number) => {
    try { await window.api.subscriptions.deactivate(id); toast.success(tr('saved')); load(); }
    catch (e) { toast.error(String(e)); }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-title">{tr('subscriptions')}</div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ {tr('newSubscription')}</button>
      </div>
      <table className="list">
        <thead>
          <tr>
            <th>{tr('customer')}</th><th>{tr('subscriptions')}</th><th>{tr('startDate')}</th>
            <th>{tr('endDate')}</th><th>{tr('price')}</th><th>{tr('status')}</th><th></th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => {
            const daysLeft = differenceInDays(parseISO(s.end_date), new Date());
            const active = !!s.is_active && daysLeft >= 0;
            return (
              <tr key={s.id}>
                <td><b>{s.customer_name}</b></td>
                <td>{tr(s.type)}</td>
                <td className="mono">{s.start_date}</td>
                <td className="mono">{s.end_date}</td>
                <td>{fmtMoney(s.price, currency)}</td>
                <td>
                  {active ? (
                    daysLeft <= 3
                      ? <span className="badge amber">{tr('subEndsIn')} {daysLeft} {tr('days')}</span>
                      : <span className="badge green">{tr('active')}</span>
                  ) : (
                    <span className="badge red">{tr('inactive')}</span>
                  )}
                </td>
                <td style={{ textAlign: 'end' }}>
                  {active && <button className="btn btn-red btn-sm" onClick={() => deactivate(s.id)}>{tr('cancel')}</button>}
                </td>
              </tr>
            );
          })}
          {subs.length === 0 && <tr><td colSpan={7} className="empty">—</td></tr>}
        </tbody>
      </table>
      {showNew && <NewSubModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function NewSubModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { tr } = useLang();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [customerId, setCustomerId] = useState(0);
  const [type, setType] = useState<Subscription['type']>('monthly');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([window.api.customers.list(), window.api.settings.get()]).then(([c, s]) => {
      setCustomers(c); setSettings(s);
    }).catch((e) => toast.error(String(e)));
  }, []);

  useEffect(() => {
    const key = type === 'weekly' ? 'sub_weekly_price' : type === 'biweekly' ? 'sub_biweekly_price' : 'sub_monthly_price';
    setPrice(settings[key] || '');
  }, [type, settings]);

  const save = async () => {
    if (!customerId) return;
    setBusy(true);
    try {
      await window.api.subscriptions.create({ customerId, type, price: parseFloat(price) || 0 });
      toast.success(tr('saved'));
      onDone();
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={tr('newSubscription')} onClose={onClose}>
      <label className="field">{tr('customer')}
        <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}>
          <option value={0}>—</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="field">{tr('subscriptions')}
        <select value={type} onChange={(e) => setType(e.target.value as Subscription['type'])}>
          <option value="weekly">{tr('weekly')}</option>
          <option value="biweekly">{tr('biweekly')}</option>
          <option value="monthly">{tr('monthly')}</option>
        </select>
      </label>
      <label className="field">{tr('price')}<input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
      <p className="muted">{tr('startDate')}: {new Date().toISOString().slice(0, 10)}</p>
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>{tr('cancel')}</button>
        <button className="btn btn-primary" disabled={busy || !customerId} onClick={save}>{tr('save')}</button>
      </div>
    </Modal>
  );
}
