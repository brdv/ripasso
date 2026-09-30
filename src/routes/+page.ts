import type { Deck } from "$lib/domain/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch("/data.json");

  if (!response.ok) {
    throw new Error(`Kon de dataset niet laden: HTTP ${response.status}`);
  }

  return { deck: (await response.json()) as Deck };
};
