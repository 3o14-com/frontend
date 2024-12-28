import type { Theme } from '@/types/theme';

export const LIGHT_THEME: Theme = {
  colors: {
    primary: '#007BFF',
    background: '#ffffff',
    text: '#333333',
    border: '#cccccc',
    error: '#dc3545',
    success: '#28a745',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
};

export const DARK_THEME: Theme = {
  colors: {
    primary: '#0D6EFD',
    background: '#121212',
    text: '#ffffff',
    border: '#333333',
    error: '#dc3545',
    success: '#28a745',
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16,
  },
};
