import express from "express"
import { createServer } from "http";

import { toNodeHandler } from "better-auth/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { auth } from "./auth.ts";
import { env } from "./lib/env.ts";
import cors from "cors"
import { appRouter } from "./trpc/routers/index.ts";
import { createContext } from "./trpc/context.ts";
import { setupStoreWsServer } from "./ws/storeWs.ts";


const app = express()
const port = process.env.PORT || 4000

app.use(
  cors({
    origin: ['*',env.CORS_ORIGIN, "exp://192.168.201.18:8081", "http://192.168.201.18:8081", "exp+skillmap:\expo-development-client\?url=http%3A%2F%2F192.168.201.18%3A8081", "exp://skillmap", "https://skillmapapp.netlify.app"],
    credentials: true,
  })
);
app.all("/api/auth/*splat", toNodeHandler(auth))
app.use(express.json({ limit: '10mb' }))

app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

const server = createServer(app);
setupStoreWsServer(server);

server.listen(port, () => {
    console.log(`le serveur a bien demarée sur le port ${port}`)
}) 

export type AppRouter = typeof appRouter