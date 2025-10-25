import { DIAMOND_TO_NAIRA_RATE } from './constants';

// Use the centralized conversion rate

export function nairaTodiamonds(naira: number): number {
  return Math.round(naira / DIAMOND_TO_NAIRA_RATE);
}

export function diamondsToNaira(diamonds: number): number {
  return diamonds * DIAMOND_TO_NAIRA_RATE;
}

export function formatCurrency(naira: number): string {
  const diamonds = nairaTodiamonds(naira);
  return `${diamonds}💎`;
}

export function formatDiamonds(diamonds: number): string {
  return `${diamonds}💎`;
}