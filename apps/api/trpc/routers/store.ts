import { TRPCError } from '@trpc/server'
import z from 'zod'
import { protectedProcedure, t } from '../trpc.ts'
import { notifyStoreConversationMessage } from '../../ws/storeWs.ts'

const storeItemInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  city: z.string().optional(),
  district: z.string().optional(),
  phoneNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
})

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
        owner: { select: { id: true, name: true, phoneNumber: true, email: true } },
      },
    })
    if (!item || !item.isActive) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Annonce introuvable' })
    }
    return item
  }),

  createItem: protectedProcedure.input(storeItemInput).mutation(async ({ ctx, input }) => {
    return ctx.prisma.storeItem.create({
      data: {
        ...input,
        contactEmail: input.contactEmail || undefined,
        ownerId: ctx.session!.user.id,
      },
    })
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
})
