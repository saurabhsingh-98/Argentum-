/**
 * Calculates current and longest streak from a list of post dates.
 * Dates should be in 'YYYY-MM-DD' format.
 */
export function calculateStreak(history: { post_date: string }[]) {
  if (!history || history.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Ensure unique dates and sort descending
  const uniqueDates = Array.from(new Set(history.map(h => h.post_date))).sort((a, b) => b.localeCompare(a));
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate Longest Streak
  if (uniqueDates.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diff = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);

      if (Math.round(diff) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }

  // Calculate Current Streak
  const latestDate = uniqueDates[0];
  if (latestDate === today || latestDate === yesterday) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diff = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);

        if (Math.round(diff) === 1) {
          currentStreak++;
        } else {
          break;
        }
    }
  } else {
    currentStreak = 0;
  }

  return { 
    current: currentStreak, 
    longest: longestStreak 
  };
}
