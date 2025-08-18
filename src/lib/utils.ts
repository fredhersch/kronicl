import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a creation timestamp, handling cases where it might not exist
 * @param timestamp - The timestamp to format (can be string, Date, or undefined)
 * @param format - The date-fns format string (default: 'PPP p')
 * @returns Formatted date string or fallback text
 */
export function formatCreationTime(timestamp: string | Date | undefined, format: string = 'PPP p'): string {
  if (!timestamp) {
    return 'Unknown';
  }
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Gets a short creation date for display in cards/lists
 * @param timestamp - The timestamp to format
 * @returns Short formatted date string
 */
export function getShortCreationDate(timestamp: string | Date | undefined): string {
  if (!timestamp) {
    return '';
  }
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }
    return `Created ${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })}`;
  } catch (error) {
    return '';
  }
}
