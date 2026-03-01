const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
};

export const formatAmount = (pence: number, currency: string): string => {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${(pence / 100).toFixed(2)}`;
};
