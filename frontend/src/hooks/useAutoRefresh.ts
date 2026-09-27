'use client';

import { useState, useEffect } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs: number = 30000) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const refresh = async () => {
    setIsRefreshing(true);
    await callback();
    setLastUpdated(new Date());
    setSecondsAgo(0);
    setIsRefreshing(false);
  };

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  // Interval for refreshing
  useEffect(() => {
    if (isPaused) return;

    const intervalId = setInterval(() => {
      refresh();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [callback, intervalMs, isPaused]);

  // Interval for updating seconds ago
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondsAgo(Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  return { lastUpdated, secondsAgo, isRefreshing, refresh, pause, resume };
}
