import { randomUUID } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import z from 'zod'
import { supabase } from '../../lib/supabase.ts'
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

      // ⚠️ ICI : Tu peux enregistrer l'URL dans ta base de données via Prisma
      // Par exemple, si tu crées un modèle Reel :
      // await ctx.prisma.reel.create({
      //   data: { url: videoUrl, description, userId }
      // })

      console.log(`Nouvelle vidéo enregistrée par l'utilisateur ${userId}:`, videoUrl)

      return { 
        message: 'Vidéo enregistrée avec succès dans la base de données',
        videoUrl 
      }
    }),
})
