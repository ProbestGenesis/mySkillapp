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
          createdAt: reel.createdAt,
        })),
        nextCursor,
      }
    }),
})
