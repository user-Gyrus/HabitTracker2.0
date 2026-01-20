/**
 * Centralized configuration for environment variables.
 * This file provides a single source of truth for all environment-dependent settings.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Environment detection
// Set VITE_ENV=development in Netlify for dev build, leave unset for production
export const IS_DEVELOPMENT = import.meta.env.VITE_ENV === 'development';
export const APP_NAME = IS_DEVELOPMENT ? 'Atomiq Developer' : 'Atomiq';
