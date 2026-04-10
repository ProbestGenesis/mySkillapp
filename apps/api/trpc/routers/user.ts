import z from 'zod'
import { t } from '../trpc.ts'
import { TRPCError } from '@trpc/server'
import { createProvider, createSkill } from '../../../../packages/lib/zodSchema.ts'
import { protectedProcedure } from '../trpc.ts'

const userProcedure = protectedProcedure.input(z.object({ userId: z.string() }))

export const userRouter = t.router({
  getUserWithProviderData: userProcedure.query(async ({ input, ctx }) => {
    const userWithProvider = await ctx.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      include: {
        provider: {
          include: {
            skills: true
          }
        },
      },
    })
    return userWithProvider
  }),

  createProvider: protectedProcedure.input(createProvider).mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id

    const userWithProvider = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    })

    if (userWithProvider?.provider) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Vous avez déjà un profil prestataire',
      })
    }

    const provider = await ctx.prisma.provider.create({
      data: {
        userId,
        profession: input.profession.value,
        bio: input.bio,
        availability: input.availability.value,
      },
    })

    await ctx.prisma.user.update({
      where: { id: userId },
      data: {
        role: "PROVIDER",
      },
    })
    return {
      ok: true,
      message: 'Vous êtes devenu prestataire de service',
      provider,
    }
  }),

  addSkill : protectedProcedure.input(createSkill).mutation(async ({input, ctx}) => {
    const userId = ctx.session.user.id

    const userWithProvider = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    })

    if (!userWithProvider?.provider) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Vous devez avoir un profil prestataire pour ajouter des compétences',
      })
    }

    const skill = await ctx.prisma.skills.create({
      data: {
        providerId: userWithProvider.provider.id,
        title: input.title,
        description: input.description,
        average_price: parseInt(input.averagePrice, 10)
      },
    })

    return {
      ok: true,
      message: 'Compétence ajoutée avec succès',
      skill,
    }
  })
})
