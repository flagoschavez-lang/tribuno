import { ArrowUpRight, ChevronRight, Radio } from 'lucide-react';
import { type Asset, formatChange, formatCompact, formatPrice } from '../data/markets';
import { useLive } from '../data/live';
import MarketLogo from './MarketLogo';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';

export default function AssetQuote({ asset, onTitleClick }: { asset: Asset; onTitleClick?: () => void }) {
  const { liveOf } = useLive();
  const { t } = useI18n();
  const live = liveOf(asset);
  const previous = live.price / (1 + live.change / 100);
  const difference = live.price - previous;
  const liveQuote = liveOf(asset);
  const isLive = liveQuote.price !== asset.price || liveQuote.change !== asset.change;

  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(live.price);
  useEffect(() => {
    if (prevPriceRef.current !== live.price) {
      setFlash(live.price > prevPriceRef.current ? 'up' : 'down');
      const t = window.setTimeout(() => setFlash(null), 700);
      prevPriceRef.current = live.price;
      return () => window.clearTimeout(t);
    }
    prevPriceRef.current = live.price;
  }, [live.price]);

  return (
    <div className="asset-quote">
      <div className="quote-name-line">
        <MarketLogo key={asset.id} asset={live} size={29} />
        {onTitleClick ? <button className="quote-title" onClick={onTitleClick}>{live.shortName}<ChevronRight size={18} /></button> : <h3 className="quote-title">{live.shortName}</h3>}
        <span className="quote-exchange">{isLive ? <span className="quote-live-dot" title={t('chart.real')}><Radio size={11} /></span> : null} {live.exchange} &middot; {live.symbol}</span>
      </div>
      <div className="quote-price-line">
        <span className={`quote-price price-flash ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}>{formatPrice(live.price, live.decimals)}</span>
        <span className="quote-currency">{live.currency}</span>
        <span className={`quote-change ${live.change >= 0 ? 'positive' : 'negative'}`}>{difference >= 0 ? '+' : ''}{formatPrice(difference, live.decimals)} ({formatChange(live.change)})</span>
        <span className="quote-today">{isLive ? t('quote.live') : t('quote.today')}</span>
      </div>
      {isLive && live.volume > 0 && (
        <div className="quote-volume">{t('quote.volume')} <strong>{formatCompact(live.volume)}</strong>{live.exchange ? ` · ${live.exchange}` : ''}</div>
      )}
      {onTitleClick && (
        <button className="quote-open" onClick={onTitleClick}>{t('quote.openDetail')}<ArrowUpRight size={13} /></button>
      )}
    </div>
  );
}