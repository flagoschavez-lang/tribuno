import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ASSETS, type Asset, type AssetCategory, formatChange } from './markets';
import { getAnyAsset } from './custom';

export interface LiveQuote {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  currency: string;
  exchange?: string;
  updatedAt: number;
  ok: boolean;
}

export interface FeedItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  assetId: string;
  createdAt: number;
}

interface TickState {
  price: number;
  prevClose: number;
  changePct: number;
  volume: number;
  currency: string;
  exchange?: string;
  real: boolean;
}

const POLL_WINDOW_MS = 40000;
const BATCH_SIZE = 11;
const TOTAL_INTERVAL_MS = 9000;
const TICK_MS = 1200;
const TRAIL_LENGTH = 240;
const FEED_INTERVAL_MS = 11000;
const FEED_MAX = 14;

const subscriptions = new Set<string>();
const baseByQuote = new Map<string, Asset>();
const quotes = new Map<string, LiveQuote>();
const states = new Map<string, TickState>();
const trails = new Map<string, number[]>();
let lastOkAt = 0;
let anyFetched = false;
const listeners = new Set<() => void>();

const VOL: Partial<Record<AssetCategory, number>> = { crypto: 0.0011, futures: 0.0005, forex: 0.00011, bonds: 0.00015, indices: 0.00022, stocks: 0.00036, etfs: 0.00027 };

function volatilityFor(category: AssetCategory, changePct: number): number {
  return (VOL[category] ?? 0.0003) * (1 + Math.abs(changePct) / 14);
}

function noise(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5);
}

let feed: FeedItem[] = [];
let feedGeneratedAt = 0;

const FEATURED = ['SPX', 'NDX', 'IBEX', 'DAX', 'CAC', 'BTCUSD', 'ETHUSD', 'EURUSD', 'USDJPY', 'GC1!', 'CL1!', 'NVDA', 'TSLA', 'AAPL', 'US10Y', 'DE10Y'];

function buildFeed(now: number): FeedItem[] {
  const items: FeedItem[] = [];
  const chosen = FEATURED.filter((id) => getAnyAsset(id) !== undefined);
  for (let round = 0; round < 2 && items.length < 6; round++) {
    const index = (round + Math.floor(now / 11000)) % chosen.length;
    const id = chosen[index];
    const asset = getAnyAsset(id);
    if (!asset) continue;
    const tick = states.get(asset.quote) ?? states.get(asset.id);
    const price = tick?.price ?? asset.price;
    const pct = tick?.changePct ?? asset.change;
    const dir = pct >= 0 ? 'sube' : 'cede';
    const verb = pct >= 0 ? 'se anota' : 'recorta';
    const priceText = price.toLocaleString('es-ES', { maximumFractionDigits: asset.decimals });
    const delta = formatChange(pct);
    let title: string;
    let category: string;
    let summary: string;
    if (asset.category === 'crypto') {
      category = 'Cripto';
      title = `${asset.shortName} ${verb} un ${delta} y se negocia en ${priceText} ${asset.currency}`;
      summary = `El activo digital ${asset.name} mantiene la atenci\u00f3n del mercado con un movimiento constante de varios d\u00e9cimas durante la \u00faltima hora.`;
    } else if (asset.category === 'forex') {
      category = 'Divisas';
      title = `${asset.id} ${dir} al ${delta} con el foco en los bancos centrales`;
      summary = `El cruce de divisas ajusta posiciones mientras los operadores revisan los diferenciales de tipos y la agenda macroecon\u00f3mica.`;
    } else if (asset.category === 'futures') {
      category = 'Materias primas';
      title = `${asset.shortName} ${verb} un ${delta} y se acerca a m\u00e1ximos de la sesi\u00f3n`;
      summary = 'Los contratos de futuros reflejan el pulso de la oferta y la demanda en un d\u00eda de actividad sostenida.';
    } else if (asset.category === 'indices') {
      category = 'Mercados';
      title = `${asset.shortName} ${dir} un ${delta}, en m\u00e1ximos t\u00e9cnicos de la jornada`;
      summary = `El \u00edndice ${asset.name} cotiza con cambios moderados mientras los inversores asimilan las \u00faltimas referencias macroecon\u00f3micas.`;
    } else {
      category = 'Renta variable';
      title = `${asset.shortName} cotiza en ${priceText} ${asset.currency} y ${verb} un ${delta}`;
      summary = `La compa\u00f1\u00eda ${asset.name} es uno de los valores m\u00e1s seguidos de la sesi\u00f3n, con un volumen de negocio por encima de su media reciente.`;
    }
    items.push({ id: `${asset.id}-${Math.round(now / 11000)}-${round}`, category, title, summary, assetId: asset.id, createdAt: now });
  }
  for (const stale of [...feed].slice(0, 2)) items.push(stale);
  return items.slice(0, FEED_MAX);
}

async function fetchQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`, { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const closes: (number | null)[] | undefined = result.indicators?.quote?.[0]?.close;
    const first = closes?.find((value): value is number => typeof value === 'number');
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? first ?? 0;
    const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? first ?? 0;
    const change = meta.regularMarketChange ?? (prev ? price - prev : 0);
    const changePercent = meta.regularMarketChangePercent ?? (prev ? (change / prev) * 100 : 0);
    return {
      price,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? 0,
      previousClose: prev,
      currency: meta.currency ?? 'USD',
      exchange: meta.exchangeName,
      updatedAt: Date.now(),
      ok: true,
    };
  } catch {
    return null;
  }
}

async function refreshBatch(symbols: string[]) {
  const results = await Promise.allSettled(symbols.map((quote) => fetchQuote(quote)));
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      const quote = result.value;
      const symbol = symbols[index];
      quotes.set(symbol, quote);
      anyFetched = true;
      lastOkAt = Date.now();
      const previous = states.get(symbol);
      states.set(symbol, { price: quote.price, prevClose: quote.previousClose || previous?.price || quote.price, changePct: quote.changePercent, volume: quote.volume, currency: quote.currency || previous?.currency || 'USD', exchange: quote.exchange ?? previous?.exchange, real: true });
      const trail = trails.get(symbol);
      if (trail) { const last = trail[trail.length - 1]; if (last !== quote.price) trail.push(quote.price); if (trail.length > TRAIL_LENGTH) trail.splice(0, trail.length - TRAIL_LENGTH); }
    }
  });
}

function tickSecond() {
  if (!subscriptions.size) return;
  for (const symbol of subscriptions) {
    const base = baseByQuote.get(symbol) ?? getAnyAsset(symbol);
    if (!base) continue;
    const current = states.get(symbol);
    if (!current) {
      const prev = base.price / (1 + base.change / 100);
      states.set(symbol, { price: base.price, prevClose: prev, changePct: base.change, volume: base.volume, currency: base.currency, exchange: base.exchange, real: false });
      const trail = trails.get(symbol) ?? [];
      trail.push(base.price);
      if (trail.length > TRAIL_LENGTH) trail.splice(0, trail.length - TRAIL_LENGTH);
      trails.set(symbol, trail);
      continue;
    }
    const sigma = volatilityFor(base.category, current.changePct);
    const next = Math.max(0.00000001, Math.min(current.price * 1.02, current.price * (1 + sigma * noise())));
    states.set(symbol, { ...current, price: next, changePct: current.prevClose > 0 ? ((next - current.prevClose) / current.prevClose) * 100 : current.changePct });
    const trail = trails.get(symbol) ?? [];
    trail.push(next);
    if (trail.length > TRAIL_LENGTH) trail.splice(0, trail.length - TRAIL_LENGTH);
    trails.set(symbol, trail);
  }
}

let timer: number | undefined;
let tickTimer: number | undefined;
let feedTimer: number | undefined;
let cursor = 0;

async function pollRotating() {
  const symbols = [...subscriptions];
  if (!symbols.length) return;
  if (cursor >= symbols.length) cursor = 0;
  const batch = symbols.slice(cursor, cursor + BATCH_SIZE);
  cursor += BATCH_SIZE;
  if (batch.length) await refreshBatch(batch);
}

function ensurePolling() {
  const symbols = [...subscriptions];
  const batches = Math.ceil(symbols.length / BATCH_SIZE) || 1;
  if (timer === undefined) {
    pollRotating();
    timer = window.setInterval(pollRotating, Math.max(1800, TOTAL_INTERVAL_MS / batches));
  }
  if (tickTimer === undefined) tickTimer = window.setInterval(tickSecond, TICK_MS);
  if (feedTimer === undefined) feedTimer = window.setInterval(() => { feed = buildFeed(Date.now()); feedGeneratedAt = Date.now(); }, FEED_INTERVAL_MS);
}

function stopWhenIdle() {
  if (subscriptions.size === 0) {
    if (timer !== undefined) { window.clearInterval(timer); timer = undefined; }
    if (tickTimer !== undefined) { window.clearInterval(tickTimer); tickTimer = undefined; }
    if (feedTimer !== undefined) { window.clearInterval(feedTimer); feedTimer = undefined; }
    cursor = 0;
  }
}

function syncAssets() {
  baseByQuote.clear();
  for (const asset of ASSETS) if (asset.quote.length > 0) baseByQuote.set(asset.quote, asset);
  const symbols = new Set(baseByQuote.keys());
  for (const symbol of symbols) subscriptions.add(symbol);
  for (const symbol of [...subscriptions]) if (!symbols.has(symbol) && !getAnyAsset(symbol)) subscriptions.delete(symbol);
  if (subscriptions.size) ensurePolling();
}

interface LiveContextValue {
  liveOf: (asset: Asset) => Asset;
  trailOf: (quote: string) => number[];
  connected: boolean;
  hasData: boolean;
  refreshing: boolean;
  lastUpdate: number;
  liveCount: number;
  symbolCount: number;
  feed: FeedItem[];
  feedGeneratedAt: number;
  refresh: () => Promise<void>;
}

const LiveContext = createContext<LiveContextValue>({
  liveOf: (asset) => asset,
  trailOf: () => [],
  connected: false,
  hasData: false,
  refreshing: false,
  lastUpdate: 0,
  liveCount: 0,
  symbolCount: 0,
  feed: [],
  feedGeneratedAt: 0,
  refresh: async () => undefined,
});

export function useLive(): LiveContextValue {
  return useContext(LiveContext);
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const disposed = useRef(false);

  useEffect(() => {
    disposed.current = false;
    syncAssets();
    feed = buildFeed(Date.now());
    feedGeneratedAt = Date.now();
    const onTick = () => { if (!disposed.current) setVersion((value) => value + 1); };
    listeners.add(onTick);
    return () => {
      disposed.current = true;
      listeners.delete(onTick);
      stopWhenIdle();
    };
  }, []);

  const liveOf = useCallback((base: Asset): Asset => {
    const symbol = base.quote || base.id;
    const tick = states.get(symbol);
    if (!tick) {
      const recent = quotes.get(symbol);
      if (!recent) return base;
      return { ...base, price: recent.price, change: recent.changePercent, volume: recent.volume || base.volume, currency: recent.currency || base.currency };
    }
    return { ...base, price: tick.price, change: tick.changePct, volume: tick.volume || base.volume, currency: tick.currency || base.currency };
  }, [version]);

  const trailOf = useCallback((quote: string): number[] => trails.get(quote) ?? [], [version]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const symbols = [...subscriptions];
      const batches = Math.ceil(symbols.length / BATCH_SIZE) || 1;
      for (let i = 0; i < batches; i++) {
        const batch = symbols.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        if (batch.length) await refreshBatch(batch);
      }
    } finally {
      setRefreshing(false);
      if (!disposed.current) setVersion((value) => value + 1);
    }
  }, []);

  const connected = Date.now() - lastOkAt < POLL_WINDOW_MS;

  const value = useMemo<LiveContextValue>(() => ({
    liveOf,
    trailOf,
    connected,
    hasData: anyFetched,
    refreshing,
    lastUpdate: lastOkAt,
    liveCount: quotes.size,
    symbolCount: subscriptions.size,
    feed,
    feedGeneratedAt,
    refresh,
  }), [liveOf, trailOf, connected, refreshing, feedGeneratedAt]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function attachCustomSymbol(symbol: string) {
  const custom = getAnyAsset(symbol);
  if (custom) baseByQuote.set(symbol, custom);
  if (!subscriptions.has(symbol)) {
    subscriptions.add(symbol);
    ensurePolling();
  }
}