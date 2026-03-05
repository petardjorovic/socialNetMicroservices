import cors from "cors";

const ALLOWED_ORIGINS = ["http://localhost:5173", "https://myexamplesite.com"];

export const isOriginAllowed = (origin?: string) => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
};

export const configurationCors = () => {
  return cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // callback(new Error("Not allowed by CORS"));
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    maxAge: 600,
  });
};
