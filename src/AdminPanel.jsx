import { useState, useEffect } from 'react';
import { api, saveToken, clearToken } from './api';
import {
  X, LogOut, RefreshCw, Plus, Edit2, Trash2, Check,
  Package, CalendarDays, ShoppingBag, TrendingUp, ChevronLeft,
  Eye, EyeOff, AlertCircle, Loader
} from 'lucide-react';

const C = {
  bg:'#FFFFFF', bgSoft:'#F8F6F2', bgWarm:'#F0EBE2',
  ink:'#0A0A0A', inkSoft:'#1A1A1A', mute:'#8A8580', line:'#E8E4DD',
  gold:'#D4AF37', goldDark:'#8B6914', success:'#2D7D46', error:'#C0392B',
};
const goldGrad = 'linear-gradient(135deg,#F5D547 0%,#D4AF37 50%,#8B6914 100%)';

const STATUS_ORDER = ['confirmé','en préparation','livré','annulé'];
const STATUS_APPT  = ['confirmé','terminé','annulé'];
const STATUS_COLOR = { 'confirmé':'#D4AF37','en préparation':'#4A90E2','livré':'#2D7D46','annulé':'#C0392B','terminé':'#2D7D46' };

// ─── LOGIN ─────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { token, admin } = await api.auth.login(email, password);
      saveToken(token);
      onLogin(admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:C.bg }}>
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="text-[10px] tracking-[0.3em] font-semibold mb-2" style={{ color:C.mute }}>PANNEAU ADMINISTRATION</div>
          <h1 className="text-[32px]" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Azzabi Optic</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail admin" type="email" required
            className="w-full px-4 py-3.5 text-[13px] outline-none"
            style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}/>
          <div className="relative">
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe"
              type={showPwd ? 'text' : 'password'} required
              className="w-full px-4 py-3.5 text-[13px] outline-none pr-12"
              style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}/>
            <button type="button" onClick={()=>setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPwd ? <EyeOff size={15} style={{ color:C.mute }}/> : <Eye size={15} style={{ color:C.mute }}/>}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[12px] px-3 py-2" style={{ background:'#FEE2E2', color:C.error }}>
              <AlertCircle size={13}/>{error}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-4 text-[11px] tracking-[0.22em] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background:C.ink, color:'#FFF' }}>
            {loading ? <Loader size={15} className="animate-spin"/> : 'SE CONNECTER'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── PRODUCT FORM ──────────────────────────────────────────────────
function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState(product || { brand:'', name:'', cat:'soleil', genre:'unisexe', price:'', img:'', is_new:false });
  const [loading, setLoading] = useState(false);
  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) await api.admin.products.update(product.id, form);
      else          await api.admin.products.create(form);
      onSave();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const input = (label, key, type='text', opts={}) => (
    <div>
      <div className="text-[10px] tracking-[0.2em] font-semibold mb-1.5" style={{ color:C.mute }}>{label}</div>
      <input value={form[key]} onChange={e=>f(key, type==='number'?Number(e.target.value):e.target.value)}
        type={type} {...opts} className="w-full px-3 py-3 text-[13px] outline-none"
        style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}/>
    </div>
  );

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto" style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="min-h-screen flex items-start justify-center p-4 pt-12">
        <div className="w-full max-w-lg bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>
              {product ? 'Modifier produit' : 'Nouveau produit'}
            </h2>
            <button onClick={onCancel}><X size={18} style={{ color:C.mute }}/></button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {input('MARQUE', 'brand')}
              {input('NOM', 'name')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] tracking-[0.2em] font-semibold mb-1.5" style={{ color:C.mute }}>CATÉGORIE</div>
                <select value={form.cat} onChange={e=>f('cat',e.target.value)}
                  className="w-full px-3 py-3 text-[13px] outline-none"
                  style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}>
                  <option value="soleil">Soleil</option>
                  <option value="vue">Vue</option>
                  <option value="lentilles">Lentilles</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] tracking-[0.2em] font-semibold mb-1.5" style={{ color:C.mute }}>GENRE</div>
                <select value={form.genre} onChange={e=>f('genre',e.target.value)}
                  className="w-full px-3 py-3 text-[13px] outline-none"
                  style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}>
                  <option value="femme">Femme</option>
                  <option value="homme">Homme</option>
                  <option value="unisexe">Unisexe</option>
                </select>
              </div>
            </div>
            {input('PRIX (TND)', 'price', 'number', { min:1 })}
            {input('URL IMAGE', 'img')}
            {form.img && <img src={form.img} alt="preview" className="w-full h-32 object-contain" style={{ background:C.bgSoft }}/>}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.is_new} onChange={e=>f('is_new',e.target.checked)} className="w-4 h-4"/>
              <span className="text-[12px]" style={{ color:C.ink }}>Marquer comme NOUVEAU</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading}
                className="flex-1 py-3.5 text-[11px] tracking-[0.2em] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background:C.ink, color:'#FFF' }}>
                {loading ? <Loader size={13} className="animate-spin"/> : <><Check size={13}/>{product ? 'MODIFIER' : 'CRÉER'}</>}
              </button>
              <button type="button" onClick={onCancel}
                className="px-5 py-3.5 text-[11px] tracking-[0.2em] font-semibold border"
                style={{ borderColor:C.line, color:C.ink }}>ANNULER</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PANEL ──────────────────────────────────────────────
export default function AdminPanel({ onClose, onSync }) {
  const [admin, setAdmin]             = useState(null);
  const [section, setSection]         = useState('dashboard');
  const [dashboard, setDashboard]     = useState(null);
  const [products, setProducts]       = useState([]);
  const [orders, setOrders]           = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [syncMsg, setSyncMsg]         = useState('');
  const [loading, setLoading]         = useState(false);

  // Try auto-login from stored token
  useEffect(() => {
    api.auth.me().then(({ admin }) => setAdmin(admin)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!admin) return;
    loadSection(section);
  }, [admin, section]);

  const loadSection = async (sec) => {
    setLoading(true);
    try {
      if (sec === 'dashboard')    setDashboard(await api.admin.dashboard());
      if (sec === 'products')     setProducts(await api.admin.products.list());
      if (sec === 'orders')       setOrders(await api.admin.orders.list());
      if (sec === 'appointments') setAppointments(await api.admin.appointments.list());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const syncWoo = async () => {
    setSyncMsg('Synchronisation en cours…');
    try {
      const r = await api.admin.sync.woocommerce();
      setSyncMsg(`✅ ${r.added} ajoutés, ${r.updated} mis à jour (${r.total} produits WC)`);
      if (section === 'products') loadSection('products');
      if (onSync) onSync();
    } catch (err) { setSyncMsg(`❌ ${err.message}`); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.admin.products.delete(id);
    setProducts(p => p.filter(x => x.id !== id));
  };

  const setOrderStatus = async (ref, status) => {
    await api.admin.orders.setStatus(ref, status);
    setOrders(o => o.map(x => x.ref === ref ? { ...x, status } : x));
  };

  const setApptStatus = async (ref, status) => {
    await api.admin.appointments.setStatus(ref, status);
    setAppointments(a => a.map(x => x.ref === ref ? { ...x, status } : x));
  };

  const logout = () => { clearToken(); setAdmin(null); };

  if (!admin) return <LoginScreen onLogin={setAdmin}/>;

  const navItems = [
    { k:'dashboard',    icon:TrendingUp,   label:'Dashboard' },
    { k:'products',     icon:ShoppingBag,  label:'Produits' },
    { k:'orders',       icon:Package,      label:'Commandes' },
    { k:'appointments', icon:CalendarDays, label:'Rendez-vous' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background:C.bg }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
           style={{ background:C.ink, borderBottom:`1px solid rgba(255,255,255,0.1)` }}>
        <div>
          <div className="text-[9px] tracking-[0.3em] font-semibold" style={{ color:'rgba(255,255,255,0.5)' }}>ADMIN</div>
          <div className="text-[15px] font-semibold text-white" style={{ fontFamily:'Fraunces,serif' }}>Azzabi Optic</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={logout} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background:'rgba(255,255,255,0.1)' }}>
            <LogOut size={15} style={{ color:'rgba(255,255,255,0.7)' }}/>
          </button>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background:'rgba(255,255,255,0.1)' }}>
            <X size={15} style={{ color:'rgba(255,255,255,0.7)' }}/>
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex overflow-x-auto flex-shrink-0" style={{ borderBottom:`1px solid ${C.line}` }}>
        {navItems.map(({ k, icon:Icon, label }) => (
          <button key={k} onClick={()=>setSection(k)}
            className="flex items-center gap-2 px-4 py-3 text-[11px] tracking-[0.15em] font-semibold whitespace-nowrap flex-shrink-0"
            style={{ color:section===k?C.ink:C.mute, borderBottom:section===k?`2px solid ${C.gold}`:'2px solid transparent' }}>
            <Icon size={14}/>{label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading && <div className="flex justify-center py-12"><Loader size={24} className="animate-spin" style={{ color:C.mute }}/></div>}

        {/* DASHBOARD */}
        {!loading && section === 'dashboard' && dashboard && (
          <div>
            <h2 className="text-[24px] mb-5" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Vue d'ensemble</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label:'Produits',   value:dashboard.products,     icon:ShoppingBag },
                { label:'Commandes',  value:dashboard.orders,       icon:Package },
                { label:'RDV',        value:dashboard.appointments, icon:CalendarDays },
                { label:'En attente', value:dashboard.pendingOrders,icon:TrendingUp },
              ].map(s=>(
                <div key={s.label} className="p-4" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
                  <s.icon size={16} style={{ color:C.gold, marginBottom:8 }}/>
                  <div className="text-[28px] tabular-nums" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{s.value}</div>
                  <div className="text-[10px] tracking-[0.2em] font-semibold" style={{ color:C.mute }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div className="p-4 mb-4" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
              <div className="text-[10px] tracking-[0.2em] font-semibold mb-1" style={{ color:C.mute }}>CHIFFRE D'AFFAIRES TOTAL</div>
              <div className="text-[32px] tabular-nums" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>
                {dashboard.revenue.toLocaleString('fr-FR')} <span className="text-[16px]" style={{ color:C.mute }}>TND</span>
              </div>
            </div>
            {/* WooCommerce sync */}
            <div className="p-4" style={{ border:`1px solid ${C.line}` }}>
              <div className="text-[10px] tracking-[0.2em] font-semibold mb-2" style={{ color:C.mute }}>SYNCHRONISATION WOOCOMMERCE</div>
              <p className="text-[12px] mb-3" style={{ color:C.inkSoft }}>Importer les produits depuis votre site azzabioptic.com</p>
              <button onClick={syncWoo}
                className="flex items-center gap-2 px-4 py-3 text-[11px] tracking-[0.2em] font-semibold"
                style={{ background:goldGrad, color:C.ink }}>
                <RefreshCw size={13}/>SYNCHRONISER AVEC WOOCOMMERCE
              </button>
              {syncMsg && <p className="text-[12px] mt-2" style={{ color:C.inkSoft }}>{syncMsg}</p>}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {!loading && section === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[24px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Produits ({products.length})</h2>
              <button onClick={()=>{setEditProduct(null);setShowForm(true);}}
                className="flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.2em] font-semibold"
                style={{ background:C.ink, color:'#FFF' }}>
                <Plus size={13}/>AJOUTER
              </button>
            </div>
            <div className="space-y-2">
              {products.map(p=>(
                <div key={p.id} className="flex items-center gap-3 p-3" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
                  <div className="w-12 h-12 flex-shrink-0 overflow-hidden" style={{ background:C.bg }}>
                    <img src={p.img} alt={p.brand} className="w-full h-full object-contain" style={{ padding:'4%' }}
                      onError={e=>e.target.style.opacity=0}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.15em] font-semibold" style={{ color:C.ink }}>{p.brand}</div>
                    <div className="text-[11px] truncate" style={{ color:C.inkSoft }}>{p.name}</div>
                    <div className="text-[11px] tabular-nums" style={{ color:C.gold }}>{p.price?.toLocaleString('fr-FR')} TND</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {p.is_new && <span className="text-[8px] px-1.5 py-0.5 font-semibold" style={{ background:goldGrad, color:C.ink }}>NEW</span>}
                    <button onClick={()=>{setEditProduct(p);setShowForm(true);}}
                      className="w-8 h-8 flex items-center justify-center" style={{ border:`1px solid ${C.line}` }}>
                      <Edit2 size={12} style={{ color:C.mute }}/>
                    </button>
                    <button onClick={()=>deleteProduct(p.id)}
                      className="w-8 h-8 flex items-center justify-center" style={{ border:`1px solid ${C.error}22`, background:`${C.error}11` }}>
                      <Trash2 size={12} style={{ color:C.error }}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {!loading && section === 'orders' && (
          <div>
            <h2 className="text-[24px] mb-5" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Commandes ({orders.length})</h2>
            <div className="space-y-3">
              {orders.length === 0 && <p className="text-[13px]" style={{ color:C.mute }}>Aucune commande.</p>}
              {orders.map((o,i)=>(
                <div key={i} className="p-4" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[10px] tracking-[0.15em] font-semibold" style={{ color:C.mute }}>{o.ref}</div>
                      <div className="text-[13px]" style={{ color:C.ink }}>{o.contact?.name} · {o.contact?.phone}</div>
                      <div className="text-[11px]" style={{ color:C.mute }}>{o.cart?.length} article{o.cart?.length!==1?'s':''} · {o.total?.toLocaleString('fr-FR')} TND</div>
                    </div>
                    <span className="text-[9px] px-2 py-1 font-semibold capitalize"
                      style={{ background:`${STATUS_COLOR[o.status]||C.mute}22`, color:STATUS_COLOR[o.status]||C.mute }}>
                      {o.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_ORDER.filter(s=>s!==o.status).map(s=>(
                      <button key={s} onClick={()=>setOrderStatus(o.ref,s)}
                        className="px-2.5 py-1 text-[9px] tracking-[0.1em] font-semibold border"
                        style={{ borderColor:C.line, color:C.ink }}>
                        → {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APPOINTMENTS */}
        {!loading && section === 'appointments' && (
          <div>
            <h2 className="text-[24px] mb-5" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Rendez-vous ({appointments.length})</h2>
            <div className="space-y-3">
              {appointments.length === 0 && <p className="text-[13px]" style={{ color:C.mute }}>Aucun rendez-vous.</p>}
              {appointments.map((a,i)=>(
                <div key={i} className="p-4" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-[10px] tracking-[0.15em] font-semibold" style={{ color:C.mute }}>{a.ref}</div>
                      <div className="text-[13px]" style={{ color:C.ink }}>{a.name} · {a.phone}</div>
                      <div className="text-[11px]" style={{ color:C.inkSoft }}>{a.service}</div>
                      <div className="text-[11px]" style={{ color:C.mute }}>{a.boutique} · {a.date} à {a.time}</div>
                    </div>
                    <span className="text-[9px] px-2 py-1 font-semibold capitalize"
                      style={{ background:`${STATUS_COLOR[a.status]||C.mute}22`, color:STATUS_COLOR[a.status]||C.mute }}>
                      {a.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS_APPT.filter(s=>s!==a.status).map(s=>(
                      <button key={s} onClick={()=>setApptStatus(a.ref,s)}
                        className="px-2.5 py-1 text-[9px] tracking-[0.1em] font-semibold border"
                        style={{ borderColor:C.line, color:C.ink }}>
                        → {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          product={editProduct}
          onSave={()=>{ setShowForm(false); loadSection('products'); }}
          onCancel={()=>setShowForm(false)}
        />
      )}
    </div>
  );
}
