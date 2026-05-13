import { z } from "zod";

export const scoreSchema = z.object({
  fixtureId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  rageQuitPlayerId: z.string().optional().nullable(),
  comebackWin: z.coerce.boolean().optional().default(false)
});

export const submissionSchema = z.object({
  fixtureId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99)
});

export const manualPointsSchema = z.object({
  seasonId: z.string().uuid(),
  playerId: z.string().uuid(),
  points: z.coerce
    .number()
    .int("Use whole numbers.")
    .min(-99, "Adjustment too low.")
    .max(99, "Adjustment too high.")
    .refine((value) => value !== 0, "Adjustment must be non-zero."),
  reason: z.string().trim().max(280).optional().or(z.literal(""))
});

const scoreField = z
  .number({
    invalid_type_error: "Enter a score.",
    required_error: "Enter a score."
  })
  .int("Score must be a whole number.")
  .min(0, "Score must be 0 or higher.")
  .max(99, "Score is too high.");

export const logResultFormSchema = z.object({
  homeScore: scoreField,
  awayScore: scoreField,
  rageQuit: z.boolean().default(false),
  rageQuitPlayerId: z.string().optional(),
  comebackWin: z.boolean().default(false)
});

export const submitResultFormSchema = z.object({
  homeScore: scoreField,
  awayScore: scoreField
});

export const manualPointsFormSchema = manualPointsSchema
  .omit({ seasonId: true, points: true })
  .extend({
    points: z
      .number({ invalid_type_error: "Enter a number." })
      .int("Use whole numbers.")
      .min(-99, "Adjustment too low.")
      .max(99, "Adjustment too high.")
      .refine((value) => value !== 0, "Adjustment must be non-zero.")
  });
