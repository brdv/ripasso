import { fail, redirect, type RequestEvent } from "@sveltejs/kit";
import { isAPIError } from "better-auth/api";
import { MIN_PASSWORD_LENGTH } from "$lib/domain/constants";

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mailadres of wachtwoord klopt niet.",
  USER_ALREADY_EXISTS: "Er bestaat al een account met dit e-mailadres.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Er bestaat al een account met dit e-mailadres.",
  PASSWORD_TOO_SHORT: `Je wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens hebben.`,
  INVALID_EMAIL: "Vul een geldig e-mailadres in.",
};

export async function handleAuthForm(event: RequestEvent, mode: "sign-in" | "sign-up") {
  const form = await event.request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const auth = event.locals.auth;

  if (!auth) return fail(500, { email, message: "Inloggen is nu niet beschikbaar." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { email, message: MESSAGES.INVALID_EMAIL });
  if (mode === "sign-up" && password.length < MIN_PASSWORD_LENGTH) {
    return fail(400, { email, message: MESSAGES.PASSWORD_TOO_SHORT });
  }
  if (!password) return fail(400, { email, message: "Vul je wachtwoord in." });

  try {
    if (mode === "sign-up") {
      await auth.api.signUpEmail({
        body: { email, password, name: email.split("@")[0] },
        headers: event.request.headers,
      });
    } else {
      await auth.api.signInEmail({ body: { email, password }, headers: event.request.headers });
    }
  } catch (caught) {
    if (isAPIError(caught)) {
      const code = (caught.body as { code?: string } | undefined)?.code ?? "";
      return fail(400, { email, message: MESSAGES[code] ?? "Dat lukte niet. Probeer het opnieuw." });
    }
    throw caught;
  }

  redirect(303, "/");
}
