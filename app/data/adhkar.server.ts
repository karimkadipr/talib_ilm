import texts from "./adhkar-texts.json";
import type { AdhkarCollection, Dhikr } from "./adhkar";
import { gradings } from "./adhkar-gradings.server";

// Texts of the morning and evening adhkār, as published by islambook.com. Each names its grading
// by key; the grading itself is attached here.
const all = texts as Record<AdhkarCollection["id"], (Omit<Dhikr, "grading"> & { grading: string })[]>;

export function getAdhkar(id: AdhkarCollection["id"]): Dhikr[] {
  return all[id].map((d) => ({ ...d, grading: gradings[d.grading] ?? null }));
}
