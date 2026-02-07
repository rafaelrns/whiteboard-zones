import { z } from 'zod';

export const HealthResponse = z.object({
  ok: z.boolean(),
  service: z.string(),
  time: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;

export const RegisterRequest = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const AuthResponse = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['owner', 'editor', 'reviewer', 'viewer']),
  }),
});
export type AuthResponse = z.infer<typeof AuthResponse>;


export const ZoneRulesSchema = z.object({
  maxEditors: z.number().int().positive().optional(),
  maxEditSeconds: z.number().int().positive().optional(),
  allowedRoles: z.array(z.enum(['owner', 'editor', 'reviewer', 'viewer'])).min(1),
});

export const ZoneRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

export const CreateZoneRequest = z.object({
  type: z.enum(['FREE_EDIT', 'LOCKED_ZONE', 'REVIEW_REQUIRED', 'READ_ONLY']),
  name: z.string().min(1),
  rect: ZoneRectSchema,
  rules: ZoneRulesSchema,
});
export type CreateZoneRequest = z.infer<typeof CreateZoneRequest>;


export const CreateSuggestionRequest = z.object({
  zoneId: z.string().optional().nullable(),
  title: z.string().min(1),
  message: z.string().optional().nullable(),
  objectsJson: z.array(z.any()).min(1),
});
export type CreateSuggestionRequest = z.infer<typeof CreateSuggestionRequest>;

export const DecideSuggestionRequest = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional().nullable(),
});
export type DecideSuggestionRequest = z.infer<typeof DecideSuggestionRequest>;


export const CreateFeedbackRequest = z.object({
  kind: z.enum(['GENERAL', 'BUG', 'IDEA']).default('GENERAL'),
  message: z.string().min(3).max(2000),
  boardId: z.string().optional().nullable(),
  meta: z.record(z.any()).optional().nullable(),
});
export type CreateFeedbackRequest = z.infer<typeof CreateFeedbackRequest>;
