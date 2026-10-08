import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, Clock, CalendarCheck, Coffee, BarChart3, Settings as SettingsIcon, Languages,
} from 'lucide-react';
import { Lang, t, TKey } from './i18n';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Sessions from './pages/Sessions';
import Subscriptions from './pages/Subscriptions';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

interface LangCtx {
  lang: Lang;
  tr: (k: TKey) => string;
  toggle: () => void;
}
const Ctx = createContext<LangCtx>({ lang: 'ar', tr: (k) => k, toggle: () => {} });
export const useLang = () => useContext(Ctx);

const NAV: { to: string; key: TKey; icon: React.ReactNode }[] = [
  { to: '/', key: 'dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/customers', key: 'customers', icon: <Users size={20} /> },
  { to: '/sessions', key: 'sessions', icon: <Clock size={20} /> },
  { to: '/subscriptions', key: 'subscriptions', icon: <CalendarCheck size={20} /> },
  { to: '/products', key: 'products', icon: <Coffee size={20} /> },
  { to: '/reports', key: 'reports', icon: <BarChart3 size={20} /> },
  { to: '/settings', key: 'settings', icon: <SettingsIcon size={20} /> },
];

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'ar');

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);

  const ctx = useMemo<LangCtx>(
    () => ({ lang, tr: (k) => t(lang, k), toggle: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')) }),
    [lang]
  );

  return (
    <Ctx.Provider value={ctx}>
      <HashRouter>
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-icon">📚</span>
              <span className="brand-name">{ctx.tr('appName')}</span>
            </div>
            <nav>
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                  {n.icon}
                  <span>{ctx.tr(n.key)}</span>
                </NavLink>
              ))}
            </nav>
            <button className="lang-toggle" onClick={ctx.toggle}>
              <Languages size={18} />
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
          </aside>
          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/products" element={<Products />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <Toaster position="bottom-center" toastOptions={{ style: { fontFamily: 'inherit' } }} />
      </HashRouter>
    </Ctx.Provider>
  );
}
