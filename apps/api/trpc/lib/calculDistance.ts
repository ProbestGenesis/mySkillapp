import type { PrismaClient } from '../../generated/prisma/client.ts'

export const calculDistance = async (
    prisma: PrismaClient,
    { userId, lat, long }: { userId: string, lat: number, long: number }
) => {
   const result = await prisma.$queryRaw<{distance: number}[]>`
            SELECT ST_Distance(
                l.position::geography,
                ST_SetSRID(ST_MakePoint(${long}, ${lat}), 4326)::geography
            )::float AS distance
            FROM "Location" l
            WHERE l."userId" = ${userId}
            AND l.position IS NOT NULL
   `

   const distanceM = result[0]?.distance;
   return distanceM ? distanceM / 1000 : 0;
}