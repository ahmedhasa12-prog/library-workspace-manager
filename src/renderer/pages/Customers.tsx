import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, StickyNote, Trash2 } from 'lucide-react';
import type { Customer, CustomerDetails } from '../../shared/types';
import { useLang } from '../App';
import { Modal, SubscriptionAlert, fmtMoney } from '../components/ui';
import { NewCustomerModal } from './Dashboard';

export default function Customers() {
  const { tr } = useLang();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [currency, setCurrency] = useState('EGP');

  const load = () => window.api.customers.list().then(setCustomers).catch((e) => toast.error(String(e)));
  useEffect(() => {
    load();
    window.api.settings.get().then((s) => setCurrency(s.currency || 'EGP'));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q ? customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)) : customers;

  const remove = async (c: Customer) => {
    if (!confirm(tr('confirmDelete'))) return;
    try { await window.api.customers.remove(c.id); toast.success(tr('deleted')); load(); }
    catch (e) { toast.error(String(e)); }
  };

  const openDetails = async (id: number) => {
    try { setDetails(await window.api.customers.details(id)); } catch (e) { toast.error(String(e)); }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-title">{tr('customers')}</div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><UserPlus size={17} /> {tr('newCustomer')}</button>
      </div>
      <input className="search-box" style={{ marginBottom: 16 }} placeholder={tr('searchCustomer')} value={search} onChange={(e) => setSearch(e.target.value)} />

      <table className="list">
        <thead><tr><th>{tr('name')}</th><th>{tr('phone')}</th><th>{tr('email')}</th><th></th></tr></thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td><b>{c.name}</b></td>
              <td>{c.phone || '—'}</td>
              <td>{c.email || '—'}</td>
              <td style={{ whiteSpace: 'nowrap', textAlign: 'end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => openDetails(c.id)}>
                  <StickyNote size={15} /> {tr('notes')}
                </button>{' '}
                <button className="btn btn-red btn-sm" onClick={() => remove(c)}><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={4} className="empty">{tr('emptyCustomers')}</td></tr>}
        </tbody>
      </table>

      {showNew && <NewCustomerModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); load(); }} />}
      {details && (
        <DetailsModal details={details} currency={currency} onClose={() => setDetails(null)}
          onRefresh={async () => setDetails(await window.api.customers.details(details.customer.id))} />
      )}
    </div>
  );
}

function DetailsModal({ details, currency, onClose, onRefresh }: {
  details: CustomerDetails; currency: string; onClose: () => void; onRefresh: () => Promise<void>;
}) {
  const { tr } = useLang();
  const [note, setNote] = useState('');
  const [isDebt, setIsDebt] = useState(false);
  const [amount, setAmount] = useState('');

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await window.api.customers.addNote({
        customerId: details.customer.id, note: note.trim(), isDebt, debtAmount: parseFloat(amount) || 0,
      });
      setNote(''); setIsDebt(false); setAmount('');
      toast.success(tr('saved'));
      await onRefresh();
    } catch (e) { toast.error(String(e)); }
  };

  const clearDebt = async (id: number) => {
    try { await window.api.customers.clearDebt(id); toast.success(tr('saved')); await onRefresh(); }
    catch (e) { toast.error(String(e)); }
  };

  return (
    <Modal title={`${details.customer.name}`} onClose={onClose} wide>
      <SubscriptionAlert sub={details.activeSubscription} />
      {details.totalDebt > 0 && <div className="alert-strip danger">💰 {tr('totalDebt')}: {fmtMoney(details.totalDebt, currency)}</div>}

      <div className="section-title">{tr('addNote')}</div>
      <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr('notes') + '...'} />
      <div className="row" style={{ marginTop: 10 }}>
        <label className="row" style={{ gap: 6, fontWeight: 600, fontSize: 13.5 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={isDebt} onChange={(e) => setIsDebt(e.target.checked)} />
          {tr('isDebt')}
        </label>
        {isDebt && <input type="number" style={{ width: 130 }} placeholder={tr('amount')} value={amount} onChange={(e) => setAmount(e.target.value)} />}
        <span className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={addNote}>{tr('add')}</button>
      </div>

      <div className="section-title">{tr('notes')}</div>
      {details.notes.length === 0 && <div className="empty">{tr('noNotes')}</div>}
      {details.notes.map((n) => (
        <div className="item-row" key={n.id}>
          <span>
            {!!n.is_debt && <span className="badge red" style={{ marginInlineEnd: 8 }}>{tr('debt')}: {fmtMoney(n.debt_amount, currency)}</span>}
            {n.note}
            <div className="muted">{n.created_at}</div>
          </span>
          {!!n.is_debt && <button className="btn btn-green btn-sm" onClick={() => clearDebt(n.id)}>{tr('markPaid')}</button>}
        </div>
      ))}
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>{tr('close')}</button>
      </div>
    </Modal>
  );
}
