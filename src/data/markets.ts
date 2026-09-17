export type AssetCategory = 'stocks' | 'crypto' | 'indices' | 'forex' | 'futures' | 'bonds' | 'etfs';
export type Category = 'overview' | AssetCategory;
export type Region = 'global' | 'us' | 'europe' | 'asia' | 'latam' | 'apac';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  shortName: string;
  category: AssetCategory;
  price: number;
  change: number;
  volume: number;
  marketCap: number;
  currency: string;
  exchange: string;
  region: Region;
  logo: string;
  color: string;
  decimals: number;
  description: string;
  quote: string;
}

type AssetInput = Pick<Asset, 'id' | 'name' | 'price' | 'change'> & Partial<Asset>;

function asset(input: AssetInput): Asset {
  return {
    symbol: input.id,
    shortName: input.name,
    category: 'stocks',
    volume: 24500000,
    marketCap: 0,
    currency: 'USD',
    exchange: 'NASDAQ',
    region: 'us',
    logo: '',
    color: '#2962ff',
    decimals: 2,
    quote: '',
    description: 'Explora la evoluci\u00f3n de este activo, consulta sus datos en vivo y a\u00f1\u00e1delo a tu lista para seguirlo de cerca. Las cotizaciones proceden de un proveedor de mercado y pueden experimentar ligeros retrasos.',
    ...input,
  };
}

export const ASSETS: Asset[] = [
  // ── Índices ───────────────────────────────────────────────────────────────
  asset({ id: 'SPX', name: 'S&P 500', category: 'indices', price: 7635.14, change: 83.33, quote: '^GSPC', logo: 'indices/s-and-p-500', color: '#e84748', exchange: 'SP', volume: 3450000000, description: 'El S&P 500 sigue el rendimiento de 500 grandes empresas cotizadas en Estados Unidos. Es uno de los indicadores m\u00e1s utilizados para entender el pulso de la bolsa estadounidense.' }),
  asset({ id: 'NDX', name: 'Nasdaq 100', category: 'indices', price: 29419.41, change: 474.35, quote: '^NDX', logo: 'indices/nasdaq-100', color: '#147ed1', exchange: 'NASDAQ', volume: 4210000000 }),
  asset({ id: 'DJI', name: 'Dow Jones', category: 'indices', price: 51801.96, change: 340.06, quote: '^DJI', logo: 'indices/dow-30', color: '#2856cd', exchange: 'DJ', volume: 285000000 }),
  asset({ id: 'IBEX', name: 'IBEX 35', category: 'indices', price: 19831.8, change: 275.9, quote: '^IBEX', logo: 'indices/ibex-35', color: '#e79b2d', exchange: 'BME', currency: 'EUR', region: 'europe' }),
  asset({ id: 'DAX', name: 'DAX', category: 'indices', price: 25716.71, change: 314.41, quote: '^GDAXI', logo: 'country/DE', exchange: 'XETR', currency: 'EUR', region: 'europe' }),
  asset({ id: 'SX5E', name: 'Euro Stoxx 50', category: 'indices', price: 6322.9, change: 56.4, quote: '^STOXX50E', logo: 'indices/euro-stoxx-50', exchange: 'STOXX', currency: 'EUR', region: 'europe' }),
  asset({ id: 'UKX', name: 'FTSE 100', category: 'indices', price: 10816.14, change: 158.04, quote: '^FTSE', logo: 'country/GB', exchange: 'LSE', currency: 'GBP', region: 'europe' }),
  asset({ id: 'CAC', name: 'CAC 40', category: 'indices', price: 8186.93, change: 96.65, quote: '^FCHI', logo: 'country/FR', exchange: 'EURONEXT', currency: 'EUR', region: 'europe' }),
  asset({ id: 'FTSEMIB', name: 'FTSE MIB', shortName: 'FTSE MIB', category: 'indices', price: 52385.5, change: 830.5, quote: 'FTSEMIB.MI', logo: 'country/IT', exchange: 'MIL', currency: 'EUR', region: 'europe' }),
  asset({ id: 'RUT', name: 'Russell 2000', category: 'indices', price: 2881.73, change: 22.91, quote: '^RUT', logo: 'country/US', exchange: 'RUSSELL' }),
  asset({ id: 'VIX', name: 'Volatilidad VIX', shortName: 'VIX', category: 'indices', price: 15.58, change: -1.62, quote: '^VIX', logo: 'country/US', color: '#b6366b', exchange: 'CBOE' }),
  asset({ id: 'NI225', name: 'Nikkei 225', category: 'indices', price: 64136.25, change: 213.25, quote: '^N225', logo: 'country/JP', exchange: 'TVC', currency: 'JPY', region: 'asia' }),
  asset({ id: 'HSI', name: 'Hang Seng', category: 'indices', price: 24604.29, change: -62.91, quote: '^HSI', logo: 'country/HK', exchange: 'HSI', currency: 'HKD', region: 'asia' }),
  asset({ id: 'SSE', name: 'Shanghai Composite', shortName: 'Shanghai', category: 'indices', price: 3875.6, change: 11.32, quote: '000001.SS', logo: 'country/CN', exchange: 'SSE', currency: 'CNY', region: 'asia' }),
  asset({ id: 'SENSEX', name: 'BSE Sensex', category: 'indices', price: 74314.59, change: 310.79, quote: '^BSESN', logo: 'country/IN', exchange: 'BSE', currency: 'INR', region: 'asia' }),
  asset({ id: 'KOSPI', name: 'KOSPI', category: 'indices', price: 6715.41, change: -2.56, quote: '^KS11', logo: 'country/KR', exchange: 'KRX', currency: 'KRW', region: 'asia' }),
  asset({ id: 'AXJO', name: 'S&P/ASX 200', shortName: 'ASX 200', category: 'indices', price: 8732.4, change: 59.9, quote: '^AXJO', logo: 'country/AU', exchange: 'ASX', currency: 'AUD', region: 'apac' }),
  asset({ id: 'BVSP', name: 'Ibovespa', shortName: 'Bovespa', category: 'indices', price: 186310.6, change: 762.94, quote: '^BVSP', logo: 'country/BR', exchange: 'B3', currency: 'BRL', region: 'latam' }),
  asset({ id: 'MXX', name: 'IPC', shortName: 'IPC M\u00e9xico', category: 'indices', price: 63867.61, change: 360.5, quote: '^MXX', logo: 'country/MX', exchange: 'BMV', currency: 'MXN', region: 'latam' }),
  asset({ id: 'GSPTSE', name: 'S&P/TSX', shortName: 'TSX', category: 'indices', price: 35868.14, change: 376.87, quote: '^GSPTSE', logo: 'country/CA', exchange: 'TSX', currency: 'CAD', region: 'us' }),
  asset({ id: 'TWII', name: 'Taiwan Weighted', shortName: 'Taiwan', category: 'indices', price: 46288, change: 776.5, quote: '^TWII', logo: 'country/TW', exchange: 'TWSE', currency: 'TWD', region: 'asia' }),

  // ── Acciones (EE. UU.) ───────────────────────────────────────────────────
  asset({ id: 'NVDA', name: 'NVIDIA Corporation', shortName: 'NVIDIA', price: 219.35, change: 5.45, volume: 299310000, marketCap: 5160000000000, quote: 'NVDA', logo: 'nvidia', color: '#76b900', description: 'NVIDIA dise\u00f1a procesadores gr\u00e1ficos y plataformas de computaci\u00f3n acelerada. Sus tecnolog\u00edas impulsan la inteligencia artificial, los centros de datos y los videojuegos.' }),
  asset({ id: 'TSLA', name: 'Tesla, Inc.', shortName: 'Tesla', price: 366.51, change: 8.43, volume: 86950000, marketCap: 798210000000, quote: 'TSLA', logo: 'tesla', color: '#e82127' }),
  asset({ id: 'AAPL', name: 'Apple Inc.', shortName: 'Apple', price: 336.19, change: 3.77, volume: 54190000, marketCap: 3440000000000, quote: 'AAPL', logo: 'apple', color: '#555555', description: 'Apple dise\u00f1a y comercializa dispositivos, software y servicios digitales. Su ecosistema incluye el iPhone, el Mac, el iPad y una amplia gama de servicios.' }),
  asset({ id: 'AMD', name: 'Advanced Micro Devices, Inc.', shortName: 'AMD', price: 543.84, change: 31.34, volume: 42680000, marketCap: 253710000000, quote: 'AMD', logo: 'advanced-micro-devices', color: '#151515' }),
  asset({ id: 'MSFT', name: 'Microsoft Corporation', shortName: 'Microsoft', price: 495.03, change: 4.73, volume: 21840000, marketCap: 3220000000000, quote: 'MSFT', logo: 'microsoft', color: '#00a4ef' }),
  asset({ id: 'AMZN', name: 'Amazon.com, Inc.', shortName: 'Amazon', price: 251.58, change: 5.62, volume: 37290000, marketCap: 2010000000000, quote: 'AMZN', logo: 'amazon', color: '#ff9900' }),
  asset({ id: 'META', name: 'Meta Platforms, Inc.', shortName: 'Meta', price: 676.76, change: 3.45, volume: 14590000, marketCap: 1420000000000, quote: 'META', logo: 'meta-platforms', color: '#0866ff' }),
  asset({ id: 'GOOGL', name: 'Alphabet Inc.', shortName: 'Alphabet', price: 345.89, change: 3.02, volume: 23510000, marketCap: 2020000000000, quote: 'GOOGL', logo: 'alphabet', color: '#4285f4' }),
  asset({ id: 'NFLX', name: 'Netflix, Inc.', shortName: 'Netflix', price: 75.33, change: -1.08, volume: 3100000, marketCap: 304000000000, quote: 'NFLX', logo: 'netflix', color: '#e50914' }),
  asset({ id: 'AVGO', name: 'Broadcom Inc.', shortName: 'Broadcom', price: 348.09, change: 8.58, volume: 22890000, marketCap: 840000000000, quote: 'AVGO', logo: 'broadcom', color: '#cc092f' }),
  asset({ id: 'ORCL', name: 'Oracle Corporation', shortName: 'Oracle', price: 148.91, change: 5.75, volume: 10200000, marketCap: 497000000000, quote: 'ORCL', logo: 'oracle', color: '#c74634' }),
  asset({ id: 'CRM', name: 'Salesforce, Inc.', shortName: 'Salesforce', price: 244.59, change: -5.51, volume: 4900000, marketCap: 275000000000, quote: 'CRM', logo: 'salesforce', color: '#00a1e0' }),
  asset({ id: 'JPM', name: 'JPMorgan Chase & Co.', shortName: 'JPMorgan', price: 350.1, change: 1.18, volume: 9100000, marketCap: 609000000000, quote: 'JPM', logo: 'jpmorgan-chase', color: '#003087', exchange: 'NYSE' }),
  asset({ id: 'BAC', name: 'Bank of America Corp.', shortName: 'Bank of America', price: 58.24, change: 0.34, volume: 41000000, marketCap: 322000000000, quote: 'BAC', logo: 'bank-of-america', color: '#012169', exchange: 'NYSE' }),
  asset({ id: 'XOM', name: 'Exxon Mobil Corporation', shortName: 'Exxon Mobil', price: 162.83, change: -0.49, volume: 16100000, marketCap: 520000000000, quote: 'XOM', logo: 'exxon-mobil', color: '#ff5f00', exchange: 'NYSE' }),
  asset({ id: 'WMT', name: 'Walmart Inc.', shortName: 'Walmart', price: 106.62, change: -0.89, volume: 17100000, marketCap: 641000000000, quote: 'WMT', logo: 'walmart', color: '#0071ce', exchange: 'NYSE' }),
  asset({ id: 'COST', name: 'Costco Wholesale Corp.', shortName: 'Costco', price: 891.72, change: -2.02, volume: 1700000, marketCap: 395000000000, quote: 'COST', logo: 'costco-wholesale', color: '#005dab' }),
  asset({ id: 'DIS', name: 'The Walt Disney Company', shortName: 'Disney', price: 105.72, change: -1.27, volume: 9800000, marketCap: 169000000000, quote: 'DIS', logo: 'disney', color: '#113ccf', exchange: 'NYSE' }),
  asset({ id: 'MCD', name: "McDonald's Corporation", shortName: 'McDonald\u2019s', price: 249.33, change: 0.76, volume: 3500000, marketCap: 210000000000, quote: 'MCD', logo: 'mcdonalds', color: '#ffbc0d', exchange: 'NYSE' }),
  asset({ id: 'KO', name: 'The Coca-Cola Company', shortName: 'Coca-Cola', price: 88.1, change: 0.22, volume: 12800000, marketCap: 304000000000, quote: 'KO', logo: 'coca-cola', color: '#f40009', exchange: 'NYSE' }),
  asset({ id: 'PEP', name: 'PepsiCo, Inc.', shortName: 'PepsiCo', price: 133.81, change: -0.53, volume: 6700000, marketCap: 236000000000, quote: 'PEP', logo: 'pepsico', color: '#004b93' }),
  asset({ id: 'UNH', name: 'UnitedHealth Group', shortName: 'UnitedHealth', price: 378.48, change: 3.22, volume: 3100000, marketCap: 512000000000, quote: 'UNH', logo: 'unitedhealth', color: '#a6192e', exchange: 'NYSE' }),
  asset({ id: 'JNJ', name: 'Johnson & Johnson', shortName: 'J&J', price: 269.58, change: 2.3, volume: 7300000, marketCap: 385000000000, quote: 'JNJ', logo: 'johnson-and-johnson', color: '#c8102e', exchange: 'NYSE' }),
  asset({ id: 'PFE', name: 'Pfizer Inc.', shortName: 'Pfizer', price: 27.68, change: 0.21, volume: 41000000, marketCap: 160000000000, quote: 'PFE', logo: 'pfizer', color: '#df1c31', exchange: 'NYSE' }),
  asset({ id: 'TMO', name: 'Thermo Fisher Scientific', shortName: 'Thermo Fisher', price: 661.41, change: 12.98, volume: 1300000, marketCap: 225000000000, quote: 'TMO', logo: 'thermo-fisher-scientific', color: '#f99d1c', exchange: 'NYSE' }),
  asset({ id: 'CAT', name: 'Caterpillar Inc.', shortName: 'Caterpillar', price: 795.72, change: 13, volume: 3000000, marketCap: 183000000000, quote: 'CAT', logo: 'caterpillar', color: '#ffce25', exchange: 'NYSE' }),
  asset({ id: 'GE', name: 'General Electric', shortName: 'GE', price: 315.33, change: 2.43, volume: 12000000, marketCap: 188000000000, quote: 'GE', logo: 'general-electric', color: '#2656c9', exchange: 'NYSE' }),
  asset({ id: 'BA', name: 'The Boeing Company', shortName: 'Boeing', price: 198.18, change: -3.78, volume: 8800000, marketCap: 113000000000, quote: 'BA', logo: 'boeing', color: '#003479', exchange: 'NYSE' }),
  asset({ id: 'IBM', name: 'IBM Corporation', shortName: 'IBM', price: 238.67, change: 1.18, volume: 4300000, marketCap: 209000000000, quote: 'IBM', logo: 'ibm', color: '#054ada', exchange: 'NYSE' }),
  asset({ id: 'MU', name: 'Micron Technology', shortName: 'Micron', price: 976.02, change: 49.47, volume: 28100000, marketCap: 116000000000, quote: 'MU', logo: 'micron-technology', color: '#0f4db8' }),
  asset({ id: 'QCOM', name: 'Qualcomm Incorporated', shortName: 'Qualcomm', price: 189.28, change: 4.44, volume: 8200000, marketCap: 184000000000, quote: 'QCOM', logo: 'qualcomm', color: '#8a2be2' }),
  asset({ id: 'INTC', name: 'Intel Corporation', shortName: 'Intel', price: 110.77, change: 9.72, volume: 42000000, marketCap: 101000000000, quote: 'INTC', logo: 'intel', color: '#0068b5' }),
  asset({ id: 'T', name: 'AT&T Inc.', shortName: 'AT&T', price: 25.41, change: -0.45, volume: 32000000, marketCap: 159000000000, quote: 'T', logo: 'at-and-t', color: '#00a8e0', exchange: 'NYSE' }),
  asset({ id: 'VZ', name: 'Verizon Communications', shortName: 'Verizon', price: 48.58, change: -1.18, volume: 20100000, marketCap: 179000000000, quote: 'VZ', logo: 'verizon', color: '#cd040b', exchange: 'NYSE' }),
  asset({ id: 'NKE', name: 'Nike, Inc.', shortName: 'Nike', price: 36.38, change: 0.59, volume: 9800000, marketCap: 117000000000, quote: 'NKE', logo: 'nike', color: '#111111', exchange: 'NYSE' }),
  asset({ id: 'SBUX', name: 'Starbucks Corporation', shortName: 'Starbucks', price: 97.25, change: -0.09, volume: 10900000, marketCap: 110000000000, quote: 'SBUX', logo: 'starbucks', color: '#00704a' }),
  asset({ id: 'UBER', name: 'Uber Technologies', shortName: 'Uber', price: 70.98, change: 0.01, volume: 19800000, marketCap: 152000000000, quote: 'UBER', logo: 'uber', color: '#000000', exchange: 'NYSE' }),
  asset({ id: 'PYPL', name: 'PayPal Holdings', shortName: 'PayPal', price: 53.23, change: 0.52, volume: 8300000, marketCap: 78900000000, quote: 'PYPL', logo: 'paypal', color: '#003087' }),
  asset({ id: 'V', name: 'Visa Inc.', shortName: 'Visa', price: 371.42, change: 0.49, volume: 5200000, marketCap: 544000000000, quote: 'V', logo: 'visa', color: '#1a1f71', exchange: 'NYSE' }),
  asset({ id: 'MA', name: 'Mastercard Incorporated', shortName: 'Mastercard', price: 568.05, change: 0.3, volume: 2400000, marketCap: 456000000000, quote: 'MA', logo: 'mastercard', color: '#eb001b', exchange: 'NYSE' }),
  asset({ id: 'TTWO', name: 'Take-Two Interactive Software', shortName: 'Take-Two', price: 210.47, change: -1.34, volume: 2400000, marketCap: 36500000000, quote: 'TTWO', logo: '', color: '#1a1a2e', exchange: 'NASDAQ', description: 'Desarrollador de videojuegos editor de franquicias como Grand Theft Auto, NBA 2K y Red Dead Redemption. El lanzamiento de GTA VI est\u00e1 previsto para finales de 2026.' }),

  // ── Acciones (Europa) ────────────────────────────────────────────────────
  asset({ id: 'SAN', name: 'Banco Santander, S.A.', shortName: 'Santander', price: 12.95, change: 0.26, volume: 32800000, marketCap: 70200000000, quote: 'SAN.MC', logo: 'santander', color: '#ec0000', exchange: 'BME', currency: 'EUR', region: 'europe' }),
  asset({ id: 'IBE', name: 'Iberdrola, S.A.', shortName: 'Iberdrola', price: 20.52, change: 0.28, volume: 8200000, marketCap: 87100000000, quote: 'IBE.MC', logo: 'iberdrola', exchange: 'BME', currency: 'EUR', region: 'europe' }),
  asset({ id: 'BBVA', name: 'Banco Bilbao Vizcaya', shortName: 'BBVA', price: 25.14, change: 0.42, volume: 21200000, marketCap: 58700000000, quote: 'BBVA.MC', logo: 'bbva', color: '#072146', exchange: 'BME', currency: 'EUR', region: 'europe' }),
  asset({ id: 'TEF', name: 'Telef\u00f3nica, S.A.', shortName: 'Telef\u00f3nica', price: 3.75, change: 0.04, volume: 15300000, marketCap: 22700000000, quote: 'TEF.MC', logo: 'telefonica', color: '#1998ff', exchange: 'BME', currency: 'EUR', region: 'europe' }),
  asset({ id: 'ITX', name: 'Industria de Dise\u00f1o Textil', shortName: 'Inditex', price: 52.4, change: -0.38, volume: 4200000, marketCap: 143000000000, quote: 'ITX.MC', logo: 'inditex', color: '#111111', exchange: 'BME', currency: 'EUR', region: 'europe' }),
  asset({ id: 'ASML', name: 'ASML Holding N.V.', shortName: 'ASML', price: 1418, change: 21.8, volume: 760000, marketCap: 317000000000, quote: 'ASML.AS', logo: 'asml', color: '#000000', exchange: 'AMS', currency: 'EUR', region: 'europe' }),
  asset({ id: 'SAP', name: 'SAP SE', shortName: 'SAP', price: 188, change: 1.44, volume: 1500000, marketCap: 230000000000, quote: 'SAP.DE', logo: 'sap', color: '#0faa41', exchange: 'XETR', currency: 'EUR', region: 'europe' }),
  asset({ id: 'SIE', name: 'Siemens AG', shortName: 'Siemens', price: 266.6, change: 6.1, volume: 1300000, marketCap: 147000000000, quote: 'SIE.DE', logo: 'siemens', color: '#009999', exchange: 'XETR', currency: 'EUR', region: 'europe' }),
  asset({ id: 'BAS', name: 'BASF SE', shortName: 'BASF', price: 52.37, change: 0.24, volume: 1900000, marketCap: 40700000000, quote: 'BAS.DE', logo: 'basf', color: '#0f8b5e', exchange: 'XETR', currency: 'EUR', region: 'europe' }),
  asset({ id: 'OR', name: 'L\u2019Or\u00e9al S.A.', shortName: 'L\u2019Or\u00e9al', price: 380.1, change: -1.8, volume: 480000, marketCap: 225000000000, quote: 'OR.PA', logo: 'l-oreal', color: '#020430', exchange: 'EPA', currency: 'EUR', region: 'europe' }),
  asset({ id: 'MC', name: 'LVMH Mo\u00ebt Hennessy', shortName: 'LVMH', price: 412.3, change: 1.35, volume: 510000, marketCap: 326000000000, quote: 'MC.PA', logo: 'lvmh', color: '#111111', exchange: 'EPA', currency: 'EUR', region: 'europe' }),
  asset({ id: 'HSBC', name: 'HSBC Holdings', shortName: 'HSBC', price: 6.74, change: 0.45, volume: 14000000, marketCap: 125000000000, quote: 'HSBC.US', logo: 'hsbc', color: '#db0011', exchange: 'NYSE', region: 'europe' }),

  // ── Acciones (Asia y Latam) ──────────────────────────────────────────────
  asset({ id: 'TSM', name: 'Taiwan Semiconductor', shortName: 'TSMC', price: 429.7, change: 11.98, volume: 11200000, marketCap: 890000000000, quote: 'TSM', logo: 'tsmc', color: '#005ea8', exchange: 'NYSE', region: 'asia' }),
  asset({ id: 'BABA', name: 'Alibaba Group', shortName: 'Alibaba', price: 108.49, change: 1.22, volume: 16300000, marketCap: 199000000000, quote: 'BABA', logo: 'alibaba-group', color: '#ff6a00', exchange: 'NYSE', region: 'asia' }),
  asset({ id: 'PDD', name: 'PDD Holdings', shortName: 'PDD', price: 78.14, change: -0.62, volume: 9800000, marketCap: 149000000000, quote: 'PDD', logo: 'pinduoduo', color: '#e02e24', exchange: 'NASDAQ', region: 'asia' }),
  asset({ id: '0700.HK', name: 'Tencent Holdings', shortName: 'Tencent', price: 426, change: -7.4, volume: 9800000, marketCap: 370000000000, quote: '0700.HK', logo: 'tencent', color: '#00a8ec', exchange: 'HKEX', currency: 'HKD', region: 'asia' }),
  asset({ id: 'SONY', name: 'Sony Group', shortName: 'Sony', price: 23.81, change: 0.08, volume: 1100000, marketCap: 117000000000, quote: 'SONY', logo: 'sony', color: '#000000', exchange: 'NYSE', currency: 'USD', region: 'asia' }),
  asset({ id: 'VALE', name: 'Vale S.A.', shortName: 'Vale', price: 14.5, change: 0.37, volume: 35200000, marketCap: 43700000000, quote: 'VALE', logo: 'vale', color: '#005daa', exchange: 'NYSE', region: 'latam' }),
  asset({ id: 'PETR4.SA', name: 'Petrobras', shortName: 'Petrobras', price: 48.82, change: 0.17, volume: 13200000, marketCap: 96000000000, quote: 'PETR4.SA', logo: 'petrobras', color: '#009739', exchange: 'B3', currency: 'BRL', region: 'latam' }),
  asset({ id: 'WALMEX.MX', name: 'Walmex', shortName: 'Walmex', price: 46, change: 0.46, volume: 8900000, marketCap: 57700000000, quote: 'WALMEX.MX', logo: 'walmart', color: '#0071ce', exchange: 'BMV', currency: 'MXN', region: 'latam' }),

  // ── Criptomonedas ────────────────────────────────────────────────────────
  asset({ id: 'BTCUSD', symbol: 'BTCUSD', name: 'Bitcoin', category: 'crypto', price: 76528.79, change: 384.98, volume: 31200000000, marketCap: 1250000000000, quote: 'BTC-USD', logo: 'crypto/XTVCBTC', color: '#f7931a', exchange: 'CRYPTO', region: 'global', description: 'Bitcoin es una red de pagos descentralizada y la primera criptomoneda. Su oferta est\u00e1 limitada a 21 millones de unidades y funciona sin una autoridad central.' }),
  asset({ id: 'ETHUSD', name: 'Ethereum', category: 'crypto', price: 2450.54, change: 34.4, volume: 16400000000, marketCap: 317000000000, quote: 'ETH-USD', logo: 'crypto/XTVCETH', color: '#627eea', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'SOLUSD', name: 'Solana', category: 'crypto', price: 100.81, change: 2.18, volume: 2840000000, marketCap: 68900000000, quote: 'SOL-USD', logo: 'crypto/XTVCSOL', color: '#9945ff', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'BNBUSD', name: 'BNB', category: 'crypto', price: 727.68, change: 2.11, volume: 1630000000, marketCap: 86000000000, quote: 'BNB-USD', logo: 'crypto/XTVCBNB', color: '#f3ba2f', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'XRPUSD', name: 'XRP', category: 'crypto', price: 1.29, change: 0, volume: 940000000, marketCap: 33200000000, quote: 'XRP-USD', logo: 'crypto/XTVCXRP', color: '#23292f', exchange: 'CRYPTO', region: 'global', decimals: 4 }),
  asset({ id: 'DOGEUSD', name: 'Dogecoin', category: 'crypto', price: 0.08, change: 0, volume: 515000000, marketCap: 15800000000, quote: 'DOGE-USD', logo: 'crypto/XTVCDOGE', color: '#c2a633', exchange: 'CRYPTO', region: 'global', decimals: 4 }),
  asset({ id: 'ADAUSD', name: 'Cardano', category: 'crypto', price: 0.2, change: 0.01, volume: 278000000, marketCap: 12500000000, quote: 'ADA-USD', logo: 'crypto/XTVCADA', color: '#0033ad', exchange: 'CRYPTO', region: 'global', decimals: 4 }),
  asset({ id: 'AVAXUSD', name: 'Avalanche', category: 'crypto', price: 7.59, change: 0.12, volume: 315000000, marketCap: 11500000000, quote: 'AVAX-USD', logo: 'crypto/XTVCAVAX', color: '#e84142', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'LINKUSD', name: 'Chainlink', category: 'crypto', price: 11.31, change: 0.27, volume: 342000000, marketCap: 7600000000, quote: 'LINK-USD', logo: 'crypto/XTVCLINK', color: '#2a5ada', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'DOTUSD', name: 'Polkadot', category: 'crypto', price: 1.07, change: 0.05, volume: 82000000, marketCap: 6300000000, quote: 'DOT-USD', logo: 'crypto/XTVCX', color: '#e6007a', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'LTCUSD', name: 'Litecoin', category: 'crypto', price: 53.4, change: 1.72, volume: 264000000, marketCap: 5000000000, quote: 'LTC-USD', logo: 'crypto/XTVCLTC', color: '#345d9d', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'UNIUSD', name: 'Uniswap', category: 'crypto', price: 0, change: 0, volume: 127000000, marketCap: 4500000000, quote: 'UNI-USD', logo: 'crypto/XTVCNI', color: '#ff007a', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'ATOMUSD', name: 'Cosmos', category: 'crypto', price: 1.55, change: 0.03, volume: 82000000, marketCap: 1800000000, quote: 'ATOM-USD', logo: 'crypto/XTVCTOOM', color: '#2e3148', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'XLMUSD', name: 'Stellar', category: 'crypto', price: 0.18, change: 0, volume: 41200000, marketCap: 2700000000, quote: 'XLM-USD', logo: 'crypto/XTVCXLM', color: '#000000', exchange: 'CRYPTO', region: 'global', decimals: 4 }),
  asset({ id: 'TRXUSD', name: 'TRON', category: 'crypto', price: 0.33, change: 0, volume: 61000000, marketCap: 12600000000, quote: 'TRX-USD', logo: 'crypto/XTVCTRX', color: '#eb0029', exchange: 'CRYPTO', region: 'global', decimals: 4 }),
  asset({ id: 'SHIBUSD', name: 'Shiba Inu', category: 'crypto', price: 0, change: 0, volume: 38500000, marketCap: 7700000000, quote: 'SHIB-USD', logo: 'crypto/', color: '#fda400', exchange: 'CRYPTO', region: 'global', decimals: 7 }),
  asset({ id: 'NEARUSD', name: 'NEAR Protocol', category: 'crypto', price: 2.97, change: 0.36, volume: 180000000, marketCap: 6000000000, quote: 'NEAR-USD', logo: 'crypto/', color: '#000000', exchange: 'CRYPTO', region: 'global' }),
  asset({ id: 'SUIUSD', name: 'Sui', category: 'crypto', price: 0, change: 0, volume: 52000000, marketCap: 2900000000, quote: 'SUI-USD', logo: 'crypto/', color: '#4da2ff', exchange: 'CRYPTO', region: 'global' }),

  // ── Divisas ──────────────────────────────────────────────────────────────
  asset({ id: 'EURUSD', symbol: 'EURUSD', name: 'Euro / D\u00f3lar estadounidense', shortName: 'EUR/USD', category: 'forex', price: 1.1477, change: 0, decimals: 4, quote: 'EURUSD=X', logo: 'country/EU', color: '#234ca0', exchange: 'FX', region: 'global', volume: 854000000 }),
  asset({ id: 'GBPUSD', name: 'Libra / D\u00f3lar estadounidense', shortName: 'GBP/USD', category: 'forex', price: 1.34, change: 0, decimals: 4, quote: 'GBPUSD=X', logo: 'country/GB', exchange: 'FX', region: 'global', volume: 431000000 }),
  asset({ id: 'USDJPY', name: 'D\u00f3lar estadounidense / Yen', shortName: 'USD/JPY', category: 'forex', price: 156.03, change: -0.19, quote: 'JPY=X', logo: 'country/JP', exchange: 'FX', region: 'global', volume: 682000000 }),
  asset({ id: 'AUDUSD', name: 'D\u00f3lar australiano / D\u00f3lar', shortName: 'AUD/USD', category: 'forex', price: 0.71, change: 0, decimals: 4, quote: 'AUDUSD=X', logo: 'country/AU', exchange: 'FX', region: 'global', volume: 246000000 }),
  asset({ id: 'USDCAD', name: 'D\u00f3lar estadounidense / D\u00f3lar canadiense', shortName: 'USD/CAD', category: 'forex', price: 1.4, change: 0, decimals: 4, quote: 'CAD=X', logo: 'country/CA', exchange: 'FX', region: 'global', volume: 312000000 }),
  asset({ id: 'USDCHF', name: 'D\u00f3lar estadounidense / Franco suizo', shortName: 'USD/CHF', category: 'forex', price: 0.82, change: 0, decimals: 4, quote: 'CHF=X', logo: 'country/CH', exchange: 'FX', region: 'global', volume: 198000000 }),
  asset({ id: 'NZDUSD', name: 'D\u00f3lar neozeland\u00e9s / D\u00f3lar', shortName: 'NZD/USD', category: 'forex', price: 0.57, change: 0, decimals: 4, quote: 'NZDUSD=X', logo: 'country/NZ', exchange: 'FX', region: 'global', volume: 62000000 }),
  asset({ id: 'EURGBP', name: 'Euro / Libra', shortName: 'EUR/GBP', category: 'forex', price: 0.86, change: 0, decimals: 4, quote: 'EURGBP=X', logo: 'country/EU', exchange: 'FX', region: 'global', volume: 88000000 }),
  asset({ id: 'EURJPY', name: 'Euro / Yen', shortName: 'EUR/JPY', category: 'forex', price: 179.06, change: -0.04, quote: 'EURJPY=X', logo: 'country/EU', exchange: 'FX', region: 'global', volume: 118000000 }),
  asset({ id: 'GBPJPY', name: 'Libra / Yen', shortName: 'GBP/JPY', category: 'forex', price: 208.33, change: -0.67, quote: 'GBPJPY=X', logo: 'country/GB', exchange: 'FX', region: 'global', volume: 46000000 }),
  asset({ id: 'USDMXN', name: 'D\u00f3lar estadounidense / Peso mexicano', shortName: 'USD/MXN', category: 'forex', price: 17.18, change: -0.06, decimals: 3, quote: 'MXN=X', logo: 'country/MX', exchange: 'FX', region: 'latam', volume: 54000000 }),
  asset({ id: 'USDBRL', name: 'D\u00f3lar estadounidense / Real', shortName: 'USD/BRL', category: 'forex', price: 5.14, change: 0, decimals: 4, quote: 'BRL=X', logo: 'country/BR', exchange: 'FX', region: 'latam', volume: 32000000 }),
  asset({ id: 'USDCNH', name: 'D\u00f3lar estadounidense / Yuan offshore', shortName: 'USD/CNH', category: 'forex', price: 6.7, change: -0.01, decimals: 4, quote: 'CNH=X', logo: 'country/CN', exchange: 'FX', region: 'asia', volume: 41000000 }),

  // ── Futuros y materias primas ────────────────────────────────────────────
  asset({ id: 'GC1!', name: 'Futuros del oro', shortName: 'Oro', category: 'futures', price: 4390.5, change: 3, quote: 'GC=F', logo: 'metal/gold', color: '#d6ad52', exchange: 'COMEX', region: 'global', volume: 224000 }),
  asset({ id: 'SI1!', name: 'Futuros de la plata', shortName: 'Plata', category: 'futures', price: 65.88, change: 0.96, quote: 'SI=F', logo: 'metal/silver', exchange: 'COMEX', region: 'global', volume: 94000 }),
  asset({ id: 'CL1!', name: 'Petr\u00f3leo crudo WTI', shortName: 'Petr\u00f3leo WTI', category: 'futures', price: 101.83, change: -0.6, quote: 'CL=F', logo: 'crude-oil', exchange: 'NYMEX', region: 'global', volume: 534000 }),
  asset({ id: 'BZ1!', name: 'Petr\u00f3leo Brent', shortName: 'Brent', category: 'futures', price: 104.64, change: -1.19, quote: 'BZ=F', logo: 'crude-oil', color: '#1c3f60', exchange: 'ICE', region: 'global', volume: 389000 }),
  asset({ id: 'NG1!', name: 'Futuros del gas natural', shortName: 'Gas natural', category: 'futures', price: 2.89, change: 0, quote: 'NG=F', logo: 'natural-gas', exchange: 'NYMEX', region: 'global', volume: 241000 }),
  asset({ id: 'HG1!', name: 'Futuros del cobre', shortName: 'Cobre', category: 'futures', price: 6.62, change: 0.11, quote: 'HG=F', logo: 'metal/copper', exchange: 'COMEX', region: 'global', volume: 87000 }),
  asset({ id: 'PL1!', name: 'Futuros del platino', shortName: 'Platino', category: 'futures', price: 1786.1, change: 0.2, quote: 'PL=F', logo: 'metal/platinum', exchange: 'NYMEX', region: 'global', volume: 21000 }),
  asset({ id: 'PA1!', name: 'Futuros del paladio', shortName: 'Paladio', category: 'futures', price: 1298.5, change: -14.9, quote: 'PA=F', logo: 'metal/palladium', exchange: 'NYMEX', region: 'global', volume: 9000 }),
  asset({ id: 'ZC1!', name: 'Futuros del ma\u00edz', shortName: 'Ma\u00edz', category: 'futures', price: 531, change: -3.25, quote: 'ZC=F', logo: 'grain/corn', exchange: 'CBOT', region: 'global', volume: 115000 }),
  asset({ id: 'ZW1!', name: 'Futuros del trigo', shortName: 'Trigo', category: 'futures', price: 725.75, change: -5, quote: 'ZW=F', logo: 'grain/wheat', exchange: 'CBOT', region: 'global', volume: 86000 }),
  asset({ id: 'ZS1!', name: 'Futuros de la soja', shortName: 'Soja', category: 'futures', price: 1319.5, change: -1, quote: 'ZS=F', logo: 'grain/soybean', exchange: 'CBOT', region: 'global', volume: 74000 }),
  asset({ id: 'KC1!', name: 'Futuros del caf\u00e9', shortName: 'Caf\u00e9', category: 'futures', price: 276.75, change: -4.8, quote: 'KC=F', logo: 'softs/coffee', exchange: 'ICE', region: 'global', volume: 49000 }),
  asset({ id: 'SB1!', name: 'Futuros del az\u00facar', shortName: 'Az\u00facar', category: 'futures', price: 18.32, change: -0.57, quote: 'SB=F', logo: 'softs/sugar', exchange: 'ICE', region: 'global', volume: 61000 }),
  asset({ id: 'CC1!', name: 'Futuros del cacao', shortName: 'Cacao', category: 'futures', price: 5620, change: -359, quote: 'CC=F', logo: 'softs/cocoa', exchange: 'ICE', region: 'global', volume: 28000 }),
  asset({ id: 'CT1!', name: 'Futuros del algod\u00f3n', shortName: 'Algod\u00f3n', category: 'futures', price: 82.68, change: -1.8, quote: 'CT=F', logo: 'softs/cotton', exchange: 'ICE', region: 'global', volume: 39000 }),
  asset({ id: 'LE1!', name: 'Futuros del ganado', shortName: 'Ganado', category: 'futures', price: 216.2, change: -4, quote: 'LE=F', logo: 'livestock/cattle', exchange: 'CME', region: 'global', volume: 43000 }),
  asset({ id: 'QO1!', name: 'Futuros de la gasolina', shortName: 'Gasolina', category: 'futures', price: 3.25, change: 0.01, quote: 'RB=F', logo: 'energy/gasoline', exchange: 'NYMEX', region: 'global', volume: 71000 }),

  // ── Bonos y renta fija ───────────────────────────────────────────────────
  asset({ id: 'US10Y', name: 'Bonos de EE. UU. a 10 a\u00f1os', shortName: 'EE. UU. 10A', category: 'bonds', price: 4.95, change: -0.06, quote: '^TNX', logo: 'country/US', exchange: 'TVC', currency: '%', volume: 0 }),
  asset({ id: 'US2Y', name: 'Bonos de EE. UU. a 2 a\u00f1os', shortName: 'EE. UU. 2A', category: 'bonds', price: 3.97, change: -0.01, quote: '^IRX', logo: 'country/US', exchange: 'TVC', currency: '%', volume: 0 }),
  asset({ id: 'US30Y', name: 'Bonos de EE. UU. a 30 a\u00f1os', shortName: 'EE. UU. 30A', category: 'bonds', price: 5.3, change: -0.05, quote: '^TYX', logo: 'country/US', exchange: 'TVC', currency: '%', volume: 0 }),
  asset({ id: 'DE10Y', name: 'Bonos de Alemania a 10 a\u00f1os', shortName: 'Alemania 10A', category: 'bonds', price: 2.18, change: 0.14, quote: '^DE10Y', logo: 'country/DE', exchange: 'TVC', currency: '%', region: 'europe', volume: 0 }),
  asset({ id: 'ES10Y', name: 'Bonos de Espa\u00f1a a 10 a\u00f1os', shortName: 'Espa\u00f1a 10A', category: 'bonds', price: 3.01, change: -0.07, quote: '^ES10Y_DEM', logo: 'country/ES', exchange: 'TVC', currency: '%', region: 'europe', volume: 0 }),
  asset({ id: 'GB10Y', name: 'Bonos del Reino Unido a 10 a\u00f1os', shortName: 'Reino Unido 10A', category: 'bonds', price: 3.95, change: 0.13, quote: '^UK10Y_DEM', logo: 'country/GB', exchange: 'TVC', currency: '%', region: 'europe', volume: 0 }),

  // ── ETFs ─────────────────────────────────────────────────────────────────
  asset({ id: 'SPY', name: 'SPDR S&P 500 ETF Trust', shortName: 'SPDR S&P 500', category: 'etfs', price: 762.42, change: 8.37, quote: 'SPY', logo: 'spdr-sandp500-etf-tr', exchange: 'AMEX', volume: 47300000, marketCap: 584000000000 }),
  asset({ id: 'QQQ', name: 'Invesco QQQ Trust', shortName: 'Invesco QQQ', category: 'etfs', price: 716.25, change: 11.53, quote: 'QQQ', logo: 'invesco', exchange: 'NASDAQ', volume: 29600000, marketCap: 297000000000 }),
  asset({ id: 'VOO', name: 'Vanguard S&P 500 ETF', shortName: 'Vanguard S&P 500', category: 'etfs', price: 700.87, change: 7.63, quote: 'VOO', logo: 'vanguard', exchange: 'AMEX', volume: 4200000, marketCap: 518000000000 }),
  asset({ id: 'IWM', name: 'iShares Russell 2000 ETF', shortName: 'iShares Russell 2000', category: 'etfs', price: 286.07, change: 2.15, quote: 'IWM', logo: 'ishares', exchange: 'AMEX', volume: 18200000, marketCap: 69400000000 }),
  asset({ id: 'DIA', name: 'SPDR Dow Jones ETF', shortName: 'SPDR DJIA', category: 'etfs', price: 518.43, change: 3.21, quote: 'DIA', logo: 'spdr-dow-jones', exchange: 'AMEX', volume: 3300000, marketCap: 38000000000 }),
  asset({ id: 'VTI', name: 'Vanguard Total Stock Market', shortName: 'Vanguard Total', category: 'etfs', price: 375.25, change: 3.99, quote: 'VTI', logo: 'vanguard', exchange: 'AMEX', volume: 3800000, marketCap: 430000000000 }),
  asset({ id: 'XLK', name: 'Technology Select Sector SPDR', shortName: 'XLK Tecnolog\u00eda', category: 'etfs', price: 188.06, change: 4.13, quote: 'XLK', logo: 'spdr', exchange: 'AMEX', volume: 9800000, marketCap: 72000000000 }),
  asset({ id: 'XLF', name: 'Financial Select Sector SPDR', shortName: 'XLF Financiero', category: 'etfs', price: 55.99, change: 0.05, quote: 'XLF', logo: 'spdr', exchange: 'AMEX', volume: 39100000, marketCap: 48000000000 }),
  asset({ id: 'XLE', name: 'Energy Select Sector SPDR', shortName: 'XLE Energ\u00eda', category: 'etfs', price: 64.43, change: 0.39, quote: 'XLE', logo: 'spdr', exchange: 'AMEX', volume: 20300000, marketCap: 38000000000 }),
  asset({ id: 'XLV', name: 'Health Care Select Sector SPDR', shortName: 'XLV Salud', category: 'etfs', price: 168.9, change: 1.13, quote: 'XLV', logo: 'spdr', exchange: 'AMEX', volume: 7100000, marketCap: 35000000000 }),
  asset({ id: 'GLD', name: 'SPDR Gold Shares', shortName: 'GLD Oro', category: 'etfs', price: 398.86, change: 7.12, quote: 'GLD', logo: 'spdr-gold', color: '#c9a227', exchange: 'AMEX', volume: 6700000, marketCap: 62000000000 }),
  asset({ id: 'SLV', name: 'iShares Silver Trust', shortName: 'SLV Plata', category: 'etfs', price: 59.02, change: 1.97, quote: 'SLV', logo: 'ishares', color: '#8896a6', exchange: 'AMEX', volume: 24100000, marketCap: 15000000000 }),
  asset({ id: 'USO', name: 'United States Oil Fund', shortName: 'USO Petr\u00f3leo', category: 'etfs', price: 156.19, change: 0.02, quote: 'USO', logo: 'us-oil-fund', exchange: 'AMEX', volume: 19000000, marketCap: 1800000000 }),
  asset({ id: 'TLT', name: 'iShares 20+ Year Treasury', shortName: 'TLT Bonos', category: 'etfs', price: 81.65, change: 0.77, quote: 'TLT', logo: 'ishares', exchange: 'NASDAQ', volume: 18400000, marketCap: 50000000000 }),
  asset({ id: 'IEF', name: 'iShares 7-10 Year Treasury', shortName: 'IEF Bonos', category: 'etfs', price: 91.16, change: 0.42, quote: 'IEF', logo: 'ishares', exchange: 'NASDAQ', volume: 7800000, marketCap: 26000000000 }),
  asset({ id: 'EEM', name: 'iShares MSCI Emerging Markets', shortName: 'iShares Emergentes', category: 'etfs', price: 67, change: 1.28, quote: 'EEM', logo: 'ishares', exchange: 'NYSE', volume: 15200000, marketCap: 19000000000 }),
  asset({ id: 'VEA', name: 'Vanguard FTSE Developed Markets', shortName: 'Vanguard Desarrollados', category: 'etfs', price: 72.14, change: 0.88, quote: 'VEA', logo: 'vanguard', exchange: 'AMEX', volume: 4100000, marketCap: 22000000000 }),
  asset({ id: 'ARKK', name: 'ARK Innovation ETF', shortName: 'ARKK Innovaci\u00f3n', category: 'etfs', price: 86.82, change: 3.64, quote: 'ARKK', logo: 'ark-invest', color: '#e84545', exchange: 'AMEX', volume: 8900000, marketCap: 7700000000 }),
  asset({ id: 'EWZ', name: 'iShares MSCI Brazil', shortName: 'EWZ Brasil', category: 'etfs', price: 37.8, change: 0.32, quote: 'EWZ', logo: 'ishares', exchange: 'NYSE', volume: 28400000, marketCap: 9600000000, region: 'latam' }),
  asset({ id: 'FXI', name: 'iShares China Large-Cap', shortName: 'FXI China', category: 'etfs', price: 34.22, change: 0.3, quote: 'FXI', logo: 'ishares', exchange: 'NYSE', volume: 62000000, marketCap: 7500000000, region: 'asia' }),
];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'overview', label: 'Resumen' },
  { id: 'stocks', label: 'Acciones' },
  { id: 'crypto', label: 'Criptomonedas' },
  { id: 'indices', label: '\u00cdndices' },
  { id: 'forex', label: 'Forex' },
  { id: 'futures', label: 'Futuros' },
  { id: 'bonds', label: 'Bonos' },
  { id: 'etfs', label: 'ETF' },
];

export const CATEGORY_HEADINGS: Record<Category, string> = {
  overview: 'El mundo, de un vistazo',
  stocks: 'Las protagonistas de la bolsa',
  crypto: 'El pulso del universo cripto',
  indices: '\u00cdndices de todo el mundo',
  forex: 'Un mundo de divisas',
  futures: 'Las materias primas, al d\u00eda',
  bonds: 'Una mirada a la renta fija',
  etfs: 'Todo un mercado en un activo',
};

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'us', label: 'Estados Unidos' },
  { id: 'europe', label: 'Europa' },
  { id: 'asia', label: 'Asia' },
  { id: 'apac', label: 'Asia-Pac\u00edfico' },
  { id: 'latam', label: 'Latinoam\u00e9rica' },
];

export function getAsset(id: string): Asset {
  return ASSETS.find((item) => item.id === id) ?? ASSETS[0];
}

export function getAssetRaw(id: string): Asset | undefined {
  return ASSETS.find((item) => item.id === id);
}

export function formatPrice(value: number, decimals = 2): string {
  const [integer, fraction] = value.toFixed(decimals).split('.');
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (fraction ? `,${fraction}` : '');
}

export function formatChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${formatPrice(value)}%`;
}

export function formatCompact(value: number): string {
  if (!value) return '-';
  const units: [number, string][] = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  const unit = units.find(([limit]) => value >= limit);
  return unit ? `${formatPrice(value / unit[0])} ${unit[1]}` : formatPrice(value, 0);
}

export function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'ahora mismo';
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return 'ayer';
}

export interface Article {
  id: number | string;
  category: string;
  title: string;
  summary: string;
  image: string;
  alt: string;
  time: string;
  readTime: string;
  assetId: string;
  body: string[];
  source?: string;
  url?: string;
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    category: 'Mercados',
    title: 'Wall Street avanza con la mirada puesta en la Reserva Federal',
    summary: 'Los grandes \u00edndices toman impulso mientras los inversores buscan pistas sobre el rumbo de los tipos de inter\u00e9s.',
    image: 'https://images.pexels.com/photos/36050277/pexels-photo-36050277.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    alt: 'Fachada de la Bolsa de Nueva York con banderas estadounidenses',
    time: 'Hace 32 min',
    readTime: '3 min',
    assetId: 'SPX',
    body: [
      'La pol\u00edtica monetaria sigue siendo uno de los principales focos de atenci\u00f3n para los mercados. Las expectativas sobre los tipos de inter\u00e9s influyen en las valoraciones de las empresas y en la distribuci\u00f3n del capital entre sectores.',
      'El S&P 500 ofrece una visi\u00f3n amplia del mercado estadounidense. Junto al Nasdaq 100 y al Dow Jones, permite comparar el comportamiento de las grandes tecnol\u00f3gicas con el de la econom\u00eda m\u00e1s tradicional.',
      'Para seguir la pr\u00f3xima sesi\u00f3n, los inversores prestan especial atenci\u00f3n a los datos de inflaci\u00f3n, empleo y actividad econ\u00f3mica. Ning\u00fan indicador aislado cuenta toda la historia: el contexto y el horizonte temporal son fundamentales.',
    ],
  },
  {
    id: 2,
    category: 'Cripto',
    title: 'Bitcoin recupera terreno y vuelve a despertar el inter\u00e9s del mercado',
    summary: 'El activo digital lidera una nueva jornada de movimientos en el ecosistema cripto.',
    image: 'https://images.pexels.com/photos/38697057/pexels-photo-38697057.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    alt: 'Una moneda dorada de Bitcoin sobre un fondo oscuro',
    time: 'Hace 1 h',
    readTime: '4 min',
    assetId: 'BTCUSD',
    body: [
      'Bitcoin concentra una parte importante de la capitalizaci\u00f3n del mercado de criptomonedas. Sus movimientos suelen marcar el tono para otros activos digitales, aunque cada proyecto tiene sus propias din\u00e1micas.',
      'El volumen de negociaci\u00f3n, la liquidez y los flujos hacia productos cotizados son algunas de las variables que observan los participantes. La volatilidad puede ser elevada incluso en periodos de aparente estabilidad.',
      'El mercado cripto opera las 24 horas, los siete d\u00edas de la semana. Definir un horizonte de inversi\u00f3n y conocer los riesgos resulta especialmente importante en este entorno.',
    ],
  },
  {
    id: 3,
    category: 'Tecnolog\u00eda',
    title: 'La inteligencia artificial mantiene a los chips en el centro de todas las miradas',
    summary: 'La inversi\u00f3n en centros de datos transforma las perspectivas del sector de semiconductores.',
    image: 'https://images.pexels.com/photos/6636463/pexels-photo-6636463.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    alt: 'Detalle de un procesador y los circuitos de una placa base',
    time: 'Hace 2 h',
    readTime: '5 min',
    assetId: 'NVDA',
    body: [
      'La demanda de capacidad de computaci\u00f3n est\u00e1 redefiniendo el sector tecnol\u00f3gico. Los fabricantes de chips, proveedores de infraestructura y grandes plataformas en la nube forman parte de una cadena cada vez m\u00e1s interconectada.',
      'NVIDIA y AMD participan en el mercado de aceleradores, mientras otras compa\u00f1\u00edas desarrollan soluciones especializadas. La competencia y los ciclos de inversi\u00f3n son factores clave a la hora de valorar sus perspectivas.',
      'Adem\u00e1s del crecimiento de los ingresos, los analistas observan los m\u00e1rgenes, la capacidad de producci\u00f3n y la concentraci\u00f3n de clientes. La innovaci\u00f3n abre oportunidades, pero no elimina los riesgos empresariales.',
    ],
  },
  {
    id: 4,
    category: 'Divisas',
    title: 'El d\u00f3lar cede terreno mientras el euro recupera la senda alcista',
    summary: 'Los pares de divisas ajustan posiciones tras una semana de movimientos impulsados por los datos macro.',
    image: 'https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    alt: 'Fajos de billetes y monedas sobre una mesa',
    time: 'Hace 3 h',
    readTime: '4 min',
    assetId: 'EURUSD',
    body: [
      'El mercado de divisas se mueve al ritmo de los diferenciales de tipos y de los datos econ\u00f3micos de cada regi\u00f3n. El euro/d\u00f3lar sigue siendo el par m\u00e1s negociado del mundo.',
      'Las expectativas sobre la pol\u00edtica monetaria del BCE y de la Reserva Federal determinan, en gran medida, hacia d\u00f3nde se dirigen las monedas de referencia.',
      'En un entorno de divisas, el an\u00e1lisis de la volatilidad impl\u00edcita y de los flujos institucionales ayuda a contextualizar los movimientos del d\u00eda a d\u00eda.',
    ],
  },
  {
    id: 5,
    category: 'Materias primas',
    title: 'El oro marca nuevos m\u00e1ximos y reaviva el inter\u00e9s por los metales preciosos',
    summary: 'La demanda de refugio seguro impulsa al metal amarillo y contagia a la plata.',
    image: 'https://images.pexels.com/photos/280240/pexels-photo-280240.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
    alt: 'Lingotes de oro apilados',
    time: 'Hace 4 h',
    readTime: '3 min',
    assetId: 'GC1!',
    body: [
      'El oro ha vuelto a centrar la atenci\u00f3n de los inversores como refugio ante la incertidumbre pol\u00edtica y las tensiones geopol\u00edticas.',
      'La plata suele amplificar los movimientos del oro, aunque su demanda industrial la vincula tambi\u00e9n al ciclo econ\u00f3mico y a la energ\u00eda renovable.',
      'Las posiciones de los fondos y los flujos hacia ETF respaldados f\u00edsicamente son algunas de las variables que anticipan el rumbo del mercado del metal.',
    ],
  },
];

export const ECONOMIC_EVENTS = [
  { id: 1, time: '14:30', country: 'US', name: 'Solicitudes de subsidio por desempleo', shortName: 'Peticiones de desempleo', impact: 3, previous: '219 K', forecast: '224 K', day: 0 },
  { id: 2, time: '15:45', country: 'US', name: 'PMI manufacturero de S&P Global', shortName: 'PMI manufacturero', impact: 2, previous: '47,9', forecast: '48,5', day: 0 },
  { id: 3, time: '16:00', country: 'EU', name: 'Confianza del consumidor de la zona euro', shortName: 'Confianza del consumidor', impact: 2, previous: '-13,5', forecast: '-13,0', day: 0 },
  { id: 4, time: '10:00', country: 'DE', name: '\u00cdndice de clima empresarial Ifo', shortName: 'Clima empresarial Ifo', impact: 2, previous: '86,6', forecast: '87,0', day: 1 },
  { id: 5, time: '14:30', country: 'US', name: '\u00cdndice de precios del consumo personal', shortName: 'Inflaci\u00f3n PCE', impact: 3, previous: '2,5%', forecast: '2,3%', day: 1 },
  { id: 6, time: '08:00', country: 'GB', name: 'Producto interior bruto trimestral', shortName: 'PIB trimestral', impact: 3, previous: '0,6%', forecast: '0,5%', day: 2 },
];