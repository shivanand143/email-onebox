import { create } from "zustand";

import { EmailCategory } from "@/lib/api";

interface FilterState {
  accountId?: string;
  folder?: string;
  query: string;
  categories: EmailCategory[];
  setAccountId: (accountId?: string) => void;
  setFolder: (folder?: string) => void;
  setQuery: (query: string) => void;
  toggleCategory: (category: EmailCategory) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  query: "",
  categories: [],
  setAccountId: (accountId) => set({ accountId }),
  setFolder: (folder) => set({ folder }),
  setQuery: (query) => set({ query }),
  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((item) => item !== category)
        : [...state.categories, category]
    })),
  reset: () => set({ accountId: undefined, folder: undefined, query: "", categories: [] })
}));

