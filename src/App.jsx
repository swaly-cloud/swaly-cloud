import { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from './api';
import AdminPanel from './AdminPanel';
import {
Home, ShoppingBag, Globe2, CalendarDays, User, Search, Heart,
MapPin, Phone, Plane, Gift, ChevronRight, ChevronLeft, X, Check,
Star, Plus, Minus, Eye, Sparkles, ArrowUpRight, MessageCircle,
Bell, Package, Clock, Truck, CheckCircle2, SlidersHorizontal,
Trash2, Tag, ArrowLeft, Edit2, LogOut, ChevronDown
} from 'lucide-react';

const C = {
bg: '#FFFFFF', bgSoft: '#F8F6F2', bgWarm: '#F0EBE2',
ink: '#0A0A0A', inkSoft: '#1A1A1A', mute: '#8A8580', line: '#E8E4DD',
goldLight: '#F5D547', gold: '#D4AF37', goldDark: '#8B6914',
success: '#2D7D46', error: '#C0392B',
};
const goldGrad = 'linear-gradient(135deg,#F5D547 0%,#D4AF37 50%,#8B6914 100%)';
const goldText = { background: goldGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };

function AzzabiLogo({ height = 26, mono = false }) {
const ink = mono ? '#FFF' : C.ink;
return (
<svg viewBox="0 0 380 70" style={{ height, width: 'auto' }}>
<defs>
<linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stopColor="#F5D547"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7A5510"/>
</linearGradient>
</defs>
<text x="0" y="48" fontFamily="Montserrat,sans-serif" fontWeight="800" fontSize="38" letterSpacing="0.5" fill={ink}>AZZABI</text>
<g transform="translate(135,4)">
<path d="M0 10L0 4L4 7L7 0L10 7L14 4L14 10Z" fill="url(#lg1)" stroke={C.goldDark} strokeWidth="0.4"/>
<circle cx="0" cy="4" r="1.2" fill={C.goldLight}/>
<circle cx="7" cy="0" r="1.2" fill={C.goldLight}/>
<circle cx="14" cy="4" r="1.2" fill={C.goldLight}/>
</g>
<g transform="translate(168,14)">
<circle cx="18" cy="28" r="17" fill="url(#lg1)"/>
<circle cx="18" cy="28" r="11" fill={mono ? '#0A0A0A' : '#FFF'}/>
<circle cx="14" cy="24" r="2" fill="#FBE76B" opacity="0.7"/>
<rect x="33" y="26" width="8" height="4" fill="url(#lg1)" rx="1"/>
<circle cx="58" cy="28" r="17" fill="url(#lg1)"/>
<circle cx="58" cy="28" r="11" fill={mono ? '#0A0A0A' : '#FFF'}/>
<circle cx="54" cy="24" r="2" fill="#FBE76B" opacity="0.7"/>
<rect x="48" y="40" width="6" height="12" fill="url(#lg1)"/>
</g>
<text x="248" y="48" fontFamily="Montserrat,sans-serif" fontWeight="800" fontSize="38" letterSpacing="0.5" fill={ink}>TIC</text>
</svg>
);
}

function AzzabiMark({ size = 30 }) {
return (
<svg viewBox="0 0 80 70" style={{ width: size, height: size * 70/80 }}>
<defs><linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FBE76B"/><stop offset="50%" stopColor="#D4AF37"/><stop offset="100%" stopColor="#7A5510"/></linearGradient></defs>
<g transform="translate(33,0)"><path d="M0 12L0 5L5 9L8 0L11 9L16 5L16 12Z" fill="url(#mg)"/></g>
<g transform="translate(0,16)">
<circle cx="18" cy="28" r="17" fill="url(#mg)"/><circle cx="18" cy="28" r="11" fill="#FFF"/>
<rect x="33" y="26" width="8" height="4" fill="url(#mg)" rx="1"/>
<circle cx="58" cy="28" r="17" fill="url(#mg)"/><circle cx="58" cy="28" r="11" fill="#FFF"/>
<rect x="48" y="40" width="6" height="12" fill="url(#mg)"/>
</g>
</svg>
);
}

const FX = { TND: 1, EUR: 0.30, USD: 0.33, CAD: 0.45 };
const SYM = { TND: 'د.ت', EUR: '€', USD: '$', CAD: 'C$' };
const fmt = (p, c) => {
const v = Math.round(p * FX[c]);
return c === 'TND' ? `${v.toLocaleString('fr-FR')} ${SYM[c]}` : `${SYM[c]}${v.toLocaleString('fr-FR')}`;
};

const UNS = seed => `https://picsum.photos/seed/${seed}/400/500`;
const PRODUCTS = [
{ id:1, brand:'FENDI', name:'FE40140U Acétate', cat:'soleil', genre:'femme', price:1790, hue:['#0F0F0F','#2C2C2C'], accent:'#D4AF37', new:true, img:'https://pretavoir.us/cdn/shop/files/fendi-ff-diamonds-fe40140u-56n-hd-1_800x.jpg?v=1740410082' },
{ id:2, brand:'TOM FORD', name:'Wyatt Tortue Havane', cat:'soleil', genre:'homme', price:1650, hue:['#3D2817','#6B4423'], accent:'#F5D547', new:false, img:'https://pretavoir.us/cdn/shop/products/tom-ford-wyatt-tf871-52f-hd-3_800x.jpg?v=1622128254' },
{ id:3, brand:'CELINE', name:'Triomphe CL40282U', cat:'soleil', genre:'femme', price:1890, hue:['#1A1A1A','#0F0F0F'], accent:'#D4AF37', new:true, img:'https://pretavoir.co.uk/cdn/shop/files/celine-cl40282u-01a-hd-2_800x.jpg?v=1709739547' },
{ id:4, brand:'PERSOL', name:'649 Original Havana', cat:'soleil', genre:'homme', price:1290, hue:['#5C3A1E','#8B5A2B'], accent:'#F5D547', new:false, img:'https://pretavoir.co.uk/cdn/shop/products/persol-0649-24-31-hd-3_800x.jpg?v=1611918887' },
{ id:5, brand:'RAY-BAN', name:'Wayfarer RB2140', cat:'soleil', genre:'unisexe', price:690, hue:['#0A0A0A','#2A2A2A'], accent:'#D4AF37', new:false, img:'https://pretavoir.co.uk/cdn/shop/products/ray-ban-2140-901-hd-2_1024x.jpg?v=1611919254' },
{ id:6, brand:'JOW&BRO', name:'DJ9082 Vintage Écaille', cat:'vue', genre:'homme', price:390, hue:['#7A4A2A','#A36B3F'], accent:'#F5D547', new:false, img:UNS('jow-bro-vintage') },
{ id:7, brand:'DIOR', name:'DiorSignature S11I', cat:'soleil', genre:'femme', price:1990, hue:['#1A1A1A','#0A0A0A'], accent:'#D4AF37', new:true, img:'https://pretavoir.us/cdn/shop/files/diorsignature-s11i-14a1-hd-3_800x.jpg?v=1720454479' },
{ id:8, brand:'SILHOUETTE', name:'TMA Icon 5290', cat:'vue', genre:'homme', price:1390, hue:['#3D3D3D','#5C5C5C'], accent:'#F5D547', new:false, img:UNS('silhouette-titanium') },
{ id:9, brand:'MIU MIU', name:'MU 04ZS Round', cat:'soleil', genre:'femme', price:1490, hue:['#0A0A0A','#1A1A1A'], accent:'#D4AF37', new:true, img:'https://pretavoir.us/cdn/shop/files/miu-miu-mu-04zs-1ab5s0-hd-3_800x.jpg?v=1707743749' },
{ id:10, brand:'VAKAY', name:'Breeze Bois & Acétate', cat:'vue', genre:'unisexe', price:1490, hue:['#3D2817','#5C3A1E'], accent:'#F5D547', new:false, img:UNS('vakay-wood') },
{ id:11, brand:'BELLA', name:'Radiant Hazelnut', cat:'lentilles', genre:'femme', price:140, hue:['#8B6F47','#A88860'], accent:'#F5D547', new:false, img:UNS('bella-contact') },
{ id:12, brand:'CARRERA', name:'8867 Pilote Métal', cat:'vue', genre:'homme', price:590, hue:['#1F1F1F','#373737'], accent:'#D4AF37', new:false, img:UNS('carrera-metal') },
{ id:13, brand:'PRADA', name:'PR 17WS Marble Black', cat:'soleil', genre:'femme', price:1750, hue:['#2A1A0A','#5C3A1E'], accent:'#D4AF37', new:true, img:'https://pretavoir.co.uk/cdn/shop/products/prada-pr-17ws-11n09t-hd-3_800x.jpg?v=1686582774' },
{ id:14, brand:'MARC JACOBS', name:'MJ1033S Bold', cat:'soleil', genre:'femme', price:950, hue:['#1A1A2A','#2A2A4A'], accent:'#F5D547', new:false, img:UNS('marc-jacobs-bold') },
{ id:15, brand:'CARRERA', name:'Grand Prix 3 Femme', cat:'vue', genre:'femme', price:690, hue:['#2C1810','#5A3020'], accent:'#F5D547', new:false, img:UNS('carrera-femme') },
{ id:16, brand:'RAY-BAN', name:'Aviator RB3025 Or', cat:'soleil', genre:'homme', price:750, hue:['#1A1410','#3A2E20'], accent:'#D4AF37', new:false, img:'https://pretavoir.us/cdn/shop/products/ray-ban-aviator-large-metal-rb-3025-0013m-hd-3_800x.jpg?v=1687521942' },
];

const BOUTIQUES = [
{ id:'marsa', name:'La Marsa', addr:'13 Avenue Taieb Mhiri', zip:'2078 La Marsa', hours:'Lun–Sam · 9h–19h' },
{ id:'zaghouan', name:'Aïn Zaghouan', addr:'04 rue Osmane Bahri', zip:'2045 Tunis', hours:'Lun–Sam · 9h–19h' },
];

const TX = {
fr: { home:'Accueil',catalog:'Boutique',diaspora:'Diaspora',appointment:'Rendez-vous',profile:'Profil',cart:'Panier',
heroKicker:'Opticien depuis 2010', heroTitle:'L\'art\nde voir.',
heroSub:'Maison opticienne tunisienne. La Marsa & Aïn Zaghouan. Sélection rigoureuse de Fendi, Celine, Dior, Tom Ford, Persol, Ray-Ban.',
discover:'Découvrir la collection', diasporaKicker:'DIASPORA · TRE',
diasporaHero:'La Tunisie\nà portée\nde regard.', diasporaSub:'Pensé pour les Tunisiens vivant à l\'étranger.' },
en: { home:'Home',catalog:'Shop',diaspora:'Diaspora',appointment:'Booking',profile:'Profile',cart:'Cart',
heroKicker:'Opticians since 2010', heroTitle:'The art\nof seeing.',
heroSub:'Tunisian eyewear house. La Marsa & Aïn Zaghouan. Curated selection of Fendi, Celine, Dior, Tom Ford, Persol, Ray-Ban.',
discover:'Discover the collection', diasporaKicker:'DIASPORA · TRE',
diasporaHero:'Tunisia\nwithin\nreach.', diasporaSub:'Designed for Tunisians living abroad.' },
ar: { home:'الرئيسية',catalog:'المتجر',diaspora:'المغتربون',appointment:'موعد',profile:'حسابي',cart:'السلة',
heroKicker:'بصريات منذ 2010', heroTitle:'فن\nالرؤية.',
heroSub:'بيت النظارات التونسي بالمرسى وعين زغوان. فندي، سيلين، ديور، توم فورد، بيرسول، راي بان.',
discover:'اكتشف المجموعة', diasporaKicker:'مغتربون · TRE',
diasporaHero:'تونس\nبمتناول\nنظرك.', diasporaSub:'مصمم للتونسيين المقيمين في الخارج.' },
};

function Btn({ children, onClick, variant='black', className='', style={}, disabled=false }) {
const base = 'text-[11px] tracking-[0.22em] font-semibold py-4 px-5 transition-all flex items-center justify-center gap-2 disabled:opacity-30';
const vars = {
black: { background: C.ink, color: '#FFF' },
gold: { background: goldGrad, color: C.ink },
outline: { background: 'transparent', border: `1px solid ${C.line}`, color: C.ink },
ghost: { background: 'transparent', color: C.ink },
};
return <button onClick={onClick} disabled={disabled} className={`${base} ${className}`} style={{ ...vars[variant], ...style }}>{children}</button>;
}

function Input({ value, onChange, placeholder, type='text', min }) {
return (
<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} min={min}
className="w-full px-4 py-3.5 text-[13px] outline-none"
style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink, fontFamily:'Manrope,sans-serif' }} />
);
}

function BackRow({ onBack, label }) {
return (
<div className="px-5 pt-5 pb-2 flex items-center gap-3">
<button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border:`1px solid ${C.line}` }}>
<ChevronLeft size={16} style={{ color:C.ink }}/>
</button>
<span className="text-[10px] tracking-[0.3em] font-semibold" style={{ color:C.mute }}>{label}</span>
</div>
);
}

function SectionHead({ kicker, title }) {
return (
<div className="mb-5">
<div className="text-[10px] tracking-[0.3em] font-semibold mb-1" style={{ color:C.mute }}>{kicker}</div>
<h3 className="text-[26px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{title}</h3>
</div>
);
}

function GoldBar() {
return <div className="absolute top-0 left-0 w-1 h-full" style={{ background:goldGrad }}/>;
}

function OrnamentBg() {
return (
<svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 400 360" preserveAspectRatio="none">
<defs><pattern id="orn" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
<circle cx="30" cy="30" r="20" fill="none" stroke="#D4AF37" strokeWidth="0.6"/>
<circle cx="30" cy="30" r="2" fill="#D4AF37"/>
</pattern></defs>
<rect width="100%" height="100%" fill="url(#orn)"/>
</svg>
);
}

function ProductCard({ p, ccy, onTap, onWish, wished, onCart }) {
const [loaded, setLoaded] = useState(false);
const [failed, setFailed] = useState(false);
return (
<button onClick={() => onTap(p)} className="text-left w-full">
<div className="relative overflow-hidden aspect-[4/5] mb-3" style={{ background: C.bgSoft }}>
{!loaded && !failed && (
<div className="absolute inset-0 flex items-center justify-center">
<svg viewBox="0 0 60 40" className="w-16 opacity-20">
<ellipse cx="12" cy="20" rx="11" ry="8" fill="none" stroke={C.mute} strokeWidth="1.5"/>
<ellipse cx="38" cy="20" rx="11" ry="8" fill="none" stroke={C.mute} strokeWidth="1.5"/>
<line x1="23" y1="20" x2="27" y2="20" stroke={C.mute} strokeWidth="1.5"/>
</svg>
</div>
)}
<img src={p.img} alt={`${p.brand} ${p.name}`}
className="absolute inset-0 w-full h-full object-contain"
style={{ padding:'8%', opacity: loaded && !failed ? 1 : 0, transition:'opacity 0.4s' }}
onLoad={() => setLoaded(true)}
onError={() => setFailed(true)}/>
{failed && (
<div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
<svg viewBox="0 0 60 40" className="w-16 opacity-30">
<ellipse cx="12" cy="20" rx="11" ry="8" fill="none" stroke={C.ink} strokeWidth="1.5"/>
<ellipse cx="38" cy="20" rx="11" ry="8" fill="none" stroke={C.ink} strokeWidth="1.5"/>
<line x1="23" y1="20" x2="27" y2="20" stroke={C.ink} strokeWidth="1.5"/>
</svg>
<span className="text-[9px] tracking-wider" style={{ color:C.mute }}>{p.brand}</span>
</div>
)}
{p.new && (
<div className="absolute top-3 left-3 text-[9px] tracking-[0.2em] font-semibold px-2 py-1"
style={{ background:goldGrad, color:C.ink }}>NOUVEAU</div>
)}
<div className="absolute bottom-0 right-0">
<button onClick={e=>{e.stopPropagation();onCart(p);}}
className="w-10 h-10 flex items-center justify-center"
style={{ background:goldGrad }}>
<Plus size={15} style={{ color:C.ink }}/>
</button>
</div>
<button onClick={e=>{e.stopPropagation();onWish(p.id);}}
className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
style={{ background:'rgba(0,0,0,0.08)', backdropFilter:'blur(8px)' }}>
<Heart size={14} style={{ color:C.ink }} className={wished ? 'fill-black' : ''}/>
</button>
</div>
<div>
<div className="text-[10px] tracking-[0.22em] font-semibold mb-0.5" style={{ color:C.ink }}>{p.brand}</div>
<div className="text-[11px] leading-tight mb-1" style={{ color:C.inkSoft }}>{p.name}</div>
<div className="text-[12px] font-semibold tabular-nums" style={{ color:C.ink }}>{fmt(p.price,ccy)}</div>
</div>
</button>
);
}

function TopBar({ ccy, setCcy, lang, setLang, cartCount, onCart, notifCount }) {
const [open, setOpen] = useState(null);
return (
<div className="sticky top-0 z-30" style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.line}` }}>
<div className="px-4 py-1.5 flex items-center justify-between">
<AzzabiLogo height={18}/>
<div className="flex items-center gap-1.5">
<button onClick={()=>setOpen(open==='ccy'?null:'ccy')}
className="px-2 py-1 text-[10px] tracking-[0.15em] font-semibold border"
style={{ color:C.ink, borderColor:C.line }}>{ccy}</button>
<button onClick={()=>setOpen(open==='lang'?null:'lang')}
className="px-2 py-1 text-[10px] tracking-[0.15em] font-semibold border uppercase"
style={{ color:C.ink, borderColor:C.line }}>{lang}</button>
<button onClick={onCart} className="relative w-9 h-9 flex items-center justify-center">
<ShoppingBag size={18} style={{ color:C.ink }}/>
{cartCount>0 && (
<span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
style={{ background:goldGrad, color:C.ink }}>{cartCount}</span>
)}
</button>
</div>
</div>
{open==='ccy' && (
<div className="px-4 pb-2 flex gap-2">
{Object.keys(FX).map(c=>(
<button key={c} onClick={()=>{setCcy(c);setOpen(null);}}
className="flex-1 py-2 text-[10px] tracking-wider border"
style={{ background:ccy===c?C.ink:'transparent', color:ccy===c?'#FFF':C.ink, borderColor:ccy===c?C.ink:C.line }}>
{c} <span className="opacity-60">{SYM[c]}</span>
</button>
))}
</div>
)}
{open==='lang' && (
<div className="px-4 pb-2 flex gap-2">
{[['fr','Français'],['en','English'],['ar','العربية']].map(([k,l])=>(
<button key={k} onClick={()=>{setLang(k);setOpen(null);}}
className="flex-1 py-2 text-[10px] border"
style={{ background:lang===k?C.ink:'transparent', color:lang===k?'#FFF':C.ink, borderColor:lang===k?C.ink:C.line }}>
{l}
</button>
))}
</div>
)}
</div>
);
}

function CartScreen({ cart, ccy, lang, onClose, onUpdate, onRemove, onCheckout, orders }) {
const [step, setStep] = useState('cart');
const [delivery, setDelivery] = useState('boutique');
const [boutique, setBoutique] = useState('marsa');
const [contact, setContact] = useState({ name:'', phone:'', email:'', address:'', city:'' });
const [payment, setPayment] = useState('instore');
const [promo, setPromo] = useState('');
const [promoApplied, setPromoApplied] = useState(false);
const [promoError, setPromoError] = useState('');

const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
const shipping = delivery === 'home' ? 20 : 0;
const total = subtotal - discount + shipping;

const applyPromo = () => {
if (promo.toUpperCase() === 'DIASPORA10') { setPromoApplied(true); setPromoError(''); }
else { setPromoError('Code invalide'); setPromoApplied(false); }
};

const doCheckout = () => {
onCheckout({ cart, delivery, boutique, contact, payment, total, date: new Date().toLocaleDateString('fr-FR') });
setStep('confirm');
};

const inputStyle = { background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink };

return (
<div className="fixed inset-0 z-50 flex flex-col" style={{ background:C.bg }}>
<div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom:`1px solid ${C.line}` }}>
<div className="flex items-center gap-3">
{step !== 'cart' && step !== 'confirm' && (
<button onClick={()=>{
if(step==='delivery') setStep('cart');
else if(step==='contact') setStep('delivery');
else if(step==='payment') setStep('contact');
}} className="w-8 h-8 flex items-center justify-center" style={{ border:`1px solid ${C.line}` }}>
<ChevronLeft size={15} style={{ color:C.ink }}/>
</button>
)}
<div>
<div className="text-[10px] tracking-[0.3em] font-semibold" style={{ color:C.mute }}>
{step==='cart'?`PANIER · ${cart.length} PIÈCE${cart.length>1?'S':''}`
:step==='delivery'?'LIVRAISON'
:step==='contact'?'COORDONNÉES'
:step==='payment'?'PAIEMENT'
:'COMMANDE CONFIRMÉE'}
</div>
{step!=='confirm' && step!=='cart' && (
<div className="flex gap-1 mt-1.5">
{['delivery','contact','payment'].map((s,i)=>(
<div key={s} className="h-0.5 w-10" style={{ background:['delivery','contact','payment'].indexOf(step)>=i?C.gold:C.line }}/>
))}
</div>
)}
</div>
</div>
<button onClick={onClose} className="w-9 h-9 flex items-center justify-center" style={{ border:`1px solid ${C.line}` }}>
<X size={16} style={{ color:C.ink }}/>
</button>
</div>
<div className="flex-1 overflow-y-auto pb-28">
{step === 'cart' && (
<div className="px-5 pt-4">
{cart.length === 0 ? (
<div className="py-24 text-center">
<ShoppingBag size={40} className="mx-auto mb-4" style={{ color:C.line }}/>
<div className="text-[15px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Votre panier est vide.</div>
<button onClick={onClose} className="mt-4 text-[11px] tracking-[0.2em] underline underline-offset-4" style={{ color:C.mute }}>RETOUR À LA BOUTIQUE</button>
</div>
) : (
<>
<div className="space-y-4 mb-6">
{cart.map(item=>(
<div key={item.product.id} className="flex gap-4" style={{ borderBottom:`1px solid ${C.line}`, paddingBottom:'16px' }}>
<div className="w-20 h-20 flex-shrink-0 overflow-hidden" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
<img src={item.product.img} alt={item.product.brand} className="w-full h-full object-contain" style={{ padding:'6%' }} onError={e=>{ e.target.style.opacity='0'; }}/>
</div>
<div className="flex-1 min-w-0">
<div className="text-[10px] tracking-[0.2em] font-semibold mb-0.5" style={{ color:C.ink }}>{item.product.brand}</div>
<div className="text-[12px] leading-tight mb-2" style={{ color:C.inkSoft }}>{item.product.name}</div>
<div className="flex items-center gap-3">
<div className="flex items-center border" style={{ borderColor:C.line }}>
<button onClick={()=>onUpdate(item.product.id, item.qty-1)} className="w-8 h-8 flex items-center justify-center"><Minus size={12} style={{ color:C.ink }}/></button>
<span className="w-8 text-center text-[12px] tabular-nums" style={{ color:C.ink }}>{item.qty}</span>
<button onClick={()=>onUpdate(item.product.id, item.qty+1)} className="w-8 h-8 flex items-center justify-center"><Plus size={12} style={{ color:C.ink }}/></button>
</div>
<button onClick={()=>onRemove(item.product.id)}><Trash2 size={14} style={{ color:C.mute }}/></button>
</div>
</div>
<div className="text-[12px] font-semibold tabular-nums flex-shrink-0" style={{ color:C.ink }}>{fmt(item.product.price*item.qty, 'TND')}</div>
</div>
))}
</div>
<div className="mb-6">
<div className="text-[10px] tracking-[0.25em] font-semibold mb-2" style={{ color:C.mute }}>CODE PROMO</div>
<div className="flex gap-2">
<input value={promo} onChange={e=>setPromo(e.target.value)} placeholder="Ex: DIASPORA10" className="flex-1 px-4 py-3 text-[12px] outline-none uppercase" style={{ ...inputStyle, letterSpacing:'0.1em' }}/>
<Btn onClick={applyPromo} variant="outline" className="px-5 !py-3 !text-[10px]">OK</Btn>
</div>
{promoApplied && <div className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color:C.success }}><Check size={12}/>–10% appliqué</div>}
{promoError && <div className="text-[11px] mt-1.5" style={{ color:C.error }}>{promoError}</div>}
</div>
<div className="p-4 mb-4" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
<div className="space-y-2 text-[12px]">
<div className="flex justify-between"><span style={{ color:C.mute }}>Sous-total</span><span style={{ color:C.ink }}>{fmt(subtotal,'TND')}</span></div>
{promoApplied && <div className="flex justify-between"><span style={{ color:C.success }}>Remise –10%</span><span style={{ color:C.success }}>–{fmt(discount,'TND')}</span></div>}
<div className="flex justify-between font-semibold text-[14px] pt-2" style={{ borderTop:`1px solid ${C.line}` }}><span style={{ color:C.ink }}>Total estimé</span><span style={{ color:C.ink }}>{fmt(total,'TND')}</span></div>
<div className="text-[10px]" style={{ color:C.mute }}>Frais de livraison calculés à l'étape suivante</div>
</div>
</div>
</>
)}
</div>
)}
{step === 'delivery' && (
<div className="px-5 pt-6">
<h2 className="text-[28px] mb-6 leading-tight" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Mode de réception</h2>
<div className="space-y-3 mb-6">
{[
{ k:'boutique', icon:MapPin, title:'Retrait gratuit en boutique', sub:'Prêt sous 24–48h — La Marsa ou Aïn Zaghouan' },
{ k:'home', icon:Truck, title:'Livraison à domicile', sub:'20 TND · 48–72h dans toute la Tunisie' },
].map(opt=>(
<button key={opt.k} onClick={()=>setDelivery(opt.k)} className="w-full p-4 text-left flex items-start gap-3 border" style={{ background:delivery===opt.k?C.bgWarm:'transparent', borderColor:delivery===opt.k?C.gold:C.line }}>
<opt.icon size={18} style={{ color:delivery===opt.k?C.gold:C.mute, marginTop:2 }}/>
<div>
<div className="text-[14px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{opt.title}</div>
<div className="text-[12px] mt-0.5" style={{ color:C.mute }}>{opt.sub}</div>
</div>
{delivery===opt.k && <Check size={16} style={{ color:C.gold, marginLeft:'auto', marginTop:2 }}/>}
</button>
))}
</div>
{delivery==='boutique' && (
<div>
<div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>BOUTIQUE</div>
<div className="grid grid-cols-2 gap-2">
{BOUTIQUES.map(b=>(
<button key={b.id} onClick={()=>setBoutique(b.id)} className="p-4 border text-left" style={{ background:boutique===b.id?C.ink:'transparent', color:boutique===b.id?'#FFF':C.ink, borderColor:boutique===b.id?C.ink:C.line }}>
<div className="text-[10px] opacity-60 mb-1">AZZABI OPTIC</div>
<div style={{ fontFamily:'Fraunces,serif' }}>{b.name}</div>
<div className="text-[10px] mt-0.5 opacity-70">{b.hours}</div>
</button>
))}
</div>
</div>
)}
</div>
)}
{step === 'contact' && (
<div className="px-5 pt-6">
<h2 className="text-[28px] mb-6 leading-tight" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Vos coordonnées</h2>
<div className="space-y-3">
<Input value={contact.name} onChange={v=>setContact({...contact,name:v})} placeholder="Nom complet *"/>
<Input value={contact.phone} onChange={v=>setContact({...contact,phone:v})} placeholder="Téléphone / WhatsApp *"/>
<Input value={contact.email} onChange={v=>setContact({...contact,email:v})} placeholder="E-mail (optionnel)" type="email"/>
{delivery==='home' && (
<>
<Input value={contact.address} onChange={v=>setContact({...contact,address:v})} placeholder="Adresse complète *"/>
<Input value={contact.city} onChange={v=>setContact({...contact,city:v})} placeholder="Ville / Gouvernorat *"/>
</>
)}
</div>
</div>
)}
{step === 'payment' && (
<div className="px-5 pt-6">
<h2 className="text-[28px] mb-6 leading-tight" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Mode de paiement</h2>
<div className="space-y-3 mb-6">
{[
{ k:'instore', icon:'💳', title:'Paiement en boutique', sub:'Espèces ou carte bancaire tunisienne lors du retrait' },
{ k:'card', icon:'🌐', title:'Carte bancaire internationale', sub:'Visa, Mastercard — EUR, CAD, USD acceptés' },
{ k:'wise', icon:'🔁', title:'Virement Wise / PayPal', sub:'Pour la diaspora — paiement depuis l\'étranger' },
].map(opt=>(
<button key={opt.k} onClick={()=>setPayment(opt.k)} className="w-full p-4 text-left flex items-start gap-3 border" style={{ background:payment===opt.k?C.bgWarm:'transparent', borderColor:payment===opt.k?C.gold:C.line }}>
<span className="text-xl">{opt.icon}</span>
<div className="flex-1">
<div className="text-[14px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{opt.title}</div>
<div className="text-[11px] mt-0.5" style={{ color:C.mute }}>{opt.sub}</div>
</div>
{payment===opt.k && <Check size={16} style={{ color:C.gold, marginTop:2 }}/>}
</button>
))}
</div>
<div className="p-4" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
<div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>RÉCAPITULATIF</div>
<div className="space-y-2 text-[12px]">
{cart.map(i=>(
<div key={i.product.id} className="flex justify-between">
<span style={{ color:C.inkSoft }}>{i.product.brand} × {i.qty}</span>
<span style={{ color:C.ink }}>{fmt(i.product.price*i.qty,'TND')}</span>
</div>
))}
{promoApplied && <div className="flex justify-between" style={{ color:C.success }}><span>Remise</span><span>–{fmt(discount,'TND')}</span></div>}
{delivery==='home' && <div className="flex justify-between"><span style={{ color:C.mute }}>Livraison</span><span style={{ color:C.ink }}>{fmt(shipping,'TND')}</span></div>}
<div className="flex justify-between font-semibold pt-2" style={{ borderTop:`1px solid ${C.line}` }}>
<span style={{ color:C.ink }}>TOTAL</span><span style={{ color:C.ink }}>{fmt(total,'TND')}</span>
</div>
</div>
</div>
</div>
)}
{step === 'confirm' && (
<div className="px-5 pt-12 text-center">
<div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background:goldGrad }}>
<Check size={32} style={{ color:C.ink }} strokeWidth={2.5}/>
</div>
<h2 className="text-[36px] mb-3" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink, letterSpacing:'-0.01em' }}>Commande passée.</h2>
<p className="text-[13px] leading-relaxed mb-8 max-w-[28ch] mx-auto" style={{ color:C.inkSoft }}>
{delivery==='boutique' ? `Votre commande sera prête dans 24–48h à la boutique de ${BOUTIQUES.find(b=>b.id===boutique)?.name}. Un SMS de confirmation vous sera envoyé.` : `Votre commande sera livrée à ${contact.city} dans 48–72h. Un SMS de suivi vous sera envoyé.`}
</p>
<div className="p-5 text-left mb-6" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
<div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>VOTRE COMMANDE</div>
<div className="space-y-1.5 text-[12px]">
<div className="flex justify-between"><span style={{ color:C.mute }}>Articles</span><span style={{ color:C.ink }}>{cart.length} pièce{cart.length>1?'s':''}</span></div>
<div className="flex justify-between"><span style={{ color:C.mute }}>Total</span><span style={{ color:C.ink }}>{fmt(total,'TND')}</span></div>
<div className="flex justify-between"><span style={{ color:C.mute }}>Paiement</span><span style={{ color:C.ink }}>{{instore:'En boutique',card:'Carte internationale',wise:'Wise/PayPal'}[payment]}</span></div>
</div>
</div>
<a href="https://wa.me/21628630250" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 text-[11px] tracking-[0.22em] font-semibold mb-3" style={{ background:C.ink, color:'#FFF' }}>
<MessageCircle size={15}/>SUIVI WHATSAPP
</a>
<button onClick={onClose} className="text-[11px] tracking-[0.2em] underline underline-offset-4" style={{ color:C.mute }}>RETOUR À LA BOUTIQUE</button>
</div>
)}
</div>
{step !== 'confirm' && cart.length > 0 && (
<div className="fixed bottom-0 left-0 right-0 px-5 py-4" style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderTop:`1px solid ${C.line}` }}>
<Btn variant="black" className="w-full" onClick={()=>{ if(step==='cart') setStep('delivery'); else if(step==='delivery') setStep('contact'); else if(step==='contact' && contact.name && contact.phone) setStep('payment'); else if(step==='payment') doCheckout(); }} disabled={step==='contact' && (!contact.name || !contact.phone)}>
{step==='cart'?`COMMANDER · ${fmt(total,'TND')}`:step==='delivery'?'CONTINUER':step==='contact'?'CHOISIR LE PAIEMENT':`CONFIRMER · ${fmt(total,'TND')}`}
<ChevronRight size={14}/>
</Btn>
</div>
)}
</div>
);
}

// ─── DIASPORA SCREEN ───────────────────────────────────────────────
function DiasporaScreen({ ccy, lang }) {
const [mode, setMode] = useState(null);
const [step, setStep] = useState(1);
const [form, setForm] = useState({ from:'',recipient:'',city:'',whatsapp:'',message:'',returnDate:'',boutique:'marsa' });
const inStyle = { background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink };
const iCls = "w-full px-4 py-3.5 text-[13px] outline-none";

if (mode === 'gift') return (
<div className="pb-32" style={{ background:C.bg }}>
<BackRow onBack={()=>{setMode(null);setStep(1);}} label={`SERVICE CADEAU · ÉTAPE ${step}/3`}/>
<div className="px-5 pt-2">
<div className="flex gap-1.5 mb-7">{[1,2,3].map(s=><div key={s} className="flex-1 h-0.5" style={{ background:s<=step?C.gold:C.line }}/>)}</div>
{step===1 && (<div><h2 className="text-[30px] leading-tight mb-5" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Vous offrez à qui ?</h2><div className="space-y-3 mb-6"><input value={form.from} onChange={e=>setForm({...form,from:e.target.value})} placeholder="Votre prénom · Votre ville (Paris, Montréal…)" className={iCls} style={inStyle}/><input value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})} placeholder="Prénom du destinataire en Tunisie" className={iCls} style={inStyle}/><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Ville de livraison (Tunis, Sousse…)" className={iCls} style={inStyle}/><input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp du destinataire (+216…)" className={iCls} style={inStyle}/></div><Btn variant="black" className="w-full" onClick={()=>setStep(2)} disabled={!form.from||!form.recipient||!form.city}>CONTINUER <ChevronRight size={14}/></Btn></div>)}
{step===2 && (<div><h2 className="text-[30px] leading-tight mb-5" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Un mot pour accompagner ?</h2><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} rows={5} placeholder="Votre message — imprimé sur une carte et glissé dans l'écrin." className={`${iCls} resize-none mb-4`} style={inStyle}/><div className="p-4 mb-6 relative" style={{ background:C.bgWarm }}><GoldBar/><div className="flex gap-3 pl-3"><Sparkles size={14} style={{ color:C.gold, marginTop:2 }}/><div className="text-[12px] leading-relaxed" style={{ color:C.inkSoft }}><strong style={{ color:C.ink }}>Inclus :</strong> écrin Azzabi Optic + carte imprimée à votre nom + livraison 48–72h ou retrait gratuit.</div></div></div><Btn variant="black" className="w-full" onClick={()=>setStep(3)}>CHOISIR LA MONTURE <ChevronRight size={14}/></Btn></div>)}
{step===3 && (<div><h2 className="text-[30px] leading-tight mb-3" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Notre conseillère vous rappelle.</h2><p className="text-[13px] leading-relaxed mb-5" style={{ color:C.inkSoft }}>Un opticien diplômé vous appelle sur WhatsApp dans l'heure pour le choix de la monture. Paiement par carte EUR/CAD/USD ou Wise.</p><div className="p-5 mb-5" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}><div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>RÉCAPITULATIF</div>{[['De',form.from||'—'],['Pour',form.recipient||'—'],['Livraison',form.city||'—'],['Devise',ccy]].map(([k,v])=>(<div key={k} className="flex justify-between text-[12px] py-2" style={{ borderBottom:`1px solid ${C.line}` }}><span style={{ color:C.mute }}>{k}</span><span style={{ color:C.ink }}>{v}</span></div>))}</div><a href="https://wa.me/21628630250" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 text-[11px] tracking-[0.22em] font-semibold" style={{ background:C.ink, color:'#FFF' }}><MessageCircle size={15}/>CONTACTER PAR WHATSAPP</a></div>)}
</div>
</div>
);

if (mode === 'return') return (
<div className="pb-32" style={{ background:C.bg }}>
<BackRow onBack={()=>setMode(null)} label="RETOUR AU PAYS"/>
<div className="px-5 pt-2">
<h2 className="text-[32px] leading-tight mb-3" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Vos lunettes vous attendent à votre arrivée.</h2>
<p className="text-[13px] leading-relaxed mb-5" style={{ color:C.inkSoft }}>Réservez votre examen de vue 4–6 semaines avant. Vos verres sont prêts le jour J.</p>
<div className="space-y-3 mb-5">
<input value={form.from} onChange={e=>setForm({...form,from:e.target.value})} placeholder="Votre nom complet" className={iCls} style={inStyle}/>
<input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="WhatsApp / Téléphone" className={iCls} style={inStyle}/>
<input type="date" value={form.returnDate} onChange={e=>setForm({...form,returnDate:e.target.value})} className={iCls} style={inStyle}/>
<div className="grid grid-cols-2 gap-2">{BOUTIQUES.map(b=>(<button key={b.id} onClick={()=>setForm({...form,boutique:b.id})} className="p-4 border text-left" style={{ background:form.boutique===b.id?C.ink:'transparent', color:form.boutique===b.id?'#FFF':C.ink, borderColor:form.boutique===b.id?C.ink:C.line }}><div className="text-[10px] opacity-60 mb-1">BOUTIQUE</div><span style={{ fontFamily:'Fraunces,serif' }}>{b.name}</span></button>))}</div>
</div>
<Btn variant="black" className="w-full" disabled={!form.from||!form.returnDate}>CONFIRMER MA PRÉ-RÉSERVATION</Btn>
<p className="text-[11px] text-center mt-3" style={{ color:C.mute }}>Une opticienne vous rappelle pour préciser votre correction.</p>
</div>
</div>
);

return (
<div className="pb-32" style={{ background:C.bg }}>
<div className="relative overflow-hidden" style={{ background:C.ink, color:'#FFF' }}>
<OrnamentBg/>
<div className="absolute top-0 right-0 w-48 h-48" style={{ background:'radial-gradient(circle at top right,rgba(212,175,55,0.3) 0%,transparent 70%)' }}/>
<div className="relative px-6 pt-10 pb-12">
<div className="text-[10px] tracking-[0.3em] font-semibold mb-5" style={goldText}>DIASPORA · TRE</div>
<h1 className="text-[44px] leading-[0.98] mb-5" style={{ fontFamily:'Fraunces,serif', fontWeight:300, letterSpacing:'-0.01em' }}>La Tunisie{'\n'}à portée{'\n'}de regard.</h1>
<p className="text-[14px] leading-relaxed opacity-80 max-w-[30ch]">Pensé pour les Tunisiens vivant à l'étranger.</p>
</div>
</div>
<div className="px-5 pt-6 space-y-4 mb-10">
{[
{ k:'gift', icon:Gift, kicker:'SERVICE CADEAU', title:'Offrir des lunettes à un proche en Tunisie', sub:'Paiement EUR/CAD/USD, livraison dans toute la Tunisie, écrin et carte inclus.' },
{ k:'return', icon:Plane, kicker:'RETOUR AU PAYS', title:'Préparer mes lunettes pour mes vacances en Tunisie', sub:'Réservation 4–6 semaines avant arrivée. Verres prêts le jour J.' },
].map((opt,i)=>(
<button key={opt.k} onClick={()=>setMode(opt.k)} className="block w-full text-left p-6 relative overflow-hidden" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}>
<div className="absolute top-4 right-4 text-[60px] leading-none opacity-[0.08]" style={{ fontFamily:'Fraunces,serif', color:C.gold }}>{['I','II'][i]}</div>
<div className="flex items-center gap-2 text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}><opt.icon size={12} style={{ color:C.gold }}/>{opt.kicker}</div>
<h3 className="text-[22px] leading-tight mb-2" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{opt.title}</h3>
<p className="text-[12px] leading-relaxed mb-4" style={{ color:C.inkSoft }}>{opt.sub}</p>
<div className="flex items-center gap-2 text-[10px] tracking-[0.22em] font-semibold" style={{ color:C.ink }}>COMMENCER <ChevronRight size={13} style={{ color:C.gold }}/></div>
</button>
))}
</div>
<div className="px-5 mb-10">
<SectionHead kicker="COMMENT ÇA MARCHE" title="Trois étapes."/>
{[{n:'01',t:'Vous nous contactez',d:'WhatsApp ou formulaire. Réponse en français, arabe ou anglais.'},{n:'02',t:'Choix conseillé à distance',d:'Photos, visagisme par visio, recommandation de monture et verres.'},{n:'03',t:'Livraison ou retrait',d:'Express 48–72h en Tunisie ou retrait gratuit en boutique.'}].map(s=>(<div key={s.n} className="py-5 flex gap-5" style={{ borderTop:`1px solid ${C.line}` }}><div className="text-[12px] font-semibold tabular-nums" style={{ color:C.gold, fontFamily:'Fraunces,serif' }}>{s.n}</div><div><div className="text-[15px] mb-1" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{s.t}</div><div className="text-[12px] leading-relaxed" style={{ color:C.inkSoft }}>{s.d}</div></div></div>))}
</div>
<div className="px-5">
<a href="https://wa.me/21628630250" target="_blank" rel="noreferrer" className="block w-full p-5 relative overflow-hidden" style={{ background:C.ink, color:'#FFF' }}>
<div className="absolute top-0 right-0 w-32 h-32" style={{ background:'radial-gradient(circle at top right,rgba(212,175,55,0.25) 0%,transparent 70%)' }}/>
<div className="relative flex items-center gap-4">
<div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:goldGrad }}><MessageCircle size={20} style={{ color:C.ink }}/></div>
<div className="flex-1"><div className="text-[10px] tracking-[0.25em] font-semibold mb-1" style={goldText}>CONSEILLER EN LIGNE</div><div className="text-[15px]" style={{ fontFamily:'Fraunces,serif' }}>Parler à un opticien sur WhatsApp</div></div>
<ArrowUpRight size={18}/>
</div>
</a>
</div>
</div>
);
}

// ─── APPOINTMENT SCREEN ────────────────────────────────────────────
function AppointmentScreen({ onBook }) {
const [boutique,setBoutique]=useState('marsa');
const [date,setDate]=useState('');
const [time,setTime]=useState('');
const [service,setService]=useState('exam');
const [name,setName]=useState('');
const [phone,setPhone]=useState('');
const [note,setNote]=useState('');
const [confirmed,setConfirmed]=useState(false);
const slots=['09:30','10:30','11:30','14:00','15:00','16:00','17:00'];
const services=[{k:'exam',label:'Examen de vue',d:'30 min · gratuit'},{k:'fitting',label:'Essayage & visagisme',d:'45 min · sans engagement'},{k:'progressive',label:'Conseil verres progressifs',d:'40 min · expert Varilux'},{k:'lenses',label:'Adaptation lentilles',d:'30 min'}];
const doConfirm = () => { onBook({ ref:'RDV-'+Date.now(), service:services.find(s=>s.k===service)?.label, boutique:BOUTIQUES.find(b=>b.id===boutique)?.name, date, time, name, phone, note, status:'confirmé' }); setConfirmed(true); };
if (confirmed) return (
<div className="pb-32 px-5 pt-12 text-center" style={{ background:C.bg }}>
<div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background:goldGrad }}><Check size={32} style={{ color:C.ink }} strokeWidth={2.5}/></div>
<h2 className="text-[36px] mb-3" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Réservé.</h2>
<p className="text-[13px] leading-relaxed max-w-[28ch] mx-auto mb-8" style={{ color:C.inkSoft }}>Un SMS de confirmation vous sera envoyé. À très vite chez Azzabi Optic.</p>
<button onClick={()=>{setConfirmed(false);setDate('');setTime('');setName('');setPhone('');setNote('');}} className="text-[11px] tracking-[0.2em] underline underline-offset-4" style={{ color:C.ink }}>NOUVEAU RENDEZ-VOUS</button>
</div>
);
return (
<div className="pb-32" style={{ background:C.bg }}>
<div className="px-5 pt-6 pb-4"><div className="text-[10px] tracking-[0.3em] font-semibold mb-1" style={{ color:C.mute }}>RENDEZ-VOUS</div><h2 className="text-[34px] leading-tight" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Réserver en boutique</h2></div>
<div className="px-5 space-y-6">
<div><div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>PRESTATION</div><div className="space-y-2">{services.map(s=>(<button key={s.k} onClick={()=>setService(s.k)} className="w-full text-left p-4 border" style={{ background:service===s.k?C.bgWarm:'transparent', borderColor:service===s.k?C.gold:C.line }}><div className="flex items-center justify-between"><div><div className="text-[14px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{s.label}</div><div className="text-[11px] mt-0.5" style={{ color:C.mute }}>{s.d}</div></div>{service===s.k && <Check size={15} style={{ color:C.gold }} strokeWidth={2.5}/>}</div></button>))}</div></div>
<div><div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>BOUTIQUE</div><div className="grid grid-cols-2 gap-2">{BOUTIQUES.map(b=>(<button key={b.id} onClick={()=>setBoutique(b.id)} className="p-4 border text-left" style={{ background:boutique===b.id?C.ink:'transparent', color:boutique===b.id?'#FFF':C.ink, borderColor:boutique===b.id?C.ink:C.line }}><div className="text-[10px] opacity-60 mb-1">AZZABI OPTIC</div><div style={{ fontFamily:'Fraunces,serif' }}>{b.name}</div><div className="text-[10px] opacity-70 mt-0.5">{b.hours}</div></button>))}</div></div>
<div><div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>DATE</div><input type="date" value={date} onChange={e=>setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3.5 text-[13px] outline-none" style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}/></div>
{date && (<div><div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>CRÉNEAU</div><div className="grid grid-cols-4 gap-2">{slots.map(s=>(<button key={s} onClick={()=>setTime(s)} className="py-3 text-[12px] tabular-nums border" style={{ background:time===s?C.ink:'transparent', color:time===s?'#FFF':C.ink, borderColor:time===s?C.ink:C.line }}>{s}</button>))}</div></div>)}
<div><div className="text-[10px] tracking-[0.25em] font-semibold mb-3" style={{ color:C.mute }}>VOS COORDONNÉES</div><div className="space-y-2"><Input value={name} onChange={setName} placeholder="Nom complet *"/><Input value={phone} onChange={setPhone} placeholder="Téléphone / WhatsApp *"/><textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Note optionnelle…" className="w-full px-4 py-3.5 text-[13px] outline-none resize-none" style={{ background:C.bgSoft, border:`1px solid ${C.line}`, color:C.ink }}/></div></div>
<Btn variant="black" className="w-full" onClick={doConfirm} disabled={!(date&&time&&name&&phone)}>CONFIRMER LE RENDEZ-VOUS</Btn>
</div>
</div>
);
}

// ─── PROFILE SCREEN ────────────────────────────────────────────────
function ProfileScreen({ ccy, wished, toggleWish, onProduct, onCart, orders, appointments, onAdminOpen }) {
const [view, setView] = useState('main');
const wishedProducts = PRODUCTS.filter(p=>wished.includes(p.id));
const statusColor = { 'confirmé':C.gold, 'en préparation':'#4A90E2', 'livré':C.success, 'annulé':C.error };

if (view === 'favorites') return (
<div className="pb-32" style={{ background:C.bg }}>
<BackRow onBack={()=>setView('main')} label="MES FAVORIS"/>
<div className="px-5 pt-2">
{wishedProducts.length===0 ? (<div className="py-20 text-center"><Heart size={36} className="mx-auto mb-4" style={{ color:C.line }}/><div className="text-[15px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Aucun favori.</div></div>)
: (<div className="grid grid-cols-2 gap-x-4 gap-y-7">{wishedProducts.map(p=>(<ProductCard key={p.id} p={p} ccy={ccy} onTap={onProduct} onWish={toggleWish} wished={true} onCart={onCart}/>))}</div>)}
</div>
</div>
);

if (view === 'orders') return (
<div className="pb-32" style={{ background:C.bg }}>
<BackRow onBack={()=>setView('main')} label="MES COMMANDES"/>
<div className="px-5 pt-2">
{orders.length===0 ? (<div className="py-20 text-center"><Package size={36} className="mx-auto mb-4" style={{ color:C.line }}/><div className="text-[15px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Aucune commande.</div></div>)
: (<div className="space-y-3">{orders.map((o,i)=>(<div key={i} className="p-5" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}><div className="flex items-start justify-between mb-3"><div><div className="text-[10px] tracking-[0.2em] font-semibold mb-0.5" style={{ color:C.mute }}>{o.ref} · {o.date||o.created_at?.slice(0,10)}</div><div className="text-[14px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{o.cart?.length} pièce{o.cart?.length>1?'s':''}</div></div><span className="text-[10px] px-2 py-1 font-semibold capitalize" style={{ background:`${(statusColor[o.status]||C.mute)}22`, color:statusColor[o.status]||C.mute }}>{o.status}</span></div><div className="flex justify-between text-[12px] font-semibold pt-2" style={{ borderTop:`1px solid ${C.line}` }}><span style={{ color:C.ink }}>Total</span><span style={{ color:C.ink }}>{fmt(o.total,'TND')}</span></div></div>))}</div>)}
</div>
</div>
);

if (view === 'appointments') return (
<div className="pb-32" style={{ background:C.bg }}>
<BackRow onBack={()=>setView('main')} label="MES RENDEZ-VOUS"/>
<div className="px-5 pt-2">
{appointments.length===0 ? (<div className="py-20 text-center"><CalendarDays size={36} className="mx-auto mb-4" style={{ color:C.line }}/><div className="text-[15px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Aucun rendez-vous.</div></div>)
: (<div className="space-y-3">{appointments.map((a,i)=>(<div key={i} className="p-5" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}><div className="flex justify-between items-start mb-2"><div><div className="text-[10px] tracking-[0.2em] font-semibold mb-0.5" style={{ color:C.mute }}>{a.date} · {a.time}</div><div className="text-[14px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{a.service}</div></div><span className="text-[10px] px-2 py-1 font-semibold" style={{ background:`${C.gold}22`, color:C.goldDark }}>{a.status}</span></div><div className="text-[12px] flex items-center gap-1.5" style={{ color:C.inkSoft }}><MapPin size={12} style={{ color:C.gold }}/>{a.boutique}</div></div>))}</div>)}
</div>
</div>
);

return (
<div className="pb-32" style={{ background:C.bg }}>
<div className="px-5 pt-6 pb-4"><div className="text-[10px] tracking-[0.3em] font-semibold mb-1" style={{ color:C.mute }}>PROFIL</div><h2 className="text-[34px] leading-tight" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink }}>Mon compte</h2></div>
<div className="px-5">
<div className="p-5 mb-6 relative overflow-hidden" style={{ background:C.ink, color:'#FFF' }}>
<div className="absolute top-0 right-0 w-32 h-32" style={{ background:'radial-gradient(circle at top right,rgba(212,175,55,0.3) 0%,transparent 70%)' }}/>
<div className="relative flex items-center gap-4">
<div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:goldGrad }}><span className="text-[22px]" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>A</span></div>
<div className="flex-1"><div className="text-[16px]" style={{ fontFamily:'Fraunces,serif' }}>Client Azzabi</div><div className="text-[10px] tracking-[0.2em] font-semibold opacity-70">MEMBRE 2024</div></div>
</div>
</div>
<div className="grid grid-cols-3 gap-2 mb-7">
{[{v:wished.length,l:'Favoris',view:'favorites'},{v:orders.length,l:'Commandes',view:'orders'},{v:appointments.length,l:'RDV',view:'appointments'}].map(s=>(<button key={s.l} onClick={()=>setView(s.view)} className="p-4 text-center" style={{ background:C.bgSoft, border:`1px solid ${C.line}` }}><div className="text-[26px] tabular-nums" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{s.v}</div><div className="text-[10px] tracking-[0.2em] font-semibold mt-1" style={{ color:C.mute }}>{s.l.toUpperCase()}</div></button>))}
</div>
{[{icon:Heart,label:'Mes favoris',sub:`${wished.length} pièce${wished.length!==1?'s':''}`,view:'favorites'},{icon:Package,label:'Mes commandes',sub:orders.length>0?`${orders.length} commande${orders.length!==1?'s':''}`:'Aucune commande',view:'orders'},{icon:CalendarDays,label:'Mes rendez-vous',sub:appointments.length>0?`${appointments.length} rendez-vous`:'Aucun rendez-vous',view:'appointments'}].map((item,i)=>(<button key={i} className="w-full flex items-center gap-4 py-4" style={{ borderTop:`1px solid ${C.line}` }} onClick={()=>setView(item.view)}><div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background:C.bgSoft }}><item.icon size={16} style={{ color:C.mute }}/></div><div className="flex-1 text-left"><div className="text-[13px]" style={{ color:C.ink }}>{item.label}</div><div className="text-[11px]" style={{ color:C.mute }}>{item.sub}</div></div><ChevronRight size={15} style={{ color:C.mute }}/></button>))}
<a href="https://wa.me/21628630250" target="_blank" rel="noreferrer" className="w-full py-4 flex items-center gap-4" style={{ borderTop:`1px solid ${C.line}` }}><div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background:C.bgSoft }}><MessageCircle size={16} style={{ color:C.mute }}/></div><div className="flex-1 text-left"><div className="text-[13px]" style={{ color:C.ink }}>Service client</div><div className="text-[11px]" style={{ color:C.mute }}>+216 28 630 250 · WhatsApp</div></div><ArrowUpRight size={15} style={{ color:C.mute }}/></a>
<div className="mt-4 p-4 relative" style={{ background:C.bgWarm }}><GoldBar/><div className="flex items-start gap-3 pl-3"><Tag size={14} style={{ color:C.gold, marginTop:1 }}/><div className="text-[12px] leading-relaxed" style={{ color:C.inkSoft }}><strong style={{ color:C.ink }}>Code promo diaspora :</strong> utilisez <strong>DIASPORA10</strong> au panier pour –10% sur votre première commande.</div></div></div>
<div className="mt-10 text-center pb-6"><div className="flex justify-center mb-3"><AzzabiMark size={26}/></div><div className="text-[9px] tracking-[0.4em] font-semibold" style={{ color:C.mute }}>— EST. 2010 — TUNIS —</div><button onClick={onAdminOpen} className="mt-4 text-[10px] tracking-[0.2em]" style={{ color:C.line }}>⚙ ADMIN</button></div>
</div>
</div>
);
}

export default function AzzabiOpticApp() {
const [tab, setTab] = useState('home');
const [ccy, setCcy] = useState('TND');
const [lang, setLang] = useState('fr');
const [wished, setWished] = useState([]);
const [cart, setCart] = useState([]);
const [cartOpen, setCartOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);
const [orders, setOrders] = useState([]);
const [appointments, setAppointments] = useState([]);
const [showAdmin, setShowAdmin] = useState(false);
const [products, setProducts] = useState(PRODUCTS);
const [apiReady, setApiReady] = useState(false);

useEffect(() => {
  api.products.list().then(data => {
    setProducts(data);
    setApiReady(true);
  }).catch(() => {
    setApiReady(false);
  });
}, []);

const dir = lang==='ar' ? 'rtl' : 'ltr';

const toggleWish = useCallback(id => setWished(w=>w.includes(id)?w.filter(x=>x!==id):[...w,id]), []);

const addToCart = useCallback(product => {
setCart(c=>{
const idx = c.findIndex(i=>i.product.id===product.id);
if(idx>=0) return c.map((i,j)=>j===idx?{...i,qty:i.qty+1}:i);
return [...c, { product, qty:1 }];
});
}, []);

const updateQty = useCallback((id, qty) => {
if(qty<1) setCart(c=>c.filter(i=>i.product.id!==id));
else setCart(c=>c.map(i=>i.product.id===id?{...i,qty}:i));
}, []);

const removeFromCart = useCallback(id => setCart(c=>c.filter(i=>i.product.id!==id)), []);

const cartCount = cart.reduce((s,i)=>s+i.qty, 0);

const handleCheckout = useCallback(async (orderData) => {
try {
  const saved = await api.orders.create(orderData);
  setOrders(o=>[saved, ...o]);
} catch {
  setOrders(o=>[{ ...orderData, status:'confirmé', ref:'LOCAL-'+Date.now() }, ...o]);
}
setCart([]);
}, []);

const handleBook = useCallback(async (apptData) => {
try {
  const saved = await api.appointments.create(apptData);
  setAppointments(a=>[saved, ...a]);
} catch {
  setAppointments(a=>[{ ...apptData }, ...a]);
}
}, []);

const tabs = [
{ k:'home',        icon:Home,         label:'Accueil' },
{ k:'catalog',     icon:ShoppingBag,  label:'Boutique' },
{ k:'diaspora',    icon:Globe2,       label:'Diaspora' },
{ k:'appointment', icon:CalendarDays, label:'RDV' },
{ k:'profile',     icon:User,         label:'Profil' },
];

const notifCount = orders.filter(o=>o.status==='confirmé').length;

return (
<div className="min-h-screen w-full" style={{ background:C.bg, fontFamily:'Manrope,sans-serif', color:C.ink }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Manrope:wght@400;500;600;700&family=Montserrat:wght@800;900&display=swap'); .scrollbar-hide::-webkit-scrollbar{display:none} .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none} details summary::-webkit-details-marker{display:none} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.3s ease-out}`}</style>
<TopBar ccy={ccy} setCcy={setCcy} lang={lang} setLang={setLang} cartCount={cartCount} onCart={()=>setCartOpen(true)} notifCount={notifCount}/>
<div key={tab} className="fade-in" dir={dir}>
{tab==='diaspora' && <DiasporaScreen ccy={ccy} lang={lang}/>}
{tab==='appointment' && <AppointmentScreen onBook={handleBook}/>}
{tab==='profile' && <ProfileScreen ccy={ccy} wished={wished} toggleWish={toggleWish} onProduct={setSelectedProduct} onCart={addToCart} orders={orders} appointments={appointments} onAdminOpen={()=>setShowAdmin(true)}/>}
{tab==='home' && <div className="pb-32" style={{ background:C.bg }}><div className="px-6 pt-10 pb-12"><div className="flex items-center gap-2 text-[10px] tracking-[0.3em] font-semibold mb-6" style={{ color:C.mute }}><span className="w-6 h-px" style={{ background:C.gold }}/>OPTICIEN DEPUIS 2010</div><h1 className="text-[58px] leading-[0.92] mb-6" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink, letterSpacing:'-0.02em' }}>L'art de voir.</h1><p className="text-[14px] leading-relaxed mb-8 max-w-[28ch]" style={{ color:C.inkSoft }}>Maison opticienne tunisienne. La Marsa & Aïn Zaghouan. Sélection rigoureuse de Fendi, Celine, Dior, Tom Ford, Persol, Ray-Ban.</p><button onClick={()=>setTab('catalog')} className="inline-flex items-center gap-3 px-5 py-3.5 text-[11px] tracking-[0.2em] font-semibold" style={{ background:C.ink, color:'#FFF' }}>DÉCOUVRIR LA COLLECTION<ArrowUpRight size={14}/></button></div><div className="px-5 mb-12"><div className="relative overflow-hidden aspect-[3/2]"><img src="https://azzabioptic.com/wp-content/uploads/2025/09/desktop_fr-FR.webp" alt="Azzabi Optic boutique" className="w-full h-full object-cover" onError={e=>{e.target.src='https://picsum.photos/seed/azzabi-optic-boutique/600/400';}}/><div className="absolute bottom-0 left-0 right-0 p-4" style={{ background:'linear-gradient(transparent,rgba(0,0,0,0.6))' }}><div className="text-[10px] tracking-[0.3em] font-semibold text-white opacity-80">LA MARSA · AÏN ZAGHOUAN</div></div></div></div><div className="px-5 mb-12"><div className="text-[10px] tracking-[0.3em] font-semibold mb-1" style={{ color:C.mute }}>01 — COLLECTION</div><h3 className="text-[26px] mb-5" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Maisons d'exception</h3><div className="flex gap-4 overflow-x-auto pb-2 px-5 scrollbar-hide">{products.filter(p=>p.new||p.is_new).map(p=>(<div key={p.id} className="w-[170px] flex-shrink-0"><ProductCard p={p} ccy={ccy} onTap={setSelectedProduct} onWish={toggleWish} wished={wished.includes(p.id)} onCart={addToCart}/></div>))}</div></div><div className="px-5 py-4 flex items-center gap-4"><span className="h-px flex-1" style={{ background:C.line }}/><AzzabiMark size={26}/><span className="h-px flex-1" style={{ background:C.line }}/></div><div className="px-5 pt-8 mb-12"><div className="text-[10px] tracking-[0.3em] font-semibold mb-1" style={{ color:C.mute }}>02 — JOURNAL</div><h3 className="text-[26px] mb-5" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>Notes d'opticien</h3>{[{kicker:'GUIDE', title:'Verres progressifs Varilux : ce qu\'il faut savoir', read:'6 min', img:'https://azzabioptic.com/wp-content/uploads/2026/04/Gemini_Generated_Image_knp2g7knp2g7knp2.png', url:'https://azzabioptic.com'}, {kicker:'TENDANCE', title:'Lunettes de soleil 2026 : les formes qui s\'imposent', read:'4 min', img:'https://azzabioptic.com/wp-content/uploads/2025/09/desktop_fr-FR.webp', url:'https://azzabioptic.com'}, {kicker:'EXPERTISE', title:'Lentilles de couleur : choisir une teinte naturelle', read:'5 min', img:'https://picsum.photos/seed/contact-lenses-color-azzabi/400/280', url:'https://azzabioptic.com'}].map((a,i)=>(<a key={i} href={a.url} target="_blank" rel="noreferrer" className="block py-5 flex items-start gap-4" style={{ borderTop:`1px solid ${C.line}` }}><div className="flex-1 min-w-0"><div className="text-[9px] tracking-[0.25em] font-semibold mb-1.5" style={{ color:C.gold }}>{a.kicker}</div><div className="text-[15px] leading-snug mb-2" style={{ fontFamily:'Fraunces,serif', color:C.ink }}>{a.title}</div><div className="text-[11px]" style={{ color:C.mute }}>{a.read} de lecture</div></div><div className="w-24 h-20 flex-shrink-0 relative overflow-hidden" style={{ background:C.bgSoft }}><img src={a.img} alt={a.title} className="absolute inset-0 w-full h-full object-cover" onError={e => { e.target.style.display='none'; }}/></div></a>))}</div></div>}
{tab==='catalog' && <div className="pb-32" style={{ background:C.bg }}><div className="px-5 pt-6 pb-4"><div className="text-[10px] tracking-[0.3em] font-semibold mb-1" style={{ color:C.mute }}>BOUTIQUE</div><h2 className="text-[34px]" style={{ fontFamily:'Fraunces,serif', fontWeight:300, color:C.ink, letterSpacing:'-0.01em' }}>Le catalogue</h2>{apiReady && <div className="text-[10px] mt-1" style={{ color:C.success }}>● API connectée</div>}</div><div className="px-5 grid grid-cols-2 gap-x-4 gap-y-7">{products.map(p=>(<ProductCard key={p.id} p={p} ccy={ccy} onTap={setSelectedProduct} onWish={toggleWish} wished={wished.includes(p.id)} onCart={addToCart}/>))}</div></div>}
</div>
<div className="fixed bottom-0 left-0 right-0 z-40" style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(12px)', borderTop:`1px solid ${C.line}` }}>
<div className="flex items-center justify-around px-2 pt-3 pb-5">
{tabs.map(({ k, icon:Icon, label })=>(
<button key={k} onClick={()=>setTab(k)} className="flex flex-col items-center gap-1 px-2 py-1 relative">
{tab===k && <div className="absolute -top-3 w-6 h-0.5" style={{ background:goldGrad }}/>}
<Icon size={18} strokeWidth={tab===k?2:1.5} style={{ color:tab===k?C.ink:C.mute }}/>
<span className="text-[9px] tracking-[0.1em] font-semibold" style={{ color:tab===k?C.ink:C.mute }}>{label}</span>
</button>
))}
</div>
</div>
{selectedProduct && (
<div className="fixed inset-0 z-50 overflow-y-auto" style={{ background:C.bg }}>
<div className="aspect-square relative" style={{ background:C.bgSoft }}>
<img src={selectedProduct.img} alt={`${selectedProduct.brand}`} className="absolute inset-0 w-full h-full object-contain" style={{ padding:'8%' }}/>
<button onClick={()=>setSelectedProduct(null)} className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center" style={{ background:'rgba(0,0,0,0.08)', backdropFilter:'blur(10px)' }}>
<X size={18} style={{ color:C.ink }}/>
</button>
</div>
<div className="px-5 pt-6 pb-32">
<h1 className="text-[28px] leading-tight mb-2" style={{ fontFamily:'Fraunces,serif', fontWeight:400, color:C.ink }}>{selectedProduct.name}</h1>
<div className="flex items-baseline gap-3 mb-6 pb-6" style={{ borderBottom:`1px solid ${C.line}` }}>
<div className="text-[26px] tabular-nums font-semibold" style={{ color:C.ink }}>{fmt(selectedProduct.price,ccy)}</div>
</div>
<button onClick={()=>{addToCart(selectedProduct);setSelectedProduct(null);setCartOpen(true);}} className="w-full py-4 text-[11px] tracking-[0.22em] font-semibold flex items-center justify-center gap-2" style={{ background:C.ink, color:'#FFF' }}>
<Plus size={15}/>AJOUTER AU PANIER
</button>
</div>
</div>
)}
{cartOpen && (
<CartScreen cart={cart} ccy={ccy} lang={lang} onClose={()=>setCartOpen(false)} onUpdate={updateQty} onRemove={removeFromCart} onCheckout={handleCheckout} orders={orders}/>
)}
{showAdmin && <AdminPanel onClose={()=>setShowAdmin(false)}/>}
{/* Secret admin trigger — triple tap on logo area */}
<button onClick={()=>setShowAdmin(true)}
  className="fixed bottom-24 right-4 w-8 h-8 rounded-full opacity-0 z-50"
  aria-label="Admin"
  style={{ background:'transparent' }}/>
</div>
);
}
