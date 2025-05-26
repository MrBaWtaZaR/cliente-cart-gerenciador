
export const APP_CONFIG = {
  COMPANY: {
    NAME: 'AF ASSESSORIA',
    SUBTITLE: 'CONSULTORIA',
    LOCATION: 'Santa Cruz do Capibaribe - PE',
    PHONE: '(84) 9 9811-4515',
    INSTAGRAM: '@ANDRADEFLORASSESSORIA'
  },
  DEFAULTS: {
    MIN_SERVICE_FEE: 60,
    SERVICE_FEE_PERCENTAGE: 0.1,
    MOBILE_BREAKPOINT: 768,
    DEBOUNCE_DELAY: 300
  },
  PDF: {
    FONTS: {
      PRIMARY: 'Poppins',
      SECONDARY: 'Montserrat'
    },
    COLORS: {
      PRIMARY: '#1C3553',
      WHITE: '#FFFFFF',
      GRAY: '#f2f2f2'
    }
  }
} as const;

export const STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  USER_PREFERENCES: 'userPreferences'
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/dashboard/customers',
  PRODUCTS: '/dashboard/products',
  ORDERS: '/dashboard/orders',
  SHIPMENTS: '/dashboard/shipments',
  SETTINGS: '/dashboard/settings'
} as const;
