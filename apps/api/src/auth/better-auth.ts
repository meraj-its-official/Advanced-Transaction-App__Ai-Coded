import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const socialProviders: Record<string, any> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
} else {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-id",
    clientSecret:
      process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-secret",
    enabled: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  };
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
} else {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID || "placeholder-github-id",
    clientSecret:
      process.env.GITHUB_CLIENT_SECRET || "placeholder-github-secret",
    enabled: !!(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ),
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "payflow_better_auth_secret_production_key_32_chars_minimum",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3005",
    "http://localhost:3007",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3005",
    "http://127.0.0.1:3007",
    "http://127.0.0.1:5000",
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  user: {
    additionalFields: {
      phone: { type: "string", required: true, unique: true },
      pin: { type: "string", required: false },
      kycStatus: { type: "string", required: false, defaultValue: "PENDING" },
      isActive: { type: "boolean", required: false, defaultValue: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const existingWallet = await prisma.wallet.findUnique({
              where: { userId: user.id },
            });
            if (!existingWallet) {
              await prisma.wallet.create({
                data: {
                  userId: user.id,
                  balance: 0,
                  currency: "INR",
                  isLocked: false,
                },
              });
            }
          } catch (err) {
            console.error(
              "[BetterAuth] Error creating default wallet for user:",
              err,
            );
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
