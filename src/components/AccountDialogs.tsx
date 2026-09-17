import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BadgeCheck, Bookmark, Crown, Info, Loader2, LogOut, MessageSquareText, Plus, Star, TrendingUp, UserRound, X } from 'lucide-react';
import Modal from './Modal';
import MarketLogo from './MarketLogo';
import { useAuth } from '../data/auth';
import { useLive, type FeedItem } from '../data/live';
import { articleFromFeed } from './MarketDialogs';
import { addFavorite, fetchFavorites, fetchReports, fetchReviews, friendlyAuthError, publishReport, publishReview, removeFavorite, type CommunityReport, type CurrencyReview } from '../data/supabase';
import { getAssetOrFallback } from '../data/custom';
import { formatChange, relativeTime, type Article, type Asset } from '../data/markets';

const VIP_CHECKOUT_URL = '';

interface BaseProps { onClose: () => void }

export function AuthDialog({ onClose, onDone }: BaseProps & { onDone?: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setInfo('');
    if (!email.includes('@')) { setError('Escribe un correo v\u00e1lido.'); return; }
    if (password.length < 6) { setError('La contrase\u00f1a debe tener al menos 6 caracteres.'); return; }
    if (mode === 'register' && name.trim().length < 2) { setError('Escribe tu nombre.'); return; }
    setBusy(true);
    try {
      if (mode === 'register') {
        const { error: message, needsConfirmation } = await signUp(email.trim(), password, name.trim());
        if (message) { setError(friendlyAuthError(message)); return; }
        if (needsConfirmation) { setInfo('Te hemos enviado un correo para confirmar tu cuenta. Rev\u00edsalo y despu\u00e9s inicia sesi\u00f3n.'); setMode('login'); return; }
        onDone?.(); onClose();
      } else {
        const { error: message } = await signIn(email.trim(), password);
        if (message) { setError(friendlyAuthError(message)); return; }
        onDone?.(); onClose();
      }
    } finally { setBusy(false); }
  };

  return (
    <Modal title={mode === 'register' ? 'Crea tu espacio Tribuno' : 'Entra en tu espacio'} onClose={onClose} className="auth-modal">
      <p className="modal-intro">Tu cuenta te da un espacio privado con tus divisas favoritas, rese\u00f1as e informes.</p>
      <div className="dialog-filter-tabs"><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setInfo(''); }}>Crear cuenta</button><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setInfo(''); }}>Iniciar sesi\u00f3n</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={40} placeholder="Tu nombre" /></label>}
        <label>Correo electr\u00f3nico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="tu@correo.com" /></label>
        <label>Contrase\u00f1a<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="M\u00ednimo 6 caracteres" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {info && <p className="form-info" role="status">{info}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin-icon" size={17} /> : null}{mode === 'register' ? 'Crear mi cuenta' : 'Entrar'}</button>
      </form>
      <div className="privacy-note"><Info size={15} /><span>Usamos tu correo solo para identificar tu cuenta. Puedes crear rese\u00f1as e informes que ver\u00e1 la comunidad.</span></div>
    </Modal>
  );
}

function Stars({ value, onChange }: { value: number; onChange?: (next: number) => void }) {
  return <div className="stars-input" role={onChange ? 'radiogroup' : undefined} aria-label="Valoraci&oacute;n">{([1, 2, 3, 4, 5] as const).map((star) => <button key={star} type="button" className={star <= value ? 'filled' : ''} aria-label={`${star} estrellas`} onClick={onChange ? () => onChange(star) : undefined} disabled={!onChange}><Star size={16} fill={star <= value ? 'currentColor' : 'none'} /></button>)}</div>;
}

export function SpaceDialog({ onClose, onAsset, onArticle }: BaseProps & { onAsset: (asset: Asset) => void; onArticle: (article: Article) => void }) {
  const { user, profile, isVip, loading, signOut } = useAuth();
  const { feed, liveOf } = useLive();
  const [tab, setTab] = useState<'favorites' | 'reviews' | 'reports' | 'vip'>('favorites');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reviews, setReviews] = useState<CurrencyReview[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [symbol, setSymbol] = useState('EURUSD');
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportBody, setReportBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user) return;
    void fetchFavorites(user.id).then(setFavorites);
    void fetchReviews().then(setReviews);
    void fetchReports().then(setReports);
  }, [user]);

  const vipNews = useMemo(() => feed.filter((item) => Boolean(item.url)).slice(0, 6), [feed]);

  if (loading) return <Modal title="Tu espacio Tribuno" onClose={onClose}><div className="space-loading"><Loader2 className="spin-icon" size={22} />Cargando tu espacio\u2026</div></Modal>;
  if (!user) return <AuthDialog onClose={onClose} />;

  const toggleFavorite = async (id: string) => {
    if (!user) return;
    if (favorites.includes(id)) { setFavorites(favorites.filter((item) => item !== id)); await removeFavorite(user.id, id); }
    else { setFavorites([...favorites, id]); await addFavorite(user.id, id); }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || reviewBody.trim().length < 4) { setNotice('Escribe una rese\u00f1a un poco m\u00e1s descriptiva.'); return; }
    setBusy(true);
    const { error } = await publishReview(user.id, symbol, rating, reviewBody.trim());
    setBusy(false);
    if (error) { setNotice('No pudimos publicar tu rese\u00f1a. Int\u00e9ntalo de nuevo.'); return; }
    setReviewBody(''); setNotice('Rese\u00f1a publicada. \u00a1Gracias por aportar!');
    setReviews(await fetchReviews());
  };

  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!isVip) { setNotice('Los informes para la comunidad son una funci\u00f3n VIP.'); return; }
    if (reportTitle.trim().length < 3 || reportBody.trim().length < 10) { setNotice('El informe necesita un t\u00edtulo y un an\u00e1lisis m\u00e1s completo.'); return; }
    setBusy(true);
    const { error } = await publishReport(user.id, symbol, reportTitle.trim(), reportBody.trim());
    setBusy(false);
    if (error) { setNotice('No pudimos publicar tu informe. Int\u00e9ntalo de nuevo.'); return; }
    setReportTitle(''); setReportBody(''); setNotice('Informe publicado para la comunidad.');
    setReports(await fetchReports());
  };

  return (
    <Modal title="Tu espacio Tribuno" onClose={onClose} className="space-modal wide-modal">
      <div className="space-header">
        <span className="space-avatar">{profile?.display_name?.slice(0, 1).toUpperCase() ?? <UserRound size={20} />}</span>
        <div><strong>{profile?.display_name ?? 'Miembro Tribuno'}</strong><span>{isVip ? 'Membres\u00eda VIP activa' : 'Cuenta gratuita'}{isVip ? ' · acceso a informes y noticias especiales' : ''}</span></div>
        {isVip ? <span className="vip-chip"><Crown size={13} />VIP</span> : <button className="vip-button" onClick={() => setTab('vip')}><Crown size={14} />Hazte VIP</button>}
        <button className="icon-button space-signout" onClick={() => { void signOut(); onClose(); }} aria-label="Cerrar sesi\u00f3n"><LogOut size={17} /></button>
      </div>
      <div className="dialog-filter-tabs space-tabs">{([{ id: 'favorites', label: 'Mis divisas' }, { id: 'reviews', label: 'Rese\u00f1as' }, { id: 'reports', label: 'Informes' }, { id: 'vip', label: 'Membres\u00eda' }] as const).map((entry) => <button key={entry.id} className={tab === entry.id ? 'active' : ''} onClick={() => { setTab(entry.id); setNotice(''); }}>{entry.label}</button>)}</div>

      {tab === 'favorites' && (
        <div className="space-panel">
          <p className="space-hint">Tu lista privada de divisas y activos favoritos. Se guarda en tu cuenta.</p>
          <div className="space-favorites">{(() => { const options = ['EURUSD', 'USDJPY', 'GBPUSD', 'BTCUSD', 'ETHUSD', 'SPX', 'NVDA', 'GC1!']; return options.map((id) => { const asset = liveOf(getAssetOrFallback(id)); const active = favorites.includes(id); return <button key={id} className={`space-fav-chip ${active ? 'active' : ''}`} onClick={() => toggleFavorite(id)}><MarketLogo asset={asset} size={24} /><span><strong>{asset.symbol}</strong><small className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</small></span>{active ? <BadgeCheck size={16} /> : <Plus size={16} />}</button>; }); })()}</div>
          <h3 className="dialog-section-title">Tus favoritos <span>{favorites.length}</span></h3>
          <div className="space-list">{favorites.length ? favorites.map((id) => { const asset = liveOf(getAssetOrFallback(id)); return <div className="space-row" key={id}><MarketLogo asset={asset} size={30} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span><button className="icon-button" onClick={() => onAsset(asset)} aria-label={`Ver ${asset.symbol}`}><TrendingUp size={16} /></button></div>; }) : <p className="space-hint">A\u00fan no has elegido favoritos. Toca las divisas de arriba.</p>}</div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-panel">
          <form className="space-form" onSubmit={submitReview}>
            <div className="form-two-columns">
              <label>Divisa<select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{['EURUSD', 'USDJPY', 'GBPUSD', 'USDCLP', 'BTCUSD', 'ETHUSD'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
              <label>Valoraci\u00f3n<Stars value={rating} onChange={setRating} /></label>
            </div>
            <label>Tu rese\u00f1a<textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} rows={3} maxLength={400} placeholder="Comparte tu visi\u00f3n sobre esta divisa\u2026" /></label>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin-icon" size={16} /> : <MessageSquareText size={16} />}Publicar rese\u00f1a</button>
          </form>
          <h3 className="dialog-section-title">Rese\u00f1as de la comunidad <span>{reviews.length}</span></h3>
          <div className="space-list">{reviews.length ? reviews.map((review) => <div className="space-review" key={review.id}><div className="space-review-head"><strong>@{review.author}</strong><span>{review.symbol} &middot; {relativeTime(new Date(review.created_at).getTime())}</span><Stars value={review.rating} /></div><p>{review.body}</p></div>) : <p className="space-hint">Todav\u00eda no hay rese\u00f1as. S\u00e9 el primero en opinar.</p>}</div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-panel">
          {isVip ? <form className="space-form" onSubmit={submitReport}>
            <div className="form-two-columns">
              <label>Activo<select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{['SPX', 'EURUSD', 'BTCUSD', 'NVDA', 'GC1!', 'US10Y'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
              <label>T\u00edtulo<input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} maxLength={90} placeholder="T\u00edtulo del informe" /></label>
            </div>
            <label>An\u00e1lisis<textarea value={reportBody} onChange={(event) => setReportBody(event.target.value)} rows={4} maxLength={1200} placeholder="Redacta tu informe para la comunidad\u2026" /></label>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin-icon" size={16} /> : <TrendingUp size={16} />}Publicar informe</button>
          </form> : <div className="vip-lock"><Crown size={22} /><div><strong>Informes para la comunidad</strong><span>Publicar informes y comentarios destacados es una funci\u00f3n VIP. Act\u00edvala por 1 USD.</span></div><button className="vip-button" onClick={() => setTab('vip')}>Hazte VIP</button></div>}
          <h3 className="dialog-section-title">Informes publicados <span>{reports.length}</span></h3>
          <div className="space-list">{reports.length ? reports.map((report) => <div className="space-review" key={report.id}><div className="space-review-head"><strong>@{report.author}</strong><span>{report.symbol ?? 'General'} &middot; {relativeTime(new Date(report.created_at).getTime())}</span></div><h4>{report.title}</h4><p>{report.body}</p></div>) : <p className="space-hint">A\u00fan no hay informes publicados.</p>}</div>
        </div>
      )}

      {tab === 'vip' && (
        <div className="space-panel">
          <div className={`vip-card ${isVip ? 'active' : ''}`}><Crown size={26} /><div><strong>Membres\u00eda Tribuno VIP</strong><span>{isVip ? 'Ya eres miembro VIP. Gracias por apoyar a la comunidad.' : 'Desbloquea los informes, comentarios destacados y las noticias especiales.'}</span></div><span className="vip-price">1 USD<span>/ mes</span></span></div>
          <ul className="vip-perks"><li>Publicar informes y comentarios para la comunidad</li><li>Acceso a noticias y an\u00e1lisis especiales</li><li>Insignia VIP en tus aportaciones</li></ul>
          {isVip ? <p className="space-hint">Tu membres\u00eda est\u00e1 activa. Gestiona el pago desde tu proveedor si lo necesitas.</p> : (VIP_CHECKOUT_URL ? <a className="primary-button vip-cta" href={VIP_CHECKOUT_URL} target="_blank" rel="noopener noreferrer"><Crown size={16} />Activar VIP por 1 USD</a> : <div className="privacy-note"><Info size={15} /><span>El cobro de 1 USD a\u00fan no est\u00e1 conectado. Cuando definamos el proveedor (Stripe, PayPal o un enlace de Global66), este bot\u00f3n activar\u00e1 la membres\u00eda autom\u00e1ticamente.</span></div>)}
          {isVip && <><h3 className="dialog-section-title">Noticias especiales VIP</h3><div className="space-list">{vipNews.length ? vipNews.map((item: FeedItem) => { const art = articleFromFeed(item); return <button key={item.id} className="space-row space-news-row" onClick={() => onArticle(art)}><Bookmark size={16} /><span><strong>{item.title}</strong><small>{item.source ? `Fuente: ${item.source} · ` : ''}{relativeTime(item.createdAt)}</small></span><span /></button>; }) : <p className="space-hint">Sin contenido nuevo por ahora.</p>}</div></>}
        </div>
      )}

      {notice && <p className="space-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={14} /></button></p>}
    </Modal>
  );
}
