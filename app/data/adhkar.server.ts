import texts from "./adhkar-texts.json";
import type { AdhkarCollection, Dhikr } from "./adhkar";

// Texts of the morning and evening adhkār, as published by islambook.com.
const all = texts as Record<AdhkarCollection["id"], Dhikr[]>;

export function getAdhkar(id: AdhkarCollection["id"]): Dhikr[] {
  return all[id];
}
