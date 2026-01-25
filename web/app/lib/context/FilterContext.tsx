"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { SortType } from "../types/enums";

interface FilterContextType {
  selectedTopics: string[];
  sortType: SortType;
  toggleTopic: (topicId: string) => void;
  setSortType: (sortType: SortType) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortType, setSortType] = useState<SortType>(SortType.RANDOM);

  const toggleTopic = useCallback((topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedTopics([]);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        selectedTopics,
        sortType,
        toggleTopic,
        setSortType,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined)
    throw new Error("useFilter must be used within a FilterProvider");
  return context;
}
