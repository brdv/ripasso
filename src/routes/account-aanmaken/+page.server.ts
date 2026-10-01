import { redirect } from "@sveltejs/kit";
import { handleAuthForm } from "$lib/server/auth-forms";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) redirect(303, "/");
};

export const actions: Actions = {
  default: (event) => handleAuthForm(event, "sign-up"),
};
