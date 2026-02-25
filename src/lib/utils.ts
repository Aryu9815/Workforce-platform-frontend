import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import toast from 'react-hot-toast'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'USD', locale = 'en-US'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '-'
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(numAmount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(d)
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function snakeToTitle(str: string): string {
  if (!str) return ''
  return str
    .split('_')
    .map(word => capitalizeFirst(word))
    .join(' ')
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => { inThrottle = false }, limit)
    }
  }
}

/**
 * Extracts and displays user-friendly error messages from a backend error response.
 * Handles standardized structure: { success: false, error: { code, message, details: { fields: {...} } } }
 * Triggers individual toasts for validation errors.
 */
export function showApiError(error: any, defaultMessage = "An unexpected error occurred"): void {
  if (!error) {
    toast.error(defaultMessage);
    return;
  }
  
  // 1. Check for standard backend error structure
  const errorData = error?.response?.data?.error;
  
  if (errorData) {
    const { code, message, details } = errorData;

    // Handle Validation Errors (ERR_VALIDATION) - Show separate toasts for each field
    if (code === 'ERR_VALIDATION' && details?.fields) {
      const fields = Object.entries(details.fields);
      if (fields.length > 0) {
        fields.forEach(([field, msg]) => {
          toast.error(`${snakeToTitle(field)}: ${msg}`);
        });
        return;
      }
    }

    // Handle other detailed errors
    if (message) {
      toast.error(message);
      return;
    }
  }

  // 2. Fallback to legacy detail field (FastAPI/Starlette)
  const detail = error?.response?.data?.detail;
  if (detail) {
    toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    return;
  }

  // 3. Root message fallback
  const rootMessage = error?.response?.data?.message;
  if (rootMessage) {
    toast.error(rootMessage);
    return;
  }

  // 4. Axios network error
  if (error.message) {
    toast.error(error.message);
    return;
  }

  toast.error(defaultMessage);
}

/**
 * Extracts a user-friendly error message as a string.
 * Useful for logging or simple alerts.
 */
export function getErrorMessage(error: any, defaultMessage = "An unexpected error occurred"): string {
  if (!error) return defaultMessage;
  
  const errorData = error?.response?.data?.error;
  
  if (errorData) {
    const { code, message, details } = errorData;
    if (code === 'ERR_VALIDATION' && details?.fields) {
      return Object.entries(details.fields)
        .map(([field, msg]) => `${snakeToTitle(field)}: ${msg}`)
        .join('\n');
    }
    if (message) return message;
  }

  const detail = error?.response?.data?.detail;
  if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail);

  const rootMessage = error?.response?.data?.message;
  if (rootMessage) return rootMessage;

  if (error.message) return error.message;

  return defaultMessage;
}
