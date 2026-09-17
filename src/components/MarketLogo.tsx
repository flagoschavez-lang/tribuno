import { type CSSProperties } from 'react';
import type { Asset } from '../data/markets';

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="34" height="28" viewBox="0 0 36 30" fill="none" aria-hidden="true">
      <path d="M1 23V11H8V23H1ZM11 23V4H18V23H11ZM21 23V12H28V23H21Z" fill="currentColor" />
      <path d="M20 6L25 1L35 1L25 11L20 6Z" fill="currentColor" />
    </svg>
  );
}

export default function MarketLogo({ asset, size = 32 }: { asset: Asset; size?: number }) {
  return (
    <span className="asset-logo" style={{ width: size, height: size, '--asset-color': asset.color } as CSSProperties}>
      <span className="asset-logo-fallback">{asset.symbol.slice(0, 2)}</span>
    </span>
  );
}