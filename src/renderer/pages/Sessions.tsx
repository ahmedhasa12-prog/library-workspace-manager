import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { SessionRow } from '../../shared/types';
import { useLang } from '../App';
import { fmtMoney } from '../components/ui';

export default function Sessions() {
  const { tr } = useLang();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [currency, setCurrency] = useState('EGP');

  useEffect(() => {
    window.api.sessions.history(500).then(setRows).catch((e) => toast.error(String(e)));
    window.api.settings.get().then((s) => setCurrency(s.currency || 'EGP'));
  }, []);

  return (
    <div>
      <div className="page-head"><div className="page-title">{tr('history')}</div></div>
      <table className="list">
        <thead>
          <tr>
            <th>{tr('customer')}</th><th>{tr('room')}</th><th>{tr('inTime')}</th><th>{tr('outTime')}</th>
            <th>{tr('duration')}</th><th>{tr('timeCharge')}</th><th>{tr('items')}</th><th>{tr('total')}</th><th>{tr('status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td><b>{s.customer_name}</b>{!!s.is_subscriber && <> <span className="badge green">{tr('subscriber')}</span></>}</td>
              <td>{s.room_name}</td>
              <td className="mono">{s.check_in_time}</td>
              <td className="mono">{s.check_out_time || '—'}</td>
              <td className="mono">{s.duration_minutes != null ? `${Math.floor(s.duration_minutes / 60)}h ${s.duration_minutes % 60}m` : '—'}</td>
              <td>{s.time_charge != null ? fmtMoney(s.time_charge, currency) : '—'}</td>
              <td>{s.products_charge != null ? fmtMoney(s.products_charge, currency) : '—'}</td>
              <td><b>{s.total_amount != null ? fmtMoney(s.total_amount, currency) : '—'}</b></td>
              <td>{s.status === 'active' ? <span className="badge blue">{tr('activeNow')}</span> : <span className="badge gray">✓</span>}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={9} className="empty">{tr('noActiveSessions')}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
