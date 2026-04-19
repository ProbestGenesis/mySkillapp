import { randomUUID } from 'node:crypto'
import { TRPCError } from '@trpc/server'
import z from 'zod'
import { supabase } from '../../lib/supabase.ts'
import { protectedProcedure, t } from '../trpc.ts'
import {
  isStoreUserOnline,
  notifyStoreConversationMessage,
  notifyStoreConversationRead,
} from '../../ws/storeWs.ts'

const STORE_ITEM_MAX_IMAGES = 8

const storeItemInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  imageUrls: z.array(z.string().url()).max(STORE_ITEM_MAX_IMAGES).default([]),
  city: z.string().optional(),
  district: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
})

const STORE_FREE_LIMIT = 2
const STORE_FREE_WINDOW_DAYS = 14
const STORE_PARTNER_DURATION_DAYS = 30
const STORE_PARTNER_MONTHLY_PRICE_FCFA = 5000

export const storeRouter = t.router({
  listItems: t.procedure
    .input(
      z
        .object({
          search: z.string().optional(),
          page: z.number().int().positive().default(1),
          pageSize: z.number().int().positive().max(50).default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1
      const pageSize = input?.pageSize ?? 10
      const skip = (page - 1) * pageSize
      return ctx.prisma.storeItem.findMany({
        where: {
          isActive: true,
          OR: input?.search
            ? [
                { title: { contains: input.search, mode: 'insensitive' } },
                { description: { contains: input.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
        include: {
          owner: {
            select: { id: true, name: true, phoneNumber: true, email: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      })
    }),

  getItem: t.procedure.input(z.object({ itemId: z.string() })).query(async ({ ctx, input }) => {
    const item = await ctx.prisma.storeItem.findUnique({
      where: { id: input.itemId },
      include: {
        owner: { select: { id: true, name: true, phoneNumber: true, image: true } },
      },
    })
    if (!item || !item.isActive) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Annonce introuvable' })
    }
    return item
  }),

  createItem: protectedProcedure.input(storeItemInput).mutation(async ({ ctx, input }) => {
    const prismaAny = ctx.prisma as any
    const userId = ctx.session!.user.id
    const user = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { storePartnerUntil: true },
    })

    const now = new Date()
    const isPartner = !!user?.storePartnerUntil && user.storePartnerUntil > now

    if (!isPartner) {
      const windowStart = new Date(now)
      windowStart.setDate(windowStart.getDate() - STORE_FREE_WINDOW_DAYS)
      const recentPublications = await ctx.prisma.storeItem.count({
        where: {
          ownerId: userId,
          createdAt: { gte: windowStart },
        },
      })

      if (recentPublications >= STORE_FREE_LIMIT) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Limite atteinte: 2 publications par 14 jours pour les particuliers. Devenez partenaire.',
        })
      }
    }

    return ctx.prisma.storeItem.create({
      data: {
        ...input,
        imageUrls: input.imageUrls ?? [],
        contactEmail: input.contactEmail || undefined,
        ownerId: userId,
      },
    })
  }),

  uploadStoreItemImage: protectedProcedure
    .input(
      z.object({
        base64: z.string(),
        mimeType: z.string().default('image/jpeg'),
        fileName: z.string().default('image.jpg'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { base64, mimeType, fileName } = input
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(mimeType)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Seuls les fichiers .jpeg, .jpg, .png et .webp sont autorisés',
        })
      }
      const buffer = Buffer.from(base64, 'base64')
      if (buffer.byteLength > 5 * 1024 * 1024) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Le fichier ne doit pas dépasser 5MB',
        })
      }
      const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '.jpg'
      const userId = ctx.session!.user.id
      const uniqueName = `${randomUUID()}${ext}`
      const filePath = `store-items/${userId}/${uniqueName}`

      const { error: uploadError } = await supabase.storage
        .from('Skillmap')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (uploadError) {
        console.error('Supabase store image upload error:', uploadError)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Échec de l'enregistrement de l'image",
        })
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('Skillmap').getPublicUrl(filePath)

      return { imageUrl: publicUrl }
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        data: storeItemInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.storeItem.findUnique({ where: { id: input.itemId } })
      if (!existing || !existing.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Annonce introuvable' })
      }
      if (existing.ownerId !== ctx.session!.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Action non autorisée' })
      }
      return ctx.prisma.storeItem.update({
        where: { id: input.itemId },
        data: {
          ...input.data,
          imageUrls: input.data.imageUrls ?? [],
          contactEmail: input.data.contactEmail || undefined,
        },
      })
    }),

  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.storeItem.findUnique({ where: { id: input.itemId } })
      if (!existing || !existing.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Annonce introuvable' })
      }
      if (existing.ownerId !== ctx.session!.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Action non autorisée' })
      }

      await ctx.prisma.storeItem.update({
        where: { id: input.itemId },
        data: { isActive: false },
      })
      return { ok: true }
    }),

  getMyItems: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.storeItem.findMany({
      where: { ownerId: ctx.session!.user.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
    })
  }),

  startConversation: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const normalized = input.message.trim()
      if (!normalized) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Message vide interdit' })
      }
      const item = await ctx.prisma.storeItem.findUnique({
        where: { id: input.itemId },
      })
      if (!item || !item.isActive) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Annonce introuvable' })
      }
      if (item.ownerId === ctx.session!.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Vous ne pouvez pas démarrer une discussion sur votre propre annonce',
        })
      }

      const conversation = await ctx.prisma.storeConversation.upsert({
        where: {
          itemId_customerId: {
            itemId: input.itemId,
            customerId: ctx.session!.user.id,
          },
        },
        update: {},
        create: {
          itemId: input.itemId,
          ownerId: item.ownerId,
          customerId: ctx.session!.user.id,
        },
      })

      await ctx.prisma.storeMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: ctx.session!.user.id,
          content: normalized,
        },
      })

      notifyStoreConversationMessage(conversation.id, [item.ownerId, ctx.session!.user.id])

      return conversation
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const normalized = input.content.trim()
      if (!normalized) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Message vide interdit' })
      }
      const conversation = await ctx.prisma.storeConversation.findUnique({
        where: { id: input.conversationId },
      })
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation introuvable' })
      }
      const userId = ctx.session!.user.id
      const allowed = conversation.ownerId === userId || conversation.customerId === userId
      if (!allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Action non autorisée' })
      }

      const message = await ctx.prisma.storeMessage.create({
        data: {
          conversationId: input.conversationId,
          senderId: userId,
          content: normalized,
        },
        include: {
          sender: { select: { id: true, name: true } },
        },
      })
      notifyStoreConversationMessage(input.conversationId, [
        conversation.ownerId,
        conversation.customerId,
      ])
      return message
    }),

  markConversationRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.storeConversation.findUnique({
        where: { id: input.conversationId },
      })
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation introuvable' })
      }

      const userId = ctx.session!.user.id
      const allowed = conversation.ownerId === userId || conversation.customerId === userId
      if (!allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Action non autorisée' })
      }

      const updated = await ctx.prisma.storeMessage.updateMany({
        where: {
          conversationId: input.conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      })

      if (updated.count > 0) {
        notifyStoreConversationRead(input.conversationId, [
          conversation.ownerId,
          conversation.customerId,
        ])
      }

      return { updated: updated.count }
    }),

  getConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page
      const pageSize = input.pageSize
      const skip = (page - 1) * pageSize
      const conversation = await ctx.prisma.storeConversation.findUnique({
        where: { id: input.conversationId },
        include: {
          item: true,
          owner: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          messages: {
            include: {
              sender: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
          },
        },
      })
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation introuvable' })
      }
      const userId = ctx.session!.user.id
      const allowed = conversation.ownerId === userId || conversation.customerId === userId
      if (!allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Action non autorisée' })
      }
      conversation.messages.reverse()
      return conversation
    }),

  getConversationPresence: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.storeConversation.findUnique({
        where: { id: input.conversationId },
      })
      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation introuvable' })
      }
      const userId = ctx.session!.user.id
      const allowed = conversation.ownerId === userId || conversation.customerId === userId
      if (!allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Action non autorisée' })
      }

      const otherUserId =
        conversation.ownerId === userId ? conversation.customerId : conversation.ownerId

      return {
        myUserId: userId,
        otherUserId,
        isOtherUserOnline: isStoreUserOnline(otherUserId),
      }
    }),

  listMyConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session!.user.id
    return ctx.prisma.storeConversation.findMany({
      where: {
        OR: [{ ownerId: userId }, { customerId: userId }],
      },
      include: {
        item: true,
        owner: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }),

  getPublishingStatus: protectedProcedure.query(async ({ ctx }) => {
    const prismaAny = ctx.prisma as any
    const userId = ctx.session!.user.id
    const now = new Date()
    const windowStart = new Date(now)
    windowStart.setDate(windowStart.getDate() - STORE_FREE_WINDOW_DAYS)

    const [user, recentPublications] = await Promise.all([
      prismaAny.user.findUnique({
        where: { id: userId },
        select: { storePartnerUntil: true, storePartnerStartedAt: true },
      }),
      ctx.prisma.storeItem.count({
        where: {
          ownerId: userId,
          createdAt: { gte: windowStart },
        },
      }),
    ])

    const isPartner = !!user?.storePartnerUntil && user.storePartnerUntil > now
    const remainingFreePublications = Math.max(0, STORE_FREE_LIMIT - recentPublications)

    return {
      isPartner,
      partnerUntil: user?.storePartnerUntil ?? null,
      partnerStartedAt: user?.storePartnerStartedAt ?? null,
      freeLimit: STORE_FREE_LIMIT,
      freeWindowDays: STORE_FREE_WINDOW_DAYS,
      usedPublicationsInWindow: recentPublications,
      remainingFreePublications,
      canPublish: isPartner || remainingFreePublications > 0,
    }
  }),

  becomePartner: protectedProcedure.mutation(async ({ ctx }) => {
    const prismaAny = ctx.prisma as any
    const userId = ctx.session!.user.id
    const now = new Date()

    const current = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { storePartnerUntil: true },
    })

    const baseDate =
      current?.storePartnerUntil && current.storePartnerUntil > now ? current.storePartnerUntil : now

    const newPartnerUntil = new Date(baseDate)
    newPartnerUntil.setDate(newPartnerUntil.getDate() + STORE_PARTNER_DURATION_DAYS)

    const updated = await prismaAny.user.update({
      where: { id: userId },
      data: {
        storePartnerUntil: newPartnerUntil,
        storePartnerStartedAt: current?.storePartnerUntil ? undefined : now,
      },
      select: {
        storePartnerUntil: true,
        storePartnerStartedAt: true,
      },
    })

    return {
      message: 'Abonnement partenaire activé pour 30 jours',
      partnerUntil: updated.storePartnerUntil,
      partnerStartedAt: updated.storePartnerStartedAt,
    }
  }),

  simulatePartnerPayment: protectedProcedure.mutation(async ({ ctx }) => {
    const prismaAny = ctx.prisma as any
    const userId = ctx.session!.user.id
    const now = new Date()

    const current = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { storePartnerUntil: true },
    })

    const startsAt =
      current?.storePartnerUntil && current.storePartnerUntil > now ? current.storePartnerUntil : now
    const endsAt = new Date(startsAt)
    endsAt.setDate(endsAt.getDate() + STORE_PARTNER_DURATION_DAYS)

    const [updatedUser, subscription] = await Promise.all([
      prismaAny.user.update({
        where: { id: userId },
        data: {
          storePartnerUntil: endsAt,
          storePartnerStartedAt: current?.storePartnerUntil ? undefined : now,
        },
        select: {
          storePartnerUntil: true,
          storePartnerStartedAt: true,
        },
      }),
      prismaAny.storePartnerSubscription.create({
        data: {
          userId,
          amountFcfa: STORE_PARTNER_MONTHLY_PRICE_FCFA,
          durationDays: STORE_PARTNER_DURATION_DAYS,
          startsAt,
          endsAt,
          status: 'PAID',
        },
      }),
    ])

    return {
      message: 'Paiement simulé confirmé',
      subscriptionId: subscription.id,
      amountFcfa: subscription.amountFcfa,
      partnerUntil: updatedUser.storePartnerUntil,
      partnerStartedAt: updatedUser.storePartnerStartedAt,
    }
  }),

  listPartnerSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const prismaAny = ctx.prisma as any
    const userId = ctx.session!.user.id
    const subscriptions = await prismaAny.storePartnerSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 24,
    })
    return {
      monthlyPriceFcfa: STORE_PARTNER_MONTHLY_PRICE_FCFA,
      subscriptions,
    }
  }),
})
