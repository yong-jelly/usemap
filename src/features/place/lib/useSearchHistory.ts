import { useState, useEffect } from "react";

const SEARCH_HISTORY_KEY = "place_search_history";
const MAX_HISTORY_COUNT = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const saveToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    const newHistory = [
      searchTerm,
      ...history.filter((item) => item !== searchTerm),
    ].slice(0, MAX_HISTORY_COUNT);
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const removeFromHistory = (searchTerm: string) => {
    const newHistory = history.filter((item) => item !== searchTerm);
    setHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return {
    history,
    saveToHistory,
    removeFromHistory,
    clearHistory,
  };
}
