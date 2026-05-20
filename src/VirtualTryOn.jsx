import { useState, useRef, useCallback, useEffect } from 'react';
import { api, saveToken } from './api';
import { Camera, Upload, X, ChevronLeft, Sparkles, LogIn, Eye, RefreshCw } from 'lucide-react';

const C = {
  bg: '#0a0a0f', sf: '#12121a', cd: '#1a1a26', bd: '#2a2a3e',
  tx: '#e8e8f0', mu: '#5a5a7a', ac: '#c9a227', as: 'rgba(201,162,39,.10)',
  ok: '#10b981', ob: 'rgba(16,185,129,.08)', oe: 'rgba(16,185,129,.2)',
  er: '#dc3545', eb: 'rgba(220,53,69,.08)', ee: 'rgba(220,53,69,.2)',
  goldGrad: 'linear-gradient(135deg,#F5D547 0%,#D4AF37 50%,#8B6914 100%)',
};
const M = "'JetBrains Mono',monospace";
const S = "'Outfit','Manrope',system-ui,sans-serif";

// ─── Login gate ────────────────────────────────────────────────────
function LoginGate({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { token } = await api.auth.login(email, password);
      saveToken(token);
      onAuth();
    } catch (e) {
      setErr(e.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', background: C.cd,
    border: `1px solid ${C.bd}`, borderRadius: 9, color: C.tx,
    fontSize: 14, fontFamily: S, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: S }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.as, border: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Eye size={24} color={C.ac} />
          </div>
          <h2 style={{ color: C.tx, fontSize: 22, fontWeight: 700, margin: 0 }}>Essayage Virtuel</h2>
          <p style={{ color: C.mu, fontSize: 13, marginTop: 6 }}>Accès réservé au personnel</p>
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required style={inp} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" type="password" required style={inp} />
          {err && <div style={{ padding: '9px 12px', borderRadius: 8, background: C.eb, border: `1px solid ${C.ee}`, fontSize: 12, color: C.er }}>{err}</div>}
          <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 9, border: 'none', background: C.goldGrad, color: '#0a0a0f', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: S, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogIn size={16} />{loading ? 'Connexion…' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Score badge ───────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 80 ? C.ok : score >= 60 ? C.ac : C.er;
  const bg    = score >= 80 ? C.ob : score >= 60 ? C.as : C.eb;
  const bd    = score >= 80 ? C.oe : score >= 60 ? 'rgba(201,162,39,.25)' : C.ee;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: bg, border: `1px solid ${bd}` }}>
      <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: M }}>{score}</span>
      <span style={{ fontSize: 10, color, fontWeight: 600 }}>/100</span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────
export default function VirtualTryOn({ products = [] }) {
  const [authed, setAuthed] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [err, setErr] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [step, setStep] = useState('pick');
  const [productPage, setProductPage] = useState(0);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Check existing token
  useEffect(() => {
    const t = localStorage.getItem('azzabi_admin_token');
    if (t) setAuthed(true);
  }, []);

  // Mark products as loaded when available
  useEffect(() => {
    if (products && products.length > 0) {
      setProductsLoaded(true);
    }
  }, [products]);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setErr("Impossible d'accéder à la caméra. Utilisez l'upload de photo.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Capture from webcam
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    c.toBlob(blob => {
      setPhotoBlob(blob);
      setPhoto(c.toDataURL('image/jpeg', 0.9));
      stopCamera();
      setStep('product');
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  // Upload from file
  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPhoto(ev.target.result); setPhotoBlob(file); setStep('product'); };
    reader.readAsDataURL(file);
  }, []);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('azzabi_admin_token')}`,
  });

  // Step 1: Analyze face with Claude
  const analyze = useCallback(async () => {
    if (!photo || !selectedProduct) return;
    setLoading(true); setErr(''); setAnalysis(null); setGeneratedImage(null); setRecommendations(null);
    try {
      const base64 = photo.split(',')[1];
      const mime = photo.split(';')[0].split(':')[1];
      const { analysis: res } = await fetch(`${API}/tryon/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ photoBase64: base64, photoMimeType: mime, product: selectedProduct }),
      }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }));

      setAnalysis(res);
      setStep('result');
      setLoading(false);

      // Generate image automatically after analysis
      setGenerating(true);
      try {
        const { imageUrl } = await fetch(`${API}/tryon/generate`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            photoBase64: base64, photoMimeType: mime,
            product: selectedProduct, analysis: res,
          }),
        }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }));
        setGeneratedImage(imageUrl);
      } catch (e) {
        console.warn('Génération automatique échouée:', e.message);
      } finally {
        setGenerating(false);
      }

      // Fetch recommendations in background
      fetchRecommendations(res.faceShape);
    } catch (e) {
      setErr(e.message || "Erreur lors de l'analyse");
      setLoading(false);
    }
  }, [photo, selectedProduct]);

  // Step 2a: Get frame recommendations for this face shape
  const fetchRecommendations = useCallback(async (faceShape) => {
    const eyewear = products.filter(p => !p.cat?.toLowerCase().includes('lentille'));
    if (!faceShape || !eyewear.length) return;
    setRecommending(true);
    try {
      const { recommendations: recs } = await fetch(`${API}/tryon/recommend`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ faceShape, products: eyewear }),
      }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }));
      setRecommendations(recs);
    } catch (e) {
      console.warn('Recommandations non disponibles:', e.message);
    } finally {
      setRecommending(false);
    }
  }, [products]);

  // Step 2b: Generate realistic AI photo (optional)
  const generateImage = useCallback(async () => {
    if (!photo || !selectedProduct || !analysis) return;
    setGenerating(true); setErr('');
    try {
      const base64 = photo.split(',')[1];
      const mime = photo.split(';')[0].split(':')[1];
      const { imageUrl } = await fetch(`${API}/tryon/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          photoBase64: base64, photoMimeType: mime,
          product: selectedProduct, analysis,
        }),
      }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); }));
      setGeneratedImage(imageUrl);
    } catch (e) {
      setErr(e.message || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  }, [photo, selectedProduct, analysis]);

  const reset = () => {
    setPhoto(null); setPhotoBlob(null); setSelectedProduct(null);
    setAnalysis(null); setGeneratedImage(null); setRecommendations(null);
    setErr(''); setStep('pick'); stopCamera();
  };

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  const eyewearProducts = products.filter(p => !p.cat?.toLowerCase().includes('lentille'));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.tx, fontFamily: S, paddingBottom: 100 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: C.sf, borderBottom: `1px solid ${C.bd}`, padding: '20px 16px 16px' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {step !== 'pick' && (
            <button onClick={reset} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.bd}`, background: 'transparent', color: C.mu, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-.02em', color: C.tx }}>
              <span style={{ background: C.goldGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Essayage</span> IA
            </h1>
            <p style={{ margin: 0, fontSize: 10, color: C.mu }}>Powered by Claude · Personnel Azzabi Optic</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {['Photo', 'Monture', 'Résultat'].map((label, i) => {
            const idx = { pick: 0, camera: 0, product: 1, result: 2 }[step] ?? 0;
            const done = i < idx, active = i === idx;
            return (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 3, borderRadius: 2, background: done || active ? C.ac : C.bd, marginBottom: 4, opacity: done ? 0.5 : 1 }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: active ? C.ac : done ? C.mu : C.bd, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* ── STEP: PICK PHOTO ── */}
        {(step === 'pick' || step === 'camera') && (
          <div>
            {step === 'camera' ? (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.bd}`, position: 'relative' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, display: 'flex', gap: 10, background: 'linear-gradient(transparent,rgba(0,0,0,.7))' }}>
                  <button onClick={capture} style={{ flex: 1, padding: 14, borderRadius: 10, border: 'none', background: C.goldGrad, color: '#0a0a0f', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: S }}>
                    Capturer
                  </button>
                  <button onClick={() => { stopCamera(); setStep('pick'); }} style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${C.bd}`, background: 'transparent', color: C.mu, cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ padding: 28, borderRadius: 14, border: `1.5px dashed ${C.bd}`, textAlign: 'center', background: C.sf }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: C.as, border: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Eye size={22} color={C.ac} />
                  </div>
                  <p style={{ color: C.tx, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>Photo du client</p>
                  <p style={{ color: C.mu, fontSize: 11, margin: '0 0 18px', lineHeight: 1.5 }}>Prenez une photo de face, bonne lumière, visage dégagé.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={() => { setStep('camera'); startCamera(); }} style={{ padding: '12px 0', borderRadius: 9, border: `1px solid ${C.bd}`, background: C.cd, color: C.tx, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: S, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      <Camera size={15} /> Webcam
                    </button>
                    <label style={{ padding: '12px 0', borderRadius: 9, border: `1px solid ${C.bd}`, background: C.cd, color: C.tx, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: S, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      <Upload size={15} /> Importer
                      <input type="file" accept="image/*" capture="user" onChange={handleUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: SELECT PRODUCT ── */}
        {step === 'product' && (
          <div>
            {/* Photo preview */}
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, position: 'relative', maxHeight: 200 }}>
              <img src={photo} alt="client" style={{ width: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <button onClick={() => setStep('pick')} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.bd}`, background: 'rgba(10,10,15,.8)', color: C.mu, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: C.mu, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
              Choisir la monture à essayer
            </div>

            {!productsLoaded ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.ac, animation: 'bounce 1.4s infinite', animationDelay: '0s' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.ac, animation: 'bounce 1.4s infinite', animationDelay: '0.2s' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.ac, animation: 'bounce 1.4s infinite', animationDelay: '0.4s' }} />
                <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {eyewearProducts.slice(productPage * 12, (productPage + 1) * 12).map(p => (
                <button key={p.id} onClick={() => setSelectedProduct(p)} style={{ padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${selectedProduct?.id === p.id ? C.ac : C.bd}`, background: selectedProduct?.id === p.id ? C.as : C.cd, cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 7, overflow: 'hidden', marginBottom: 7, background: '#1a1a26' }}>
                    {p.img ? <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={18} color={C.mu} /></div>}
                  </div>
                  <div style={{ fontSize: 9, color: C.mu, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</div>
                  <div style={{ fontSize: 11, color: C.tx, fontWeight: 600, lineHeight: 1.3, marginTop: 2 }}>{p.name}</div>
                </button>
                ))}
              </div>
            )}

            {/* Pagination */}
            {eyewearProducts.length > 12 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => setProductPage(Math.max(0, productPage - 1))} disabled={productPage === 0} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.bd}`, background: productPage === 0 ? C.bd : C.cd, color: C.tx, cursor: productPage === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                  ← Précédent
                </button>
                <span style={{ fontSize: 12, color: C.mu, minWidth: 80, textAlign: 'center' }}>
                  Page {productPage + 1} / {Math.ceil(eyewearProducts.length / 12)}
                </span>
                <button onClick={() => setProductPage(Math.min(Math.ceil(eyewearProducts.length / 12) - 1, productPage + 1))} disabled={productPage >= Math.ceil(eyewearProducts.length / 12) - 1} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.bd}`, background: productPage >= Math.ceil(eyewearProducts.length / 12) - 1 ? C.bd : C.cd, color: C.tx, cursor: productPage >= Math.ceil(eyewearProducts.length / 12) - 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Suivant →
                </button>
              </div>
            )}

            {err && <div style={{ padding: '9px 12px', borderRadius: 8, background: C.eb, border: `1px solid ${C.ee}`, fontSize: 12, color: C.er, marginBottom: 10 }}>{err}</div>}

            <button onClick={analyze} disabled={!selectedProduct || loading} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: selectedProduct ? C.goldGrad : C.bd, color: selectedProduct ? '#0a0a0f' : C.mu, fontSize: 14, fontWeight: 700, cursor: selectedProduct ? 'pointer' : 'not-allowed', fontFamily: S, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s' }}>
              <Sparkles size={16} />{loading ? 'Analyse en cours…' : 'Analyser avec Claude'}
            </button>
          </div>
        )}

        {/* ── STEP: RESULT ── */}
        {step === 'result' && analysis && (
          <div style={{ display: 'grid', gap: 12 }}>

            {/* Photo originale + image générée */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.bd}`, background: C.cd }}>
              <img src={generatedImage || photo} alt="essayage" style={{ width: '100%', display: 'block' }} />
              {generatedImage && (
                <div style={{ padding: '6px 12px', fontSize: 9, color: C.mu, textAlign: 'center' }}>Image IA générée ✨</div>
              )}
            </div>

            {/* Score + forme visage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: C.cd, border: `1px solid ${C.bd}` }}>
                <div style={{ fontSize: 10, color: C.mu, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Compatibilité</div>
                <ScoreBadge score={analysis.score ?? 75} />
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: C.cd, border: `1px solid ${C.bd}` }}>
                <div style={{ fontSize: 10, color: C.mu, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Forme du visage</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ac, textTransform: 'capitalize' }}>{analysis.faceShape ?? '—'}</div>
              </div>
            </div>

            {/* Monture sélectionnée */}
            {selectedProduct && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: C.cd, border: `1px solid ${C.bd}` }}>
                <div style={{ width: 56, height: 40, borderRadius: 7, overflow: 'hidden', background: C.sf, flexShrink: 0 }}>
                  {selectedProduct.img && <img src={selectedProduct.img} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.mu, fontWeight: 600, textTransform: 'uppercase' }}>{selectedProduct.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.tx }}>{selectedProduct.name}</div>
                </div>
              </div>
            )}

            {/* Analyse Claude */}
            <div style={{ padding: '14px', borderRadius: 10, background: C.as, border: `1px solid rgba(201,162,39,.2)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Sparkles size={13} color={C.ac} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.ac, textTransform: 'uppercase', letterSpacing: '.06em' }}>Analyse Claude</span>
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: C.tx, lineHeight: 1.6 }}>{analysis.recommendation}</p>
              {analysis.tips && <p style={{ margin: 0, fontSize: 11, color: C.mu, lineHeight: 1.5, fontStyle: 'italic' }}>💡 {analysis.tips}</p>}
            </div>

            {/* ── TOP RECOMMANDATIONS ── */}
            <div style={{ padding: '14px', borderRadius: 10, background: C.cd, border: `1px solid ${C.bd}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <Sparkles size={13} color={C.ac} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.ac, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Meilleures montures pour votre visage
                </span>
              </div>
              {recommending ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.mu, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.ac, animation: 'bounce 1.4s infinite' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.ac, animation: 'bounce 1.4s infinite', animationDelay: '.2s' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.ac, animation: 'bounce 1.4s infinite', animationDelay: '.4s' }} />
                  <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
                  <span style={{ marginLeft: 4 }}>IA en train de chercher…</span>
                </div>
              ) : recommendations?.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {recommendations.map((rec, i) => (
                    <button key={i} onClick={() => { setSelectedProduct(rec.product); setGeneratedImage(null); }} style={{ padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${selectedProduct?.id === rec.product?.id ? C.ac : C.bd}`, background: selectedProduct?.id === rec.product?.id ? C.as : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.ac, minWidth: 20 }}>#{i + 1}</div>
                        {rec.product?.img && <img src={rec.product.img} alt={rec.product.name} style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 9, color: C.mu, fontWeight: 600, textTransform: 'uppercase' }}>{rec.product?.brand}</div>
                          <div style={{ fontSize: 12, color: C.tx, fontWeight: 700 }}>{rec.product?.name}</div>
                          <div style={{ fontSize: 10, color: C.ac, fontStyle: 'italic', marginTop: 2 }}>→ {rec.reason}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 11, color: C.mu }}>Aucune recommandation disponible.</p>
              )}
            </div>

            {/* Bouton générer image IA */}
            {!generatedImage && (
              <button onClick={generateImage} disabled={generating} style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: C.goldGrad, color: '#0a0a0f', fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: S, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: generating ? 0.7 : 1 }}>
                <Sparkles size={16} />{generating ? 'Génération en cours… (1-2 min)' : 'Générer image réaliste IA'}
              </button>
            )}

            {err && <div style={{ padding: '9px 12px', borderRadius: 8, background: C.eb, border: `1px solid ${C.ee}`, fontSize: 12, color: C.er }}>{err}</div>}

            <button onClick={reset} style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.bd}`, background: 'transparent', color: C.mu, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: S }}>
              Nouvel essayage
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
