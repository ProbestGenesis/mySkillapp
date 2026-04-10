import { t } from "../trpc.ts";
import z from "zod"
import { TRPCError } from "@trpc/server";
import  {  protectProcedure } from "../trpc.ts"


const serviceProcedure = t.procedure.input(z.object({
    userId: z.string(),
}))

const confirmProcedure = t.procedure.input(z.object({
    serviceId: z.string(),
    code: z.string()
}))
export const serviceRouter = t.router({
    getYoursServices: serviceProcedure.query(async ({input,ctx}) => {
        const session = ctx.session

        if(!session?.user.id) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Vous devez être connecté pour accéder à vos services',
            })
        }
        
        return ctx.prisma.service.findMany({
            where: {
                OR: [
                    {customerId: session.user.id},
                    {providerId: session.user.providerId}
                ]
            },
            include: {
                provider: {
                    include: {
                        user: true,
                    }
                },
                skills: true
            }
        })
    }),

    confirmService: 
    
})