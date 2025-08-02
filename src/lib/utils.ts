import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString();
}

export function formatResponseTime(time: number | null): string {
  if (time === null) return 'N/A';
  return `${time}ms`;
}

export function getStatusColor(status: 'up' | 'down' | null): string {
  switch (status) {
    case 'up':
      return 'text-green-600 bg-green-100';
    case 'down':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getStatusIcon(status: 'up' | 'down' | null): string {
  switch (status) {
    case 'up':
      return '🟢';
    case 'down':
      return '🔴';
    default:
      return '⚪';
  }
} 