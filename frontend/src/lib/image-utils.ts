import { API_BASE } from './config';

export const getAvatarUrl = (path: string | null | undefined): string | null => {
  if (!path || path === '') return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Ensure we don't double slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If it's a backend upload path (starts with /uploads)
  if (cleanPath.startsWith('/uploads')) {
    // API_BASE is something like http://localhost:5050
    return `${API_BASE}${cleanPath}`;
  }
  
  // Fallback for paths that might be missing /uploads but are local
  return path;
};
