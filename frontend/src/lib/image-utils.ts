import { API_BASE } from './config';

/**
 * Universal Image URL Helper
 * Handles:
 * 1. Full URLs (Cloudinary, External)
 * 2. Local uploads (prefixed with API_BASE)
 * 3. ID view proxy (for local private files)
 */
export const getImageUrl = (path: string | null | undefined, type: 'avatar' | 'id' = 'avatar'): string | undefined => {
  if (!path || path === '' || typeof path !== 'string') return undefined;
  
  // 1. Handle full URLs (Cloudinary, data URIs, etc)
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
    // If it's a legacy localhost URL but we are in production, normalize it
    if (path.includes('localhost:5050') && !API_BASE.includes('localhost')) {
      const relativePath = path.split('localhost:5050')[1];
      return `${API_BASE}${relativePath}`;
    }
    return path;
  }
  
  // 2. Handle local ID proxying
  if (type === 'id') {
    // If it's a local path like /uploads/ids/... or just the filename
    return `${API_BASE}/api/users/view-id?url=${encodeURIComponent(path)}`;
  }
  
  // 3. Handle local avatar/generic uploads
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/uploads')) {
    return `${API_BASE}${cleanPath}`;
  }
  
  // Fallback
  return path;
};

// Legacy alias for compatibility
export const getAvatarUrl = (path: string | null | undefined) => getImageUrl(path, 'avatar');

