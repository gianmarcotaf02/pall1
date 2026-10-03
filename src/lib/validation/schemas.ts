import { z } from "zod";
import type { PlayerRole } from "@/types/domain";

export const ROLES = ["goalkeeper", "defender", "midfielder", "forward"] as const;
export const roleEnum = z.enum(ROLES);

export const nicknameSchema = z
  .string()
  .trim()
  .min(3, "Il nickname deve avere almeno 3 caratteri.")
  .max(24, "Il nickname può avere al massimo 24 caratteri.")
  .regex(/^[A-Za-z0-9_.-]+$/, "Solo lettere, numeri e i simboli . _ -");

export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email("Inserisci un indirizzo email valido."),
);

export const passwordSchema = z
  .string()
  .min(6, "La password deve avere almeno 6 caratteri.")
  .max(72, "La password può avere al massimo 72 caratteri.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Inserisci la password."),
});

export const registerSchema = z.object({
  nickname: nicknameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Le due password non coincidono.",
    path: ["confirm"],
  });

export const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), schema.optional());

export const profileSchema = z
  .object({
    nickname: nicknameSchema,
    full_name: z.string().trim().max(80, "Massimo 80 caratteri.").optional(),
    roles: z.array(roleEnum).max(4).optional(),
    preferred_role: z.string().optional(),
    jersey_number: z.union([
      z.coerce
        .number()
        .int("Il numero di maglia deve essere un numero intero.")
        .min(1, "Il numero di maglia va da 1 a 99.")
        .max(99, "Il numero di maglia va da 1 a 99."),
      z.literal(""),
    ]),
    birth_date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data di nascita non valida."), z.literal("")]),
  })
  .superRefine((data, ctx) => {
    const preferred = data.preferred_role;
    if (preferred && preferred !== "" && !(data.roles ?? []).includes(preferred as PlayerRole)) {
      ctx.addIssue({
        code: "custom",
        path: ["preferred_role"],
        message: "Il ruolo preferito deve essere tra i ruoli selezionati.",
      });
    }
  });

export const matchSchema = z.object({
  match_date_local: z.string().min(1, "Indica data e ora della partita."),
  location: z.string().trim().min(2, "Indica il campo.").max(120, "Massimo 120 caratteri."),
  max_players: z.coerce
    .number()
    .int("Numero non valido.")
    .min(2, "Servono almeno 2 posti.")
    .max(40, "Massimo 40 posti."),
  team_a_name: z.string().trim().min(1, "Nome squadra mancante.").max(40, "Massimo 40 caratteri."),
  team_b_name: z.string().trim().min(1, "Nome squadra mancante.").max(40, "Massimo 40 caratteri."),
  notes: z.string().trim().max(500, "Massimo 500 caratteri.").optional(),
});

export const resultSchema = z.object({
  team_a_score: z.coerce.number().int("Punteggio non valido.").min(0, "Punteggio non valido.").max(99),
  team_b_score: z.coerce.number().int("Punteggio non valido.").min(0, "Punteggio non valido.").max(99),
  mvp_profile_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  notes: z.string().trim().max(500, "Massimo 500 caratteri.").optional(),
});

export const teamAssignmentSchema = z.object({
  match_player_id: z.string().uuid("Giocatore non valido."),
  team: z.union([z.enum(["a", "b"]), z.literal("")]),
});

export const playerContributionSchema = z.object({
  match_player_id: z.string().uuid("Giocatore non valido."),
  goals: z.coerce.number().int().min(0, "Valore non valido.").max(99),
  assists: z.coerce.number().int().min(0, "Valore non valido.").max(99),
});

export const attendanceSchema = z.object({
  match_id: z.string().uuid(),
  attendance: z.enum(["present", "maybe", "absent"]),
});

export const adminProfileSchema = z.object({
  profile_id: z.string().uuid(),
  notes: z.string().trim().max(500, "Massimo 500 caratteri.").optional(),
});

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
