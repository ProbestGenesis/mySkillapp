import { t } from "../trpc.ts";
import { protectedProcedure } from "../trpc.ts";
import z from "zod";
import { postsSchema as createPostSchema } from "../../../../packages/lib/zodSchema.ts";


export const postRouter = t.router({
    getPosts: t.procedure.query(async ({ctx}) => {
        const posts = await ctx.prisma.post.findMany({
            include: {
                user: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10
        })
        return posts
    }),

    getPost: t.procedure.input(z.object({id: z.string()})).query(async ({input, ctx}) => {
        const post = await ctx.prisma.post.findUnique({
            where: {
                id: input.id
            },
            include: {
                user: true
            }
        })
        return post
    }),

    createPost: protectedProcedure.input(createPostSchema).mutation(async ({input, ctx}) => {
        const post = await ctx.prisma.post.create({
            data: {
                body: input.body,
                user: {
                    connect: {
                        id: ctx.session.user.id
                    }
                },
                notification: false,
                profession: input.profession.value
            }
        })
        return post
    }),    
})