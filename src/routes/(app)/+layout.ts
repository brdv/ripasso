import type { StudyEntry } from "$lib/domain/types";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch }) => {
  const response = await fetch("/api/entries");

  if (!response.ok) {
    throw new Error(`Kon de woorden niet laden: HTTP ${response.status}`);
  }

  return { entries: (await response.json()) as StudyEntry[] };
};
