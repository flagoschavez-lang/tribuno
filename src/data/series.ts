import { useEffect, useMemo, useState } from 'react';
import type { Asset } from './markets';
import { makeSeries } from '../components/MarketChart';
import type { Period } from '../components/MarketChart';

export interface SeriesPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const RANGE_MAP: Record<Period | '7D', { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '30m' },
  '7D': { range: '7d', interval: '1d' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  'YTD': { range: 'ytd', interval: '1d' },
  '1A': { range: '1y', interval: '1d' },
  'Todo': { range: 'max', interval: '1mo' },
};

interface SeriesCacheEntry {
  points: SeriesPoint[];
  fetchedAt: number;
}

const seriesCache = new Map<string, SeriesCacheEntry>();

export async function fetchSeries(symbol: string, period: Period): Promise<SeriesPoint[] | null> {
  const key = `${symbol}|${period}`;
  const cached = seriesCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < 6 * 60 * 1000) return cached.points;
  try {
    const { range, interval } = RANGE_MAP[period];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`, { signal: controller.signal });
    window.clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result || !Array.isArray(result.timestamp)) return null;
    const quote = result.indicators?.quote?.[0];
    if (!quote) return null;
    const points: SeriesPoint[] = [];
    for (let idx = 0; idx < result.timestamp.length; idx++) {
      const open = quote.open?.[idx];
      const high = quote.high?.[idx];
      const low = quote.low?.[idx];
      const close = quote.close?.[idx];
      if (typeof open === 'number' && typeof high === 'number' && typeof low === 'number' && typeof close === 'number') {
        points.push({ time: result.timestamp[idx], open, high, low, close, volume: quote.volume?.[idx] ?? 0 });
      }
    }
    if (!points.length) return null;
    seriesCache.set(key, { points, fetchedAt: Date.now() });
    return points;
  } catch {
    return null;
  }
}

export function useSeries(asset: Asset, period: Period): { points: SeriesPoint[]; source: 'api' | 'synthetic' | 'loading'; loading: boolean } {
  const [apiPoints, setApiPoints] = useState<SeriesPoint[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!asset.quote) {
      setApiPoints(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cached = seriesCache.get(`${asset.quote}|${period}`);
    if (cached) {
      setApiPoints(cached.points);
      setLoading(false);
      return;
    }
    fetchSeries(asset.quote, period).then((points) => {
      if (!active) return;
      setApiPoints(points);
      setLoading(false);
    });
    return () => { active = false; };
  }, [asset.id, asset.quote, period]);

  const source = apiPoints ? 'api' : loading ? 'loading' : 'synthetic';

  const finalPoints = useMemo(() => {
    if (apiPoints && apiPoints.length > 1) return apiPoints;
    const synthetic = makeSeries(asset, period as SeriesPeriodForFallback, 150);
    const now = Date.now();
    const stride = period === '1D' ? 5 * 60 * 1000 : period === '5D' ? 30 * 60 * 1000 : period === '1M' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const base = now - stride * synthetic.length;
    return synthetic.map((close, idx) => {
      const open = idx === 0 ? close : synthetic[idx - 1];
      const wick = Math.abs(close - open) * (0.2 + ((idx % 5) / 10));
      return {
        time: base + idx * stride,
        open,
        high: Math.max(open, close) + wick,
        low: Math.min(open, close) - wick,
        close,
        volume: asset.volume / 1000 + ((idx * 7919) % 7000),
      };
    });
  }, [apiPoints, asset, period]);

  return { points: finalPoints, source, loading };
}

type SeriesPeriodForFallback = Period | '7D';