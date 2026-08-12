import { italianDisplay } from "./cards";
import type { ResolvedDirection, SessionItem } from "./types";

export function promptFor(item: SessionItem): string {
  return item.dir === "nl_it" ? item.card.nl : italianDisplay(item.card);
}

export function answerFor(item: SessionItem): string {
  return item.dir === "nl_it" ? italianDisplay(item.card) : item.card.nl;
}

export function promptLabelFor(dir: ResolvedDirection): string {
  return dir === "nl_it" ? "vertaal naar het Italiaans" : "wat betekent dit?";
}

export function promptLanguageFor(dir: ResolvedDirection): "lang-nl" | "lang-it" {
  return dir === "nl_it" ? "lang-nl" : "lang-it";
}

export function answerLanguageFor(dir: ResolvedDirection): "lang-it" | "lang-nl" {
  return dir === "nl_it" ? "lang-it" : "lang-nl";
}
