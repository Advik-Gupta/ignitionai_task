import express from "express";
import cors from "cors";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { createOriginMatcher } from "./utils/cors-origins";
import { HttpError } from "./utils/http-error";

export function createApp(allowedOrigins: string[]) {
  const app = express();
  const isAllowedOrigin = createOriginMatcher(allowedOrigins);

  app.disable("x-powered-by");

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(new HttpError(403, `Origin ${origin} is not allowed`));
      },
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
