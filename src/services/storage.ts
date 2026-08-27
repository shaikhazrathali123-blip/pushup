import { Workout, UserStats, UserSettings, Challenge, Badge } from '../types';

const STORAGE_KEYS = {
  WORKOUTS: 'pushquest_workouts_v1',
  SETTINGS: 'pushquest_settings_v1',
  CHALLENGES: 'pushquest_challenges_v1',
  BADGES: 'pushquest_badges_v1',
  USER_STATS: 'pushquest_stats_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  targetDepthAngle: 90,
  dailyTargetReps: 50,
  autoIncrementOnGoal: false,
  goalIncrementStep: 10,
  soundEnabled: true,
  voiceEnabled: true,
  hapticEnabled: true,
  mirrorCamera: true,
  showSkeleton: true,
  autoRestTimer: true,
  restDurationSeconds: 45,
};

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_rep',
    title: 'First Step',
    description: 'Complete your first tracked push-up session',
    icon: 'Flame',
    unlockedAt: null,
    category: 'reps',
    xp: 100,
  },
  {
    id: 'reps_50',
    title: 'Warmup Complete',
    description: 'Accumulate 50 all-time push-ups',
    icon: 'Target',
    unlockedAt: null,
    category: 'reps',
    xp: 250,
  },
  {
    id: 'reps_250',
    title: 'Century Pioneer',
    description: 'Accumulate 250 all-time push-ups',
    icon: 'Award',
    unlockedAt: null,
    category: 'reps',
    xp: 500,
  },
  {
    id: 'reps_1000',
    title: 'Iron Chest',
    description: 'Reach 1,000 all-time push-ups',
    icon: 'Shield',
    unlockedAt: null,
    category: 'reps',
    xp: 1500,
  },
  {
    id: 'unbroken_25',
    title: 'Titan Lungs',
    description: 'Perform 25 unbroken reps in a single set',
    icon: 'Zap',
    unlockedAt: null,
    category: 'reps',
    xp: 400,
  },
  {
    id: 'streak_3',
    title: 'Momentum',
    description: 'Maintain a 3-day workout streak',
    icon: 'Calendar',
    unlockedAt: null,
    category: 'streak',
    xp: 300,
  },
  {
    id: 'streak_7',
    title: 'Relentless',
    description: 'Maintain a 7-day workout streak',
    icon: 'Flame',
    unlockedAt: null,
    category: 'streak',
    xp: 800,
  },
  {
    id: 'form_perfection',
    title: 'Laser Precision',
    description: 'Complete a workout with 92%+ average form score',
    icon: 'CheckCircle2',
    unlockedAt: null,
    category: 'form',
    xp: 350,
  },
  {
    id: 'century_session',
    title: 'Century Club',
    description: 'Do 100+ push-ups in a single workout session',
    icon: 'Trophy',
    unlockedAt: null,
    category: 'special',
    xp: 600,
  },
];

export function getLevelInfo(xp: number): { level: number; title: string; nextLevelXp: number; currentLevelXp: number; progressPercent: number } {
  // Tier thresholds
  const tiers = [
    { level: 1, title: 'Recruit', xp: 0 },
    { level: 2, title: 'Bronze Operative', xp: 300 },
    { level: 3, title: 'Silver Sentinel', xp: 750 },
    { level: 4, title: 'Gold Champion', xp: 1500 },
    { level: 5, title: 'Platinum Striker', xp: 2600 },
    { level: 6, title: 'Diamond Vanguard', xp: 4200 },
    { level: 7, title: 'Master Titan', xp: 6500 },
    { level: 8, title: 'Apex Legend', xp: 10000 },
  ];

  let currentTier = tiers[0];
  let nextTier = tiers[1];

  for (let i = 0; i < tiers.length; i++) {
    if (xp >= tiers[i].xp) {
      currentTier = tiers[i];
      nextTier = tiers[i + 1] || { level: tiers[i].level + 1, title: 'Apex Ascendant', xp: tiers[i].xp + 5000 };
    } else {
      break;
    }
  }

  const range = nextTier.xp - currentTier.xp;
  const earned = xp - currentTier.xp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));

  return {
    level: currentTier.level,
    title: currentTier.title,
    nextLevelXp: nextTier.xp,
    currentLevelXp: currentTier.xp,
    progressPercent,
  };
}

class StorageEngine {
  private isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
  private dbName = 'PushQuestDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<IDBDatabase | null> {
    if (!this.isIndexedDBAvailable) return null;
    if (this.db) return this.db;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        request.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('workouts')) {
            db.createObjectStore('workouts', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  public getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Handle storage quota
    }
  }

  public async getWorkouts(): Promise<Workout[]> {
    // Try localStorage cache first for instant sync
    let list: Workout[] = [];
    try {
      const local = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      if (local) {
        list = JSON.parse(local);
      }
    } catch {
      list = [];
    }

    if (list.length > 0) return list;

    // Fallback to IndexedDB if empty
    const db = await this.initDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('workouts', 'readonly');
          const store = tx.objectStore('workouts');
          const req = store.getAll();
          req.onsuccess = () => {
            const results = (req.result as Workout[]) || [];
            results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(results));
            resolve(results);
          };
          req.onerror = () => resolve(list);
        } catch {
          resolve(list);
        }
      });
    }

    return list;
  }

  public async saveWorkout(workout: Workout): Promise<{ updatedStats: UserStats; newBadges: Badge[]; newPR: boolean }> {
    const workouts = await this.getWorkouts();
    const existingIndex = workouts.findIndex((w) => w.id === workout.id);

    // Calculate PR check
    const currentBestSet = workouts.reduce((max, w) => Math.max(max, w.bestSet), 0);
    const isPR = workout.bestSet > currentBestSet && workout.bestSet > 0;
    workout.isPR = isPR;

    if (existingIndex >= 0) {
      workouts[existingIndex] = workout;
    } else {
      workouts.unshift(workout);
    }

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch {
      // Ignore
    }

    // Save to IndexedDB
    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction('workouts', 'readwrite');
        const store = tx.objectStore('workouts');
        store.put(workout);
      } catch {
        // Ignore
      }
    }

    // Recalculate stats & achievements
    const updatedStats = this.computeStats(workouts);
    const newBadges = this.evaluateBadges(workouts, updatedStats);
    this.refreshChallenges(workouts, updatedStats);

    return { updatedStats, newBadges, newPR: isPR };
  }

  public async deleteWorkout(workoutId: string): Promise<UserStats> {
    let workouts = await this.getWorkouts();
    workouts = workouts.filter((w) => w.id !== workoutId);

    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch {
      // Ignore
    }

    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction('workouts', 'readwrite');
        tx.objectStore('workouts').delete(workoutId);
      } catch {
        // Ignore
      }
    }

    const stats = this.computeStats(workouts);
    this.refreshChallenges(workouts, stats);
    return stats;
  }

  public computeStats(workouts: Workout[]): UserStats {
    let totalPushups = 0;
    let totalDurationSeconds = 0;
    let bestSet = 0;
    let totalFormScore = 0;
    let xp = 0;

    // Daily breakdown for max reps in a day
    const dayMap = new Map<string, number>();

    workouts.forEach((w) => {
      totalPushups += w.totalReps;
      totalDurationSeconds += w.durationSeconds;
      if (w.bestSet > bestSet) bestSet = w.bestSet;
      totalFormScore += w.avgFormScore * w.totalReps;
      xp += w.xpEarned;

      const dayKey = new Date(w.date).toISOString().split('T')[0];
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + w.totalReps);
    });

    let maxRepsDay = 0;
    dayMap.forEach((reps) => {
      if (reps > maxRepsDay) maxRepsDay = reps;
    });

    const avgFormScore = totalPushups > 0 ? Math.round(totalFormScore / totalPushups) : 90;

    // Streak calculation
    const { currentStreak, longestStreak } = this.calculateStreaks(workouts);

    const levelInfo = getLevelInfo(xp);

    const stats: UserStats = {
      totalPushups,
      totalWorkouts: workouts.length,
      totalDurationSeconds,
      bestSet,
      maxRepsDay,
      xp,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      currentStreak,
      longestStreak,
      lastWorkoutDate: workouts.length > 0 ? workouts[0].date : null,
      avgFormScore,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    } catch {
      // Ignore
    }

    return stats;
  }

  private calculateStreaks(workouts: Workout[]): { currentStreak: number; longestStreak: number } {
    if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Get unique dates formatted YYYY-MM-DD sorted descending
    const dateSet = new Set<string>();
    workouts.forEach((w) => {
      const d = new Date(w.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateSet.add(`${year}-${month}-${day}`);
    });

    const uniqueDates = Array.from(dateSet).sort().reverse();
    if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Check if streak is active (worked out today or yesterday)
    let currentStreak = 0;
    const hasToday = uniqueDates.includes(todayStr);
    const hasYesterday = uniqueDates.includes(yesterdayStr);

    if (hasToday || hasYesterday) {
      let checkDate = hasToday ? new Date(today) : new Date(yesterday);
      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Compute longest historical streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevTimestamp: number | null = null;

    // Sort ascending for chronological run
    const ascendingDates = Array.from(dateSet).sort();
    ascendingDates.forEach((dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const currTime = new Date(y, m - 1, d).getTime();

      if (prevTimestamp === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((currTime - prevTimestamp) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevTimestamp = currTime;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    });

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    return { currentStreak, longestStreak };
  }

  public getBadges(): Badge[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BADGES);
      if (saved) {
        const parsed: Badge[] = JSON.parse(saved);
        // Merge with initial badges to ensure any newly defined badge exists
        return INITIAL_BADGES.map((b) => {
          const match = parsed.find((p) => p.id === b.id);
          return match ? { ...b, unlockedAt: match.unlockedAt } : b;
        });
      }
    } catch {
      // Ignore
    }
    return INITIAL_BADGES;
  }

  public evaluateBadges(workouts: Workout[], stats: UserStats): Badge[] {
    const badges = this.getBadges();
    const newlyUnlocked: Badge[] = [];
    const now = new Date().toISOString();

    badges.forEach((b) => {
      if (b.unlockedAt) return; // Already unlocked

      let shouldUnlock = false;
      if (b.id === 'first_rep' && stats.totalPushups >= 1) shouldUnlock = true;
      if (b.id === 'reps_50' && stats.totalPushups >= 50) shouldUnlock = true;
      if (b.id === 'reps_250' && stats.totalPushups >= 250) shouldUnlock = true;
      if (b.id === 'reps_1000' && stats.totalPushups >= 1000) shouldUnlock = true;
      if (b.id === 'unbroken_25' && stats.bestSet >= 25) shouldUnlock = true;
      if (b.id === 'streak_3' && stats.currentStreak >= 3) shouldUnlock = true;
      if (b.id === 'streak_7' && stats.currentStreak >= 7) shouldUnlock = true;
      if (b.id === 'form_perfection' && workouts.some((w) => w.avgFormScore >= 92 && w.totalReps >= 15)) shouldUnlock = true;
      if (b.id === 'century_session' && workouts.some((w) => w.totalReps >= 100)) shouldUnlock = true;

      if (shouldUnlock) {
        b.unlockedAt = now;
        newlyUnlocked.push(b);
      }
    });

    try {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    } catch {
      // Ignore
    }

    return newlyUnlocked;
  }

  public getChallenges(workouts: Workout[], stats: UserStats): Challenge[] {
    const today = new Date().toISOString().split('T')[0];

    // Compute Today's reps
    const todayReps = workouts
      .filter((w) => w.date.startsWith(today))
      .reduce((sum, w) => sum + w.totalReps, 0);

    // Compute This Week's reps (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekReps = workouts
      .filter((w) => new Date(w.date) >= sevenDaysAgo)
      .reduce((sum, w) => sum + w.totalReps, 0);

    const challenges: Challenge[] = [
      {
        id: 'challenge_daily_50',
        title: '50 Today',
        description: 'Complete 50 push-ups before midnight',
        target: 50,
        current: Math.min(50, todayReps),
        type: 'daily',
        xpReward: 150,
        badgeIcon: 'Zap',
        isCompleted: todayReps >= 50,
        claimed: false,
      },
      {
        id: 'challenge_week_500',
        title: '500 This Week',
        description: 'Crush 500 total reps over a 7-day span',
        target: 500,
        current: Math.min(500, weekReps),
        type: 'weekly',
        xpReward: 600,
        badgeIcon: 'Flame',
        isCompleted: weekReps >= 500,
        claimed: false,
      },
      {
        id: 'challenge_unbroken_20',
        title: '20 Unbroken',
        description: 'Perform 20 clean push-ups in a single continuous set',
        target: 20,
        current: Math.min(20, stats.bestSet),
        type: 'unbroken',
        xpReward: 250,
        badgeIcon: 'Shield',
        isCompleted: stats.bestSet >= 20,
        claimed: false,
      },
      {
        id: 'challenge_beat_pr',
        title: 'Beat Your PR',
        description: `Surpass your all-time best set record (current: ${stats.bestSet || 0})`,
        target: Math.max(1, stats.bestSet + 1),
        current: Math.min(Math.max(1, stats.bestSet + 1), stats.bestSet),
        type: 'pr',
        xpReward: 300,
        badgeIcon: 'Trophy',
        isCompleted: stats.bestSet >= 25, // completed milestone if high
        claimed: false,
      },
      {
        id: 'challenge_streak_5',
        title: '5-Day Streak Warrior',
        description: 'Log push-ups 5 consecutive days',
        target: 5,
        current: Math.min(5, stats.currentStreak),
        type: 'milestone',
        xpReward: 400,
        badgeIcon: 'Calendar',
        isCompleted: stats.currentStreak >= 5,
        claimed: false,
      },
    ];

    // Load claimed statuses
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      if (saved) {
        const map = JSON.parse(saved) as Record<string, boolean>;
        challenges.forEach((c) => {
          if (map[c.id]) c.claimed = true;
        });
      }
    } catch {
      // Ignore
    }

    return challenges;
  }

  public claimChallenge(challengeId: string): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      const map = saved ? JSON.parse(saved) : {};
      map[challengeId] = true;
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(map));
    } catch {
      // Ignore
    }
  }

  private refreshChallenges(workouts: Workout[], stats: UserStats) {
    this.getChallenges(workouts, stats);
  }

  public async seedDemoData(): Promise<void> {
    const now = new Date();
    const sampleWorkouts: Workout[] = [];
    const dates = [
      new Date(now.getTime() - 4 * 86400000),
      new Date(now.getTime() - 3 * 86400000),
      new Date(now.getTime() - 2 * 86400000),
      new Date(now.getTime() - 1 * 86400000),
      new Date(now.getTime()),
    ];

    const repTemplates = [
      { total: 35, best: 15, sets: [15, 12, 8], duration: 320, form: 94 },
      { total: 45, best: 18, sets: [18, 15, 12], duration: 410, form: 92 },
      { total: 50, best: 20, sets: [20, 15, 15], duration: 450, form: 96 },
      { total: 60, best: 25, sets: [25, 20, 15], duration: 520, form: 95 },
      { total: 70, best: 28, sets: [28, 22, 20], duration: 580, form: 97 },
    ];

    dates.forEach((d, i) => {
      const tmpl = repTemplates[i];
      sampleWorkouts.push({
        id: `demo_${Date.now()}_${i}`,
        date: d.toISOString(),
        totalReps: tmpl.total,
        bestSet: tmpl.best,
        durationSeconds: tmpl.duration,
        avgFormScore: tmpl.form,
        xpEarned: tmpl.total * 10 + tmpl.best * 5 + 50,
        isPR: i === dates.length - 1,
        sets: tmpl.sets.map((reps, sIdx) => ({
          setNumber: sIdx + 1,
          reps,
          durationSeconds: Math.round(reps * 3.2),
          avgDepthAngle: 88,
          avgFormScore: tmpl.form,
          timestamp: d.toISOString(),
        })),
      });
    });

    sampleWorkouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(sampleWorkouts));

    const db = await this.initDB();
    if (db) {
      const tx = db.transaction('workouts', 'readwrite');
      const store = tx.objectStore('workouts');
      sampleWorkouts.forEach((w) => store.put(w));
    }

    const stats = this.computeStats(sampleWorkouts);
    this.evaluateBadges(sampleWorkouts, stats);
  }

  public async clearAllData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.WORKOUTS);
    localStorage.removeItem(STORAGE_KEYS.USER_STATS);
    localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
    localStorage.removeItem(STORAGE_KEYS.BADGES);

    const db = await this.initDB();
    if (db) {
      try {
        const tx = db.transaction('workouts', 'readwrite');
        tx.objectStore('workouts').clear();
      } catch {
        // Ignore
      }
    }
  }
}

export const storage = new StorageEngine();
