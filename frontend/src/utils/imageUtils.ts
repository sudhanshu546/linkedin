import { IMAGE_BASE_URL } from '../constants/api';

/**
 * Utility to format image URLs
 * Handles full URLs and relative paths from the backend
 */
export const getImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${IMAGE_BASE_URL}${url}`;
};
