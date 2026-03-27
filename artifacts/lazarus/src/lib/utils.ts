import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHex(str: string | undefined) {
  if (!str) return "0x0000";
  return `0x${str.toUpperCase()}`;
}

export function generateScramble(seed: string) {
  const chars = "!@#$%^&*()<>[]{}|";
  return seed.split('').map(c => Math.random() > 0.3 ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
}
