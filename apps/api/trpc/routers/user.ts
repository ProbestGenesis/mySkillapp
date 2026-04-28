import { randomUUID } from 'node:crypto'
import z from 'zod'
import { t } from '../trpc.ts'
import { TRPCError } from '@trpc/server'
import { createProvider, createSkill, updatePersonalProfileSchema, updateProviderProfileSchema } from '../../../../packages/lib/zodSchema.ts'
import { protectedProcedure } from '../trpc.ts'
import { supabase } from '../../lib/supabase.ts'

const saveLocationInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

const userProcedure = protectedProcedure.input(z.object({ userId: z.string() }))

export const userRouter = t.router({
  /**
   * Enregistre la position courante (PostGIS). Remplace les anciennes lignes `Location` de l’utilisateur.
   */
  saveLocation: protectedProcedure.input(saveLocationInput).mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id
    const { latitude, longitude } = input
    const id = randomUUID()

    await ctx.prisma.$executeRaw`
      DELETE FROM "Location" WHERE "userId" = ${userId}
    `
    await ctx.prisma.$executeRaw`
      INSERT INTO "Location" (id, "userId", position)
      VALUES (
        ${id},
        ${userId},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
    `

    return { ok: true as const, locationId: id }
  }),

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
    const userId = ctx.session!.user.id

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
        user: {
          connect: {
            id: userId,
          },
        },
        profession: input.profession.value,
        experience: input.experience,
        occupation: input.occupation.value,
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

  

  updateProfilePicture: protectedProcedure
    .input(z.object({
      base64: z.string(),
      mimeType: z.string().default('image/jpeg'),
      fileName: z.string().default('image.jpg'),
    }))
    .mutation(async ({ input, ctx }) => {
      const { base64, mimeType, fileName } = input;

      // Validate mime type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Seuls les fichiers .jpeg, .jpg, .png et .webp sont autorisés',
        });
      }

      // Decode base64 to buffer
      const buffer = Buffer.from(base64, 'base64');

      // 5MB limit
      if (buffer.byteLength > 5 * 1024 * 1024) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Le fichier ne doit pas dépasser 5MB',
        });
      }

      const ext = fileName.substring(fileName.lastIndexOf('.')) || '.jpg';
      const uniqueName = `${randomUUID()}${ext}`;
      const filePath = `avatars/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from('Skillmap')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Échec de l'enregistrement de l'image",
        });
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Skillmap')
        .getPublicUrl(filePath);

      return {
        message: 'Photo de profil mise à jour avec succès',
        imageUrl: publicUrl,
      };
    }),

  updatePersonalProfile: protectedProcedure.input(updatePersonalProfileSchema).mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;
    await ctx.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phoneNumber: input.phoneNumber,
        city: input.city,
        district: input.district,
      },
    });
    return { ok: true, message: 'Informations personnelles mises à jour avec succès' };
  }),

  updateProviderProfile: protectedProcedure.input(updateProviderProfileSchema).mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.user.id;
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: { provider: true },
    });
    if (!user?.provider) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profil prestataire non trouvé',
      });
    }
    await ctx.prisma.provider.update({
      where: { id: user.provider.id },
      data: {
        profession: input.profession.value,
        bio: input.bio,
        availability: input.availability.value,
        average_price: input.average_price ? parseFloat(input.average_price) : null,
        occupation: input.occupation.value,
        experience: input.experience,
      },
    });
    return { ok: true, message: 'Informations de prestation mises à jour avec succès' };
  }),
})
