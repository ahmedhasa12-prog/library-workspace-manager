import React, { useEffect, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import type { Subscription } from '../../shared/types';
import { useLang } from '../App';

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={wide ? { width: 700 } : undefined} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** Renders subscription status alert: active (with days left), expiring soon, or expired/none. */
export function SubscriptionAlert({ sub }: { sub: Subscription | null }) {
  const { tr } = useLang();
  if (!sub) return <div className="alert-strip warn">⚠️ {tr('subNone')}</div>;
  const daysLeft = differenceInDays(parseISO(sub.end_date), new Date());
  const level = daysLeft < 0 ? 'danger' : daysLeft <= 2 ? 'warn' : 'ok';
  const label =
    daysLeft < 0
      ? `⚠️ ${tr('subExpired')} (${tr('endDate')}: ${sub.end_date})`
      : daysLeft <= 2
      ? `⏰ ${tr('subEndsIn')} ${daysLeft} ${tr('days')} — ${tr('endDate')}: ${sub.end_date}`
      : `✅ ${tr('subActive')} · ${sub.start_date} ← ${sub.end_date}`;
  return <div className={`alert-strip ${level}`}>{label}</div>;
}

/** Live ticking elapsed timer since check-in. */
export function LiveTimer({ since }: { since: string }) {
  const { tr } = useLang();
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.max(0, Math.floor((Date.now() - new Date(since.replace(' ', 'T')).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <div className="timer">
      {h}
      <small>{tr('visitHours')}</small> {String(m).padStart(2, '0')}
      <small>{tr('visitMins')}</small>
    </div>
  );
}

export function fmtMoney(v: number | null | undefined, currency: string) {
  return `${(v ?? 0).toFixed(2)} ${currency}`;
}
