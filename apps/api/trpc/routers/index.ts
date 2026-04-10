import { t } from "../trpc.ts";
import { userRouter } from "./user.ts";
import { serviceRouter } from "./service.ts";

export const appRouter = t.router({
    user: userRouter,
    service: serviceRouter
})