import { t } from "../trpc.ts";
import { protectedProcedure } from "../trpc.ts";
import z from "zod";

export const providersRouter = t.router({
    getProviders: t.procedure.query(async ({ctx}) => {
        const providers = await ctx.prisma.provider.findMany({
            include: {
                user: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10
        })
        return providers
    }),

    getProvidersByProfession: t.procedure.input(z.object({profession: z.string()})).query(async ({input, ctx}) => {
        const providers = await ctx.prisma.provider.findMany({
            where: {
                profession: input.profession
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 10
        })
        return providers
    }),

    getNearsProvider: t.procedure
  .input(z.object({ latitude: z.number(), longitude: z.number() }))
  .query(async ({ input, ctx }) => {
    // Récupérer les IDs des localisations proches
    const nearbyLocations = await ctx.prisma.$queryRawUnsafe<{ id: string }[]>(`
        SELECT id
        FROM "Location"
        WHERE ST_DWithin(
          "Location".position,
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326),
          1000
        )
      `);

    const locationIds = nearbyLocations.map((loc) => loc.id);

    // Récupérer les utilisateurs liés à ces localisations
    const users = await ctx.prisma.user.findMany({
      where: {
        Location: {
            some: { id: { in: locationIds } }
          }
      },
      include: {
        provider: {
          select: {
            mission_nb: true,
            rate: true,
            profession: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return users;
  }),


    getProvider: t.procedure.input(z.object({id: z.string()})).query(async ({input, ctx}) => {
        const provider = await ctx.prisma.provider.findUnique({
            where: {
                id: input.id
            },
            include: {
                user: true
            }
        })
        return provider
    }),

   
})