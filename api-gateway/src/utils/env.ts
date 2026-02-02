const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value) throw new Error(`Missing environment variable ${key}`);

  return value;
};

export const NODE_ENV = getEnv("NODE_ENV", "development");
export const IDENTITY_SERVICE_URL = getEnv("IDENTITY_SERVICE_URL");
export const POST_SERVICE_URL = getEnv("POST_SERVICE_URL");
export const PORT = getEnv("PORT", "3000");
export const REDIS_URL = getEnv("REDIS_URL");
export const JWT_SECRET = getEnv("JWT_SECRET");
