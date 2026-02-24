export const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }

  return value;
};

export const getConfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "3001"),
  MONGO_URI: getEnv("MONGO_URI"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  REDIS_URL: getEnv("REDIS_URL"),
  RABBITMQ_URL: getEnv("RABBITMQ_URL"),
});
