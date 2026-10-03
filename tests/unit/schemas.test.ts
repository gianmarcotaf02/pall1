import { describe, expect, it } from "vitest";
import {
  loginSchema,
  matchSchema,
  profileSchema,
  registerSchema,
  resultSchema,
} from "@/lib/validation/schemas";
import { firstIssue, errorMessage } from "@/lib/errors";
import { fromDatetimeLocalValue, humanDay, toDatetimeLocalValue } from "@/lib/format";

describe("loginSchema", () => {
  it("normalizza email (trim + lowercase)", () => {
    const parsed = loginSchema.parse({ email: "  Nome@Esempio.IT ", password: "segreta" });
    expect(parsed.email).toBe("nome@esempio.it");
  });

  it("rifiuta email non valide", () => {
    const result = loginSchema.safeParse({ email: "non-una-email", password: "segreta" });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstIssue(result.error)).toMatch(/email/i);
  });

  it("richiede la password", () => {
    const result = loginSchema.safeParse({ email: "a@b.it", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accetta un nickname valido", () => {
    const parsed = registerSchema.parse({
      nickname: "tafo_02",
      email: "tafo@example.it",
      password: "calcetto",
    });
    expect(parsed.nickname).toBe("tafo_02");
  });

  it("rifiuta nickname con caratteri non ammessi", () => {
    const result = registerSchema.safeParse({
      nickname: "taf o!",
      email: "tafo@example.it",
      password: "calcetto",
    });
    expect(result.success).toBe(false);
  });

  it("rifiuta password troppo corte", () => {
    const result = registerSchema.safeParse({
      nickname: "tafo",
      email: "tafo@example.it",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  const base = {
    nickname: "tafo",
    full_name: "",
    roles: ["goalkeeper", "defender"],
    jersey_number: "",
    birth_date: "",
  };

  it("accetta campi opzionali vuoti", () => {
    const parsed = profileSchema.parse(base);
    expect(parsed.jersey_number).toBe("");
    expect(parsed.birth_date).toBe("");
  });

  it("coercizza il numero di maglia da stringa", () => {
    const parsed = profileSchema.parse({ ...base, jersey_number: "10" });
    expect(parsed.jersey_number).toBe(10);
  });

  it("rifiuta numeri di maglia fuori range", () => {
    expect(profileSchema.safeParse({ ...base, jersey_number: "0" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, jersey_number: "100" }).success).toBe(false);
  });

  it("vuole il ruolo preferito tra quelli selezionati", () => {
    const invalid = profileSchema.safeParse({ ...base, preferred_role: "forward" });
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(firstIssue(invalid.error)).toMatch(/ruolo preferito/i);

    const valid = profileSchema.safeParse({ ...base, preferred_role: "defender" });
    expect(valid.success).toBe(true);
  });

  it("rifiuta date non valide", () => {
    expect(profileSchema.safeParse({ ...base, birth_date: "12/05/1990" }).success).toBe(false);
  });
});

describe("matchSchema", () => {
  it("coercizza max_players e applica i default dei nomi squadra", () => {
    const parsed = matchSchema.parse({
      match_date_local: "2026-06-15T21:00",
      location: "Campo Nord",
      max_players: "12",
      team_a_name: "Squadra A",
      team_b_name: "Squadra B",
    });
    expect(parsed.max_players).toBe(12);
  });

  it("rifiuta un numero di posti fuori range", () => {
    const result = matchSchema.safeParse({
      match_date_local: "2026-06-15T21:00",
      location: "Campo Nord",
      max_players: "1",
      team_a_name: "A",
      team_b_name: "B",
    });
    expect(result.success).toBe(false);
  });
});

describe("resultSchema", () => {
  it("accetta punteggi a zero", () => {
    const parsed = resultSchema.parse({ team_a_score: "0", team_b_score: "3" });
    expect(parsed.team_b_score).toBe(3);
  });

  it("rifiuta punteggi negativi", () => {
    expect(resultSchema.safeParse({ team_a_score: "-1", team_b_score: "0" }).success).toBe(false);
  });
});

describe("errorMessage", () => {
  it("traduce gli errori dei trigger", () => {
    expect(errorMessage({ message: 'exception MATCH_FULL', code: "P0001" })).toMatch(/completo/i);
    expect(errorMessage({ message: "MISSING_RESULT" })).toMatch(/risultato/i);
  });

  it("traduce gli errori di unicità", () => {
    expect(errorMessage({ code: "23505", message: "duplicate key" })).toMatch(/già in uso/i);
  });

  it("traduce gli errori di credenziali", () => {
    expect(errorMessage({ message: "Invalid login credentials" })).toMatch(/email o password/i);
  });
});

describe("fuso orario", () => {
  it("converte l'ora di Roma in UTC (estate: UTC+2)", () => {
    expect(fromDatetimeLocalValue("2026-06-15T21:00")).toBe("2026-06-15T19:00:00.000Z");
  });

  it("converte l'ora di Roma in UTC (inverno: UTC+1)", () => {
    expect(fromDatetimeLocalValue("2026-01-15T21:00")).toBe("2026-01-15T20:00:00.000Z");
  });

  it("fa il giro completo andata e ritorno", () => {
    const iso = fromDatetimeLocalValue("2026-09-08T20:30");
    expect(iso).not.toBeNull();
    expect(toDatetimeLocalValue(iso!)).toBe("2026-09-08T20:30");
  });

  it("etichetta la giornata corrente", () => {
    expect(humanDay(new Date().toISOString())).toBe("Oggi");
  });
});
