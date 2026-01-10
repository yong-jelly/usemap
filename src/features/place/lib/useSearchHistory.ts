import { useState, useEffect, useCallback } from "react";

const SEARCH_HISTORY_KEY = "place_search_history";
const MAX_HISTORY_COUNT = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    // 초기값을 동기적으로 불러오기 (SSR 고려)
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveToHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setHistory(prev => {
      const newHistory = [
        searchTerm,
        ...prev.filter((item) => item !== searchTerm),
      ].slice(0, MAX_HISTORY_COUNT);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const removeFromHistory = useCallback((searchTerm: string) => {
    setHistory(prev => {
      const newHistory = prev.filter((item) => item !== searchTerm);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  return {
    history,
    saveToHistory,
    removeFromHistory,
    clearHistory,
  };
}
