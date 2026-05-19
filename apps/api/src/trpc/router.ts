// ProviderIQ — tRPC Router & Core Routes
// Powered by Inquantic.Ai

import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';
import { z } from 'zod';
import { OrchestratorAgent } from '@provideriq/agents';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Secure procedure checking active API keys
const apiKeySecuredProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.apiKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Provide a valid ProviderIQ API key.',
    });
  }

  const keyRecord = await ctx.db.apiKey.findUnique({
    where: { key: ctx.apiKey },
  });

  if (!keyRecord || !keyRecord.isActive) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or inactive ProviderIQ API key.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      keyRecord,
    },
  });
});

export const appRouter = router({
  // Factual search procedure
  searchFacilities: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const whereClause: any = {};

      if (input.state) whereClause.state = input.state;
      if (input.city) whereClause.city = input.city;
      if (input.query) {
        // SQLite doesn't support mode:'insensitive', so we use OR across fields
        const q = input.query;
        whereClause.OR = [
          { name: { contains: q } },
          { city: { contains: q } },
          { state: { contains: q } },
          { specialties: { contains: q } },
          { nameAliases: { contains: q } },
        ];
      }

      const facilities = await ctx.db.facility.findMany({
        where: whereClause,
        orderBy: { piiScore: 'desc' },
        take: 100,
      });

      return { facilities };
    }),

  // Detailed profile retrieval
  getFacilityProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { id: input.id },
        include: {
          scoreHistory: { orderBy: { recordedAt: 'desc' }, take: 10 },
          signals: { orderBy: { capturedAt: 'desc' }, take: 20 },
          reviews: { orderBy: { reviewDate: 'desc' }, take: 5 },
          newsItems: { orderBy: { publishedAt: 'desc' }, take: 5 },
        },
      });

      if (!facility) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Facility with ID ${input.id} was not found.`,
        });
      }

      return { facility };
    }),

  // Secure intelligence calculation trigger
  triggerResearch: apiKeySecuredProcedure
    .input(z.object({ facilityId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const facility = await ctx.db.facility.findUnique({
        where: { id: input.facilityId },
      });

      if (!facility) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Specified facility for research run does not exist.',
        });
      }

      const runId = `run_${Date.now()}`;
      const orchestrator = new OrchestratorAgent();

      // Trigger research in-memory (async runner fallback for local dev instead of full BullMQ/Redis setup)
      orchestrator
        .execute({
          facilityId: facility.id,
          facilityName: facility.name,
          city: facility.city,
          state: facility.state,
          runId,
        })
        .catch((err) => console.error(`[tRPC Trigger async error] ${String(err)}`));

      return {
        runId,
        status: 'RUNNING',
        estimatedDurationMs: 45000,
      };
    }),
});

export type AppRouter = typeof appRouter;
