import z from 'zod'
import { protectedProcedure, t } from '../trpc.ts'

export const mediaRouter = t.router({
  saveVideoUrl: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { videoUrl, description } = input
      const userId = ctx.session!.user.id

      await ctx.prisma.reel.create({
        data: {
          url: videoUrl,
          description,
          thumbnail: '',
          user: {
            connect: {
              id: ctx.session?.user.id,
            },
          },
        },
      })

      console.log(`Nouvelle vidéo enregistrée par l'utilisateur ${userId}:`, videoUrl)

      return {
        message: 'Votre vidéo a été postée avec succès.',
        videoUrl,
      }
    }),
})
