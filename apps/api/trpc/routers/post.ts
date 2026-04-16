import z from 'zod'
import { postsSchema as createPostSchema } from '../../../../packages/lib/zodSchema.ts'
import { protectedProcedure, t } from '../trpc.ts'
import { userInfo } from 'node:os'
import { TRPCError } from '@trpc/server'

export const postRouter = t.router({
  getPosts: t.procedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })
    return posts
  }),

  getPost: t.procedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const post = await ctx.prisma.post.findUnique({
      where: {
        id: input.id,
      },
      include: {
        user: true,
      },
    })
    return post
  }),

  listMyPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: { userId: ctx.session!.user.id, status: "PENDING" },
      orderBy: { createdAt: 'desc' },
      take: 2,
    })
  }),

  getMyPost: protectedProcedure.input(z.object({postId: z.string()})).query(async ({ input, ctx }) => {
     try{
      const data = ctx.prisma.post.findFirst({
            where: { id: input.postId },
            include: {
              user: true,
              applyProviders: true,
            },
          })

          if(!data){
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Publication introuvable"
            })
          }

          return data
     } 

     catch(error: any){
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message
      })
     }
  }),

  myPostProviders: protectedProcedure.input(z.object({postId: z.string()})).query(async ({ input, ctx }) => {
    return ctx.prisma.post.findUnique({
      where: {
        id: input.postId,
      },
      include: {
        applyProviders: true,
      },
    })
  }),

  createPost: protectedProcedure.input(createPostSchema).mutation(async ({ input, ctx }) => {
    const post = await ctx.prisma.post.create({
      data: {
        body: input.body,
        user: {
          connect: {
            id: ctx.session!.user.id,
          },
        },
        notification: false,
        profession: input.profession.value,
      },
    })

    if(!post){
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la création de la publication"
      })
    }
    return post
  }),

  applyForPost: protectedProcedure.input(z.object({ postId: z.string(), offeredPrice: z.number() })).mutation(async ({ input, ctx }) => {
    const isProvider = ctx.session?.user.role === "PROVIDER" ? true : false

    if(!isProvider){
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Vous devez être un prestataire pour postuler"
      })
    }
    
    const provider = await ctx.prisma.provider.findFirst({
      where: { userId: ctx.session!.user.id }
    })

    if(!provider){
       throw new TRPCError({
        code: "NOT_FOUND",
        message: "Profil prestataire introuvable"
      })
    }

    const post = await ctx.prisma.post.update({
      where: {
        id: input.postId,
      },
      data: {
        applyProviders: {
          connect: {
            id: provider.id
          }
        },
        offered_Price: {
          push: input.offeredPrice
        },
      },
    })
    return post
  }),

  selectProvider: protectedProcedure.input(z.object({ postId: z.string(), providerId: z.string() })).mutation(async ({ input, ctx }) => {
    const post = await ctx.prisma.post.update({
      where: {
        id: input.postId,
      },
      data: {
        providerId: input.providerId,
      },
    })
    return post
  })
})
