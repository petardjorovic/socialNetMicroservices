import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { MONGO_URI, PORT } from "./utils/env.js";
import logger from "./utils/logger.js";
import helmet from "helmet";
import errorHandler from "./middlewares/errorHandler.js";
import router from "./routes/identity-servise.route.js";

const app = express();

// connect to mongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((error) => logger.error("MongoDB connection error", error));

// midlewares

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use("/api/auth", router);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
