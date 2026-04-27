import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTSh(amount: number): string {
  return new Intl.NumberFormat("en-TZ", {
    maximumFractionDigits: 0,
  }).format(amount);
}
