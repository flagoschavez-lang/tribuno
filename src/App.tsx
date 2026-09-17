import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, ArrowUpRight, Bell, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, CircleHelp, Ellipsis, Expand, Globe2, LayoutList, Lightbulb, Menu, MessageSquare, Moon, Plus, Search, SlidersHorizontal, Star, Sun, X, RefreshCw } from 'lucide-react';
import { ARTICLES, ASSETS, CATEGORIES, CATEGORY_HEADINGS, ECONOMIC_EVENTS, REGIONS, type Article, type Asset, type Category, type Region, formatChange, formatCompact, formatPrice, getAsset, relativeTime } from './data/markets';
import MarketLogo, { BrandMark } from './components/MarketLogo';
import MarketChart, { Sparkline, type Period } from './components/MarketChart';
import AssetQuote from './components/AssetQuote';
import { AlertsDialog, ArticleDialog, AssetDialog, CalendarDialog, CommunityDialog, HelpDialog, NewsDialog, ProfileDialog, SearchDialog, WatchlistDialog, articleFromFeed, type PriceAlert, type Profile } from './components/MarketDialogs';
import { SpaceDialog } from './components/AccountDialogs';
import useStoredState from './utils/useStoredState';
import { LiveProvider, useLive } from './data/live';
import { AuthProvider, useAuth } from './data/auth';
import { getAssetOrFallback, useCustom } from './data/custom';

type DialogView =
  | { type: 'search'; adding?: boolean }
  | { type: 'asset'; assetId: string; expanded?: boolean }
  | { type: 'alerts'; assetId?: string }
  | { type: 'calendar' }
  | { type: 'profile' }
  | { type: 'account' }
  | { type: 'watchlist' }
  | { type: 'article'; articleId: number | string }
  | { type: 'news' }
  | { type: 'community' }
  | { type: 'help' };

type SortKey = 'symbol' | 'price' | 'change' | 'volume' | 'marketCap';
type MoversFilter = 'active' | 'gainers' | 'losers';
const DEFAULT_WATCHLIST = ['SPX', 'NDX', 'BTCUSD', 'AAPL', 'EURUSD'];
const TICKERS = ['SPX', 'NDX', 'IBEX', 'EURUSD', 'BTCUSD', 'GC1!'];

function Watchlist({ ids, name, onAdd, onManage, onSelect }: { ids: string[]; name: string; onAdd: () => void; onManage: () => void; onSelect: (asset: Asset) => void }) {
  const { liveOf } = useLive();
  return (
    <section className="watchlist-section" aria-label="Lista de seguimiento">
      <div className="sidebar-section-heading"><h2>Lista de seguimiento</h2><div><button className="icon-button" onClick={onAdd} aria-label={'A\u00f1adir s\u00edmbolo'} title={'A\u00f1adir s\u00edmbolo'}><Plus size={19} /></button><button className="icon-button" onClick={onManage} aria-label="Gestionar lista" title="Gestionar lista"><Ellipsis size={19} /></button></div></div>
      <div className="watchlist-label"><button onClick={onManage}>{name}<ChevronDown size={14} /></button><span>{ids.length} s&iacute;mbolos</span></div>
      <div className="watchlist-columns"><span>S&iacute;mbolo</span><span>&Uacute;ltimo</span><span>Cambio</span></div>
      <div className="watchlist-rows">{ids.length ? ids.map((id) => { const asset = liveOf(getAssetOrFallback(id)); return <button className="watch-row" key={id} onClick={() => onSelect(asset)}><span className="watch-symbol"><MarketLogo asset={asset} size={26} /><span><strong>{asset.symbol}</strong><small>{asset.shortName}</small></span></span><span className="watch-price">{formatPrice(asset.price, asset.decimals)}</span><span className={`watch-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>{formatChange(asset.change)}</span></button>; }) : <div className="watch-empty"><Star size={23} /><p>Elige los activos que quieres seguir.</p></div>}</div>
      <button className="add-symbol-button" onClick={onAdd}><Plus size={16} />A&ntilde;adir s&iacute;mbolo</button>
    </section>
  );
}

function App() {
  const [profile, setProfile] = useStoredState<Profile | null>('tribuno.profile.v1', null);
  const [category, setCategory] = useState<Category>(profile?.category ?? 'overview');
  const [region, setRegion] = useState<Region>('global');
  const [selectedId, setSelectedId] = useState(() => ASSETS.find((asset) => asset.category === (profile?.category && profile.category !== 'overview' ? profile.category : 'indices'))?.id ?? 'SPX');
  const [period, setPeriod] = useState<Period>('1D');
  const [view, setView] = useState<DialogView | null>(null);
  const [menu, setMenu] = useState<'products' | 'region' | 'stock-region' | 'mobile' | null>(null);
  const [watchlist, setWatchlist] = useStoredState<string[]>('tribuno.watchlist.v1', DEFAULT_WATCHLIST);
  const [watchlistName, setWatchlistName] = useStoredState('tribuno.list-name.v1', 'Mi lista');
  const [theme, setTheme] = useStoredState<'light' | 'dark'>('tribuno.theme.v1', 'light');
  const [alerts, setAlerts] = useStoredState<PriceAlert[]>('tribuno.alerts.v1', []);
  const [savedArticles, setSavedArticles] = useStoredState<number[]>('tribuno.saved-articles.v1', []);
  const [moversFilter, setMoversFilter] = useState<MoversFilter>('active');
  const [stockRegion, setStockRegion] = useState<'us' | 'europe' | 'all'>('us');
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'volume', direction: 'desc' });
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const { liveOf, connected, refreshing, liveCount, symbolCount, refresh, feed } = useLive();

  const { assets: customAssets } = useCustom();
  const { user } = useAuth();
  const selectedAsset = getAssetOrFallback(selectedId);
  const validWatchlist = useMemo(() => Array.isArray(watchlist) ? watchlist.filter((id) => ASSETS.some((asset) => asset.id === id) || customAssets.some((asset) => asset.id === id)) : DEFAULT_WATCHLIST, [watchlist, customAssets]);
  const notify = useCallback((message: string) => setToast({ message, id: Date.now() }), []);
  const closeDialog = useCallback(() => setView(null), []);

  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3500); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setView((current) => current?.type === 'search' ? null : { type: 'search' }); setMenu(null); }
      if (event.key === 'Escape') setMenu(null);
    };
    const onPointerDown = (event: PointerEvent) => { if (!(event.target as Element).closest('[data-menu-root]')) setMenu(null); };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => { window.removeEventListener('keydown', onKeyDown); document.removeEventListener('pointerdown', onPointerDown); };
  }, []);

  const summaryAssets = useMemo(() => {
    const assetCategory = category === 'overview' ? 'indices' : category;
    let assets = ASSETS.filter((asset) => asset.category === assetCategory);
    if (assetCategory === 'indices' && region !== 'global') assets = assets.filter((asset) => asset.region === region);
    const shown = assets.slice(0, 4);
    const selected = assets.find((asset) => asset.id === selectedId);
    return selected && !shown.some((asset) => asset.id === selected.id) ? [selected, ...shown.slice(0, 3)] : shown;
  }, [category, region, selectedId]);

  const tableCategory = category === 'overview' ? 'stocks' : category;
  const tableAssets = useMemo(() => {
    let assets = ASSETS.filter((asset) => asset.category === tableCategory);
    if (tableCategory === 'stocks' && stockRegion !== 'all') assets = assets.filter((asset) => asset.region === stockRegion);
    if (moversFilter === 'gainers') assets = assets.filter((asset) => asset.change > 0);
    if (moversFilter === 'losers') assets = assets.filter((asset) => asset.change < 0);
    return [...assets].sort((a, b) => { const comparison = sort.key === 'symbol' ? a.symbol.localeCompare(b.symbol) : a[sort.key] - b[sort.key]; return sort.direction === 'asc' ? comparison : -comparison; });
  }, [tableCategory, stockRegion, moversFilter, sort]);

  function selectCategory(next: Category) { setCategory(next); setRegion('global'); setPeriod('1D'); setMenu(null); setShowAll(false); setMoversFilter('active'); setSort({ key: 'volume', direction: 'desc' }); const nextAsset = ASSETS.find((asset) => asset.category === (next === 'overview' ? 'indices' : next)); if (nextAsset) setSelectedId(nextAsset.id); }
  function selectAsset(asset: Asset) { setCategory(asset.category === 'indices' ? 'overview' : asset.category); setSelectedId(asset.id); setRegion('global'); setPeriod('1D'); setView(null); setMenu(null); setMoversFilter('active'); setShowAll(false); setSort({ key: 'volume', direction: 'desc' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function toggleWatch(id: string) { const exists = validWatchlist.includes(id); setWatchlist(exists ? validWatchlist.filter((item) => item !== id) : [...validWatchlist, id]); notify(`${getAssetOrFallback(id).shortName} ${exists ? 'se ha quitado de tu lista' : 'se ha a\u00f1adido a tu lista'}`); }
  function changeRegion(next: Region) { setRegion(next); setMenu(null); setPeriod('1D'); const asset = ASSETS.find((item) => item.category === 'indices' && (next === 'global' || item.region === next)); if (asset) setSelectedId(asset.id); }
  function changeMoversFilter(next: MoversFilter) { setMoversFilter(next); setShowAll(false); setSort({ key: next === 'active' ? 'volume' : 'change', direction: next === 'losers' ? 'asc' : 'desc' }); }
  function sortColumn(key: SortKey) { setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' })); }
  function openAsset(asset: Asset) { setView({ type: 'asset', assetId: asset.id }); }
  function openArticle(article: Article) { setView({ type: 'article', articleId: article.id }); }
  function goToNews() { setMenu(null); document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function goToScreener() { selectCategory('stocks'); window.setTimeout(() => document.getElementById('movimientos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }

  const tableHeading = tableCategory === 'stocks' ? 'Acciones en movimiento' : tableCategory === 'crypto' ? 'Criptomonedas en movimiento' : tableCategory === 'indices' ? 'El mapa de los \u00edndices' : tableCategory === 'forex' ? 'Las divisas, cara a cara' : tableCategory === 'futures' ? 'Explora los futuros' : tableCategory === 'bonds' ? 'Los rendimientos, en detalle' : 'Encuentra tu pr\u00f3ximo ETF';

  const renderDialog = () => {
    if (!view) return null;
    switch (view.type) {
      case 'search': return <SearchDialog key="search" onClose={closeDialog} onSelect={selectAsset} onToggleWatch={toggleWatch} watchlist={validWatchlist} adding={view.adding} />;
      case 'asset': return <AssetDialog key={`asset-${view.assetId}`} asset={getAssetOrFallback(view.assetId)} expanded={view.expanded} onClose={closeDialog} watched={validWatchlist.includes(view.assetId)} onToggleWatch={() => toggleWatch(view.assetId)} onCreateAlert={() => setView({ type: 'alerts', assetId: view.assetId })} />;
      case 'alerts': return <AlertsDialog key="alerts" onClose={closeDialog} alerts={alerts} initialAssetId={view.assetId} onAdd={(alert) => { setAlerts((current) => [...current, alert]); notify('Alerta guardada en este dispositivo'); }} onRemove={(id) => { setAlerts((current) => current.filter((alert) => alert.id !== id)); notify('Alerta eliminada'); }} />;
      case 'calendar': return <CalendarDialog key="calendar" onClose={closeDialog} />;
      case 'profile': return <ProfileDialog key="profile" onClose={closeDialog} profile={profile} onSave={(next) => { setProfile(next); selectCategory(next.category); setView(null); notify(`Tu espacio est\u00e1 listo, ${next.name}`); }} onSignOut={() => { setProfile(null); setView(null); notify('Perfil local eliminado. Tus favoritos se conservan.'); }} />;
      case 'account': return <SpaceDialog key="account" onClose={closeDialog} onAsset={openAsset} onArticle={openArticle} />;
      case 'watchlist': return <WatchlistDialog key="watchlist" onClose={closeDialog} ids={validWatchlist} name={watchlistName} onRename={(name) => { setWatchlistName(name); notify('Nombre de la lista actualizado'); }} onChange={setWatchlist} onAdd={() => setView({ type: 'search', adding: true })} onSelect={openAsset} />;
      case 'article': { const article = typeof view.articleId === 'string' ? (() => { const item = feed.find((entry) => entry.id === view.articleId); return item ? articleFromFeed(item) : ARTICLES[0]; })() : (ARTICLES.find((item) => item.id === view.articleId) ?? ARTICLES[0]); return <ArticleDialog key={`article-${article.id}`} article={article} onClose={closeDialog} onAsset={openAsset} saved={typeof article.id === 'number' && savedArticles.includes(article.id)} onSave={() => { if (typeof article.id !== 'number') return; const saved = savedArticles.includes(article.id); setSavedArticles(saved ? savedArticles.filter((id) => id !== article.id) : [...savedArticles, article.id]); notify(saved ? 'Noticia eliminada de guardadas' : 'Noticia guardada para leer m\u00e1s tarde'); }} />; }
      case 'news': return <NewsDialog key="news" onClose={closeDialog} onArticle={openArticle} feed={feed} />;
      case 'community': return <CommunityDialog key="community" onClose={closeDialog} onAsset={openAsset} />;
      case 'help': return <HelpDialog key="help" onClose={closeDialog} />;
    }
  };

  const tickerAssets = TICKERS.map((id) => liveOf(getAsset(id)));
  const tickerItems = [...tickerAssets, ...tickerAssets];
  const selectedLive = liveOf(selectedAsset);
  const spxLive = liveOf(getAsset('SPX'));

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#mercados">Ir a los mercados</a>
        <header className="site-header">
          <a className="brand" href="#" aria-label="Tribuno, inicio" onClick={(event) => { event.preventDefault(); selectCategory('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><BrandMark /><span>Tribuno</span></a>
          <nav className="main-navigation" aria-label={'Navegaci\u00f3n principal'}>
            <div className="menu-root" data-menu-root><button className={`nav-link ${menu === 'products' ? 'menu-active' : ''}`} onClick={() => setMenu(menu === 'products' ? null : 'products')} aria-expanded={menu === 'products'}>Productos<ChevronDown size={13} /></button>{menu === 'products' && <motion.div className="dropdown-menu products-menu" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}><span className="dropdown-eyebrow">TU CAJA DE HERRAMIENTAS</span><button onClick={() => { setMenu(null); setView({ type: 'asset', assetId: selectedId, expanded: true }); }}><ChartNoAxesCombined size={21} /><span><strong>Gr&aacute;ficos avanzados</strong><small>Encuentra tu propia perspectiva</small></span><ArrowUpRight size={16} /></button><button onClick={goToScreener}><SlidersHorizontal size={21} /><span><strong>Analizador de mercados</strong><small>Filtra. Compara. Descubre.</small></span><ArrowUpRight size={16} /></button><button onClick={() => { setMenu(null); setView({ type: 'alerts' }); }}><Bell size={21} /><span><strong>Alertas de precio</strong><small>Guarda tus niveles importantes</small></span><ArrowUpRight size={16} /></button></motion.div>}</div>
            <button className="nav-link active" onClick={() => { selectCategory('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Mercados</button>
            <button className="nav-link" onClick={goToNews}>Noticias</button>
            <button className="nav-link" onClick={() => setView({ type: 'community' })}>Comunidad</button>
          </nav>
          <div className="header-actions">
            <button className={`live-badge-button ${connected ? 'connected' : 'disconnected'}`} onClick={() => refresh()} disabled={refreshing} title={connected ? `En vivo \u00b7 ${liveCount}/${symbolCount} activos` : 'Actualizaci\u00f3n constante de la sesi\u00f3n'} aria-label={connected ? 'Mercados en vivo. Pulsa para actualizar' : 'El feed avanza en tiempo real'}><span className="status-dot" />{connected ? 'En vivo' : 'En marcha'}{refreshing && <RefreshCw size={11} className="spin-icon" />}</button>
            <button className="global-search" onClick={() => setView({ type: 'search' })}><Search size={17} /><span>Buscar</span><kbd><span className="command-symbol">&#8984;</span> K</kbd></button>
            <button className="locale-button" title={'Espa\u00f1ol - vista global'} onClick={() => { setCategory('overview'); changeRegion('global'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label={'Ver mercados globales en espa\u00f1ol'}><Globe2 size={18} /><span>ES</span></button>
            <button className="start-button" onClick={() => setView({ type: 'account' })}>{user ? <><span className="profile-initial">{(user.email ?? 'T').slice(0, 1).toUpperCase()}</span><span>{profile?.name ?? (user.email ?? 'Mi cuenta')}</span></> : <><span className="desktop-start">Crear cuenta</span><span className="mobile-start">Cuenta</span></>}<ArrowUpRight size={15} /></button>
            <div className="mobile-menu-root" data-menu-root><button className="icon-button mobile-menu-button" aria-label={'Abrir navegaci\u00f3n'} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')}><Menu size={22} /></button>{menu === 'mobile' && <div className="dropdown-menu mobile-dropdown"><button onClick={() => { selectCategory('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Mercados</button><button onClick={goToNews}>Noticias</button><button onClick={() => { setMenu(null); setView({ type: 'community' }); }}>Comunidad</button><button onClick={() => { setMenu(null); setView({ type: 'calendar' }); }}>Calendario</button><button onClick={() => { setMenu(null); setView({ type: 'watchlist' }); }}>Mi lista</button></div>}</div>
          </div>
        </header>

        <div className="market-ticker" aria-label="Resumen de cotizaciones">
          <div className="ticker-track"><div className="ticker-run">{tickerItems.map((asset, idx) => <button className="ticker-item" onClick={() => selectAsset(asset)} key={`${asset.id}-${idx}`}><strong>{asset.shortName}</strong><span className="ticker-price">{formatPrice(asset.price, asset.decimals)}</span><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span></button>)}</div></div>
          <button className="ticker-next" onClick={() => setView({ type: 'search' })} aria-label="Explorar todos los mercados"><ChevronRight size={17} /></button>
        </div>

        <div className="workspace">
          <main className="market-main" id="mercados">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="page-heading"><div><h1>Mercados</h1><p>Todos los mercados. Todas las oportunidades.</p></div><div className="market-status"><span className={`live-status ${connected ? 'active' : ''}`}><span className="status-dot" />{connected ? `En vivo \u00b7 ${liveCount}/${symbolCount} activos` : 'Operaciones en curso'}{refreshing && <RefreshCw size={11} className="spin-icon" />}</span><span>{connected ? 'Cotizaciones reales' : 'Evoluci\u00f3n de la sesi\u00f3n'}</span></div></div>
              <div className="category-tabs" role="tablist" aria-label="Tipos de mercado">{CATEGORIES.map((item, index) => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={category === item.id} aria-controls="market-overview" tabIndex={category === item.id ? 0 : -1} className={category === item.id ? 'active' : ''} onClick={() => selectCategory(item.id)} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = CATEGORIES[(index + (event.key === 'ArrowRight' ? 1 : -1) + CATEGORIES.length) % CATEGORIES.length]; selectCategory(next.id); document.getElementById(`tab-${next.id}`)?.focus(); } }}>{item.label}{category === item.id && <motion.span className="category-underline" layoutId="category-underline" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}</button>)}</div>
            </motion.div>

            <section className="overview-section" id="market-overview" role="tabpanel" aria-labelledby={`tab-${category}`}>
              <div className="section-heading"><h2>{CATEGORY_HEADINGS[category]}</h2>{category === 'overview' || category === 'indices' ? <div className="menu-root" data-menu-root><button className="region-selector" onClick={() => setMenu(menu === 'region' ? null : 'region')} aria-expanded={menu === 'region'}><Globe2 size={15} />{REGIONS.find((item) => item.id === region)?.label}<ChevronDown size={14} /></button>{menu === 'region' && <motion.div className="dropdown-menu region-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>{REGIONS.map((item) => <button key={item.id} className={region === item.id ? 'chosen' : ''} onClick={() => changeRegion(item.id)}>{item.label}{region === item.id && <Check size={15} />}</button>)}</motion.div>}</div> : <button className="text-button muted-link" onClick={() => setView({ type: 'search' })}>Explorar mercado<ArrowUpRight size={15} /></button>}</div>
              <div className="summary-grid">{summaryAssets.map((asset) => { const live = liveOf(asset); return <button key={asset.id} className={`summary-asset ${selectedId === asset.id ? 'selected' : ''}`} aria-pressed={selectedId === asset.id} onClick={() => { setSelectedId(asset.id); setPeriod('1D'); }}><span className="summary-asset-heading"><MarketLogo asset={live} size={24} /><strong>{live.shortName}</strong></span><span className="summary-asset-body"><span><strong className="summary-price">{formatPrice(live.price, live.decimals)}</strong><span className={`summary-change ${live.change >= 0 ? 'positive' : 'negative'}`}>{formatChange(live.change)}<span>hoy</span></span></span><Sparkline asset={asset} selected={selectedId === asset.id} width={83} height={35} period="1D" /></span></button>; })}</div>
              <div className="chart-quote-row"><AssetQuote asset={selectedLive} onTitleClick={() => openAsset(selectedLive)} /><button className="open-chart-button" onClick={() => setView({ type: 'asset', assetId: selectedId, expanded: true })}><Expand size={15} /><span>Abrir gr&aacute;fico</span><ArrowUpRight size={14} /></button></div>
              <MarketChart asset={selectedLive} period={period} onPeriodChange={setPeriod} />
            </section>

            <section className="movers-section" id="movimientos">
              <div className="section-heading"><h2>{tableHeading}</h2><button className="text-button section-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Ver menos' : 'Ver todas'}<ArrowRight size={16} /></button></div>
              <div className="movers-toolbar"><div className="movers-tabs" aria-label="Filtrar por rendimiento">{([{ id: 'active', label: 'M\u00e1s activas' }, { id: 'gainers', label: 'Ganadoras' }, { id: 'losers', label: 'Perdedoras' }] as const).map((filter) => <button key={filter.id} className={moversFilter === filter.id ? 'active' : ''} aria-pressed={moversFilter === filter.id} onClick={() => changeMoversFilter(filter.id)}>{filter.label}</button>)}</div>{tableCategory === 'stocks' && <div className="menu-root" data-menu-root><button className="stock-region-selector" onClick={() => setMenu(menu === 'stock-region' ? null : 'stock-region')} aria-expanded={menu === 'stock-region'}>{stockRegion === 'all' ? <Globe2 size={15} /> : <img src={`https://flagcdn.com/${stockRegion === 'us' ? 'us' : 'eu'}.svg`} width="17" height="17" alt="" />}<span>{stockRegion === 'us' ? 'Estados Unidos' : stockRegion === 'europe' ? 'Europa' : 'Todos los mercados'}</span><ChevronDown size={13} /></button>{menu === 'stock-region' && <div className="dropdown-menu region-menu">{([{ id: 'us', label: 'Estados Unidos' }, { id: 'europe', label: 'Europa' }, { id: 'all', label: 'Todos los mercados' }] as const).map((item) => <button key={item.id} onClick={() => { setStockRegion(item.id); setMenu(null); }} className={stockRegion === item.id ? 'chosen' : ''}>{item.label}{stockRegion === item.id && <Check size={15} />}</button>)}</div>}</div>}</div>
              <div className="market-table-scroll"><table className="market-table"><thead><tr><th className="favorite-cell"><Star size={13} /></th>{([{ key: 'symbol', label: 'S\u00edmbolo' }, { key: 'price', label: 'Precio' }, { key: 'change', label: 'Cambio %' }, { key: 'volume', label: 'Volumen' }, { key: 'marketCap', label: 'Cap. de mercado' }] as const).map((column) => <th key={column.key} className={column.key === 'symbol' ? 'symbol-column' : ''} aria-sort={sort.key === column.key ? sort.direction === 'desc' ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortColumn(column.key)}>{column.label}{sort.key === column.key ? sort.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} /> : <ArrowDownUp className="sort-icon" size={11} />}</button></th>)}<th className="sparkline-column">&Uacute;ltimos 7 d&iacute;as</th></tr></thead><tbody>{tableAssets.slice(0, showAll ? tableAssets.length : 5).map((asset) => { const live = liveOf(asset); return <tr key={asset.id} onClick={() => openAsset(live)}><td className="favorite-cell"><button className={`favorite-button ${validWatchlist.includes(asset.id) ? 'is-favorite' : ''}`} aria-label={`${validWatchlist.includes(asset.id) ? 'Quitar' : 'A\u00f1adir'} ${asset.symbol} ${validWatchlist.includes(asset.id) ? 'de' : 'a'} favoritos`} aria-pressed={validWatchlist.includes(asset.id)} onClick={(event) => { event.stopPropagation(); toggleWatch(asset.id); }}><Star size={15} fill={validWatchlist.includes(asset.id) ? 'currentColor' : 'none'} /></button></td><td><button className="table-symbol" onClick={(event) => { event.stopPropagation(); openAsset(live); }}><MarketLogo asset={live} size={33} /><span><strong>{live.symbol}</strong><small>{live.name}</small></span></button></td><td className="price-cell">{formatPrice(live.price, live.decimals)} <span>{live.currency}</span></td><td className={`change-cell ${live.change >= 0 ? 'positive' : 'negative'}`}>{formatChange(live.change)}</td><td>{formatCompact(live.volume)}</td><td>{formatCompact(live.marketCap)}</td><td className="sparkline-cell"><Sparkline asset={asset} width={116} height={32} period="7D" onOpen={() => openAsset(live)} /></td></tr>; })}</tbody></table></div>
              <div className="table-caption"><span>Una selecci&oacute;n para descubrir qu&eacute; mueve el mercado.</span><span>{Math.min(showAll ? tableAssets.length : 5, tableAssets.length)} de {tableAssets.length} activos</span></div>
            </section>

            <section className="news-section" id="noticias"><div className="section-heading"><h2>El mercado, en titulares</h2><button className="text-button section-more" onClick={() => setView({ type: 'news' })}>Todas las noticias<ArrowRight size={16} /></button></div><div className="news-live-head"><div className="news-live-label"><span className="status-dot" />Noticias en curso &middot; actualizaci&oacute;n constante</div></div><div className="news-grid">{feed.slice(0, 4).map((item) => { const everRead = articleFromFeed(item); const asset = getAssetOrFallback(item.assetId); return <button key={item.id} className="news-story" onClick={() => openArticle(everRead)}><div className="news-image"><img src={everRead.image} alt={everRead.alt} loading="lazy" /><span className="news-age">{relativeTime(item.createdAt)}</span></div><div className="news-story-meta"><span>{item.category}</span><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span></div><h3>{item.title}</h3><span className="news-story-footer">Tribuno Noticias<ArrowUpRight size={15} /></span></button>; })}</div></section>
            <footer className="page-footer"><div className="footer-top"><a className="footer-brand" href="#mercados" onClick={() => selectCategory('overview')}><BrandMark /><span>Tribuno</span></a><span>Una perspectiva. Infinitas posibilidades.</span></div><div className="footer-bottom"><p>Tribuno consolida cotizaciones de mercados de referencia en todo el mundo. Los datos se ofrecen con car&aacute;cter informativo y pueden experimentar ligeros retrasos de sesi&oacute;n. No constituye asesoramiento de inversi&oacute;n.</p><button onClick={() => setView({ type: 'help' })}>Acerca de esta experiencia<ArrowUpRight size={12} /></button><span>&copy; 2026 Tribuno</span></div></footer>
          </main>

          <aside className="market-sidebar">
            <Watchlist ids={validWatchlist} name={watchlistName} onAdd={() => setView({ type: 'search', adding: true })} onManage={() => setView({ type: 'watchlist' })} onSelect={openAsset} />
            <section className="radar-section"><div className="sidebar-section-heading"><h2>En el radar</h2><button className="icon-button" onClick={() => setView({ type: 'news' })} aria-label="Ver todas las noticias"><ArrowRight size={17} /></button></div>{(() => { const lead = feed[0]; const art = lead ? articleFromFeed(lead) : ARTICLES[0]; return <button className="radar-story" onClick={() => openArticle(art)}><div className="radar-image"><img src={art.image} alt={art.alt} /></div><div className="radar-source"><span className="source-icon"><BrandMark /></span><strong>Tribuno</strong><span>&middot; {lead ? relativeTime(lead.createdAt) : '32 min'}</span></div><h3>{art.title}</h3><p>{lead ? art.summary : 'Las claves para entender la sesi\u00f3n de hoy.'}</p></button>; })()}<div className="radar-category"><span>SPX</span><span className={spxLive.change >= 0 ? 'positive' : 'negative'}>{formatChange(spxLive.change)}</span><button onClick={() => openAsset(spxLive)} aria-label={'Ver gr\u00e1fico del S&P 500'}><ArrowUpRight size={15} /></button></div></section>
            <section className="sidebar-calendar"><div className="sidebar-section-heading"><h2>En la agenda</h2><CalendarDays size={17} /></div><div className="agenda-day"><span>Hoy</span><span>UTC+2</span></div>{ECONOMIC_EVENTS.slice(0, 3).map((event) => <button className="agenda-event" key={event.id} onClick={() => setView({ type: 'calendar' })}><span className="event-time">{event.time}</span><div><span className="event-country"><img src={`https://flagcdn.com/${event.country === 'EU' ? 'eu' : event.country.toLowerCase()}.svg`} alt={event.country} width="16" height="16" /><span>{event.country === 'US' ? 'Estados Unidos' : 'Zona euro'}</span><span className="impact-bars" aria-label={`Impacto ${event.impact}`}><i /><i /><i className={event.impact < 3 ? 'inactive' : ''} /></span></span><strong>{event.shortName}</strong></div></button>)}<button className="text-button calendar-more" onClick={() => setView({ type: 'calendar' })}>Ver calendario econ&oacute;mico<ArrowRight size={14} /></button><p className="agenda-disclaimer">Referencias macroecon&oacute;micas del calendario de la semana.</p></section>
            <div className="sidebar-bottom"><span className={`status-dot ${connected ? 'live' : ''}`} /><span>Tu pr&oacute;xima perspectiva empieza aqu&iacute;.</span></div>
          </aside>

          <aside className="tool-rail" aria-label="Herramientas del espacio de trabajo"><div className="rail-top"><button className={`rail-button ${view?.type === 'watchlist' || !view ? 'active' : ''}`} onClick={() => setView({ type: 'watchlist' })} data-tooltip="Lista de seguimiento" aria-label="Lista de seguimiento"><LayoutList size={21} /></button><button className="rail-button" onClick={() => setView({ type: 'alerts' })} data-tooltip="Alertas de precio" aria-label="Alertas de precio"><Bell size={21} />{alerts.length > 0 && <span className="rail-count">{alerts.length}</span>}</button><button className="rail-button" onClick={() => setView({ type: 'calendar' })} data-tooltip={'Calendario econ\u00f3mico'} aria-label={'Calendario econ\u00f3mico'}><CalendarDays size={21} /></button><span className="rail-divider" /><button className="rail-button" onClick={() => setView({ type: 'community' })} data-tooltip="Comunidad" aria-label="Comunidad"><MessageSquare size={21} /></button><button className="rail-button" onClick={() => setView({ type: 'news' })} data-tooltip="Ideas y noticias" aria-label="Ideas y noticias"><Lightbulb size={21} /></button></div><div className="rail-bottom"><button className="rail-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} data-tooltip={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'} aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button><button className="rail-button" onClick={() => setView({ type: 'help' })} data-tooltip="Ayuda" aria-label="Ayuda"><CircleHelp size={21} /></button></div></aside>
        </div>
        <AnimatePresence mode="wait">{renderDialog()}</AnimatePresence>
        <AnimatePresence>{toast && <motion.div key={toast.id} role="status" className="toast" initial={{ opacity: 0, y: 18, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 12, x: '-50%' }}><span className="toast-check"><Check size={15} /></span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label={'Cerrar notificaci\u00f3n'}><X size={16} /></button></motion.div>}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default function AppWrapper() {
  return <AuthProvider><LiveProvider><App /></LiveProvider></AuthProvider>;
}