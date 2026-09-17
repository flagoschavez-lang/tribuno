import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Bell, Bookmark, Check, CheckCheck, ChevronRight, Clock3, Globe2, Info, LockKeyhole, Plus, Search, ShieldCheck, Star, Trash2, TrendingUp, UserRound, X, RefreshCw } from 'lucide-react';
import { ARTICLES, ASSETS, CATEGORIES, ECONOMIC_EVENTS, type Article, type Asset, type Category, formatChange, formatCompact, formatPrice, relativeTime } from '../data/markets';
import Modal from './Modal';
import MarketLogo, { BrandMark } from './MarketLogo';
import MarketChart, { type Period } from './MarketChart';
import AssetQuote from './AssetQuote';
import { useLive, attachCustomSymbol, type FeedItem } from '../data/live';
import { useSeries } from '../data/series';
import { getAssetOrFallback, registerCustom, searchAllMarkets, type ResolvedSymbol } from '../data/custom';
import { useI18n } from '../i18n';

function hashText(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function articleFromFeed(item: FeedItem, lang: 'es' | 'en' = 'es'): Article {
  const asset = getAssetOrFallback(item.assetId);
  const source = ARTICLES[hashText(item.id) % ARTICLES.length];
  const priceText = formatPrice(asset.price, asset.decimals);
  const body = lang === 'en'
    ? [
        `${asset.name} (${asset.symbol}) trades at ${priceText} ${asset.currency}, with a ${formatChange(asset.change)} move during the session. Trading activity keeps participants on watch amid sustained momentum.`,
        `Volume sits at ${formatCompact(asset.volume || 0)} and the intraday reference updates continuously. The ${priceText} ${asset.currency} level works as an immediate reference for the asset.`,
        'From an analysis perspective, a move like this is best understood against volume and the breadth of the rest of the market. Time horizon and risk tolerance remain the most relevant variables when interpreting any headline.',
      ]
    : [
        `${asset.name} (${asset.symbol}) cotiza en ${priceText} ${asset.currency}, con un movimiento del ${formatChange(asset.change)} durante la sesi\u00f3n. La operativa mantiene la atenci\u00f3n de los participantes en un contexto de actividad sostenida.`,
        `El volumen negociado se sit\u00faa en ${formatCompact(asset.volume || 0)} y la referencia intrad\u00eda se actualiza de forma continua. El nivel de ${priceText} ${asset.currency} funciona como referencia inmediata para el activo.`,
        'Desde una perspectiva de an\u00e1lisis, un movimiento de este tipo conviene contextualizarlo con el volumen y la amplitud del resto del mercado. El horizonte temporal y la tolerancia al riesgo siguen siendo las variables m\u00e1s relevantes a la hora de interpretar cualquier titular.',
      ];
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    summary: item.summary,
    image: item.image ?? source.image,
    alt: item.title,
    time: relativeTime(item.createdAt),
    readTime: '2 min',
    assetId: item.assetId,
    source: item.source,
    url: item.url,
    body,
  };
}

export interface PriceAlert {
  id: string;
  assetId: string;
  condition: 'above' | 'below';
  price: number;
}

export interface Profile {
  name: string;
  category: Category;
}

interface BaseProps { onClose: () => void }

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function SearchDialog({ onClose, onSelect, onToggleWatch, watchlist, adding = false }: BaseProps & { onSelect: (asset: Asset) => void; onToggleWatch: (id: string) => void; watchlist: string[]; adding?: boolean }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [remote, setRemote] = useState<ResolvedSymbol[] | null>(null);
  const [searching, setSearching] = useState(false);
  const { liveOf } = useLive();
  const { t, catLabel } = useI18n();
  const results = useMemo(() => ASSETS.filter((asset) => (filter === 'all' || asset.category === filter) && normalize(`${asset.symbol} ${asset.name}`).includes(normalize(query))), [query, filter]);
  const tabs = [{ id: 'all', label: t('search.all') }, ...CATEGORIES.filter((category) => ['stocks', 'crypto', 'indices', 'forex'].includes(category.id))];
  const runRemoteSearch = async () => {
    const value = query.trim();
    if (value.length < 2) return;
    setSearching(true);
    try { setRemote(await searchAllMarkets(value)); } finally { setSearching(false); }
  };
  const pickRemote = (match: ResolvedSymbol) => {
    const asset = registerCustom(match);
    attachCustomSymbol(asset.id);
    if (adding) onToggleWatch(asset.id); else onSelect(asset);
  };
  const handleSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!results.length) { runRemoteSearch(); return; }
      const asset = results[Math.min(activeIndex, results.length - 1)];
      if (adding) onToggleWatch(asset.id); else onSelect(asset);
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = Math.max(0, Math.min(results.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1)));
      setActiveIndex(next);
      document.getElementById(`search-result-${results[next].id}`)?.scrollIntoView({ block: 'nearest' });
    }
  };
  return (
    <Modal title={adding ? t('search.addTitle') : t('search.title')} onClose={onClose} className="search-modal">
      <div className="search-input-wrap"><Search size={21} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setRemote(null); }} onKeyDown={handleSearchKey} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} /><kbd>ESC</kbd></div>
      <div className="dialog-filter-tabs">{tabs.map((tab) => <button key={tab.id} className={filter === tab.id ? 'active' : ''} onClick={() => { setFilter(tab.id); setActiveIndex(0); }}>{tab.id === 'all' ? tab.label : catLabel(tab.id as Category)}</button>)}</div>
      <div className="search-results-label">{query ? t('search.localResults', { n: results.length }) : t('search.exploreMarkets')}<span>{remote ? t('search.worldwide', { n: remote.length }) : t('search.priceChange')}</span></div>
      {!results.length && !remote && query.trim().length >= 2 && (
        <div className="remote-search-cta"><Globe2 size={22} /><div><strong>{t('search.globalTitle')}</strong><span>{t('search.globalDesc', { query: query.trim() })}</span></div><button className="secondary-button" onClick={runRemoteSearch} disabled={searching}>{searching ? t('search.searching') : t('search.searchWorld')} <ArrowRight size={15} /></button></div>
      )}
      <div className="search-results">
        {results.length ? results.map((asset, index) => { const live = liveOf(asset); return (
          <div className={`search-result ${index === activeIndex ? 'keyboard-active' : ''}`} key={asset.id} id={`search-result-${asset.id}`}>
            <button className="search-result-main" onClick={() => adding ? onToggleWatch(asset.id) : onSelect(asset)}>
              <MarketLogo asset={live} size={35} />
              <span className="search-asset-name"><strong>{live.symbol}</strong><span>{live.name}</span></span>
              <span className="search-asset-value"><strong>{formatPrice(live.price, live.decimals)} <small>{live.currency}</small></strong><span className={live.change >= 0 ? 'positive' : 'negative'}>{formatChange(live.change)}</span></span>
            </button>
            <button className={`icon-button ${watchlist.includes(asset.id) ? 'is-watched' : ''}`} aria-label={t(watchlist.includes(asset.id) ? 'aria.favRemove' : 'aria.favAdd', { symbol: asset.name })} onClick={() => onToggleWatch(asset.id)}>{watchlist.includes(asset.id) ? <Check size={19} /> : <Plus size={19} />}</button>
          </div>
        ); }) : remote ? remote.map((match) => <div className="search-result" key={match.symbol}><button className="search-result-main" onClick={() => pickRemote(match)}><span className="remote-symbol">{match.symbol.slice(0, 2).toUpperCase()}</span><span className="search-asset-name"><strong>{match.symbol}</strong><span>{match.name} \u00b7 {match.exchange}</span></span>{match.price ? <span className="search-asset-value"><strong>{formatPrice(match.price)} <small>{match.currency ?? ''}</small></strong></span> : <ChevronRight size={17} className="remote-chevron" />}</button>{adding && <button className="icon-button" aria-label={t('aria.favAdd', { symbol: match.symbol })} onClick={() => pickRemote(match)}><Plus size={19} /></button>}</div>) : !results.length ? <div className="empty-state"><Search size={32} /><h3>{t('search.noLocal')}</h3><p>{t('search.noLocalDesc')}</p><button className="text-button" onClick={runRemoteSearch} disabled={searching}>{searching ? t('search.searching') : t('search.searchMarkets')}</button></div> : null}
      </div>
      {(remote && !remote.length && query.trim().length >= 2) && <div className="empty-state"><Search size={32} /><h3>{t('search.noGlobal')}</h3><p>{t('search.noGlobalDesc')}</p></div>}
      <div className="dialog-footnote"><Info size={14} />{t('search.footnote')}</div>
    </Modal>
  );
}

export function AssetDialog({ asset, expanded, onClose, onToggleWatch, watched, onCreateAlert }: BaseProps & { asset: Asset; expanded?: boolean; onToggleWatch: () => void; watched: boolean; onCreateAlert: () => void }) {
  const [period, setPeriod] = useState<Period>('1D');
  const { liveOf, connected, refresh, refreshing } = useLive();
  const { t } = useI18n();
  const live = liveOf(asset);
  const { points } = useSeries(live, period);
  return (
    <Modal title={expanded ? t('asset.expandedTitle') : live.name} onClose={onClose} className={`asset-modal ${expanded ? 'wide-modal' : ''}`}>
      <div className="detail-quote"><AssetQuote asset={live} /><span className={`demo-label ${connected ? 'live-active' : ''}`}><span />{connected ? t('asset.liveQuote') : t('asset.reference')}<button className="demo-refresh" onClick={() => refresh()} aria-label={t('asset.update')} title={t('asset.update')}><RefreshCw size={12} className={refreshing ? 'spin-icon' : ''} /></button></span></div>
      <MarketChart asset={live} period={period} onPeriodChange={setPeriod} expanded />
      <div className="asset-detail-stats">
        <div><span>{t('asset.open')}</span><strong>{formatPrice(points[0]?.open ?? live.price, live.decimals)}</strong></div>
        <div><span>{t('asset.high')}</span><strong>{formatPrice(points.length ? Math.max(...points.map((point) => point.high)) : live.price, live.decimals)}</strong></div>
        <div><span>{t('asset.low')}</span><strong>{formatPrice(points.length ? Math.min(...points.map((point) => point.low)) : live.price, live.decimals)}</strong></div>
        <div><span>{t('asset.volume')}</span><strong>{formatCompact(live.volume)}</strong></div>
      </div>
      <p className="asset-description">{live.description}</p>
      <div className="detail-actions"><button className={watched ? 'secondary-button' : 'primary-button'} onClick={onToggleWatch}>{watched ? <Check size={17} /> : <Plus size={17} />}{watched ? t('asset.inList') : t('asset.addList')}</button><button className="secondary-button" onClick={onCreateAlert}><Bell size={16} />{t('asset.createAlert')}</button></div>
    </Modal>
  );
}

export function AlertsDialog({ onClose, alerts, onAdd, onRemove, initialAssetId }: BaseProps & { alerts: PriceAlert[]; onAdd: (alert: PriceAlert) => void; onRemove: (id: string) => void; initialAssetId?: string }) {
  const [assetId, setAssetId] = useState(initialAssetId ?? 'BTCUSD');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const seedAsset = getAssetOrFallback(initialAssetId ?? 'BTCUSD');
  const [price, setPrice] = useState((seedAsset.price * 1.05).toFixed(seedAsset.decimals));
  const [error, setError] = useState('');
  const { liveOf, connected } = useLive();
  const { t } = useI18n();
  const selected = liveOf(getAssetOrFallback(assetId));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const target = Number(price);
    if (!Number.isFinite(target) || target <= 0) { setError(t('alerts.invalid')); return; }
    onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, assetId, condition, price: target });
    setError('');
  };
  return (
    <Modal title={t('alerts.title')} onClose={onClose} className="alerts-modal">
      <p className="modal-intro">{t('alerts.intro')}</p>
      <div className="alerts-current"><MarketLogo asset={selected} size={34} /><div><strong>{selected.shortName}</strong><span>{t('alerts.current')} {formatPrice(selected.price, selected.decimals)} {selected.currency} <em className={selected.change >= 0 ? 'positive' : 'negative'}>({formatChange(selected.change)})</em> {connected && <em className="alerts-live-tag"> {t('quote.live')}</em>}</span></div></div>
      <form onSubmit={submit} className="alert-form">
        <label>{t('alerts.asset')}<select value={assetId} onChange={(event) => { setAssetId(event.target.value); const next = getAssetOrFallback(event.target.value); setPrice((next.price * 1.05).toFixed(next.decimals)); }}>{ASSETS.map((asset) => <option value={asset.id} key={asset.id}>{asset.symbol} - {asset.shortName}</option>)}</select></label>
        <div className="form-two-columns"><label>{t('alerts.condition')}<select value={condition} onChange={(event) => setCondition(event.target.value as 'above' | 'below')}><option value="above">{t('alerts.above')}</option><option value="below">{t('alerts.below')}</option></select></label><label>{t('alerts.target', { currency: selected.currency })}<input type="number" step="any" min="0.000001" value={price} required onChange={(event) => setPrice(event.target.value)} /></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit"><Bell size={17} />{t('alerts.save')}</button>
      </form>
      <h3 className="dialog-section-title">{t('alerts.saved')} <span>{alerts.length}</span></h3>
      <div className="saved-alerts">{alerts.length ? alerts.map((alert) => { const asset = liveOf(getAssetOrFallback(alert.assetId)); return <div className="saved-alert" key={alert.id}><MarketLogo asset={asset} size={32} /><div><strong>{asset.shortName}</strong><span>{alert.condition === 'above' ? t('alerts.aboveShort') : t('alerts.belowShort')} {formatPrice(alert.price, asset.decimals)} {asset.currency}</span></div><button className="icon-button" aria-label={`${t('aria.favRemove')}`} onClick={() => onRemove(alert.id)}><Trash2 size={16} /></button></div>; }) : <div className="small-empty-state"><Bell size={24} /><p>{t('alerts.empty')}</p></div>}</div>
      <div className="dialog-notice"><Info size={17} /><p>{t('alerts.notice')}</p></div>
    </Modal>
  );
}

export function CalendarDialog({ onClose }: BaseProps) {
  const [day, setDay] = useState(0);
  const events = ECONOMIC_EVENTS.filter((event) => day === 2 || event.day === day);
  const { t } = useI18n();
  const dayLabels = [t('calendar.today'), t('calendar.tomorrow'), t('calendar.week')];
  return (
    <Modal title={t('calendar.title')} onClose={onClose} className="calendar-modal">
      <p className="modal-intro">{t('calendar.intro')}</p>
      <div className="calendar-toolbar"><div className="dialog-filter-tabs">{dayLabels.map((label, index) => <button key={label} className={day === index ? 'active' : ''} onClick={() => setDay(index)}>{label}</button>)}</div><span><Clock3 size={14} />UTC+2</span></div>
      <div className="calendar-table-wrap"><table className="calendar-table"><thead><tr><th>{t('calendar.hour')}</th><th>{t('calendar.event')}</th><th>{t('calendar.impact')}</th><th>{t('calendar.forecast')}</th><th>{t('calendar.previous')}</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{day === 2 && <small>{event.day === 0 ? t('calendar.today') : event.day === 1 ? t('calendar.tomorrow') : t('calendar.in2days')}</small>}{event.time}</td><td><img src={`https://flagcdn.com/${event.country === 'EU' ? 'eu' : event.country.toLowerCase()}.svg`} alt={event.country} width="22" height="22" /><span>{event.name}</span></td><td><span className="impact-dots" aria-label={`${t('calendar.impact')} ${event.impact === 3 ? t('calendar.high') : t('calendar.medium')}`}>{[1, 2, 3].map((dot) => <i key={dot} className={dot <= event.impact ? 'filled' : ''} />)}</span></td><td>{event.forecast}</td><td>{event.previous}</td></tr>)}</tbody></table></div>
      <div className="dialog-footnote"><Info size={14} />{t('calendar.footnote')}</div>
    </Modal>
  );
}

export function ProfileDialog({ onClose, profile, onSave, onSignOut }: BaseProps & { profile: Profile | null; onSave: (profile: Profile) => void; onSignOut: () => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [category, setCategory] = useState<Category>(profile?.category ?? 'overview');
  const [error, setError] = useState('');
  const { t, catLabel } = useI18n();
  const submit = (event: FormEvent) => { event.preventDefault(); if (name.trim().length < 2) { setError(t('profile.nameError')); return; } onSave({ name: name.trim(), category }); };
  return (
    <Modal title={profile ? t('profile.title') : t('profile.titleNew')} onClose={onClose} className="profile-modal">
      <div className="profile-brand"><BrandMark /><span>tribuno</span></div>
      <p className="modal-intro">{t('profile.intro')}</p>
      <form onSubmit={submit} className="profile-form"><label>{t('profile.name')}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('profile.namePlaceholder')} autoComplete="given-name" maxLength={30} required /></label><label>{t('profile.favorite')}<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{catLabel(item.id)}</option>)}</select></label>{error && <p className="form-error">{error}</p>}<button type="submit" className="primary-button">{profile ? t('profile.save') : t('profile.create')}<ArrowRight size={17} /></button></form>
      <div className="privacy-note"><LockKeyhole size={15} /><span>{t('profile.privacy')}</span></div>
      {profile && <button className="text-button sign-out" onClick={onSignOut}>{t('profile.signOut')}</button>}
    </Modal>
  );
}

export function WatchlistDialog({ onClose, ids, name, onRename, onChange, onAdd, onSelect }: BaseProps & { ids: string[]; name: string; onRename: (name: string) => void; onChange: (ids: string[]) => void; onAdd: () => void; onSelect: (asset: Asset) => void }) {
  const [draftName, setDraftName] = useState(name);
  const [exported, setExported] = useState(false);
  const { liveOf } = useLive();
  const { t } = useI18n();
  const move = (index: number, direction: number) => { const next = [...ids]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next); }; 
  const exportList = () => { const csv = ['Simbolo;Nombre;Precio;Moneda;Cambio (%)', ...ids.map((id) => { const asset = liveOf(getAssetOrFallback(id)); return `${asset.symbol};${asset.name};${formatPrice(asset.price, asset.decimals)};${asset.currency};${formatPrice(asset.change)}`; })].join('\n'); const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = lang === 'en' ? 'tribuno-my-list.csv' : 'tribuno-mi-lista.csv'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setExported(true); };
  const { lang } = useI18n();
  return (
    <Modal title={t('watchModal.title')} onClose={onClose} className="watchlist-modal">
      <form className="watchlist-name-form" onSubmit={(event) => { event.preventDefault(); if (draftName.trim()) onRename(draftName.trim()); }}><label>{t('watchModal.name')}<input value={draftName} maxLength={32} required onChange={(event) => setDraftName(event.target.value)} /></label><button className="secondary-button" type="submit">{t('watchModal.save')}</button></form>
      <div className="watchlist-manage-items">{ids.length ? ids.map((id, index) => { const asset = liveOf(getAssetOrFallback(id)); return <div className="manage-watch-row" key={id}><button className="manage-watch-asset" onClick={() => onSelect(asset)}><MarketLogo asset={asset} size={32} /><span><strong>{asset.symbol}</strong><small>{asset.shortName}</small></span></button><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span><div><button className="icon-button" disabled={index === 0} aria-label={`${t('watchModal.save')} ${asset.symbol}`} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button className="icon-button" disabled={index === ids.length - 1} aria-label={`${t('watchModal.save')} ${asset.symbol}`} onClick={() => move(index, 1)}><ArrowDown size={16} /></button><button className="icon-button remove-button" aria-label={t('aria.favRemove', { symbol: asset.symbol })} onClick={() => onChange(ids.filter((item) => item !== id))}><X size={17} /></button></div></div>; }) : <div className="empty-state"><Star size={30} /><h3>{t('watchModal.emptyTitle')}</h3><p>{t('watchModal.emptyDesc')}</p></div>}</div>
      <div className="detail-actions"><button className="primary-button" onClick={onAdd}><Plus size={17} />{t('watchModal.add')}</button><button className="secondary-button" disabled={!ids.length} onClick={exportList}>{exported ? <CheckCheck size={16} /> : <ArrowDown size={16} />}{exported ? t('watchModal.exported') : t('watchModal.export')}</button></div>
      <div className="dialog-footnote"><ShieldCheck size={15} />{t('watchModal.footnote')}</div>
    </Modal>
  );
}

export function ArticleDialog({ article, onClose, onAsset, saved, onSave }: BaseProps & { article: Article; onAsset: (asset: Asset) => void; saved: boolean; onSave: () => void }) {
  const asset = getAssetOrFallback(article.assetId);
  const { t } = useI18n();
  return (
    <Modal title={t('article.title')} onClose={onClose} className="article-modal">
      <img className="article-hero" src={article.image} alt={article.alt} />
      <div className="article-meta"><span>{article.category}</span><span>{article.source ? t('article.sourcePrefix', { source: article.source }) : t('article.editorial')}</span><span>{article.readTime}</span></div>
      <h1>{article.title}</h1><p className="article-summary">{article.summary}</p>
      <div className="article-body">{article.body.map((paragraph) => <p key={paragraph.slice(0, 30)}>{paragraph}</p>)}</div>
      {article.url && <a className="article-source-link" href={article.url} target="_blank" rel="noopener noreferrer">{t('article.readOriginal')}{article.source ? t('article.inSource', { source: article.source }) : ''}<ArrowUpRight size={15} /></a>}
      <div className="article-bottom"><button className="secondary-button" onClick={() => onAsset(asset)}><TrendingUp size={17} />{t('article.explore', { name: asset.shortName })}<ArrowRight size={16} /></button><button className={`icon-button ${saved ? 'is-watched' : ''}`} onClick={onSave} aria-label={saved ? t('article.unsave') : t('article.save')}><Bookmark size={20} fill={saved ? 'currentColor' : 'none'} /></button></div>
      <div className="dialog-footnote"><Info size={15} />{t('article.footnote')}</div>
    </Modal>
  );
}

export function NewsDialog({ onClose, onArticle, feed }: BaseProps & { onArticle: (article: Article) => void; feed: FeedItem[] }) {
  const [filter, setFilter] = useState('latest');
  const { t, lang } = useI18n();
  const live = [...feed].sort((a, b) => b.createdAt - a.createdAt);
  const news = filter === 'editorial' ? [] : live.filter((item) => filter === 'latest' || item.category === filter);
  const filters = [
    { id: 'latest', label: t('newsModal.latest') },
    { id: 'markets', label: t('newsModal.markets') },
    { id: 'crypto', label: t('newsModal.crypto') },
    { id: 'forex', label: t('newsModal.forex') },
    { id: 'commodities', label: t('newsModal.commodities') },
    { id: 'editorial', label: t('newsModal.editorial') },
  ];
  return (
    <Modal title={t('newsModal.title')} onClose={onClose} className="news-modal">
      <div className="news-live-head"><div className="news-live-label"><span className="status-dot" />{t('newsModal.liveLabel')}</div></div>
      <div className="dialog-filter-tabs">{filters.map((item) => <button key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      <div className="news-dialog-list">
        {filter === 'editorial' ? ARTICLES.map((article) => <button key={article.id} className="news-dialog-item" onClick={() => onArticle(article)}><img src={article.image} alt={article.alt} /><span><small>{article.category} &middot; {article.readTime}</small><strong>{article.title}</strong><span>{article.summary}</span></span><ChevronRight size={18} /></button>)
          : news.length ? news.map((item) => { const feedArticle = articleFromFeed(item, lang); return <button key={item.id} className="news-dialog-item" onClick={() => onArticle(feedArticle)}><img src={feedArticle.image} alt={feedArticle.alt} /><span><small className="news-item-category">{item.category} &middot; <em>{item.source ? `${t('article.sourcePrefix', { source: item.source })} \u00b7 ` : ''}{relativeTime(item.createdAt)}</em></small><strong>{item.title}</strong><span>{item.summary}</span></span><ChevronRight size={18} /></button>; })
          : <div className="empty-state"><Bookmark size={30} /><h3>{t('newsModal.emptyTitle')}</h3><p>{t('newsModal.emptyDesc')}</p></div>}
      </div>
    </Modal>
  );
}

export function CommunityDialog({ onClose, onAsset }: BaseProps & { onAsset: (asset: Asset) => void }) {
  const [filter, setFilter] = useState('all');
  const { liveOf } = useLive();
  const { t, lang } = useI18n();
  const ideas = [
    { name: 'Ana Mar\u00edn', handle: 'ana.markets', asset: 'SPX', tag: 'indices', category: t('community.indices'), title: 'S&P 500: la importancia de mirar el contexto', titleEn: 'S&P 500: the importance of context', text: 'Antes de seguir una tendencia, comparo la amplitud del mercado con el volumen. Un movimiento respaldado por m\u00e1s sectores cuenta una historia muy distinta a uno aislado.', textEn: 'Before following a trend, I compare market breadth with volume. A move backed by more sectors tells a very different story than an isolated one.', color: '#e9e0fc' },
    { name: 'Daniel Rojas', handle: 'dani.crypto', asset: 'BTCUSD', tag: 'crypto', category: t('community.crypto'), title: 'Bitcoin y el valor de tener un plan', titleEn: 'Bitcoin and the value of a plan', text: 'Los movimientos de corto plazo no deber\u00edan cambiar un horizonte de largo plazo. Estos son los niveles que estoy observando en mi escenario de base, con el riesgo siempre definido.', textEn: 'Short-term moves should not change a long-term horizon. These are the levels I am watching in my base scenario, with risk always defined.', color: '#e2ede2' },
    { name: 'Laura S\u00e1nchez', handle: 'laura.invest', asset: 'NVDA', tag: 'stocks', category: t('community.stocks'), title: 'Semiconductores: m\u00e1s all\u00e1 del titular', titleEn: 'Semiconductors: beyond the headline', text: 'Los resultados y las expectativas no siempre avanzan al mismo ritmo. Mirar los m\u00e1rgenes junto a los ingresos ayuda a poner las valoraciones en perspectiva.', textEn: 'Results and expectations do not always move at the same pace. Looking at margins alongside revenue helps put valuations in perspective.', color: '#f4e6d7' },
    { name: 'Marcos Pe\u00f1a', handle: 'mpena.forex', asset: 'EURUSD', tag: 'forex', category: t('community.forex'), title: 'EUR/USD y el diferencial de tipos', titleEn: 'EUR/USD and the rate differential', text: 'Cuando el mercado cambia de expectativas sobre los bancos centrales, el cruce lo nota r\u00e1pido. Sigo el diferencial de tipos antes que el ruido intrad\u00eda.', textEn: 'When the market changes expectations about central banks, the pair notices quickly. I follow the rate differential rather than intraday noise.', color: '#e0ecf7' },
    { name: 'Sof\u00eda Iglesias', handle: 'sofia.macro', asset: 'US10Y', tag: 'fixed', category: t('community.indices'), title: 'La renta fija vuelve al centro del debate', titleEn: 'Fixed income is back at the center of the debate', text: 'El bono a diez a\u00f1os es la referencia que ordena el resto de activos. Un repunte de rentabilidad tensiona crecimiento y valoraciones casi al mismo tiempo.', textEn: 'The ten-year bond is the reference that orders the rest of the assets. A rise in yields pressures growth and valuations almost at the same time.', color: '#f3e2ea' },
    { name: 'Javier N\u00fa\u00f1ez', handle: 'javi.energy', asset: 'CL1!', tag: 'commodities', category: t('community.commodities'), title: 'Petr\u00f3leo: oferta, demanda y geopolitica', titleEn: 'Oil: supply, demand and geopolitics', text: 'En energ\u00eda, los inventarios y las decisiones de producci\u00f3n pesan m\u00e1s que cualquier titular puntual. Prefiero reaccionar a los datos que anticiparlos.', textEn: 'In energy, inventories and production decisions weigh more than any single headline. I prefer reacting to data rather than anticipating it.', color: '#f7f0d8' },
    { name: 'Carla Dom\u00ednguez', handle: 'carla.etf', asset: 'SPY', tag: 'funds', category: t('community.stocks'), title: 'Indexarse no significa no analizar', titleEn: 'Indexing does not mean not analyzing', text: 'Un ETF diversificado sigue siendo una decisi\u00f3n activa: eliges mercado, coste y horizonte. Reviso la composici\u00f3n al menos dos veces al a\u00f1o.', textEn: 'A diversified ETF is still an active decision: you choose market, cost and horizon. I review the composition at least twice a year.', color: '#e6e6f5' },
    { name: 'Tom\u00e1s Bravo', handle: 'tomas.riesgo', asset: 'IBEX', tag: 'indices', category: t('community.indices'), title: 'Gesti\u00f3n del riesgo antes que rentabilidad', titleEn: 'Risk management before returns', text: 'Defino el tama\u00f1o de cada posici\u00f3n antes de mirar el gr\u00e1fico. As\u00ed una buena idea no se convierte en un mal resultado por exceso de confianza.', textEn: 'I define the size of each position before looking at the chart. That way a good idea does not become a bad result from overconfidence.', color: '#dff0e6' },
  ].filter((idea) => filter === 'all' || idea.tag === filter);
  const filters = [
    { id: 'all', label: t('community.all') },
    { id: 'indices', label: t('community.indices') },
    { id: 'crypto', label: t('community.crypto') },
    { id: 'stocks', label: t('community.stocks') },
    { id: 'forex', label: t('community.forex') },
    { id: 'commodities', label: t('community.commodities') },
  ];
  return (
    <Modal title={t('community.title')} onClose={onClose} className="community-modal">
      <p className="modal-intro">{t('community.intro')}</p><div className="dialog-filter-tabs">{filters.map((item) => <button key={item.id} className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      <div className="community-ideas">{ideas.map((idea) => <article key={idea.handle} className="community-idea" tabIndex={0} role="button" onClick={() => onAsset(liveOf(getAssetOrFallback(idea.asset)))} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onAsset(liveOf(getAssetOrFallback(idea.asset))); } }}><div className="idea-author"><span style={{ background: idea.color }}><UserRound size={19} /></span><div><strong>{idea.name}</strong><small>@{idea.handle}</small></div><span className="idea-category">{idea.category}</span></div><h3>{lang === 'en' ? idea.titleEn : idea.title}</h3><p>{lang === 'en' ? idea.textEn : idea.text}</p><button className="text-button" tabIndex={-1} onClick={(event) => { event.stopPropagation(); onAsset(liveOf(getAssetOrFallback(idea.asset))); }}>{t('community.explore', { name: idea.asset })}<ArrowRight size={15} /></button></article>)}</div><div className="dialog-footnote"><Info size={15} />{t('community.footnote')}</div>
    </Modal>
  );
}

export function HelpDialog({ onClose }: BaseProps) {
  const { t } = useI18n();
  const faq = [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
    { q: t('help.q4'), a: t('help.a4') },
    { q: t('help.q5'), a: t('help.a5') },
    { q: t('help.q6'), a: t('help.a6') },
  ];
  return (
    <Modal title={t('help.title')} onClose={onClose} className="help-modal">
      <p className="modal-intro">{t('help.intro')}</p>
      <div className="help-faq">{faq.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
      <div className="keyboard-shortcuts"><span>{t('help.search')}</span><span><kbd>Ctrl</kbd> + <kbd>K</kbd></span></div><div className="keyboard-shortcuts"><span>{t('help.close')}</span><kbd>Esc</kbd></div>
    </Modal>
  );
}