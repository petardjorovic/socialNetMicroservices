import cors from "cors";

const ALLOWED_ORIGINS = ["http://localhost:5173", "https://myexamplesite.com"];

const configurationCors = () => {
  return cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
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

export default configurationCors;
