import { useAppSettings } from '@/context/SettingsContext';
import { formatCurrency } from '@/utils/currencyFormat';

export function useCurrencyFormatter(): (amountInUsd: number) => string {
  const { settings, currencyRates } = useAppSettings();
  return (amountInUsd) => formatCurrency(amountInUsd, settings.currencyCode, currencyRates);
}
