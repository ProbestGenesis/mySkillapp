import { initTRPC } from "@trpc/server";
import type {  Context, createContext } from "./context.ts";
import { isAuthed } from "./context.ts";


export const t = initTRPC.context<typeof createContext>().create()

export const protectedProcedure = t.procedure.use(isAuthed)