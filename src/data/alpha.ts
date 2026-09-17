import { useEffect, useState } from 'react';
import { ASSETS, type AssetCategory } from './markets';
import type { FeedItem } from './live';

const AV_KEY = '8uRnficc3PJ21fGqYAbP63qN9sLEfsMl';
const BASE = 'https://www.alphavantage.co/query';

interface CacheEntry<T> { at: number; data: T }

function cached<T>(key: string, ttlMs: number) {
  const storageKey = `tribuno.av.${key}`;
  return {
    get(): T | null {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (Date.now() - entry.at > ttlMs) return null;
        return entry.data;
      } catch {
        return null;
      }
    },
    set(data: T) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), data } as CacheEntry<T>));
      } catch {
        /* sin almacenamiento disponible */
      }
    },
  };
}

async function avRequest(functionName: string): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${BASE}?function=${encodeURIComponent(functionName)}&apikey=${AV_KEY}&datatype=json`, { signal: controller.signal });
    if (response.status === 429 || response.status === 401 || !response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function parseNumber(value: unknown): number {
  const parsed = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseVolume(value: string): number {
  const trimmed = String(value).trim().toUpperCase();
  const n = parseFloat(trimmed) || 0;
  if (trimmed.endsWith('B')) return n * 1e9;
  if (trimmed.endsWith('M')) return n * 1e6;
  if (trimmed.endsWith('K')) return n * 1e3;
  return n;
}

export interface AvMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface AvMoversData {
  gainers: AvMover[];
  losers: AvMover[];
  active: AvMover[];
}

export async function fetchAvMovers(): Promise<AvMoversData | null> {
  const cache = cached<AvMoversData>('movers', 12 * 60 * 60 * 1000);
  const hit = cache.get();
  if (hit) return hit;
  const data = await avRequest('TOP_GAINERS_LOSERS');
  const rows = (key: string): AvMover[] => {
    const list = data?.[key];
    if (!Array.isArray(list)) return [];
    return (list as Record<string, unknown>[]).map((row) => ({
      symbol: String(row.ticker ?? row.symbol ?? ''),
      name: String(row.name ?? row.ticker ?? ''),
      price: parseNumber(row.price),
      change: parseNumber(row.change_amount),
      changePercent: parseNumber(row.change_percentage),
      volume: parseVolume(String(row.volume ?? '0')),
    })).filter((item) => item.symbol);
  };
  const result: AvMoversData = {
    gainers: rows('top_gainers'),
    losers: rows('top_losers'),
    active: rows('most_actively_traded'),
  };
  if (!result.gainers.length && !result.losers.length && !result.active.length) return null;
  cache.set(result);
  return result;
}

export interface AvSector {
  name: string;
  change: number;
}

export async function fetchAvSectors(): Promise<AvSector[] | null> {
  const cache = cached<AvSector[]>('sectors', 12 * 60 * 60 * 1000);
  const hit = cache.get();
  if (hit) return hit;
  const data = await avRequest('SECTOR_PERFORMANCE');
  const map = data?.['Rank A: Real-Time Performance'];
  if (!map || typeof map !== 'object') return null;
  const result: AvSector[] = Object.entries(map as Record<string, unknown>)
    .map(([name, value]) => ({ name, change: parseNumber(value) }))
    .filter((item) => item.name && Number.isFinite(item.change));
  if (!result.length) return null;
  cache.set(result);
  return result;
}

function parseAvTime(value: unknown): number {
  const text = String(value);
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(text);
  if (!match) return Date.now();
  const [, y, mo, d, h, mi, s] = match.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s);
}

function feedTagForAssetCategory(category: AssetCategory | undefined): { categoryId: string; category: string } {
  switch (category) {
    case 'crypto': return { categoryId: 'crypto', category: 'Cripto' };
    case 'forex': return { categoryId: 'forex', category: 'Divisas' };
    case 'futures': return { categoryId: 'commodities', category: 'Materias primas' };
    default: return { categoryId: 'markets', category: 'Mercados' };
  }
}

function findAssetByTicker(tickers: string[]) {
  for (const ticker of tickers) {
    const symbol = String(ticker).toUpperCase();
    const asset = ASSETS.find((item) => item.quote === symbol || item.symbol === symbol || item.id === symbol);
    if (asset) return asset;
  }
  return undefined;
}

function avToFeedItem(entry: Record<string, unknown>): FeedItem | null {
  const title = String(entry.title ?? '');
  if (!title.trim()) return null;
  const tickers = Array.isArray(entry.ticker_sentiment)
    ? (entry.ticker_sentiment as Record<string, unknown>[]).map((item) => String(item.ticker ?? ''))
    : [];
  const asset = findAssetByTicker(tickers);
  const tag = feedTagForAssetCategory(asset?.category);
  const image = String(entry.banner_image ?? '');
  return {
    id: `av-${String(entry.time_published ?? Date.now())}-${Math.random().toString(36).slice(2, 8)}`,
    category: tag.category,
    categoryId: tag.categoryId,
    title,
    summary: String(entry.summary ?? entry.title ?? ''),
    assetId: asset?.id ?? 'SPX',
    createdAt: parseAvTime(entry.time_published),
    source: String(entry.source ?? 'Alpha Vantage'),
    url: String(entry.url ?? ''),
    image: image && image.startsWith('http') ? image : undefined,
  };
}

export async function fetchAvNews(): Promise<FeedItem[]> {
  const cache = cached<FeedItem[]>('news', 60 * 60 * 1000);
  const hit = cache.get();
  if (hit) return hit;
  const date = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const timeFrom = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}`;
  const data = await avRequest(`NEWS_SENTIMENT&topics=finance,technology,energy_transportation&limit=32&sort=LATEST&time_from=${timeFrom}`);
  const list = data?.feed;
  if (!Array.isArray(list)) return [];
  const items = (list as Record<string, unknown>[]).map(avToFeedItem).filter((item): item is FeedItem => item !== null);
  cache.set(items);
  return items;
}

export function useAvMovers(): AvMoversData | null {
  const [result, setResult] = useState<AvMoversData | null>(null);
  useEffect(() => {
    let active = true;
    fetchAvMovers().then((value) => { if (active && value) setResult(value); });
    return () => { active = false; };
  }, []);
  return result;
}

export function useAvSectors(): AvSector[] | null {
  const [result, setResult] = useState<AvSector[] | null>(null);
  useEffect(() => {
    let active = true;
    fetchAvSectors().then((value) => { if (active && value) setResult(value); });
    return () => { active = false; };
  }, []);
  return result;
}