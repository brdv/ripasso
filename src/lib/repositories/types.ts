import type { PracticeList } from "$lib/domain/types";

export interface ListRepository {
  list(): Promise<PracticeList[]>;
  save(list: PracticeList): Promise<void>;
  remove(id: string): Promise<void>;
}
