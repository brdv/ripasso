export type RichMark = "bold" | "italian" | "ending" | "change" | "irregular";

export type RichNode = string | { mark: RichMark; children: RichNode[] };

/**
 * Markup for theory text: `**vet**`, `_Italiaans_`, `[uitgang]`, `{wijziging}` (such as -isc- or
 * an inserted h) and `<onregelmatig>`. Marks can nest; an opening mark without its closing mark
 * stays plain text.
 */
const MARKS: Array<[open: string, close: string, mark: RichMark]> = [
  ["**", "**", "bold"],
  ["_", "_", "italian"],
  ["[", "]", "ending"],
  ["{", "}", "change"],
  ["<", ">", "irregular"],
];

export function parseRich(text: string): RichNode[] {
  const nodes: RichNode[] = [];
  let plain = "";
  let index = 0;
  while (index < text.length) {
    const match = MARKS.find(([open]) => text.startsWith(open, index));
    const end = match ? text.indexOf(match[1], index + match[0].length) : -1;
    if (!match || end === -1) {
      plain += text[index];
      index += 1;
      continue;
    }
    if (plain) nodes.push(plain);
    plain = "";
    nodes.push({ mark: match[2], children: parseRich(text.slice(index + match[0].length, end)) });
    index = end + match[1].length;
  }
  if (plain) nodes.push(plain);
  return nodes;
}
