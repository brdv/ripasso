import { error } from "@sveltejs/kit";
import { getDb } from "./db";

export function requireUser(locals: App.Locals): { id: string; email: string } {
  if (!locals.user) error(401, "Je bent niet ingelogd.");
  return locals.user;
}

export function requireDb(platform: App.Platform | undefined) {
  if (!platform?.env.DB) error(500, "De database is niet beschikbaar.");
  return getDb(platform.env.DB);
}

export function notFound(): never {
  error(404, "Niet gevonden.");
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    error(400, "Ongeldige gegevens.");
  }
}
