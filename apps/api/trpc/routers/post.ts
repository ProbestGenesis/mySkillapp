import { TRPCError } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import z from 'zod'
import { postsSchema as createPostSchema } from '../../../../packages/lib/zodSchema.ts'
import { protectedProcedure, t } from '../trpc.ts'

export const postRouter = t.router({
  getPosts: t.procedure.query(async ({ ctx }) => {
    try {
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
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Erreur lors de la récupération des publications',
      })
    }
  }),

  getPost: t.procedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    try {
      const post = await ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
        include: {
          user: true,
          applyProviders: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      })

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Publication introuvable',
        })
      }

      return post
    } catch (error: any) {
      if (error instanceof TRPCError) throw error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Erreur lors de la récupération de la publication',
      })
    }
  }),

  listMyPosts: protectedProcedure.query(async ({ ctx }) => {
    try {
      return ctx.prisma.post.findMany({
        where: { userId: ctx.session!.user.id, status: 'WAITING_FOR_PROVIDER' },
        orderBy: { updatedAt: 'desc' },
        take: 2,
      })
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Erreur lors de la récupération de vos publications',
      })
    }
  }),

  getMyPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const data = await ctx.prisma.post.findFirst({
          where: { id: input.postId },
          include: {
            applyProviders: {
              select: {
                id: true,
                userId: true,
                user: {
                  select: {
                    name: true,
                    image: true,
                    phoneNumberVerified: true,
                    emailVerified: true,
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        })

        if (!data) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Publication introuvable',
          })
        }

        return data
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la récupération de la publication',
        })
      }
    }),

  myPostProviders: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const post = await ctx.prisma.post.findUnique({
          where: {
            id: input.postId,
          },
          include: {
            applyProviders: true,
          },
        })

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Publication introuvable',
          })
        }

        return post
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la récupération des prestataires',
        })
      }
    }),

  createPost: protectedProcedure
    .input(
      z.object({
        ...createPostSchema.shape,
        lat: z.number().optional(),
        long: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const post = await ctx.prisma.post.create({
          data: {
            body: input.body,
            user: {
              connect: {
                id: ctx.session!.user.id,
              },
            },
            location: {
              lat: input.lat,
              long: input.long,
            },
            notification: false,
            profession: input.profession.value,
          },
        })

        if (!post) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erreur lors de la création de la publication',
          })
        }
        return post
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la création de la publication',
        })
      }
    }),

  applyForPost: protectedProcedure
    .input(z.object({ postId: z.string(), offeredPrice: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const provider = await ctx.prisma.provider.findFirst({
          where: { userId: ctx.session!.user.id },
        })

        if (!provider) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profil prestataire introuvable',
          })
        }

        const post = await ctx.prisma.post.update({
          where: {
            id: input.postId,
          },
          data: {
            applyProviders: {
              connect: {
                id: provider.id,
              },
            },
            offered_Price: {
              push: input.offeredPrice,
            },
          },
        })
        return post
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la candidature à la publication',
        })
      }
    }),

  selectProvider: protectedProcedure
    .input(z.object({ postId: z.string(), providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await ctx.prisma.user.findFirst({
          where: { id: ctx.session!.user.id },
          select: {
            id: true,
            district: true,
            city: true,
          },
        })
        const post = await ctx.prisma.post.update({
          where: {
            id: input.postId,
          },
          data: {
            providerId: input.providerId,
          },
        })
        const nanoid = customAlphabet(
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
          5
        )
        const code = nanoid()

        await ctx.prisma.service.create({
          data: {
            provider: {
              connect: {
                id: input.providerId,
              },
            },
            customer: {
              connect: {
                id: ctx.session!.user.id,
              },
            },
            location: post.location as any,
            title: `Recherche de ${post.profession}`,
            status: 'ACCEPTED',
            description: post.body,
            code,
            district: user?.district,
          },
        })
        return { ok: true, message: 'Prestataire contacté avec succès' }
      } catch (error: any) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Erreur lors de la sélection du prestataire',
        })
      }
    }),
})
