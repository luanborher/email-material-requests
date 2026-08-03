import express from "express";
import { gmailAuthRouter } from "./routes/gmail-auth.route.js";
import { gmailRouter } from "./routes/gmail.route.js";
import { healthRouter } from "./routes/health.route.js";
import { parserRouter } from "./routes/parser.route.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      service: "email-material-requests",
      status: "ok",
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth/gmail", gmailAuthRouter);
  app.use("/gmail", gmailRouter);
  app.use("/parser", parserRouter);

  return app;
}
