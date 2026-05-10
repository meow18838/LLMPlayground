import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const DICEBEAR_BASE = "https://api.dicebear.com/7.x/avataaars/svg";

export function resolveAvatar(avatar: string | undefined, name: string): string {
  const trimmed = avatar?.trim();
  if (trimmed) return trimmed;
  return `${DICEBEAR_BASE}?seed=${encodeURIComponent(name)}`;
}
