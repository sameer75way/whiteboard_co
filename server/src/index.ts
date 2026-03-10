import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { routes } from "./app/routes";
import { requestLogger } from "./app/common/middlewares/requestLogger";
import { errorHandler } from "./app/common/middlewares/errorHandler";

export const app = express();

app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(compression());

app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({ message: "API running" });
});


app.use("/api", routes);


app.use(errorHandler);

import http from "http";


import { connectDB } from "./app/common/config/db.config";
import { redisClient } from "./app/common/config/redis.config";
import { env } from "./app/common/config/env.config";

import { initSocketServer } from "./app/sockets/socket.server";
import { seedAdmin } from "./app/common/scripts/seeder";

const startServer = async () => {

  await connectDB();
  await seedAdmin();

  await redisClient.connect().catch(() => {});

  const server = http.createServer(app);

  initSocketServer(server);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

};

startServer();