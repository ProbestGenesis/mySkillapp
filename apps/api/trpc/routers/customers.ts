import z from 'zod'
import { t } from '../trpc.ts'
import { findNearbyDemandPostIds } from '../lib/geoNearby.ts'

const nearDemandsInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(50).max(500_000).optional().default(50_000),
  limit: z.number().min(1).max(40).optional().default(20),
  excludeUserId: z.string().optional(),
  service: z.string().min(2).optional(),
})

export const customersRouter = t.router({
  /**
   * Demandes (`Post`) dont l’auteur a une `Location` proche du point (PostGIS).
   */
  listNearDemands: t.procedure.input(nearDemandsInput).query(async ({ input, ctx }) => {
    const { excludeUserId, service, ...point } = input

    const rows = await findNearbyDemandPostIds(ctx.prisma, {
      latitude: point.latitude,
      longitude: point.longitude,
      radiusMeters: point.radiusMeters,
      limit: point.limit,
    })

    let ordered = rows
    if (excludeUserId) {
      const postIds = rows.map((r) => r.postId)
      if (postIds.length === 0) return []

      const postsMeta = await ctx.prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { id: true, userId: true },
      })
      const authorByPostId = new Map(postsMeta.map((p) => [p.id, p.userId]))
      ordered = rows.filter((r) => authorByPostId.get(r.postId) !== excludeUserId)
    }

    const postIds = ordered.map((r) => r.postId)
    if (postIds.length === 0) return []

    const distanceByPostId = new Map(ordered.map((r) => [r.postId, r.distanceM]))

    const posts = await ctx.prisma.post.findMany({
      where: {
        id: { in: postIds },
        ...(service
          ? {
              OR: [
                { title: { contains: service, mode: 'insensitive' } },
                { description: { contains: service, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { user: true },
    })

    const byId = new Map(posts.map((p) => [p.id, p]))
    return postIds
      .map((id) => {
        const post = byId.get(id)
        if (!post) return null
        return { ...post, distanceM: distanceByPostId.get(id) ?? 0 }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }),
})
