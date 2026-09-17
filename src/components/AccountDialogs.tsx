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
import { useI18n } from '../i18n';

const VIP_CHECKOUT_URL = 'https://www.paypal.com/ncp/payment/Q29PJK54LSGRE';

interface BaseProps { onClose: () => void }

export function AuthDialog({ onClose, onDone }: BaseProps & { onDone?: () => void }) {
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
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
    if (!email.includes('@')) { setError(t('auth.emailInvalid')); return; }
    if (password.length < 6) { setError(t('auth.passwordShort')); return; }
    if (mode === 'register' && name.trim().length < 2) { setError(t('auth.nameShort')); return; }
    setBusy(true);
    try {
      if (mode === 'register') {
        const { error: message, needsConfirmation } = await signUp(email.trim(), password, name.trim());
        if (message) { setError(t(friendlyAuthError(message))); return; }
        if (needsConfirmation) { setInfo(t('auth.confirmSent')); setMode('login'); return; }
        onDone?.(); onClose();
      } else {
        const { error: message } = await signIn(email.trim(), password);
        if (message) { setError(t(friendlyAuthError(message))); return; }
        onDone?.(); onClose();
      }
    } finally { setBusy(false); }
  };

  return (
    <Modal title={mode === 'register' ? t('auth.create') : t('auth.login')} onClose={onClose} className="auth-modal">
      <p className="modal-intro">{t('auth.intro')}</p>
      <div className="dialog-filter-tabs"><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setInfo(''); }}>{t('auth.tabRegister')}</button><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setInfo(''); }}>{t('auth.tabLogin')}</button></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <label>{t('auth.name')}<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={40} placeholder={t('auth.namePlaceholder')} /></label>}
        <label>{t('auth.email')}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder={t('auth.emailPlaceholder')} /></label>
        <label>{t('auth.password')}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={t('auth.passwordPlaceholder')} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {info && <p className="form-info" role="status">{info}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin-icon" size={17} /> : null}{mode === 'register' ? t('auth.submitRegister') : t('auth.submitLogin')}</button>
      </form>
      <div className="privacy-note"><Info size={15} /><span>{t('auth.privacy')}</span></div>
    </Modal>
  );
}

function Stars({ value, onChange }: { value: number; onChange?: (next: number) => void }) {
  const { t } = useI18n();
  return <div className="stars-input" role={onChange ? 'radiogroup' : undefined} aria-label={t('space.rating')}>{([1, 2, 3, 4, 5] as const).map((star) => <button key={star} type="button" className={star <= value ? 'filled' : ''} aria-label={`${star}`} onClick={onChange ? () => onChange(star) : undefined} disabled={!onChange}><Star size={16} fill={star <= value ? 'currentColor' : 'none'} /></button>)}</div>;
}

export function SpaceDialog({ onClose, onAsset, onArticle }: BaseProps & { onAsset: (asset: Asset) => void; onArticle: (article: Article) => void }) {
  const { user, profile, isVip, loading, signOut } = useAuth();
  const { feed, liveOf } = useLive();
  const { t, lang } = useI18n();
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

  if (loading) return <Modal title={t('space.title')} onClose={onClose}><div className="space-loading"><Loader2 className="spin-icon" size={22} />{t('space.loading')}</div></Modal>;
  if (!user) return <AuthDialog onClose={onClose} />;

  const toggleFavorite = async (id: string) => {
    if (!user) return;
    if (favorites.includes(id)) { setFavorites(favorites.filter((item) => item !== id)); await removeFavorite(user.id, id); }
    else { setFavorites([...favorites, id]); await addFavorite(user.id, id); }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || reviewBody.trim().length < 4) { setNotice(t('space.reviewNeedsBody')); return; }
    setBusy(true);
    const { error } = await publishReview(user.id, symbol, rating, reviewBody.trim());
    setBusy(false);
    if (error) { setNotice(t('space.reviewError')); return; }
    setReviewBody(''); setNotice(t('space.reviewOk'));
    setReviews(await fetchReviews());
  };

  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!isVip) { setNotice(t('space.reportVipOnly')); return; }
    if (reportTitle.trim().length < 3 || reportBody.trim().length < 10) { setNotice(t('space.reportNeedsBody')); return; }
    setBusy(true);
    const { error } = await publishReport(user.id, symbol, reportTitle.trim(), reportBody.trim());
    setBusy(false);
    if (error) { setNotice(t('space.reportError')); return; }
    setReportTitle(''); setReportBody(''); setNotice(t('space.reportOk'));
    setReports(await fetchReports());
  };

  return (
    <Modal title={t('space.title')} onClose={onClose} className="space-modal wide-modal">
      <div className="space-header">
        <span className="space-avatar">{profile?.display_name?.slice(0, 1).toUpperCase() ?? <UserRound size={20} />}</span>
        <div><strong>{profile?.display_name ?? t('space.member')}</strong><span>{isVip ? t('space.vipActive') : t('space.free')}{isVip ? t('space.vipAccess') : ''}</span></div>
        {isVip ? <span className="vip-chip"><Crown size={13} />VIP</span> : <button className="vip-button" onClick={() => setTab('vip')}><Crown size={14} />{t('space.becomeVip')}</button>}
        <button className="icon-button space-signout" onClick={() => { void signOut(); onClose(); }} aria-label={t('space.signOut')}><LogOut size={17} /></button>
      </div>
      <div className="dialog-filter-tabs space-tabs">{([{ id: 'favorites', label: t('space.tabFavorites') }, { id: 'reviews', label: t('space.tabReviews') }, { id: 'reports', label: t('space.tabReports') }, { id: 'vip', label: t('space.tabVip') }] as const).map((entry) => <button key={entry.id} className={tab === entry.id ? 'active' : ''} onClick={() => { setTab(entry.id); setNotice(''); }}>{entry.label}</button>)}</div>

      {tab === 'favorites' && (
        <div className="space-panel">
          <p className="space-hint">{t('space.favHint')}</p>
          <div className="space-favorites">{(() => { const options = ['EURUSD', 'USDJPY', 'GBPUSD', 'BTCUSD', 'ETHUSD', 'SPX', 'NVDA', 'GC1!']; return options.map((id) => { const asset = liveOf(getAssetOrFallback(id)); const active = favorites.includes(id); return <button key={id} className={`space-fav-chip ${active ? 'active' : ''}`} onClick={() => toggleFavorite(id)}><MarketLogo asset={asset} size={24} /><span><strong>{asset.symbol}</strong><small className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</small></span>{active ? <BadgeCheck size={16} /> : <Plus size={16} />}</button>; }); })()}</div>
          <h3 className="dialog-section-title">{t('space.yourFavorites')} <span>{favorites.length}</span></h3>
          <div className="space-list">{favorites.length ? favorites.map((id) => { const asset = liveOf(getAssetOrFallback(id)); return <div className="space-row" key={id}><MarketLogo asset={asset} size={30} /><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span><button className="icon-button" onClick={() => onAsset(asset)} aria-label={`${t('chart.open')} ${asset.symbol}`}><TrendingUp size={16} /></button></div>; }) : <p className="space-hint">{t('space.noFavorites')}</p>}</div>
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-panel">
          <form className="space-form" onSubmit={submitReview}>
            <div className="form-two-columns">
              <label>{t('space.currency')}<select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{['EURUSD', 'USDJPY', 'GBPUSD', 'USDCLP', 'BTCUSD', 'ETHUSD'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
              <label>{t('space.rating')}<Stars value={rating} onChange={setRating} /></label>
            </div>
            <label>{t('space.review')}<textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} rows={3} maxLength={400} placeholder={t('space.reviewPlaceholder')} /></label>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin-icon" size={16} /> : <MessageSquareText size={16} />}{t('space.publishReview')}</button>
          </form>
          <h3 className="dialog-section-title">{t('space.communityReviews')} <span>{reviews.length}</span></h3>
          <div className="space-list">{reviews.length ? reviews.map((review) => <div className="space-review" key={review.id}><div className="space-review-head"><strong>@{review.author}</strong><span>{review.symbol} &middot; {relativeTime(new Date(review.created_at).getTime())}</span><Stars value={review.rating} /></div><p>{review.body}</p></div>) : <p className="space-hint">{t('space.noReviews')}</p>}</div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-panel">
          {isVip ? <form className="space-form" onSubmit={submitReport}>
            <div className="form-two-columns">
              <label>{t('space.asset')}<select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{['SPX', 'EURUSD', 'BTCUSD', 'NVDA', 'GC1!', 'US10Y'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
              <label>{t('space.reportTitle')}<input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} maxLength={90} placeholder={t('space.reportTitlePlaceholder')} /></label>
            </div>
            <label>{t('space.reportBody')}<textarea value={reportBody} onChange={(event) => setReportBody(event.target.value)} rows={4} maxLength={1200} placeholder={t('space.reportBodyPlaceholder')} /></label>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? <Loader2 className="spin-icon" size={16} /> : <TrendingUp size={16} />}{t('space.publishReport')}</button>
          </form> : <div className="vip-lock"><Crown size={22} /><div><strong>{t('space.reportLockTitle')}</strong><span>{t('space.reportLockDesc')}</span></div><button className="vip-button" onClick={() => setTab('vip')}>{t('space.becomeVip')}</button></div>}
          <h3 className="dialog-section-title">{t('space.reportsPublished')} <span>{reports.length}</span></h3>
          <div className="space-list">{reports.length ? reports.map((report) => <div className="space-review" key={report.id}><div className="space-review-head"><strong>@{report.author}</strong><span>{report.symbol ?? t('space.general')} &middot; {relativeTime(new Date(report.created_at).getTime())}</span></div><h4>{report.title}</h4><p>{report.body}</p></div>) : <p className="space-hint">{t('space.noReports')}</p>}</div>
        </div>
      )}

      {tab === 'vip' && (
        <div className="space-panel">
          <div className={`vip-card ${isVip ? 'active' : ''}`}><Crown size={26} /><div><strong>{t('space.vipTitle')}</strong><span>{isVip ? t('space.vipActiveDesc') : t('space.vipDesc')}</span></div><span className="vip-price">{t('space.vipPrice')}<span>{t('space.vipPerMonth')}</span></span></div>
          <ul className="vip-perks"><li>{t('space.vipPerk1')}</li><li>{t('space.vipPerk2')}</li><li>{t('space.vipPerk3')}</li></ul>
          {isVip ? <p className="space-hint">{t('space.vipManage')}</p> : (VIP_CHECKOUT_URL ? <><a className="primary-button vip-cta" href={VIP_CHECKOUT_URL} target="_blank" rel="noopener noreferrer"><Crown size={16} />{t('space.activateVip')}</a><p className="space-hint">{t('space.vipPayHint')}</p></> : <div className="privacy-note"><Info size={15} /><span>{t('space.vipPending')}</span></div>)}
          {isVip && <><h3 className="dialog-section-title">{t('space.vipNews')}</h3><div className="space-list">{vipNews.length ? vipNews.map((item: FeedItem) => { const art = articleFromFeed(item, lang); return <button key={item.id} className="space-row space-news-row" onClick={() => onArticle(art)}><Bookmark size={16} /><span><strong>{item.title}</strong><small>{item.source ? `${t('article.sourcePrefix', { source: item.source })} \u00b7 ` : ''}{relativeTime(item.createdAt)}</small></span><span /></button>; }) : <p className="space-hint">{t('space.noVipNews')}</p>}</div></>}
        </div>
      )}

      {notice && <p className="space-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label={t('aria.close')}><X size={14} /></button></p>}
    </Modal>
  );
}
