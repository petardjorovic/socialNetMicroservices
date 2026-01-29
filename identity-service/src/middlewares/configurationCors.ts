import cors from "cors";

const configurationCors = () => {
  return cors({
    origin: (origin, callback) => {
      const allowedOrigin = [
        "http://localhost:5173",
        "https://myexamplesite.com",
      ];

      if (!origin || allowedOrigin.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    maxAge: 600,
  });
};

export default configurationCors;
