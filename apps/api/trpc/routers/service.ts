import { TRPCError } from '@trpc/server'
import z from 'zod'
import { protectedProcedure, t } from '../trpc.ts'

const confirmProcedure = protectedProcedure.input(
  z.object({
    serviceId: z.string(),
    code: z.string(),
  })
)
export const serviceRouter = t.router({
  getYoursServices: protectedProcedure.query(async ({ ctx }) => {
    try {
      const session = ctx.session

      return await ctx.prisma.service.findMany({
        where: {
          OR: [{ customerId: session!.user.id }, { providerId: session!.user.providerId }],
        },
        include: {
          provider: {
            include: {
              user: {
                include: {
                  Location: true,
                },
              },
            },
          },
          skills: true,
        },
      })
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Erreur lors de la récupération de vos services',
      })
    }
  }),

  careService: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { serviceId } = input
        const session = ctx.session

        const service = await ctx.prisma.service.findUnique({
          where: { id: serviceId },
        })

        if (!service) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service non trouvé',
          })
        }

        if (service.status !== 'ACCEPTED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Ce service est déjà en cours ou terminé',
          })
        }

        if (service.providerId !== session!.user.providerId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "Vous n'êtes pas le prestataire assigné à ce service",
          })
        }

        return await ctx.prisma.service.update({
          where: { id: serviceId },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
          },
        })
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la prise en charge du service',
        })
      }
    }),

  confirmService: confirmProcedure.mutation(async ({ input, ctx }) => {
    try {
      const { serviceId, code } = input
      const session = ctx.session

      const service = await ctx.prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service non trouvé',
        })
      }

      if (service.code !== code) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Le code de confirmation est incorrect',
        })
      }

      const isProvider = service.providerId === session!.user.providerId
      const isCustomer = service.customerId === session!.user.id

      if (!isProvider && !isCustomer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: "Vous n'êtes pas autorisé à confirmer ce service",
        })
      }

      return await ctx.prisma.service.update({
        where: { id: serviceId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    } catch (error: any) {
      if (error instanceof TRPCError) throw error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Erreur lors de la confirmation du service',
      })
    }
  }),

  cancelService: protectedProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { serviceId } = input
        const session = ctx.session

        const service = await ctx.prisma.service.findUnique({
          where: { id: serviceId },
        })

        if (!service) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service non trouvé',
          })
        }

        if (service.status === 'COMPLETED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Impossible d annuler un service déjà terminé',
          })
        }

        const isProvider = service.providerId === session!.user.providerId
        const isCustomer = service.customerId === session!.user.id

        if (!isProvider && !isCustomer) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: "Vous n'êtes pas autorisé à annuler ce service",
          })
        }

        return await ctx.prisma.service.update({
          where: { id: serviceId },
          data: {
            status: 'REJECTED',
          },
        })
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de l annulation du service',
        })
      }
    }),

  rateService: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { serviceId, rating } = input
        const session = ctx.session

        const service = await ctx.prisma.service.findUnique({
          where: { id: serviceId },
          include: { provider: true },
        })

        if (!service) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Service non trouvé',
          })
        }

        if (service.status !== 'COMPLETED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Vous ne pouvez noter que les services terminés',
          })
        }

        if (service.customerId !== session!.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Seul le client peut noter ce service',
          })
        }

        // Calcul de la nouvelle moyenne pour le prestataire
        const currentReviewsCount = service.provider.reviews_count || 0
        const currentRate = service.provider.rate || 0
        const newReviewsCount = currentReviewsCount + 1
        const newRate = (currentRate * currentReviewsCount + rating) / newReviewsCount

        await ctx.prisma.provider.update({
          where: { id: service.providerId },
          data: {
            rate: newRate,
            reviews_count: newReviewsCount,
          },
        })

        return { success: true, newRate }
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la notation du service',
        })
      }
    }),
})
