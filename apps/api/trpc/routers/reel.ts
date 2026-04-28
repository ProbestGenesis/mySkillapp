import z from 'zod'
import { protectedProcedure, t } from '../trpc.ts'

export const reelRouter = t.router({
  getReels: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input

      const reels = await ctx.prisma.reel.findMany({
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              like: true,
              comments: true,
            },
          },
          like: {
            where: {
              userId: ctx.session?.user.id,
            },
            select: {
              id: true,
            },
          },
        },
      })

      let nextCursor: string | undefined = undefined
      if (reels.length > limit) {
        const nextItem = reels.pop()
        nextCursor = nextItem!.id
      }

      return {
        reels: reels.map((reel) => ({
          id: reel.id,
          url: reel.url,
          thumbnail: reel.thumbnail ?? '',
          description: reel.description ?? '',
          username: reel.user.name,
          userId: reel.user.id,
          userImage: reel.user.image,
          likesCount: reel._count.like,
          commentsCount: reel._count.comments,
          isLiked: reel.like.length > 0,
          createdAt: reel.createdAt,
        })),
        nextCursor,
      }
    }),

  toggleLike: protectedProcedure
    .input(z.object({ reelId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existingLike = await ctx.prisma.like.findFirst({
        where: {
          reelId: input.reelId,
          userId: ctx.session?.user.id,
        },
      })

      if (existingLike) {
        await ctx.prisma.like.delete({
          where: { id: existingLike.id },
        })
        return { liked: false }
      }

      await ctx.prisma.like.create({
        data: {
          reel: {
            connect: {
              id: input.reelId,
            }
          }, 
          user: {
            connect: {
             id: ctx.session?.user.id as string,
            }
        },
        },
      })
      return { liked: true }
    }),

  getComments: protectedProcedure
    .input(z.object({ reelId: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.comment.findMany({
        where: { reelId: input.reelId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        reelId: z.string(),
        comment: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.comment.create({
        data: {
          reel: {
            connect: {
              id: input.reelId,
            }
          },
          user: {
              connect: {
               id: ctx.session?.user.id as string,
              }
          },
          comment: input.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })
    }),
})
