import { expo } from '@better-auth/expo'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { phoneNumber, customSession } from 'better-auth/plugins'
import { env } from './lib/env.ts'
import { prisma } from './lib/prisma.ts'
import { sendOTP } from './lib/termii.ts'

export const auth = betterAuth({
  
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN, env.EXPO_SCHEME, "http://192.168.201.18:4000", 'skillmap://', "http://192.168.201.18:8081", "exp://192.168.201.18:8081"  ],

  user: {
    additionalFields: {
      providerId: {
        type: "string",
        default: "",
        input: false
      },
      role: {
        type: 'string',
        default: 'Customer',
        input: false
      },
      rate: {
        type: 'string',
        default: '0',
        input: false
      },
      city: {
        type: "string",
        default: "",
        input: false
      },
      distrcit: {
        type: "string",
        default: "",
        input: false
      }
    },
  },

  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    expo(),
    customSession(async ({ session, user }) => {
      return {
        ...session,
        user: {
          ...user,
          role: (user as any).role,
          rate: (user as any).rate,
          city: (user as any).city,
          district: (user as any).district,
          providerId: (user as any).providerId
        },
      }
    }),
    phoneNumber({
      sendOTP: ({ phoneNumber, code }, ctx) => {
        sendOTP(Number(code), phoneNumber);
      },
      allowedAttempts: 6,
      expiresIn: 60 * 100,
      otpLength: 4,
      requireVerification: false,
    }),
  ],
})

export type Auth = typeof auth
