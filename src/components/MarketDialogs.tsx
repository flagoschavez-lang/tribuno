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

function hashText(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function articleFromFeed(item: FeedItem): Article {
  const asset = getAssetOrFallback(item.assetId);
  const source = ARTICLES[hashText(item.id) % ARTICLES.length];
  const priceText = formatPrice(asset.price, asset.decimals);
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
    body: [
      `${asset.name} (${asset.symbol}) cotiza en ${priceText} ${asset.currency}, con un movimiento del ${formatChange(asset.change)} durante la sesi\u00f3n. La operativa mantiene la atenci\u00f3n de los participantes en un contexto de actividad sostenida.`,
      `El volumen negociado se sit\u00faa en ${formatCompact(asset.volume || 0)} y la referencia intrad\u00eda se actualiza de forma continua. El nivel de ${priceText} ${asset.currency} funciona como referencia inmediata para el activo.`,
      'Desde una perspectiva de an\u00e1lisis, un movimiento de este tipo conviene contextualizarlo con el volumen y la amplitud del resto del mercado. El horizonte temporal y la tolerancia al riesgo siguen siendo las variables m\u00e1s relevantes a la hora de interpretar cualquier titular.',
    ],
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
  const results = useMemo(() => ASSETS.filter((asset) => (filter === 'all' || asset.category === filter) && normalize(`${asset.symbol} ${asset.name}`).includes(normalize(query))), [query, filter]);
  const tabs = [{ id: 'all', label: 'Todos' }, ...CATEGORIES.filter((category) => ['stocks', 'crypto', 'indices', 'forex'].includes(category.id))];
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
    <Modal title={adding ? 'A\u00f1adir s\u00edmbolo' : 'Encuentra tu pr\u00f3xima oportunidad'} onClose={onClose} className="search-modal">
      <div className="search-input-wrap"><Search size={21} /><input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setRemote(null); }} onKeyDown={handleSearchKey} placeholder={'Buscar por nombre o s\u00edmbolo en todos los mercados'} aria-label={'Buscar por nombre o s\u00edmbolo. Usa las flechas y pulsa Intro para seleccionar.'} /><kbd>ESC</kbd></div>
      <div className="dialog-filter-tabs">{tabs.map((tab) => <button key={tab.id} className={filter === tab.id ? 'active' : ''} onClick={() => { setFilter(tab.id); setActiveIndex(0); }}>{tab.label}</button>)}</div>
      <div className="search-results-label">{query ? `${results.length} resultados locales` : 'EXPLORA LOS MERCADOS'}<span>{remote ? `\u00b7 ${remote.length} en todo el mundo` : 'Precio &middot; Cambio'}</span></div>
      {!results.length && !remote && query.trim().length >= 2 && (
        <div className="remote-search-cta"><Globe2 size={22} /><div><strong>Explorar todos los mercados</strong><span>Buscamos {query.trim()} en bolsas de todo el mundo, incluidas las que no est\u00e1n en nuestra lista inicial.</span></div><button className="secondary-button" onClick={runRemoteSearch} disabled={searching}>{searching ? 'Buscando\u2026' : 'Buscar en todo el mundo'} <ArrowRight size={15} /></button></div>
      )}
      <div className="search-results">
        {results.length ? results.map((asset, index) => { const live = liveOf(asset); return (
          <div className={`search-result ${index === activeIndex ? 'keyboard-active' : ''}`} key={asset.id} id={`search-result-${asset.id}`}>
            <button className="search-result-main" onClick={() => adding ? onToggleWatch(asset.id) : onSelect(asset)}>
              <MarketLogo asset={live} size={35} />
              <span className="search-asset-name"><strong>{live.symbol}</strong><span>{live.name}</span></span>
              <span className="search-asset-value"><strong>{formatPrice(live.price, live.decimals)} <small>{live.currency}</small></strong><span className={live.change >= 0 ? 'positive' : 'negative'}>{formatChange(live.change)}</span></span>
            </button>
            <button className={`icon-button ${watchlist.includes(asset.id) ? 'is-watched' : ''}`} aria-label={`${watchlist.includes(asset.id) ? 'Quitar' : 'A\u00f1adir'} ${asset.name} ${watchlist.includes(asset.id) ? 'de' : 'a'} mi lista`} onClick={() => onToggleWatch(asset.id)}>{watchlist.includes(asset.id) ? <Check size={19} /> : <Plus size={19} />}</button>
          </div>
        ); }) : remote ? remote.map((match) => <div className="search-result" key={match.symbol}><button className="search-result-main" onClick={() => pickRemote(match)}><span className="remote-symbol">{match.symbol.slice(0, 2).toUpperCase()}</span><span className="search-asset-name"><strong>{match.symbol}</strong><span>{match.name} \u00b7 {match.exchange}</span></span>{match.price ? <span className="search-asset-value"><strong>{formatPrice(match.price)} <small>{match.currency ?? ''}</small></strong></span> : <ChevronRight size={17} className="remote-chevron" />}</button>{adding && <button className="icon-button" aria-label={`A\u00f1adir ${match.symbol} a mi lista`} onClick={() => pickRemote(match)}><Plus size={19} /></button>}</div>) : !results.length ? <div className="empty-state"><Search size={32} /><h3>No encontramos ese activo en la lista</h3><p>Usa la b&uacute;squeda global para encontrarlo en cualquier mercado del mundo.</p><button className="text-button" onClick={runRemoteSearch} disabled={searching}>{searching ? 'Buscando\u2026' : 'Buscar en todos los mercados'}</button></div> : null}
      </div>
      {(remote && !remote.length && query.trim().length >= 2) && <div className="empty-state"><Search size={32} /><h3>Sin coincidencias globales</h3><p>Prueba con otro nombre o s&iacute;mbolo de mercado.</p></div>}
      <div className="dialog-footnote"><Info size={14} />Cobertura global de mercados. Las cotizaciones llegan en vivo cuando el activo est&aacute; en sesi&oacute;n; el resto conserva una referencia de mercado.</div>
    </Modal>
  );
}

export function AssetDialog({ asset, expanded, onClose, onToggleWatch, watched, onCreateAlert }: BaseProps & { asset: Asset; expanded?: boolean; onToggleWatch: () => void; watched: boolean; onCreateAlert: () => void }) {
  const [period, setPeriod] = useState<Period>('1D');
  const { liveOf, connected, refresh, refreshing } = useLive();
  const live = liveOf(asset);
  const { points } = useSeries(live, period);
  return (
    <Modal title={expanded ? 'Tu perspectiva del mercado' : live.name} onClose={onClose} className={`asset-modal ${expanded ? 'wide-modal' : ''}`}>
      <div className="detail-quote"><AssetQuote asset={live} /><span className={`demo-label ${connected ? 'live-active' : ''}`}><span />{connected ? 'Cotizaci\u00f3n en vivo' : 'Referencia de mercado'}<button className="demo-refresh" onClick={() => refresh()} aria-label="Actualizar cotizaciones" title="Actualizar cotizaciones"><RefreshCw size={12} className={refreshing ? 'spin-icon' : ''} /></button></span></div>
      <MarketChart asset={live} period={period} onPeriodChange={setPeriod} expanded />
      <div className="asset-detail-stats">
        <div><span>Apertura</span><strong>{formatPrice(points[0]?.open ?? live.price, live.decimals)}</strong></div>
        <div><span>M&aacute;ximo del periodo</span><strong>{formatPrice(points.length ? Math.max(...points.map((point) => point.high)) : live.price, live.decimals)}</strong></div>
        <div><span>M&iacute;nimo del periodo</span><strong>{formatPrice(points.length ? Math.min(...points.map((point) => point.low)) : live.price, live.decimals)}</strong></div>
        <div><span>Volumen</span><strong>{formatCompact(live.volume)}</strong></div>
      </div>
      <p className="asset-description">{live.description}</p>
      <div className="detail-actions"><button className={watched ? 'secondary-button' : 'primary-button'} onClick={onToggleWatch}>{watched ? <Check size={17} /> : <Plus size={17} />}{watched ? 'En mi lista de seguimiento' : 'A\u00f1adir a mi lista'}</button><button className="secondary-button" onClick={onCreateAlert}><Bell size={16} />Crear alerta</button></div>
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
  const selected = liveOf(getAssetOrFallback(assetId));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const target = Number(price);
    if (!Number.isFinite(target) || target <= 0) { setError('Introduce un precio v\u00e1lido mayor que cero.'); return; }
    onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, assetId, condition, price: target });
    setError('');
  };
  return (
    <Modal title="Tus alertas de precio" onClose={onClose} className="alerts-modal">
      <p className="modal-intro">Tus niveles importantes, siempre a mano.</p>
      <div className="alerts-current"><MarketLogo asset={selected} size={34} /><div><strong>{selected.shortName}</strong><span>Precio actual: {formatPrice(selected.price, selected.decimals)} {selected.currency} <em className={selected.change >= 0 ? 'positive' : 'negative'}>({formatChange(selected.change)})</em> {connected && <em className="alerts-live-tag"> en vivo</em>}</span></div></div>
      <form onSubmit={submit} className="alert-form">
        <label>Activo<select value={assetId} onChange={(event) => { setAssetId(event.target.value); const next = getAssetOrFallback(event.target.value); setPrice((next.price * 1.05).toFixed(next.decimals)); }}>{ASSETS.map((asset) => <option value={asset.id} key={asset.id}>{asset.symbol} - {asset.shortName}</option>)}</select></label>
        <div className="form-two-columns"><label>Condici&oacute;n<select value={condition} onChange={(event) => setCondition(event.target.value as 'above' | 'below')}><option value="above">Precio por encima de</option><option value="below">Precio por debajo de</option></select></label><label>Precio objetivo ({selected.currency})<input type="number" step="any" min="0.000001" value={price} required onChange={(event) => setPrice(event.target.value)} /></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit"><Bell size={17} />Guardar alerta</button>
      </form>
      <h3 className="dialog-section-title">Alertas guardadas <span>{alerts.length}</span></h3>
      <div className="saved-alerts">{alerts.length ? alerts.map((alert) => { const asset = liveOf(getAssetOrFallback(alert.assetId)); return <div className="saved-alert" key={alert.id}><MarketLogo asset={asset} size={32} /><div><strong>{asset.shortName}</strong><span>{alert.condition === 'above' ? 'Por encima de' : 'Por debajo de'} {formatPrice(alert.price, asset.decimals)} {asset.currency}</span></div><button className="icon-button" aria-label={`Eliminar alerta de ${asset.shortName}`} onClick={() => onRemove(alert.id)}><Trash2 size={16} /></button></div>; }) : <div className="small-empty-state"><Bell size={24} /><p>A&uacute;n no tienes alertas. Guarda tu primer nivel de precio.</p></div>}</div>
      <div className="dialog-notice"><Info size={17} /><p>Las alertas se guardan en este dispositivo y se supervisan mientras exploras. La plataforma no env&iacute;a notificaciones externas.</p></div>
    </Modal>
  );
}

export function CalendarDialog({ onClose }: BaseProps) {
  const [day, setDay] = useState(0);
  const events = ECONOMIC_EVENTS.filter((event) => day === 2 || event.day === day);
  return (
    <Modal title={'Calendario econ\u00f3mico'} onClose={onClose} className="calendar-modal">
      <p className="modal-intro">Los acontecimientos que pueden mover los mercados.</p>
      <div className="calendar-toolbar"><div className="dialog-filter-tabs">{['Hoy', 'Ma\u00f1ana', 'Esta semana'].map((label, index) => <button key={label} className={day === index ? 'active' : ''} onClick={() => setDay(index)}>{label}</button>)}</div><span><Clock3 size={14} />UTC+2</span></div>
      <div className="calendar-table-wrap"><table className="calendar-table"><thead><tr><th>Hora</th><th>Evento</th><th>Impacto</th><th>Previsi&oacute;n</th><th>Anterior</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{day === 2 && <small>{event.day === 0 ? 'Hoy' : event.day === 1 ? 'Ma\u00f1ana' : 'En 2 d\u00edas'}</small>}{event.time}</td><td><img src={`https://flagcdn.com/${event.country === 'EU' ? 'eu' : event.country.toLowerCase()}.svg`} alt={event.country} width="22" height="22" /><span>{event.name}</span></td><td><span className="impact-dots" aria-label={`Impacto ${event.impact === 3 ? 'alto' : 'medio'}`}>{[1, 2, 3].map((dot) => <i key={dot} className={dot <= event.impact ? 'filled' : ''} />)}</span></td><td>{event.forecast}</td><td>{event.previous}</td></tr>)}</tbody></table></div>
      <div className="dialog-footnote"><Info size={14} />Agenda elaborada a partir de referencias macroecon&oacute;micas; las cifras pueden ser revisadas por las fuentes oficiales.</div>
    </Modal>
  );
}

export function ProfileDialog({ onClose, profile, onSave, onSignOut }: BaseProps & { profile: Profile | null; onSave: (profile: Profile) => void; onSignOut: () => void }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [category, setCategory] = useState<Category>(profile?.category ?? 'overview');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); if (name.trim().length < 2) { setError('Escribe un nombre de al menos 2 caracteres.'); return; } onSave({ name: name.trim(), category }); };
  return (
    <Modal title={profile ? 'Tu espacio Tribuno' : 'El mercado es solo el comienzo.'} onClose={onClose} className="profile-modal">
      <div className="profile-brand"><BrandMark /><span>tribuno</span></div>
      <p className="modal-intro">Una perspectiva global. Un espacio a tu medida. Personaliza tu experiencia y sigue lo que te importa.</p>
      <form onSubmit={submit} className="profile-form"><label>&iquest;C&oacute;mo te llamas?<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="given-name" maxLength={30} required /></label><label>Tu mercado favorito<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{error && <p className="form-error">{error}</p>}<button type="submit" className="primary-button">{profile ? 'Guardar preferencias' : 'Crear mi espacio gratis'}<ArrowRight size={17} /></button></form>
      <div className="privacy-note"><LockKeyhole size={15} /><span>Sin contrase&ntilde;as. Sin registros externos. Tu perfil y favoritos se guardan &uacute;nicamente en este navegador.</span></div>
      {profile && <button className="text-button sign-out" onClick={onSignOut}>Eliminar mi perfil local</button>}
    </Modal>
  );
}

export function WatchlistDialog({ onClose, ids, name, onRename, onChange, onAdd, onSelect }: BaseProps & { ids: string[]; name: string; onRename: (name: string) => void; onChange: (ids: string[]) => void; onAdd: () => void; onSelect: (asset: Asset) => void }) {
  const [draftName, setDraftName] = useState(name);
  const [exported, setExported] = useState(false);
  const { liveOf } = useLive();
  const move = (index: number, direction: number) => { const next = [...ids]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next); }; 
  const exportList = () => { const csv = ['Simbolo;Nombre;Precio;Moneda;Cambio (%)', ...ids.map((id) => { const asset = liveOf(getAssetOrFallback(id)); return `${asset.symbol};${asset.name};${formatPrice(asset.price, asset.decimals)};${asset.currency};${formatPrice(asset.change)}`; })].join('\n'); const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = 'tribuno-mi-lista.csv'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); setExported(true); };
  return (
    <Modal title="Tu lista de seguimiento" onClose={onClose} className="watchlist-modal">
      <form className="watchlist-name-form" onSubmit={(event) => { event.preventDefault(); if (draftName.trim()) onRename(draftName.trim()); }}><label>Nombre de la lista<input value={draftName} maxLength={32} required onChange={(event) => setDraftName(event.target.value)} /></label><button className="secondary-button" type="submit">Guardar</button></form>
      <div className="watchlist-manage-items">{ids.length ? ids.map((id, index) => { const asset = liveOf(getAssetOrFallback(id)); return <div className="manage-watch-row" key={id}><button className="manage-watch-asset" onClick={() => onSelect(asset)}><MarketLogo asset={asset} size={32} /><span><strong>{asset.symbol}</strong><small>{asset.shortName}</small></span></button><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span><div><button className="icon-button" disabled={index === 0} aria-label={`Subir ${asset.symbol}`} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button className="icon-button" disabled={index === ids.length - 1} aria-label={`Bajar ${asset.symbol}`} onClick={() => move(index, 1)}><ArrowDown size={16} /></button><button className="icon-button remove-button" aria-label={`Quitar ${asset.symbol}`} onClick={() => onChange(ids.filter((item) => item !== id))}><X size={17} /></button></div></div>; }) : <div className="empty-state"><Star size={30} /><h3>Tu lista, tus favoritos</h3><p>A&ntilde;ade s&iacute;mbolos para empezar a seguir el mercado.</p></div>}</div>
      <div className="detail-actions"><button className="primary-button" onClick={onAdd}><Plus size={17} />A&ntilde;adir s&iacute;mbolo</button><button className="secondary-button" disabled={!ids.length} onClick={exportList}>{exported ? <CheckCheck size={16} /> : <ArrowDown size={16} />}{exported ? 'CSV descargado' : 'Exportar CSV'}</button></div>
      <div className="dialog-footnote"><ShieldCheck size={15} />El orden y los s&iacute;mbolos se guardan autom&aacute;ticamente.</div>
    </Modal>
  );
}

export function ArticleDialog({ article, onClose, onAsset, saved, onSave }: BaseProps & { article: Article; onAsset: (asset: Asset) => void; saved: boolean; onSave: () => void }) {
  const asset = getAssetOrFallback(article.assetId);
  return (
    <Modal title="La perspectiva Tribuno" onClose={onClose} className="article-modal">
      <img className="article-hero" src={article.image} alt={article.alt} />
      <div className="article-meta"><span>{article.category}</span><span>{article.source ? `Fuente: ${article.source}` : 'Tribuno Editorial'}</span><span>{article.readTime} de lectura</span></div>
      <h1>{article.title}</h1><p className="article-summary">{article.summary}</p>
      <div className="article-body">{article.body.map((paragraph) => <p key={paragraph.slice(0, 30)}>{paragraph}</p>)}</div>
      {article.url && <a className="article-source-link" href={article.url} target="_blank" rel="noopener noreferrer">Leer la informaci&oacute;n original{article.source ? ` en ${article.source}` : ''}<ArrowUpRight size={15} /></a>}
      <div className="article-bottom"><button className="secondary-button" onClick={() => onAsset(asset)}><TrendingUp size={17} />Explorar {asset.shortName}<ArrowRight size={16} /></button><button className={`icon-button ${saved ? 'is-watched' : ''}`} onClick={onSave} aria-label={saved ? 'Quitar de noticias guardadas' : 'Guardar noticia'}><Bookmark size={20} fill={saved ? 'currentColor' : 'none'} /></button></div>
      <div className="dialog-footnote"><Info size={15} />Titular y enlace citados a su fuente original; el an&aacute;lisis es propio y con fines informativos. No constituye asesoramiento de inversi&oacute;n.</div>
    </Modal>
  );
}

export function NewsDialog({ onClose, onArticle, feed }: BaseProps & { onArticle: (article: Article) => void; feed: FeedItem[] }) {
  const [filter, setFilter] = useState('Últimas');
  const live = [...feed].sort((a, b) => b.createdAt - a.createdAt);
  const news = filter === 'Editorial' ? [] : live.filter((item) => filter === 'Últimas' || item.category === filter);
  return (
    <Modal title="El mercado, en titulares" onClose={onClose} className="news-modal">
      <div className="news-live-head"><div className="news-live-label"><span className="status-dot" />ACTUALIZACI&Oacute;N CONTINUA</div></div>
      <div className="dialog-filter-tabs">{['Últimas', 'Mercados', 'Cripto', 'Divisas', 'Materias primas', 'Editorial'].map((category) => <button key={category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>
      <div className="news-dialog-list">
        {filter === 'Editorial' ? ARTICLES.map((article) => <button key={article.id} className="news-dialog-item" onClick={() => onArticle(article)}><img src={article.image} alt={article.alt} /><span><small>{article.category} &middot; {article.readTime}</small><strong>{article.title}</strong><span>{article.summary}</span></span><ChevronRight size={18} /></button>)
          : news.length ? news.map((item) => { const feedArticle = articleFromFeed(item); return <button key={item.id} className="news-dialog-item" onClick={() => onArticle(feedArticle)}><img src={feedArticle.image} alt={feedArticle.alt} /><span><small className="news-item-category">{item.category} &middot; <em>{item.source ? `Fuente: ${item.source} \u00b7 ` : ''}{relativeTime(item.createdAt)}</em></small><strong>{item.title}</strong><span>{item.summary}</span></span><ChevronRight size={18} /></button>; })
          : <div className="empty-state"><Bookmark size={30} /><h3>Sin novedades en esta secci&oacute;n</h3><p>El feed se renueva continuamente; revisa &Uacute;ltimas noticias en unos instantes.</p></div>}
      </div>
    </Modal>
  );
}

export function CommunityDialog({ onClose, onAsset }: BaseProps & { onAsset: (asset: Asset) => void }) {
  const [filter, setFilter] = useState('Todas');
  const { liveOf } = useLive();
  const ideas = [
    { name: 'Ana Mar\u00edn', handle: 'ana.markets', asset: 'SPX', category: '\u00cdndices', title: 'S&P 500: la importancia de mirar el contexto', text: 'Antes de seguir una tendencia, comparo la amplitud del mercado con el volumen. Un movimiento respaldado por m\u00e1s sectores cuenta una historia muy distinta a uno aislado.', color: '#e9e0fc' },
    { name: 'Daniel Rojas', handle: 'dani.crypto', asset: 'BTCUSD', category: 'Cripto', title: 'Bitcoin y el valor de tener un plan', text: 'Los movimientos de corto plazo no deber\u00edan cambiar un horizonte de largo plazo. Estos son los niveles que estoy observando en mi escenario de base, con el riesgo siempre definido.', color: '#e2ede2' },
    { name: 'Laura S\u00e1nchez', handle: 'laura.invest', asset: 'NVDA', category: 'Acciones', title: 'Semiconductores: m\u00e1s all\u00e1 del titular', text: 'Los resultados y las expectativas no siempre avanzan al mismo ritmo. Mirar los m\u00e1rgenes junto a los ingresos ayuda a poner las valoraciones en perspectiva.', color: '#f4e6d7' },
    { name: 'Marcos Pe\u00f1a', handle: 'mpena.forex', asset: 'EURUSD', category: 'Divisas', title: 'EUR/USD y el diferencial de tipos', text: 'Cuando el mercado cambia de expectativas sobre los bancos centrales, el cruce lo nota r\u00e1pido. Sigo el diferencial de tipos antes que el ruido intrad\u00eda.', color: '#e0ecf7' },
    { name: 'Sof\u00eda Iglesias', handle: 'sofia.macro', asset: 'US10Y', category: 'Renta fija', title: 'La renta fija vuelve al centro del debate', text: 'El bono a diez a\u00f1os es la referencia que ordena el resto de activos. Un repunte de rentabilidad tensiona crecimiento y valoraciones casi al mismo tiempo.', color: '#f3e2ea' },
    { name: 'Javier N\u00fa\u00f1ez', handle: 'javi.energy', asset: 'CL1!', category: 'Materias primas', title: 'Petr\u00f3leo: oferta, demanda y geopolitica', text: 'En energ\u00eda, los inventarios y las decisiones de producci\u00f3n pesan m\u00e1s que cualquier titular puntual. Prefiero reaccionar a los datos que anticiparlos.', color: '#f7f0d8' },
    { name: 'Carla Dom\u00ednguez', handle: 'carla.etf', asset: 'SPY', category: 'Fondos', title: 'Indexarse no significa no analizar', text: 'Un ETF diversificado sigue siendo una decisi\u00f3n activa: eliges mercado, coste y horizonte. Reviso la composici\u00f3n al menos dos veces al a\u00f1o.', color: '#e6e6f5' },
    { name: 'Tom\u00e1s Bravo', handle: 'tomas.riesgo', asset: 'IBEX', category: '\u00cdndices', title: 'Gesti\u00f3n del riesgo antes que rentabilidad', text: 'Defino el tama\u00f1o de cada posici\u00f3n antes de mirar el gr\u00e1fico. As\u00ed una buena idea no se convierte en un mal resultado por exceso de confianza.', color: '#dff0e6' },
  ].filter((idea) => filter === 'Todas' || idea.category === filter);
  return (
    <Modal title="Las ideas se ven mejor en comunidad" onClose={onClose} className="community-modal">
      <p className="modal-intro">Otras miradas. Nuevas perspectivas. Tu propio criterio.</p><div className="dialog-filter-tabs">{['Todas', '\u00cdndices', 'Cripto', 'Acciones', 'Divisas', 'Materias primas'].map((category) => <button key={category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}</button>)}</div>
      <div className="community-ideas">{ideas.map((idea) => <article key={idea.handle} className="community-idea" tabIndex={0} role="button" onClick={() => onAsset(liveOf(getAssetOrFallback(idea.asset)))} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onAsset(liveOf(getAssetOrFallback(idea.asset))); } }}><div className="idea-author"><span style={{ background: idea.color }}><UserRound size={19} /></span><div><strong>{idea.name}</strong><small>@{idea.handle}</small></div><span className="idea-category">{idea.category}</span></div><h3>{idea.title}</h3><p>{idea.text}</p><button className="text-button" tabIndex={-1} onClick={(event) => { event.stopPropagation(); onAsset(liveOf(getAssetOrFallback(idea.asset))); }}>Explorar {idea.asset}<ArrowRight size={15} /></button></article>)}</div><div className="dialog-footnote"><Info size={15} />Perfiles e ideas generados para ilustrar la experiencia de comunidad. No es asesoramiento financiero.</div>
    </Modal>
  );
}

export function HelpDialog({ onClose }: BaseProps) {
  return (
    <Modal title={'Una mirada m\u00e1s clara'} onClose={onClose} className="help-modal">
      <p className="modal-intro">Todo lo que necesitas saber sobre esta experiencia.</p>
      <div className="help-faq"><details open><summary>&iquest;Los precios son en tiempo real?</summary><p>S&iacute;. Durante la sesi&oacute;n de cada mercado, las cotizaciones se actualizan de forma continua y el gr&aacute;fico refleja la evoluci&oacute;n del precio conforme se mueve. Cuando un mercado est&aacute; cerrado o en un intervalo de subasta, la plataforma mantiene la &uacute;ltima referencia disponible.</p></details><details><summary>&iquest;De d&oacute;nde proceden los datos de mercado?</summary><p>Consolidamos las cotizaciones de mercados de referencia y las normalizamos en una sola plataforma con criterios profesionales de calidad y coherencia. La cobertura alcanza bolsas, divisas, criptodivisas, futuros, materias primas y renta fija de todo el mundo.</p></details><details><summary>&iquest;C&oacute;mo se eligen los s&iacute;mbolos disponibles?</summary><p>La plataforma incluye una selecci&oacute;n curada de los mercados m&aacute;s relevantes y, adem&aacute;s, permite buscar e incorporar cualquier activo cotizado en el mundo a trav&eacute;s de la b&uacute;squeda global.</p></details><details><summary>&iquest;D&oacute;nde se guardan mis favoritos?</summary><p>Tu lista de seguimiento, alertas, noticias guardadas y preferencias se conservan en el almacenamiento local de este navegador. No se transmiten a servidores externos y permanecen privados en tu dispositivo.</p></details><details><summary>&iquest;Puedo comprar o vender activos?</summary><p>Tribuno es una plataforma de an&aacute;lisis e informaci&oacute;n. No permite ejecutar operaciones ni ofrece recomendaciones de inversi&oacute;n personalizadas.</p></details><details><summary>&iquest;C&oacute;mo exploro los gr&aacute;ficos?</summary><p>Selecciona un activo y elige un periodo. Mueve el cursor por el gr&aacute;fico para consultar precios y vol&uacute;menes, o usa las flechas del teclado cuando tenga el foco. Puedes alternar entre l&iacute;neas y velas, y la esquina superior muestra la evoluci&oacute;n de los &uacute;ltimos segundos.</p></details></div>
      <div className="keyboard-shortcuts"><span>Buscar un activo</span><span><kbd>Ctrl</kbd> + <kbd>K</kbd></span></div><div className="keyboard-shortcuts"><span>Cerrar una ventana</span><kbd>Esc</kbd></div>
    </Modal>
  );
}