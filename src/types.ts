export type PushupState = 'IDLE' | 'READY' | 'DESCENDING' | 'DOWN' | 'ASCENDING' | 'UP';

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseAngles {
  leftElbowAngle: number;
  rightElbowAngle: number;
  activeElbowAngle: number;
  bodyAlignmentAngle: number; // shoulder-hip-ankle angle (ideal ~170-180)
  depthPercentage: number; // 0% (top) to 100% (bottom <= 90deg)
  isFacingLeft: boolean;
  visibilityScore: number;
}

export interface FormFeedback {
  isValidPlank: boolean;
  isGoodDepth: boolean;
  isFullExtension: boolean;
  message: string;
  type: 'good' | 'warning' | 'info' | 'error';
  score: number; // 0 - 100
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  durationSeconds: number;
  avgDepthAngle: number;
  avgFormScore: number;
  restAfterSeconds?: number;
  timestamp: string;
}

export interface Workout {
  id: string;
  date: string; // ISO string
  totalReps: number;
  bestSet: number;
  durationSeconds: number;
  sets: WorkoutSet[];
  avgFormScore: number;
  xpEarned: number;
  isPR: boolean;
  notes?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'daily' | 'weekly' | 'unbroken' | 'pr' | 'milestone';
  xpReward: number;
  badgeIcon: string;
  isCompleted: boolean;
  claimed: boolean;
  expiresAt?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  category: 'reps' | 'streak' | 'form' | 'special';
  xp: number;
}

export interface UserStats {
  totalPushups: number;
  totalWorkouts: number;
  totalDurationSeconds: number;
  bestSet: number;
  maxRepsDay: number;
  xp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  avgFormScore: number;
}

export interface UserSettings {
  targetDepthAngle: number; // 90 is standard, 85 strict, 95 lenient
  dailyTargetReps: number;
  autoIncrementOnGoal: boolean; // Auto-raise daily goal upon hitting it
  goalIncrementStep: number; // e.g. 10, 20, 25, 50
  soundEnabled: boolean;
  voiceEnabled: boolean;
  hapticEnabled: boolean;
  mirrorCamera: boolean;
  showSkeleton: boolean;
  autoRestTimer: boolean;
  restDurationSeconds: number;
}

export type StickerLayout = 'minimal-text' | 'vertical-stamp' | 'compact-pill' | 'corner-hud' | 'strava-card';
export type StickerColor = 'orange' | 'white' | 'lime' | 'cyan' | 'gold';
export type StickerBgMode = 'transparent' | 'frosted' | 'solid';

export interface StickerOverlayConfig {
  layout: StickerLayout;
  bgMode: StickerBgMode;
  color: StickerColor;
  theme?: string; // for legacy compatibility
  scale: number;
  rotation: number;
  xPercent: number;
  yPercent: number;
  textAlign: 'left' | 'center' | 'right';
  showLogo: boolean;
  showDate: boolean;
  showBestSet: boolean;
  showDuration: boolean;
  showPace: boolean;
  showStreak: boolean;
  showFormScore: boolean;
  showXP: boolean;
}
