import { create } from "zustand";
import { SortType } from "../types";

// ============================================================================
// Types
// ============================================================================

interface FilterState {
  selectedTopics: string[];
  sortType: SortType;
}

interface FilterActions {
  toggleTopic: (topicId: string) => void;
  setSortType: (sortType: SortType) => void;
  setSelectedTopics: (topics: string[]) => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: FilterState = {
  selectedTopics: [],
  sortType: SortType.RANDOM,
};

// ============================================================================
// Store
// ============================================================================

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...initialState,

  toggleTopic: (topicId) =>
    set((state) => ({
      selectedTopics: state.selectedTopics.includes(topicId)
        ? state.selectedTopics.filter((id) => id !== topicId)
        : [...state.selectedTopics, topicId],
    })),

  setSortType: (sortType) => set({ sortType }),

  setSelectedTopics: (topics) => set({ selectedTopics: topics }),

  reset: () => set(initialState),
}));
