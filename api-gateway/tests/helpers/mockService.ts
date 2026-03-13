import express from "express";

export const createMockService = (port: number) => {
  const app = express();

  app.get("/api/auth/test", (req, res) => {
    res.json({
      service: "ok",
      requestId: req.headers["x-request-id"],
    });
  });

  const server = app.listen(port);

  return { app, server };
};
