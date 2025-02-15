export interface BkashConfig {
  baseURL: string;
  key: string;
  username: string;
  password: string;
  secret: string;
  isSandbox: boolean;
}

// Default sandbox values for development
const defaultConfig = {
  baseURL: 'https://checkout.sandbox.bka.sh/v1.2.0-beta',
  key: '0vWQuCRGiUX7EPVjQDr0EUAYtc',
  username: '01770618567',
  password: 'D7DaC<*E*eG',
  secret: 'jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx',
  isSandbox: true
};

const isDevelopment = process.env.NODE_ENV !== 'production';

export const bkashConfig: BkashConfig = {
  baseURL: process.env.BKASH_BASE_URL || defaultConfig.baseURL,
  key: process.env.BKASH_API_KEY || defaultConfig.key,
  username: process.env.BKASH_USERNAME || defaultConfig.username,
  password: process.env.BKASH_PASSWORD || defaultConfig.password,
  secret: process.env.BKASH_SECRET_KEY || defaultConfig.secret,
  isSandbox: isDevelopment
};

// Only throw error in production if config is missing
if (!isDevelopment && (
  !process.env.BKASH_BASE_URL ||
  !process.env.BKASH_API_KEY ||
  !process.env.BKASH_USERNAME ||
  !process.env.BKASH_PASSWORD ||
  !process.env.BKASH_SECRET_KEY
)) {
  throw new Error("Missing bKash configuration environment variables in production");
}

if (isDevelopment) {
  console.warn('Using default bKash sandbox configuration for development');
}
