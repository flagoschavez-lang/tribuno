import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChartNoAxesCombined, CandlestickChart } from 'lucide-react';
import { type Asset, formatPrice } from '../data/markets';
import { useSeries } from '../data/series';
import { useLive } from '../data/live';
import { BrandMark } from './MarketLogo';
import { useI18n } from '../i18n';

export const PERIODS = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1A', 'Todo'] as const;
export type Period = typeof PERIODS[number];
type SeriesPeriod = Period | '7D';

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

// Seeded sample data keeps each asset and time range stable between renders.
export function makeSeries(asset: Asset, period: SeriesPeriod = '1D', count = 150): number[] {
  let seed = hashString(`${asset.id}-${period}`) + 1;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const outline = [18, 25, 19, 32, 20, 12, 25, 19, 28, 17, 30, 25, 39, 34, 43, 36, 40, 33, 48, 38, 50, 42, 55, 58, 47, 66, 57, 61, 50, 60, 57, 67, 63, 70, 58, 72, 65, 73, 69, 75];
  const periodIndex = period === '7D' ? 1 : PERIODS.indexOf(period);
  const range = asset.price * (0.008 + periodIndex * 0.016);
  const direction = asset.change >= 0 ? 1 : -1;
  const values = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const step = progress * (outline.length - 1);
    const lower = Math.floor(step);
    const shape = outline[lower] + ((outline[Math.min(lower + 1, outline.length - 1)] - outline[lower]) * (step - lower));
    const noise = (random() - 0.5) * 11 + Math.sin(progress * (17 + periodIndex) + hashString(asset.id) % 6) * 5;
    return (shape + noise) * direction;
  });
  const final = values[values.length - 1];
  return values.map((value) => asset.price + ((value - final) / 100) * range);
}

export function Sparkline({ asset, selected = false, width = 96, height = 34, monochrome = false, period = '7D', onOpen }: { asset: Asset; selected?: boolean; width?: number; height?: number; monochrome?: boolean; period?: SeriesPeriod; onOpen?: () => void }) {
  const { t } = useI18n();
  const { points } = useSeries(asset, period as Period);
  const values = useMemo(() => points.map((point) => point.close), [points]);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const line = values.map((value, index) => `${(index / (values.length - 1) * width).toFixed(1)},${(height - 3 - ((value - min) / range) * (height - 6)).toFixed(1)}`).join(' L');
  const path = `M${line}`;
  const change = asset.change;
  const color = selected || monochrome ? '#2962ff' : change >= 0 ? '#089981' : '#f23645';
  const id = useId().replace(/:/g, '');
  return (
    <button className="sparkline sparkline-button" style={{ width, height }} aria-label={t('spark.aria', { name: asset.shortName })} title={t('spark.open')} onClick={onOpen} role="img">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs><linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity="0.13" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#spark-${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </button>
  );
}

interface ChartProps {
  asset: Asset;
  period: Period;
  onPeriodChange: (period: Period) => void;
  expanded?: boolean;
}

function formatTime(time: number, period: Period, locale: string): string {
  const date = new Date(time * 1000);
  if (period === '1D') return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export default function MarketChart({ asset, period, onPeriodChange, expanded = false }: ChartProps) {
  const id = useId().replace(/:/g, '');
  const reduceMotion = useReducedMotion();
  const { t, locale, lang } = useI18n();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(1000);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'area' | 'candles'>('area');
  const { points, source } = useSeries(asset, period);
  const { trailOf, connected } = useLive();
  const trail = trailOf(asset.quote || asset.id);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(([entry]) => setCanvasWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const width = canvasWidth;
  const height = expanded ? 330 : 207;
  const plotWidth = width - 94;
  const plotHeight = height - 30;

  const baseValues = points.length > 1 ? points.map((point) => point.close) : makeSeries(asset, period, 150);
  const livePrice = trail.length ? trail[trail.length - 1] : null;
  const animateLive = livePrice !== null && baseValues.length > 1;
  const values = animateLive ? [...baseValues.slice(0, baseValues.length - 1), livePrice as number] : baseValues;
  const active = points.length > 1 ? points : null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.19;
  const low = min - padding;
  const high = max + padding;
  const xAt = (index: number) => 5 + index / (values.length - 1) * (plotWidth - 15);
  const yAt = (value: number) => 8 + (1 - (value - low) / (high - low)) * (plotHeight - 17);
  const path = `M${values.map((value, index) => `${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`).join(' L')}`;
  const endY = yAt(values[values.length - 1]);
  const endX = xAt(values.length - 1);

  const activeIndex = hoverIndex === null ? null : Math.min(hoverIndex, values.length - 1);
  const hoverPoint = activeIndex !== null ? active ? active[Math.max(0, Math.min(activeIndex, active.length - 1))] : null : null;
  const hoverValue = activeIndex !== null ? values[activeIndex] : null;

  const trailRecent = trail.slice(-56);
  const trailMin = Math.min(...trailRecent);
  const trailRange = (Math.max(...trailRecent) - trailMin) || 1;
  const trailPath = trailRecent.map((value, index) => `${(index / (trailRecent.length - 1) * 76).toFixed(1)},${(25 - ((value - trailMin) / trailRange) * 21).toFixed(1)}`).join(' L');

  const tickCount = 5;
  const labelCount = width < 500 ? 4 : 7;

  return (
    <div className={`market-chart ${expanded ? 'expanded' : ''}`}>
      <div className="chart-canvas" ref={canvasRef}>
        <svg className="main-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img"
          aria-label={t('chart.aria', { name: asset.name, period })} tabIndex={0}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const pointerX = (event.clientX - bounds.left) / bounds.width * width;
            setHoverIndex(Math.max(0, Math.min(values.length - 1, Math.round((pointerX - 5) / (plotWidth - 15) * (values.length - 1)))));
          }}
          onPointerLeave={() => setHoverIndex(null)} onBlur={() => setHoverIndex(null)}
          onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setHoverIndex((current) => Math.max(0, Math.min(values.length - 1, (current ?? values.length - 1) + (event.key === 'ArrowRight' ? 1 : -1)))); } }}>
          <defs><linearGradient id={`chart-fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2962ff" stopOpacity="0.16" /><stop offset="1" stopColor="#2962ff" stopOpacity="0.015" /></linearGradient><linearGradient id={`trail-fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#089981" stopOpacity="0.22" /><stop offset="1" stopColor="#089981" stopOpacity="0.02" /></linearGradient></defs>
          {Array.from({ length: tickCount }, (_, tick) => {
            const tickY = 11 + (plotHeight - 19) * tick / (tickCount - 1);
            const price = high - ((tickY - 8) / (plotHeight - 17)) * (high - low);
            return <g key={tick}><line x1="0" y1={tickY} x2={plotWidth} y2={tickY} className="chart-grid-line" /><text x={plotWidth + 13} y={tickY + 4} className="chart-axis-text">{formatPrice(price, asset.decimals)}</text></g>;
          })}
          {chartType === 'area' ? (
            <g key={`${asset.id}-${period}`}>
              <motion.path d={`${path} L${xAt(values.length - 1)},${plotHeight} L5,${plotHeight} Z`} fill={`url(#chart-fill-${id})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.6 }} />
              <motion.path d={path} fill="none" stroke="#2962ff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: reduceMotion ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceMotion ? 0 : 0.9, ease: 'easeInOut' }} />
              <line x1={endX - 11} x2={endX + 5} y1={endY} y2={endY} stroke="#2962ff" strokeDasharray="2 3" />
              <circle cx={endX} cy={endY} r="3.2" fill="#2962ff" stroke="var(--surface)" strokeWidth="2" />
            </g>
          ) : active ? (
            <g key={`candles-${asset.id}-${period}`}>
              {values.map((close, index) => {
                const base = active[Math.max(0, Math.min(index, active.length - 1))];
                if (!base) return null;
                const candleX = xAt(index);
                const open = index === 0 ? base.open : (points[index - 1]?.close ?? base.open);
                const pointClose = livePrice !== null && index === values.length - 1 ? livePrice : (base.close ?? close);
                const highCandle = livePrice !== null && index === values.length - 1 ? Math.max(base.high, pointClose) : base.high;
                const lowCandle = livePrice !== null && index === values.length - 1 ? Math.min(base.low, pointClose) : base.low;
                const wick = Math.max(0.6, Math.abs(highCandle - lowCandle) * 0.004);
                const bodyTop = yAt(Math.max(open, pointClose));
                const bodyBottom = yAt(Math.min(open, pointClose));
                const candleWidth = Math.max(2.5, Math.min(9, (plotWidth - 15) / values.length * 0.62));
                const rising = pointClose >= open;
                const color = rising ? '#089981' : '#f23645';
                return <g key={index}>
                  <line x1={candleX} x2={candleX} y1={yAt(Math.max(open, pointClose) + wick)} y2={yAt(Math.min(open, pointClose) - wick)} stroke={color} strokeWidth="1.2" />
                  <rect x={candleX - candleWidth / 2} y={Math.min(bodyTop, bodyBottom)} width={candleWidth} height={Math.max(1.5, Math.abs(bodyBottom - bodyTop))} fill={color} rx="0.5" />
                </g>;
              })}
            </g>
          ) : (
            <g>
              {values.map((value, index) => {
                if (index % 3 !== 0) return null;
                const open = value;
                const close = values[Math.min(index + 2, values.length - 1)];
                const candleX = xAt(index);
                const color = close >= open ? '#089981' : '#f23645';
                const wick = (high - low) * (0.01 + (index % 4) * 0.004);
                const candleWidth = Math.max(2, Math.min(8, (plotWidth - 15) / 50 * 0.65));
                return <g key={index}><line x1={candleX} x2={candleX} y1={yAt(Math.max(open, close) + wick)} y2={yAt(Math.min(open, close) - wick)} stroke={color} strokeWidth="1.3" /><rect x={candleX - candleWidth / 2} y={Math.min(yAt(open), yAt(close))} width={candleWidth} height={Math.max(1.5, Math.abs(yAt(close) - yAt(open)))} fill={color} rx="0.5" /></g>;
              })}
            </g>
          )}
          {trailRecent.length > 8 && (
            <g className="chart-trail">
              {(() => { const topLeft = { x: 9, y: 9 }; return <g transform={`translate(${topLeft.x} ${topLeft.y})`}>
                <rect width="88" height="33" rx="5" fill="var(--surface)" opacity="0.92" stroke="var(--line)" strokeWidth="1" />
                <path d={`M${trailPath} L81,30 L3,30 Z`} fill={`url(#trail-fill-${id})`} opacity="0.9" />
                <path d={`M${trailPath}`} fill="none" stroke="#089981" strokeWidth="1.5" strokeLinejoin="round" />
                <text x="5" y="9" className="chart-axis-text" fontSize="7.5">{t('chart.last60')}</text>
              </g>; })()}
            </g>
          )}
          <rect x={plotWidth + 5} y={endY - 11} width="87" height="23" rx="3" fill="#2962ff" />
          <text x={plotWidth + 48.5} y={endY + 4} textAnchor="middle" fill="white" fontSize="11.5" fontWeight="550">{formatPrice(values[values.length - 1], asset.decimals)}</text>
          {active ? (() => {
            const step = Math.max(1, Math.floor(values.length / (labelCount - 1)));
            const idxs = Array.from({ length: Math.min(labelCount, values.length) }, (_, i) => Math.min(values.length - 1, i * step));
            return idxs.map((index, i) => {
              const point = active[Math.max(0, Math.min(index, active.length - 1))];
              if (!point) return null;
              const label = formatTime(point.time, period, locale);
              const first = i === 0;
              const last = i === idxs.length - 1;
              return <text key={`${label}-${index}`} x={xAt(index)} y={height - 4} textAnchor={first ? 'start' : last ? 'end' : 'middle'} className="chart-axis-text">{label}</text>;
            });
          })() : <text x={8} y={height - 4} className="chart-axis-text" textAnchor="start">{period === '1D' ? '09:30' : t('agenda.today')}</text>}
          {activeIndex !== null && hoverValue !== null && (
            <g className="chart-crosshair">
              <line x1={xAt(activeIndex)} x2={xAt(activeIndex)} y1="4" y2={plotHeight} stroke="var(--muted)" strokeDasharray="4 4" strokeWidth="0.8" />
              <line x1="0" x2={plotWidth} y1={yAt(hoverValue)} y2={yAt(hoverValue)} stroke="var(--muted)" strokeDasharray="4 4" strokeWidth="0.8" />
              <circle cx={xAt(activeIndex)} cy={yAt(hoverValue)} r="4" fill="#2962ff" stroke="var(--surface)" strokeWidth="2.5" />
              <g>
                <rect x={Math.min(plotWidth - 156, Math.max(6, xAt(activeIndex) - 78))} y="34" width="142" height={hoverPoint ? 62 : 30} rx="5" fill="var(--text)" opacity="0.96" />
                <text x={Math.min(plotWidth - 62, Math.max(82, xAt(activeIndex)))} y="53" textAnchor="middle" fontSize="13" fontWeight="650" fill="var(--surface)">{formatPrice(hoverValue, asset.decimals)} {asset.currency}</text>
                {hoverPoint && active && (
                  <text x={Math.min(plotWidth - 62, Math.max(82, xAt(activeIndex)))} y="72" textAnchor="middle" fontSize="9" fill="var(--surface)" opacity="0.75">{formatTime(hoverPoint.time, period, locale)} · {lang === 'en' ? 'O' : 'A'} {formatPrice(hoverPoint.open, asset.decimals)} · {lang === 'en' ? 'H' : 'M'} {formatPrice(hoverPoint.high, asset.decimals)} · {lang === 'en' ? 'L' : 'm'} {formatPrice(hoverPoint.low, asset.decimals)}</text>
                )}
              </g>
            </g>
          )}
        </svg>
        <div className="chart-watermark"><BrandMark /></div>
        {(source === 'api' || animateLive) && <span className="chart-live-badge"><span className="status-dot" />{connected ? t('chart.live') : t('chart.on')}</span>}
      </div>
      <div className="chart-bottom-bar">
        <div className="chart-source-label">{source === 'api' ? t('chart.real') : source === 'loading' ? t('chart.loading') : animateLive ? t('chart.evolution') : t('chart.reference')}</div>
        <div className="period-selector" aria-label={t('chart.periodAria')}>
          {PERIODS.map((item) => <button key={item} className={period === item ? 'active' : ''} aria-pressed={period === item} onClick={() => { setHoverIndex(null); onPeriodChange(item); }}>{item}</button>)}
        </div>
        <div className="chart-display-controls">
          <span className="chart-timezone">UTC</span>
          <button className={`icon-button ${chartType === 'area' ? 'selected' : ''}`} title={t('chart.line')} aria-label={t('chart.line')} aria-pressed={chartType === 'area'} onClick={() => setChartType('area')}><ChartNoAxesCombined size={17} /></button>
          <button className={`icon-button ${chartType === 'candles' ? 'selected' : ''}`} title={t('chart.candles')} aria-label={t('chart.candles')} aria-pressed={chartType === 'candles'} onClick={() => setChartType('candles')}><CandlestickChart size={17} /></button>
        </div>
      </div>
    </div>
  );
}