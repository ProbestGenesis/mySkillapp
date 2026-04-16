import type { PrismaClient } from '../../generated/prisma/client.ts'

/** Point de référence WGS84 + rayon de recherche en mètres (géographie). */
export type NearPointInput = {
  latitude: number
  longitude: number
  radiusMeters: number
  limit: number
}

export type NearUserRow = {
  userId: string
  distanceM: number
}

export type NearPostRow = {
  postId: string
  distanceM: number
}

/**
 * Utilisateurs ayant au moins une ligne `Location` avec une géométrie proche du point.
 * Un seul enregistrement par utilisateur : la position la plus proche du point.
 */
export async function findNearbyUserIds(
  prisma: PrismaClient,
  { latitude, longitude, radiusMeters, limit }: NearPointInput
): Promise<NearUserRow[]> {
  return prisma.$queryRaw<NearUserRow[]>`
    SELECT * FROM (
      SELECT DISTINCT ON (l."userId")
        l."userId" AS "userId",
        ST_Distance(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )::float AS "distanceM"
      FROM "Location" l
      WHERE l.position IS NOT NULL
        AND ST_DWithin(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY
        l."userId",
        ST_Distance(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) ASC
    ) sub
    ORDER BY sub."distanceM" ASC
    LIMIT ${limit}
  `
}

/**
 * Même logique que `findNearbyUserIds`, restreinte aux utilisateurs qui ont un profil `Provider`.
 */
export async function findNearbyProviderUserIds(
  prisma: PrismaClient,
  { latitude, longitude, radiusMeters, limit }: NearPointInput
): Promise<NearUserRow[]> {
  return prisma.$queryRaw<NearUserRow[]>`
    SELECT * FROM (
      SELECT DISTINCT ON (l."userId")
        l."userId" AS "userId",
        ST_Distance(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )::float AS "distanceM"
      FROM "Location" l
      INNER JOIN "Provider" p ON p."userId" = l."userId"
      WHERE l.position IS NOT NULL
        AND p."isAvailable" = true
        AND ST_DWithin(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY
        l."userId",
        ST_Distance(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) ASC
    ) sub
    ORDER BY sub."distanceM" ASC
    LIMIT ${limit}
  `
}

/**
 * Un post « demande » par auteur : le post associé à la position la plus proche du point.
 */
export async function findNearbyDemandPostIds(
  prisma: PrismaClient,
  { latitude, longitude, radiusMeters, limit }: NearPointInput
): Promise<NearPostRow[]> {
  return prisma.$queryRaw<NearPostRow[]>`
    SELECT * FROM (
      SELECT DISTINCT ON (u.id)
        po.id AS "postId",
        ST_Distance(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )::float AS "distanceM"
      FROM "Post" po
      INNER JOIN "user" u ON u.id = po."userId"
      INNER JOIN "Location" l ON l."userId" = u.id
      WHERE l.position IS NOT NULL
        AND ST_DWithin(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY
        u.id,
        ST_Distance(
          l.position::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) ASC
    ) sub
    ORDER BY sub."distanceM" ASC
    LIMIT ${limit}
  `
}
