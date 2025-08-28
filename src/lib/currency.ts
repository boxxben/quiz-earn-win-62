// Conversion rate (in naira)
export const DIAMOND_RATE = 50;

export function nairaTodiamonds(naira: number): number {
  return Math.floor(naira / DIAMOND_RATE);
}

export function diamondsToNaira(diamonds: number): number {
  return diamonds * DIAMOND_RATE;
}

export function formatCurrency(naira: number): string {
  const diamonds = nairaTodiamonds(naira);
  return `${diamonds}💎`;
}

export function formatDiamonds(diamonds: number): string {
  return `${diamonds}💎`;
}