import { initTRPC } from "@trpc/server";
import type {  Context, createContext } from "./context.ts";
import { TRPCError } from "@trpc/server";

export const t = initTRPC.context<typeof createContext>().create()

export const protectedProcedure = t.procedure.use(t.middleware(({next, ctx}) => {
  if(!ctx.session) {
    throw new TRPCError({code: "UNAUTHORIZED"})
  }
  return next({ctx})
}))