export interface GeneralConfig {
  id?: string;
  userId?: string;
  
  // Configuración de moneda
  currency: {
    code: string; // EUR, USD, GBP, etc.
    symbol: string; // €, $, £, etc.
    position: 'before' | 'after'; // €100 vs 100€
  };
  
  // Configuración de tema
  theme: {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    accentColor: string;
  };
  
  // Configuración regional
  locale: {
    language: string; // es, en, fr, etc.
    dateFormat: string; // DD/MM/YYYY, MM/DD/YYYY, etc.
    timeFormat: '12h' | '24h';
    timezone: string;
  };
  
  // Configuración de notificaciones
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
    leadUpdates: boolean;
    systemAlerts: boolean;
  };
  
  // Configuración de la aplicación
  app: {
    companyName: string;
    companyLogo?: string;
    sidebarCollapsed: boolean;
    defaultDashboard: string; // ruta por defecto
    itemsPerPage: number;
  };
  
  // Configuración de datos
  data: {
    autoSave: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    dataRetention: number; // días
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_GENERAL_CONFIG: Omit<GeneralConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  currency: {
    code: 'EUR',
    symbol: '€',
    position: 'after'
  },
  theme: {
    mode: 'system',
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6'
  },
  locale: {
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: 'Europe/Madrid'
  },
  notifications: {
    email: true,
    browser: true,
    sound: false,
    leadUpdates: true,
    systemAlerts: true
  },
  app: {
    companyName: 'MAR-IA',
    sidebarCollapsed: false,
    defaultDashboard: '/business-finder',
    itemsPerPage: 20
  },
  data: {
    autoSave: true,
    backupFrequency: 'daily',
    dataRetention: 365
  }
};

export const CURRENCY_OPTIONS = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' }
];

export const LANGUAGE_OPTIONS = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' }
];

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
  { value: 'America/Santiago', label: 'Santiago (GMT-3)' },
  { value: 'America/Lima', label: 'Lima (GMT-5)' }
];