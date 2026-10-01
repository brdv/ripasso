import { error } from "@sveltejs/kit";
import type { PracticeList, StudyEntry } from "$lib/domain/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const response = await fetch(`/api/shared/${encodeURIComponent(params.slug)}`);
  if (response.status === 404) error(404, "Deze gedeelde lijst bestaat niet (meer).");
  if (!response.ok) error(response.status, "Kon de gedeelde lijst niet laden.");

  const shared = (await response.json()) as { list: PracticeList; entries: StudyEntry[]; isOwner: boolean };
  return { slug: params.slug, ...shared };
};
