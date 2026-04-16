import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { t } from "./trpc.ts";
import { TRPCError } from "@trpc/server";
import { auth } from "../auth.ts";
import { prisma } from "../lib/prisma.ts";

export const createContext = async ({ req }: CreateExpressContextOptions) => {
  const session = await auth.api.getSession({
    headers: req.headers as Record<string, string | string[] | undefined>,
  });
  
  return {
    session,
    prisma
  };
};




export type Context = Awaited<ReturnType<typeof createContext>>;
