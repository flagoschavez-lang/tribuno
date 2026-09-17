import { useSyncExternalStore } from 'react';
import { type Asset, type AssetCategory, type Region, getAsset, getAssetRaw } from './markets';

const CUSTOM_KEY = 'tribuno.custom.v1';

export interface ResolvedSymbol {
  symbol: string;
  name: string;
  exchange: string;
  quoteType: string;
  price?: number;
  currency?: string;
}

interface CustomRegistry {
  assets: Asset[];
  lastQuery: string;
}

let state: CustomRegistry = { assets: load(), lastQuery: '' };
const listeners = new Set<() => void>();

function load(): Asset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Asset => Boolean(item && typeof item === 'object' && typeof item.id === 'string' && item.id && typeof item.price === 'number'));
  } catch {
    return [];
  }
}

function persist() {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(state.assets)); } catch { /* noop */ }
}

function emit() { listeners.forEach((listener) => listener()); }

export function useCustom(): { assets: Asset[]; lastQuery: string } {
  return useSyncExternalStore((onStoreChange) => { listeners.add(onStoreChange); return () => listeners.delete(onStoreChange); }, () => state);
}

export function getAnyAsset(id: string): Asset | undefined {
  return state.assets.find((item) => item.id === id) ?? getAssetRaw(id);
}

export function getAssetOrFallback(id: string): Asset {
  return getAnyAsset(id) ?? getAsset(id);
}

const PALETTE = ['#2962ff', '#089981', '#e84748', '#147ed1', '#e79b2d', '#7c3aed', '#0e88c3', '#d660a3'];

function categoryFor(quoteType: string, symbol: string, exchange: string): AssetCategory {
  const type = quoteType.toUpperCase();
  if (type === 'CRYPTOCURRENCY') return 'crypto';
  if (type === 'INDEX') return 'indices';
  if (type === 'ETF') return 'etfs';
  if (type === 'CURRENCY') return 'forex';
  if (type === 'FUTURE') return symbol.endsWith('=F') ? 'futures' : 'futures';
  if (/yield|^10YT|^2YR/i.test(symbol)) return 'bonds';
  if (/country/i.test(exchange) && type === 'MUTUALFUND') return 'etfs';
  return 'stocks';
}

const regionFor = (exchange: string, quoteType: string): Region => {
  const type = quoteType.toUpperCase();
  if (type === 'CRYPTOCURRENCY' || type === 'CURRENCY') return 'global';
  const upper = exchange.toUpperCase();
  if (upper.includes('BMV') || upper.includes('BVM') || upper.includes('B3') || upper.includes('MEX')) return 'latam';
  if (upper.includes('JPX') || upper.includes('TSE') || upper.includes('HKEX') || upper.includes('SSE') || upper.includes('SZSE') || upper.includes('KRX') || upper.includes('TWSE') || upper.includes('NSE') || upper.includes('BSE')) return 'asia';
  if (upper.includes('LSE') || upper.includes('EURONEXT') || upper.includes('XETR') || upper.includes('BME') || upper.includes('MIL') || upper.includes('SWX')) return 'europe';
  if (upper.includes('ASX') || upper.includes('NZX')) return 'apac';
  return 'us';
};

function inferDecimals(price?: number): number {
  if (!price) return 2;
  if (price < 1) return 4;
  if (price < 20) return 3;
  return 2;
}

export function registerCustom(input: ResolvedSymbol): Asset {
  const id = input.symbol.toUpperCase().replace(/\s+/g, '');
  const existing = state.assets.find((item) => item.id === id);
  const base = input.price && input.price > 0 ? input.price : 100;
  const asset: Asset = {
    id,
    symbol: input.symbol,
    name: input.name || input.symbol,
    shortName: input.symbol,
    category: categoryFor(input.quoteType, input.symbol, input.exchange),
    price: base,
    change: 0,
    volume: 0,
    marketCap: 0,
    currency: input.currency && input.currency.length === 3 ? input.currency : 'USD',
    exchange: input.exchange || 'Mercado global',
    region: regionFor(input.exchange, input.quoteType),
    logo: '',
    color: PALETTE[Math.abs([...input.symbol].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0)) % PALETTE.length],
    decimals: inferDecimals(base),
    quote: id,
    description: `${input.name || input.symbol} cotizado en ${input.exchange || 'un mercado global'}. A\u00f1adido a tu espacio desde la b\u00fasqueda de mercados. Consulta su evoluci\u00f3n en vivo y gu\u00e1rdalo en tu lista de seguimiento.`,
  };
  if (existing) {
    state.assets = state.assets.map((item) => item.id === id ? asset : item);
  } else {
    state.assets = [...state.assets, asset];
  }
  persist();
  emit();
  return asset;
}

export function removeCustom(id: string) {
  const before = state.assets.length;
  state.assets = state.assets.filter((item) => item.id !== id);
  if (state.assets.length !== before) { persist(); emit(); }
}

export async function searchAllMarkets(query: string): Promise<ResolvedSymbol[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/search?q=${encodeURIComponent(query.trim())}&quotesCount=12&newsCount=0&lang=es-ES`, { signal: controller.signal });
    if (!response.ok) return [];
    const data = await response.json();
    const quotes = Array.isArray(data?.quotes) ? data.quotes : [];
    return quotes
      .filter((match: Record<string, unknown>) => typeof match?.symbol === 'string' && Boolean(match.symbol) && !String(match.symbol).startsWith('^'))
      .map((match: Record<string, unknown>) => ({
        symbol: String(match.symbol),
        name: String(match.shortname ?? match.longname ?? match.symbol),
        exchange: String(match.exchDisp ?? match.exchange ?? 'Mercado global'),
        quoteType: String(match.quoteType ?? 'EQUITY'),
        price: typeof match.regularMarketPrice === 'number' ? match.regularMarketPrice : undefined,
        currency: typeof match.currency === 'string' ? match.currency : undefined,
      }));
  } catch {
    return [];
  } finally {
    window.clearTimeout(timeout);
  }
}