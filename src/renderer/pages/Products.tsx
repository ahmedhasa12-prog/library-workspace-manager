import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Product } from '../../shared/types';
import { useLang } from '../App';
import { Modal, fmtMoney } from '../components/ui';

const CATS = ['hot', 'cold', 'food'] as const;

export default function Products() {
  const { tr } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState('EGP');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  const load = () => window.api.products.list().then(setProducts).catch((e) => toast.error(String(e)));
  useEffect(() => {
    load();
    window.api.settings.get().then((s) => setCurrency(s.currency || 'EGP'));
  }, []);

  const restock = async (p: Product) => {
    const qty = Number(prompt(`${tr('restock')} — ${p.name}`, '20'));
    if (!qty || qty <= 0) return;
    try { await window.api.products.restock(p.id, qty); toast.success(tr('saved')); load(); }
    catch (e) { toast.error(String(e)); }
  };

  const remove = async (p: Product) => {
    if (!confirm(tr('confirmDelete'))) return;
    try { await window.api.products.remove(p.id); toast.success(tr('deleted')); load(); }
    catch (e) { toast.error(String(e)); }
  };

  return (
    <div>
      <div className="page-head">
        <div className="page-title">{tr('products')}</div>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ {tr('newProduct')}</button>
      </div>
      <div className="grid">
        {products.map((p) => (
          <div className="session-card" key={p.id}>
            <div className="top">
              <h3>{p.name}</h3>
              {p.stock <= 5 && <span className="badge amber">{tr('lowStock')}</span>}
            </div>
            <div className="meta" style={{ marginTop: 8 }}>
              <span>{tr('category')}: {tr(p.category as any)}</span>
              <span>{tr('price')}: <b>{fmtMoney(p.price, currency)}</b></span>
              <span>{tr('stock')}: <b>{p.stock}</b></span>
            </div>
            <div className="row">
              <button className="btn btn-outline btn-sm" onClick={() => restock(p)}>{tr('restock')}</button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(p)}>{tr('edit')}</button>
              <span className="spacer" />
              <button className="btn btn-red btn-sm" onClick={() => remove(p)}>{tr('delete')}</button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <ProductModal product={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onDone }: { product: Product | null; onClose: () => void; onDone: () => void }) {
  const { tr } = useLang();
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<string>(product?.category || 'cold');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [stock, setStock] = useState(String(product?.stock ?? '0'));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (product) {
        await window.api.products.update({ id: product.id, name: name.trim(), category, price: parseFloat(price) || 0 });
      } else {
        await window.api.products.create({ name: name.trim(), category, price: parseFloat(price) || 0, stock: parseInt(stock) || 0 });
      }
      toast.success(tr('saved'));
      onDone();
    } catch (e) { toast.error(String(e)); } finally { setBusy(false); }
  };

  return (
    <Modal title={product ? tr('edit') : tr('newProduct')} onClose={onClose}>
      <label className="field">{tr('name')}<input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
      <label className="field">{tr('category')}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATS.map((c) => <option key={c} value={c}>{tr(c)}</option>)}
        </select>
      </label>
      <label className="field">{tr('price')}<input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
      {!product && <label className="field">{tr('stock')}<input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></label>}
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={onClose}>{tr('cancel')}</button>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{tr('save')}</button>
      </div>
    </Modal>
  );
}
