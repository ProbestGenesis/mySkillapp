import z from 'zod'
import { t } from '../trpc.ts'
import { findNearbyProviderUserIds } from '../lib/geoNearby.ts'

const nearByInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Rayon en mètres (ellipsoïde WGS84 via `geography`). */
  radiusMeters: z.number().min(50).max(500_000).optional().default(50_000),
  limit: z.number().min(1).max(40).optional().default(20),
  /** Exclure un utilisateur (ex. soi-même) du résultat. */
  excludeUserId: z.string().optional(),
})

export const providersRouter = t.router({
  getProviders: t.procedure.query(async ({ ctx }) => {
    return ctx.prisma.provider.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  }),

  getProvidersByProfession: t.procedure
    .input(z.object({ profession: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.provider.findMany({
        where: { profession: input.profession },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    }),

  /**
   * Prestataires proches : jointure PostGIS sur `Location` puis chargement Prisma.
   */
  listNear: t.procedure.input(nearByInput).query(async ({ input, ctx }) => {
    const { excludeUserId, ...point } = input

    const rows = await findNearbyProviderUserIds(ctx.prisma, {
      latitude: point.latitude,
      longitude: point.longitude,
      radiusMeters: point.radiusMeters,
      limit: point.limit,
    })

    const filtered = excludeUserId ? rows.filter((r) => r.userId !== excludeUserId) : rows
    const userIds = filtered.map((r) => r.userId)
    if (userIds.length === 0) return []

    const distanceByUserId = new Map(filtered.map((r) => [r.userId, r.distanceM]))

    const found = await ctx.prisma.provider.findMany({
      where: { userId: { in: userIds } },
      include: { user: true, skills: true },
    })

    const byUserId = new Map(found.map((p) => [p.userId, p]))
    return userIds
      .map((uid) => {
        const provider = byUserId.get(uid)
        if (!provider) return null
        const distanceM = distanceByUserId.get(uid) ?? 0
        return { ...provider, distanceM }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }),

  getProvider: t.procedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    return ctx.prisma.provider.findUnique({
      where: { id: input.id },
      include: { user: true, skills: true },
    })
  }),
})
