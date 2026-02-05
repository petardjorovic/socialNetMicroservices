const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing environment variable ${value}`);
  }

  return value;
};

export const NODE_ENV = getEnv("NODE_EVN", "development");
export const PORT = getEnv("PORT", "3003");
export const MONGO_URI = getEnv("MONGO_URI");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const REDIS_URL = getEnv("REDIS_URL");
