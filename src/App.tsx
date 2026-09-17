import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUp, ArrowUpRight, Bell, CalendarDays, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, CircleHelp, Ellipsis, Expand, Globe2, LayoutList, Lightbulb, Menu, MessageSquare, Moon, Plus, Search, SlidersHorizontal, Star, Sun, X, RefreshCw } from 'lucide-react';
import { ARTICLES, ASSETS, CATEGORIES, ECONOMIC_EVENTS, REGIONS, type Article, type Asset, type Category, type Region, formatChange, formatCompact, formatPrice, getAsset, relativeTime } from './data/markets';
import MarketLogo, { BrandMark } from './components/MarketLogo';
import MarketChart, { Sparkline, type Period } from './components/MarketChart';
import AssetQuote from './components/AssetQuote';
import { AlertsDialog, ArticleDialog, AssetDialog, CalendarDialog, CommunityDialog, HelpDialog, NewsDialog, ProfileDialog, SearchDialog, WatchlistDialog, articleFromFeed, type PriceAlert, type Profile } from './components/MarketDialogs';
import { SpaceDialog } from './components/AccountDialogs';
import useStoredState from './utils/useStoredState';
import { LiveProvider, useLive } from './data/live';
import { AuthProvider, useAuth } from './data/auth';
import { getAssetOrFallback, useCustom } from './data/custom';
import { I18nProvider, useI18n } from './i18n';

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
  const { t } = useI18n();
  return (
    <section className="watchlist-section" aria-label={t('sidebar.watchlist')}>
      <div className="sidebar-section-heading"><h2>{t('sidebar.watchlist')}</h2><div><button className="icon-button" onClick={onAdd} aria-label={t('watchlist.add')} title={t('watchlist.add')}><Plus size={19} /></button><button className="icon-button" onClick={onManage} aria-label={t('watchlist.manage')} title={t('watchlist.manage')}><Ellipsis size={19} /></button></div></div>
      <div className="watchlist-label"><button onClick={onManage}>{name}<ChevronDown size={14} /></button><span>{t('sidebar.symbols', { n: ids.length })}</span></div>
      <div className="watchlist-columns"><span>{t('watchlist.symbol')}</span><span>{t('watchlist.last')}</span><span>{t('watchlist.change')}</span></div>
      <div className="watchlist-rows">{ids.length ? ids.map((id) => { const asset = liveOf(getAssetOrFallback(id)); return <button className="watch-row" key={id} onClick={() => onSelect(asset)}><span className="watch-symbol"><MarketLogo asset={asset} size={26} /><span><strong>{asset.symbol}</strong><small>{asset.shortName}</small></span></span><span className="watch-price">{formatPrice(asset.price, asset.decimals)}</span><span className={`watch-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>{formatChange(asset.change)}</span></button>; }) : <div className="watch-empty"><Star size={23} /><p>{t('watchlist.empty')}</p></div>}</div>
      <button className="add-symbol-button" onClick={onAdd}><Plus size={16} />{t('watchlist.add')}</button>
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
  const { t, lang, toggleLang, catLabel, regionLabel, headingFor } = useI18n();

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
  function toggleWatch(id: string) { const exists = validWatchlist.includes(id); setWatchlist(exists ? validWatchlist.filter((item) => item !== id) : [...validWatchlist, id]); notify(t(exists ? 'notify.watchRemoved' : 'notify.watchAdded', { name: getAssetOrFallback(id).shortName })); }
  function changeRegion(next: Region) { setRegion(next); setMenu(null); setPeriod('1D'); const asset = ASSETS.find((item) => item.category === 'indices' && (next === 'global' || item.region === next)); if (asset) setSelectedId(asset.id); }
  function changeMoversFilter(next: MoversFilter) { setMoversFilter(next); setShowAll(false); setSort({ key: next === 'active' ? 'volume' : 'change', direction: next === 'losers' ? 'asc' : 'desc' }); }
  function sortColumn(key: SortKey) { setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' })); }
  function openAsset(asset: Asset) { setView({ type: 'asset', assetId: asset.id }); }
  function openArticle(article: Article) { setView({ type: 'article', articleId: article.id }); }
  function goToNews() { setMenu(null); document.getElementById('noticias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function goToScreener() { selectCategory('stocks'); window.setTimeout(() => document.getElementById('movimientos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }

  const headingSuffix: Record<string, string> = { stocks: 'Stocks', crypto: 'Crypto', indices: 'Indices', forex: 'Forex', futures: 'Futures', bonds: 'Bonds', etfs: 'Etfs' };
  const tableHeading = t(`heading.movers${headingSuffix[tableCategory] ?? 'Stocks'}`);

  const renderDialog = () => {
    if (!view) return null;
    switch (view.type) {
      case 'search': return <SearchDialog key="search" onClose={closeDialog} onSelect={selectAsset} onToggleWatch={toggleWatch} watchlist={validWatchlist} adding={view.adding} />;
      case 'asset': return <AssetDialog key={`asset-${view.assetId}`} asset={getAssetOrFallback(view.assetId)} expanded={view.expanded} onClose={closeDialog} watched={validWatchlist.includes(view.assetId)} onToggleWatch={() => toggleWatch(view.assetId)} onCreateAlert={() => setView({ type: 'alerts', assetId: view.assetId })} />;
      case 'alerts': return <AlertsDialog key="alerts" onClose={closeDialog} alerts={alerts} initialAssetId={view.assetId} onAdd={(alert) => { setAlerts((current) => [...current, alert]); notify(t('notify.alertSaved')); }} onRemove={(id) => { setAlerts((current) => current.filter((alert) => alert.id !== id)); notify(t('notify.alertRemoved')); }} />;
      case 'calendar': return <CalendarDialog key="calendar" onClose={closeDialog} />;
      case 'profile': return <ProfileDialog key="profile" onClose={closeDialog} profile={profile} onSave={(next) => { setProfile(next); selectCategory(next.category); setView(null); notify(t('notify.profileReady', { name: next.name })); }} onSignOut={() => { setProfile(null); setView(null); notify(t('notify.profileRemoved')); }} />;
      case 'account': return <SpaceDialog key="account" onClose={closeDialog} onAsset={openAsset} onArticle={openArticle} />;
      case 'watchlist': return <WatchlistDialog key="watchlist" onClose={closeDialog} ids={validWatchlist} name={watchlistName} onRename={(name) => { setWatchlistName(name); notify(t('notify.listRenamed')); }} onChange={setWatchlist} onAdd={() => setView({ type: 'search', adding: true })} onSelect={openAsset} />;
      case 'article': { const article = typeof view.articleId === 'string' ? (() => { const item = feed.find((entry) => entry.id === view.articleId); return item ? articleFromFeed(item, lang) : ARTICLES[0]; })() : (ARTICLES.find((item) => item.id === view.articleId) ?? ARTICLES[0]); return <ArticleDialog key={`article-${article.id}`} article={article} onClose={closeDialog} onAsset={openAsset} saved={typeof article.id === 'number' && savedArticles.includes(article.id)} onSave={() => { if (typeof article.id !== 'number') return; const saved = savedArticles.includes(article.id); setSavedArticles(saved ? savedArticles.filter((id) => id !== article.id) : [...savedArticles, article.id]); notify(t(saved ? 'notify.articleRemoved' : 'notify.articleSaved')); }} />; }
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
        <a className="skip-link" href="#mercados">{t('skip.markets')}</a>
        <header className="site-header">
          <a className="brand" href="#" aria-label="Tribuno, inicio" onClick={(event) => { event.preventDefault(); selectCategory('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><BrandMark /><span>Tribuno</span></a>
          <nav className="main-navigation" aria-label={t('nav.aria')}>
            <div className="menu-root" data-menu-root><button className={`nav-link ${menu === 'products' ? 'menu-active' : ''}`} onClick={() => setMenu(menu === 'products' ? null : 'products')} aria-expanded={menu === 'products'}>{t('nav.products')}<ChevronDown size={13} /></button>{menu === 'products' && <motion.div className="dropdown-menu products-menu" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}><span className="dropdown-eyebrow">{t('nav.toolsEyebrow')}</span><button onClick={() => { setMenu(null); setView({ type: 'asset', assetId: selectedId, expanded: true }); }}><ChartNoAxesCombined size={21} /><span><strong>{t('tool.charts')}</strong><small>{t('tool.chartsDesc')}</small></span><ArrowUpRight size={16} /></button><button onClick={goToScreener}><SlidersHorizontal size={21} /><span><strong>{t('tool.screener')}</strong><small>{t('tool.screenerDesc')}</small></span><ArrowUpRight size={16} /></button><button onClick={() => { setMenu(null); setView({ type: 'alerts' }); }}><Bell size={21} /><span><strong>{t('tool.alerts')}</strong><small>{t('tool.alertsDesc')}</small></span><ArrowUpRight size={16} /></button></motion.div>}</div>
            <button className="nav-link active" onClick={() => { selectCategory('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('nav.markets')}</button>
            <button className="nav-link" onClick={goToNews}>{t('nav.news')}</button>
            <button className="nav-link" onClick={() => setView({ type: 'community' })}>{t('nav.community')}</button>
          </nav>
          <div className="header-actions">
            <button className={`live-badge-button ${connected ? 'connected' : 'disconnected'}`} onClick={() => refresh()} disabled={refreshing} title={connected ? t('live.connected', { n: liveCount, m: symbolCount }) : t('live.constant')} aria-label={connected ? t('live.ariaLive') : t('live.ariaOn')}><span className="status-dot" />{connected ? t('live.badgeLive') : t('live.badgeOn')}{refreshing && <RefreshCw size={11} className="spin-icon" />}</button>
            <button className="global-search" onClick={() => setView({ type: 'search' })}><Search size={17} /><span>{t('search.button')}</span><kbd><span className="command-symbol">&#8984;</span> K</kbd></button>
            <button className="locale-button" title={t('locale.aria')} onClick={() => toggleLang()} aria-label={t('locale.aria')}><Globe2 size={18} /><span>{lang.toUpperCase()}</span></button>
            <button className="start-button" onClick={() => setView({ type: 'account' })}>{user ? <><span className="profile-initial">{(user.email ?? 'T').slice(0, 1).toUpperCase()}</span><span>{profile?.name ?? (user.email ?? t('account.myAccount'))}</span></> : <><span className="desktop-start">{t('account.create')}</span><span className="mobile-start">{t('account.mobile')}</span></>}<ArrowUpRight size={15} /></button>
            <div className="mobile-menu-root" data-menu-root><button className="icon-button mobile-menu-button" aria-label={t('aria.menu')} onClick={() => setMenu(menu === 'mobile' ? null : 'mobile')}><Menu size={22} /></button>{menu === 'mobile' && <div className="dropdown-menu mobile-dropdown"><button onClick={() => { selectCategory('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('nav.markets')}</button><button onClick={goToNews}>{t('nav.news')}</button><button onClick={() => { setMenu(null); setView({ type: 'community' }); }}>{t('nav.community')}</button><button onClick={() => { setMenu(null); setView({ type: 'calendar' }); }}>{t('nav.calendar')}</button><button onClick={() => { setMenu(null); setView({ type: 'watchlist' }); }}>{t('nav.myList')}</button></div>}</div>
          </div>
        </header>

        <div className="market-ticker" aria-label={t('ticker.aria')}>
          <div className="ticker-track"><div className="ticker-run">{tickerItems.map((asset, idx) => <button className="ticker-item" onClick={() => selectAsset(asset)} key={`${asset.id}-${idx}`}><strong>{asset.shortName}</strong><span className="ticker-price">{formatPrice(asset.price, asset.decimals)}</span><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span></button>)}</div></div>
          <button className="ticker-next" onClick={() => setView({ type: 'search' })} aria-label={t('ticker.explore')}><ChevronRight size={17} /></button>
        </div>

        <div className="workspace">
          <main className="market-main" id="mercados">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="page-heading"><div><h1>{t('page.markets')}</h1><p>{t('page.tagline')}</p></div><div className="market-status"><span className={`live-status ${connected ? 'active' : ''}`}><span className="status-dot" />{connected ? t('live.connected', { n: liveCount, m: symbolCount }) : t('status.session')}{refreshing && <RefreshCw size={11} className="spin-icon" />}</span><span>{connected ? t('status.real') : t('status.evolution')}</span></div></div>
              <div className="category-tabs" role="tablist" aria-label={t('tabs.aria')}>{CATEGORIES.map((item, index) => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={category === item.id} aria-controls="market-overview" tabIndex={category === item.id ? 0 : -1} className={category === item.id ? 'active' : ''} onClick={() => selectCategory(item.id)} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const next = CATEGORIES[(index + (event.key === 'ArrowRight' ? 1 : -1) + CATEGORIES.length) % CATEGORIES.length]; selectCategory(next.id); document.getElementById(`tab-${next.id}`)?.focus(); } }}>{catLabel(item.id)}{category === item.id && <motion.span className="category-underline" layoutId="category-underline" transition={{ type: 'spring', stiffness: 450, damping: 35 }} />}</button>)}</div>
            </motion.div>

            <section className="overview-section" id="market-overview" role="tabpanel" aria-labelledby={`tab-${category}`}>
              <div className="section-heading"><h2>{headingFor(category)}</h2>{category === 'overview' || category === 'indices' ? <div className="menu-root" data-menu-root><button className="region-selector" onClick={() => setMenu(menu === 'region' ? null : 'region')} aria-expanded={menu === 'region'}><Globe2 size={15} />{regionLabel(region)}<ChevronDown size={14} /></button>{menu === 'region' && <motion.div className="dropdown-menu region-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>{REGIONS.map((item) => <button key={item.id} className={region === item.id ? 'chosen' : ''} onClick={() => changeRegion(item.id)}>{regionLabel(item.id)}{region === item.id && <Check size={15} />}</button>)}</motion.div>}</div> : <button className="text-button muted-link" onClick={() => setView({ type: 'search' })}>{t('section.explore')}<ArrowUpRight size={15} /></button>}</div>
              <div className="summary-grid">{summaryAssets.map((asset) => { const live = liveOf(asset); return <button key={asset.id} className={`summary-asset ${selectedId === asset.id ? 'selected' : ''}`} aria-pressed={selectedId === asset.id} onClick={() => { setSelectedId(asset.id); setPeriod('1D'); }}><span className="summary-asset-heading"><MarketLogo asset={live} size={24} /><strong>{live.shortName}</strong></span><span className="summary-asset-body"><span><strong className="summary-price">{formatPrice(live.price, live.decimals)}</strong><span className={`summary-change ${live.change >= 0 ? 'positive' : 'negative'}`}>{formatChange(live.change)}<span>{t('label.today')}</span></span></span><Sparkline asset={asset} selected={selectedId === asset.id} width={83} height={35} period="1D" /></span></button>; })}</div>
              <div className="chart-quote-row"><AssetQuote asset={selectedLive} onTitleClick={() => openAsset(selectedLive)} /><button className="open-chart-button" onClick={() => setView({ type: 'asset', assetId: selectedId, expanded: true })}><Expand size={15} /><span>{t('chart.open')}</span><ArrowUpRight size={14} /></button></div>
              <MarketChart asset={selectedLive} period={period} onPeriodChange={setPeriod} />
            </section>

            <section className="movers-section" id="movimientos">
              <div className="section-heading"><h2>{tableHeading}</h2><button className="text-button section-more" onClick={() => setShowAll(!showAll)}>{showAll ? t('movers.showLess') : t('movers.showAll')}<ArrowRight size={16} /></button></div>
              <div className="movers-toolbar"><div className="movers-tabs" aria-label={t('movers.aria')}>{([{ id: 'active', label: t('movers.active') }, { id: 'gainers', label: t('movers.gainers') }, { id: 'losers', label: t('movers.losers') }] as const).map((filter) => <button key={filter.id} className={moversFilter === filter.id ? 'active' : ''} aria-pressed={moversFilter === filter.id} onClick={() => changeMoversFilter(filter.id)}>{filter.label}</button>)}</div>{tableCategory === 'stocks' && <div className="menu-root" data-menu-root><button className="stock-region-selector" onClick={() => setMenu(menu === 'stock-region' ? null : 'stock-region')} aria-expanded={menu === 'stock-region'}>{stockRegion === 'all' ? <Globe2 size={15} /> : <img src={`https://flagcdn.com/${stockRegion === 'us' ? 'us' : 'eu'}.svg`} width="17" height="17" alt="" />}<span>{t(`region.${stockRegion}`)}</span><ChevronDown size={13} /></button>{menu === 'stock-region' && <div className="dropdown-menu region-menu">{([{ id: 'us', label: t('region.us') }, { id: 'europe', label: t('region.europe') }, { id: 'all', label: t('region.all') }] as const).map((item) => <button key={item.id} onClick={() => { setStockRegion(item.id); setMenu(null); }} className={stockRegion === item.id ? 'chosen' : ''}>{item.label}{stockRegion === item.id && <Check size={15} />}</button>)}</div>}</div>}</div>
              <div className="market-table-scroll"><table className="market-table"><thead><tr><th className="favorite-cell"><Star size={13} /></th>{([{ key: 'symbol', label: t('table.symbol') }, { key: 'price', label: t('table.price') }, { key: 'change', label: t('table.change') }, { key: 'volume', label: t('table.volume') }, { key: 'marketCap', label: t('table.marketCap') }] as const).map((column) => <th key={column.key} className={column.key === 'symbol' ? 'symbol-column' : ''} aria-sort={sort.key === column.key ? sort.direction === 'desc' ? 'descending' : 'ascending' : 'none'}><button onClick={() => sortColumn(column.key)}>{column.label}{sort.key === column.key ? sort.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} /> : <ArrowDownUp className="sort-icon" size={11} />}</button></th>)}<th className="sparkline-column">{t('table.last7')}</th></tr></thead><tbody>{tableAssets.slice(0, showAll ? tableAssets.length : 5).map((asset) => { const live = liveOf(asset); return <tr key={asset.id} onClick={() => openAsset(live)}><td className="favorite-cell"><button className={`favorite-button ${validWatchlist.includes(asset.id) ? 'is-favorite' : ''}`} aria-label={t(validWatchlist.includes(asset.id) ? 'aria.favRemove' : 'aria.favAdd', { symbol: asset.symbol })} aria-pressed={validWatchlist.includes(asset.id)} onClick={(event) => { event.stopPropagation(); toggleWatch(asset.id); }}><Star size={15} fill={validWatchlist.includes(asset.id) ? 'currentColor' : 'none'} /></button></td><td><button className="table-symbol" onClick={(event) => { event.stopPropagation(); openAsset(live); }}><MarketLogo asset={live} size={33} /><span><strong>{live.symbol}</strong><small>{live.name}</small></span></button></td><td className="price-cell">{formatPrice(live.price, live.decimals)} <span>{live.currency}</span></td><td className={`change-cell ${live.change >= 0 ? 'positive' : 'negative'}`}>{formatChange(live.change)}</td><td>{formatCompact(live.volume)}</td><td>{formatCompact(live.marketCap)}</td><td className="sparkline-cell"><Sparkline asset={asset} width={116} height={32} period="7D" onOpen={() => openAsset(live)} /></td></tr>; })}</tbody></table></div>
              <div className="table-caption"><span>{t('table.caption')}</span><span>{t('table.count', { n: Math.min(showAll ? tableAssets.length : 5, tableAssets.length), m: tableAssets.length })}</span></div>
            </section>

            <section className="news-section" id="noticias"><div className="section-heading"><h2>{t('news.heading')}</h2><button className="text-button section-more" onClick={() => setView({ type: 'news' })}>{t('news.all')}<ArrowRight size={16} /></button></div><div className="news-live-head"><div className="news-live-label"><span className="status-dot" />{t('news.liveLabel')}</div></div><div className="news-grid">{feed.slice(0, 4).map((item) => { const everRead = articleFromFeed(item, lang); const asset = getAssetOrFallback(item.assetId); return <button key={item.id} className="news-story" onClick={() => openArticle(everRead)}><div className="news-image"><img src={everRead.image} alt={everRead.alt} loading="lazy" /><span className="news-age">{relativeTime(item.createdAt)}</span></div><div className="news-story-meta"><span>{item.category}</span><span className={asset.change >= 0 ? 'positive' : 'negative'}>{formatChange(asset.change)}</span></div><h3>{item.title}</h3><span className="news-story-footer">{t('news.source')}<ArrowUpRight size={15} /></span></button>; })}</div></section>
            <footer className="page-footer"><div className="footer-top"><a className="footer-brand" href="#mercados" onClick={() => selectCategory('overview')}><BrandMark /><span>Tribuno</span></a><span>{t('footer.tagline')}</span></div><div className="footer-bottom"><p>{t('footer.disclaimer')}</p><button onClick={() => setView({ type: 'help' })}>{t('footer.about')}<ArrowUpRight size={12} /></button><span>&copy; 2026 Tribuno</span></div></footer>
          </main>

          <aside className="market-sidebar">
            <Watchlist ids={validWatchlist} name={watchlistName} onAdd={() => setView({ type: 'search', adding: true })} onManage={() => setView({ type: 'watchlist' })} onSelect={openAsset} />
            <section className="radar-section"><div className="sidebar-section-heading"><h2>{t('radar.title')}</h2><button className="icon-button" onClick={() => setView({ type: 'news' })} aria-label={t('radar.viewAll')}><ArrowRight size={17} /></button></div>{(() => { const lead = feed[0]; const art = lead ? articleFromFeed(lead, lang) : ARTICLES[0]; return <button className="radar-story" onClick={() => openArticle(art)}><div className="radar-image"><img src={art.image} alt={art.alt} /></div><div className="radar-source"><span className="source-icon"><BrandMark /></span><strong>Tribuno</strong><span>&middot; {lead ? relativeTime(lead.createdAt) : '32 min'}</span></div><h3>{art.title}</h3><p>{lead ? art.summary : t('radar.fallback')}</p></button>; })()}<div className="radar-category"><span>SPX</span><span className={spxLive.change >= 0 ? 'positive' : 'negative'}>{formatChange(spxLive.change)}</span><button onClick={() => openAsset(spxLive)} aria-label={t('radar.spxAria')}><ArrowUpRight size={15} /></button></div></section>
            <section className="sidebar-calendar"><div className="sidebar-section-heading"><h2>{t('agenda.title')}</h2><CalendarDays size={17} /></div><div className="agenda-day"><span>{t('agenda.today')}</span><span>UTC+2</span></div>{ECONOMIC_EVENTS.slice(0, 3).map((event) => <button className="agenda-event" key={event.id} onClick={() => setView({ type: 'calendar' })}><span className="event-time">{event.time}</span><div><span className="event-country"><img src={`https://flagcdn.com/${event.country === 'EU' ? 'eu' : event.country.toLowerCase()}.svg`} alt={event.country} width="16" height="16" /><span>{event.country === 'US' ? t('agenda.us') : t('agenda.euro')}</span><span className="impact-bars" aria-label={`${t('calendar.impact')} ${event.impact}`}><i /><i /><i className={event.impact < 3 ? 'inactive' : ''} /></span></span><strong>{event.shortName}</strong></div></button>)}<button className="text-button calendar-more" onClick={() => setView({ type: 'calendar' })}>{t('agenda.more')}<ArrowRight size={14} /></button><p className="agenda-disclaimer">{t('agenda.disclaimer')}</p></section>
            <div className="sidebar-bottom"><span className={`status-dot ${connected ? 'live' : ''}`} /><span>{t('sidebar.bottom')}</span></div>
          </aside>

          <aside className="tool-rail" aria-label={t('rail.aria')}><div className="rail-top"><button className={`rail-button ${view?.type === 'watchlist' || !view ? 'active' : ''}`} onClick={() => setView({ type: 'watchlist' })} data-tooltip={t('rail.watchlist')} aria-label={t('rail.watchlist')}><LayoutList size={21} /></button><button className="rail-button" onClick={() => setView({ type: 'alerts' })} data-tooltip={t('rail.alerts')} aria-label={t('rail.alerts')}><Bell size={21} />{alerts.length > 0 && <span className="rail-count">{alerts.length}</span>}</button><button className="rail-button" onClick={() => setView({ type: 'calendar' })} data-tooltip={t('rail.calendar')} aria-label={t('rail.calendar')}><CalendarDays size={21} /></button><span className="rail-divider" /><button className="rail-button" onClick={() => setView({ type: 'community' })} data-tooltip={t('rail.community')} aria-label={t('rail.community')}><MessageSquare size={21} /></button><button className="rail-button" onClick={() => setView({ type: 'news' })} data-tooltip={t('rail.ideas')} aria-label={t('rail.ideas')}><Lightbulb size={21} /></button></div><div className="rail-bottom"><button className="rail-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} data-tooltip={theme === 'light' ? t('rail.dark') : t('rail.light')} aria-label={theme === 'light' ? t('rail.dark') : t('rail.light')}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button><button className="rail-button" onClick={() => setView({ type: 'help' })} data-tooltip={t('rail.help')} aria-label={t('rail.help')}><CircleHelp size={21} /></button></div></aside>
        </div>
        <AnimatePresence mode="wait">{renderDialog()}</AnimatePresence>
        <AnimatePresence>{toast && <motion.div key={toast.id} role="status" className="toast" initial={{ opacity: 0, y: 18, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 12, x: '-50%' }}><span className="toast-check"><Check size={15} /></span><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label={t('aria.close')}><X size={16} /></button></motion.div>}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default function AppWrapper() {
  return <I18nProvider><AuthProvider><LiveProvider><App /></LiveProvider></AuthProvider></I18nProvider>;
}