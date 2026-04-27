import { t } from "../trpc.ts";
import { userRouter } from "./user.ts";
import { serviceRouter } from "./service.ts";
import { providersRouter } from "./providers.ts";
import { customersRouter } from "./customers.ts";
import { postRouter } from "./post.ts";
import { storeRouter } from "./store.ts";
import { mediaRouter } from "./media.ts";
import { reelRouter } from "./reel.ts";

export const appRouter = t.router({
    user: userRouter,
    service: serviceRouter,
    providers: providersRouter,
    customers: customersRouter,
    post: postRouter,
    store: storeRouter,
    media: mediaRouter,
    reel: reelRouter,
})