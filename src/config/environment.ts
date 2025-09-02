import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  discord: z.object({
    token: z.string().min(1, 'Discord token is required'),
    clientId: z.string().min(1, 'Discord client ID is required'),
  }),
  crossmint: z.object({
    apiKey: z.string().optional(),
    projectId: z.string().optional(),
  }),
  blockchain: z.object({
    infuraProjectId: z.string().optional(),
    alchemyApiKey: z.string().optional(),
  }),
  security: z.object({
    jwtSecret: z.string().min(32, 'JWT secret must be at least 32 characters'),
    encryptionKey: z.string().min(32, 'Encryption key must be at least 32 characters'),
  }),
  app: z.object({
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    port: z.number().int().min(1).max(65535).default(3000),
  }),
  rateLimiting: z.object({
    windowMs: z.number().int().positive().default(60000),
    max: z.number().int().positive().default(10),
  }),
});

const rawConfig = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
  },
  crossmint: {
    apiKey: process.env.CROSSMINT_API_KEY,
    projectId: process.env.CROSSMINT_PROJECT_ID,
  },
  blockchain: {
    infuraProjectId: process.env.INFURA_PROJECT_ID,
    alchemyApiKey: process.env.ALCHEMY_API_KEY,
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-this-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production',
  },
  app: {
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
    port: Number(process.env.PORT) || 3000,
  },
  rateLimiting: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX) || 10,
  },
};

export const config = configSchema.parse(rawConfig);

export type Config = z.infer<typeof configSchema>;
