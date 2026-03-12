import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import toast from 'react-hot-toast'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = 'INR', locale = 'en-US'): string {
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
    .split(/[._]/) // Split by dot or underscore for nested fields
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
 * Formats Pydantic validation error messages into a user-friendly format.
 * Example: "1 validation error for CreateProjectMember\nrole\n  Value error, role can only contain letters, numbers, and spaces [type=value_error, ...]"
 * Becomes: "Role: Value error, role can only contain letters, numbers, and spaces"
 */
export function formatPydanticError(message: string): string {
  if (!message || typeof message !== 'string') return message;

  // Check if it looks like a Pydantic validation error
  if (!message.includes('validation error') || !message.includes('\n')) {
    return message;
  }

  const lines = message.split('\n');
  const formattedErrors: string[] = [];

  // Line 0 is usually "N validation error(s) for ModelName"
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip the URL line often found at the end
    if (line.startsWith('For further information visit')) continue;

    // Pydantic format typically lists the field name on one line
    // and the error detail on the next line (starting with an error type in brackets)
    if (!line.includes('[type=')) {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine && nextLine.includes('[type=')) {
        const fieldName = snakeToTitle(line);
        // Extract error message before the [type=... metadata
        const errorMsg = nextLine.split('[type=')[0].trim();
        formattedErrors.push(`${fieldName}: ${errorMsg}`);
        i++; // Skip the next line as we've consumed it
      } else {
        // If it doesn't follow the exact pattern, just add the cleaned line
        formattedErrors.push(line);
      }
    } else {
      // If the line itself contains the error metadata
      const errorMsg = line.split('[type=')[0].trim();
      formattedErrors.push(errorMsg);
    }
  }

  return formattedErrors.length > 0 ? formattedErrors.join('\n') : message;
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
      const formattedMessage = formatPydanticError(message);
      // If multiple errors were combined with \n, show them as separate toasts
      if (formattedMessage.includes('\n')) {
        formattedMessage.split('\n').forEach(msg => toast.error(msg));
      } else {
        toast.error(formattedMessage);
      }
      return;
    }
  }

  // 2. Fallback to legacy detail field (FastAPI/Starlette)
  const detail = error?.response?.data?.detail;
  if (detail) {
    const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
    toast.error(formatPydanticError(msg));
    return;
  }

  // 3. Root message fallback
  const rootMessage = error?.response?.data?.message;
  if (rootMessage) {
    toast.error(formatPydanticError(rootMessage));
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
    if (message) return formatPydanticError(message);
  }

  const detail = error?.response?.data?.detail;
  if (detail) {
    const msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
    return formatPydanticError(msg);
  }

  const rootMessage = error?.response?.data?.message;
  if (rootMessage) return formatPydanticError(rootMessage);

  if (error.message) return error.message;

  return defaultMessage;
}
