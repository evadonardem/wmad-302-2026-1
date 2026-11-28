import { getStorageItem, setStorageItem } from '@/utils/storage';

export interface UsdExchangeRates {
  base: 'USD';
  date: string;
  rates: Record<string, number>;
}

export interface ExchangeRateResult extends UsdExchangeRates {
  source: 'live' | 'cache';
  warning?: string;
}

interface ExchangeRateApiResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const STORAGE_KEY = 'currency_rates_usd';
const RATES_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

function isRateRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).every(([code, rate]) =>
    /^[A-Z]{3}$/.test(code) && typeof rate === 'number' && Number.isFinite(rate) && rate > 0
  );
}

function isExchangeRateData(value: unknown): value is UsdExchangeRates {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<UsdExchangeRates>;
  return data.base === 'USD' &&
    typeof data.date === 'string' &&
    isRateRecord(data.rates) &&
    data.rates.USD === 1;
}

export async function getUsdExchangeRates(): Promise<ExchangeRateResult> {
  const cached = await getStorageItem<UsdExchangeRates>(STORAGE_KEY);

  try {
    const response = await fetch(RATES_URL);
    if (!response.ok) {
      throw new Error(`Exchange-rate service returned HTTP ${response.status}.`);
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') {
      throw new Error('Exchange-rate service returned invalid data.');
    }
    const result = payload as ExchangeRateApiResponse;
    if (result.base !== 'USD' || typeof result.date !== 'string' || !isRateRecord(result.rates)) {
      throw new Error('Exchange-rate service returned invalid USD rates.');
    }
    const rates = { ...result.rates, USD: 1 };
    const currentRates: UsdExchangeRates = { base: 'USD', date: result.date, rates };

    try {
      await setStorageItem(STORAGE_KEY, currentRates);
      return { ...currentRates, source: 'live' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Storage write failed.';
      return {
        ...currentRates,
        source: 'live',
        warning: `Live rates loaded, but could not be cached: ${message}`,
      };
    }
  } catch (error) {
    if (isExchangeRateData(cached)) {
      const message = error instanceof Error ? error.message : 'Unknown network error.';
      return {
        ...cached,
        source: 'cache',
        warning: `Using rates from ${cached.date}; live rates could not be loaded: ${message}`,
      };
    }
    const message = error instanceof Error ? error.message : 'Unknown network error.';
    throw new Error(`Currency rates are unavailable: ${message}`);
  }
}
