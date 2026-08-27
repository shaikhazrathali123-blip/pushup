import React, { useState } from 'react';
import { 
  Play, 
  Flame, 
  Trophy, 
  Target, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Sliders, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  X, 
  Zap 
} from 'lucide-react';
import { UserStats, UserSettings, Workout, Challenge } from '../types';
import { getLevelInfo } from '../services/storage';
import { formatDuration } from '../services/stickerGenerator';

interface HomeViewProps {
  stats: UserStats;
  settings: UserSettings;
  workouts: Workout[];
  challenges: Challenge[];
  onStartWorkout: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenShareModal: (workout?: Workout) => void;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stats,
  settings,
  workouts,
  challenges,
  onStartWorkout,
  onNavigateTab,
  onOpenShareModal,
  onSaveSettings,
}) => {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState(settings.dailyTargetReps.toString());
  const [justAdjusted, setJustAdjusted] = useState<{ delta: number; newTarget: number } | null>(null);

  const levelInfo = getLevelInfo(stats.xp);

  // Compute today's total reps
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWorkouts = workouts.filter((w) => w.date.startsWith(todayStr));
  const todayReps = todayWorkouts.reduce((sum, w) => sum + w.totalReps, 0);

  // Compute 7-day weekly volume
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thisWeekWorkouts = workouts.filter((w) => new Date(w.date) >= sevenDaysAgo);
  const thisWeekReps = thisWeekWorkouts.reduce((sum, w) => sum + w.totalReps, 0);

  const targetReps = settings.dailyTargetReps || 50;
  const isGoalReached = todayReps >= targetReps;
  const dailyProgressPercent = Math.min(100, Math.round((todayReps / targetReps) * 100));

  const recentWorkouts = workouts.slice(0, 3);
  const activeDailyChallenge = challenges.find((c) => c.type === 'daily') || challenges[0];

  const handleQuickAdjust = (delta: number) => {
    const newTarget = Math.max(5, targetReps + delta);
    if (newTarget === targetReps) return;

    onSaveSettings({
      ...settings,
      dailyTargetReps: newTarget,
    });
    setCustomGoalInput(newTarget.toString());
    setJustAdjusted({ delta, newTarget });
    setTimeout(() => setJustAdjusted(null), 2500);
  };

  const handleSetTarget = (reps: number) => {
    const validReps = Math.max(5, reps);
    onSaveSettings({
      ...settings,
      dailyTargetReps: validReps,
    });
    setCustomGoalInput(validReps.toString());
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customGoalInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleSetTarget(parsed);
      setIsGoalModalOpen(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28">
      {/* ==================================================================== */}
      {/* AESTHETIC HERO SECTION WITH INTEGRATED SHARE STICKER BUTTON */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#161618] via-[#111113] to-[#0D0D0E] border border-[#26262B] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Subtle dynamic ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#F27D26]/5 rounded-full blur-2xl pointer-events-none translate-y-1/2" />

        {/* Hero Top Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#222226]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1D1D21] border border-[#2D2D34] flex items-center justify-center text-[#F27D26] shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#F27D26] uppercase font-mono-stat">
                  Daily Objective
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F27D26]" />
                <span className="text-[11px] text-gray-400 font-medium">Level {levelInfo.level}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                Push-Up Telemetry
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="hero-adjust-goal-btn"
              onClick={() => setIsGoalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181C] hover:bg-[#222228] border border-[#2A2A30] hover:border-[#F27D26]/40 text-[11px] font-mono-stat text-gray-300 hover:text-white transition-colors"
            >
              <Target className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>Goal: {targetReps} reps</span>
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </button>

            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181C] border border-[#2A2A30] text-[11px] font-mono-stat text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pose Engine Active</span>
            </div>
          </div>
        </div>

        {/* Hero Main Body: Big Counter & Target Status */}
        <div className="relative z-10 my-6 sm:my-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white font-display leading-none">
                {todayReps}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-500 font-display">
                    / {targetReps}
                  </span>
                  {/* Quick Goal Reducers and Increments */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Reduce daily goal by -20 reps"
                      onClick={() => handleQuickAdjust(-20)}
                      disabled={targetReps <= 20}
                      className="px-1.5 py-1 rounded-lg bg-[#1D1D22] hover:bg-[#2A2A32] disabled:opacity-30 disabled:hover:bg-[#1D1D22] border border-[#33333C] hover:border-gray-500 text-[11px] font-bold font-mono-stat text-gray-300 transition-all active:scale-95 flex items-center gap-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                      20
                    </button>
                    <button
                      type="button"
                      title="Reduce daily goal by -10 reps"
                      onClick={() => handleQuickAdjust(-10)}
                      disabled={targetReps <= 10}
                      className="px-1.5 py-1 rounded-lg bg-[#1D1D22] hover:bg-[#2A2A32] disabled:opacity-30 disabled:hover:bg-[#1D1D22] border border-[#33333C] hover:border-gray-500 text-[11px] font-bold font-mono-stat text-gray-300 transition-all active:scale-95 flex items-center gap-0.5"
                    >
                      <Minus className="w-2.5 h-2.5" />
                      10
                    </button>
                    <button
                      type="button"
                      title="Add +10 to daily goal"
                      onClick={() => handleQuickAdjust(10)}
                      className="px-1.5 py-1 rounded-lg bg-[#1D1D22] hover:bg-[#2A2A32] border border-[#33333C] hover:border-[#F27D26]/50 text-[11px] font-bold font-mono-stat text-[#F27D26] transition-all active:scale-95 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      10
                    </button>
                    <button
                      type="button"
                      title="Add +20 to daily goal"
                      onClick={() => handleQuickAdjust(20)}
                      className="px-1.5 py-1 rounded-lg bg-[#1D1D22] hover:bg-[#2A2A32] border border-[#33333C] hover:border-[#F27D26]/50 text-[11px] font-bold font-mono-stat text-[#F27D26] transition-all active:scale-95 flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      20
                    </button>
                  </div>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-mono-stat">
                  Reps Today
                </span>
              </div>
            </div>

            {/* Status Message */}
            <div className="text-xs sm:text-sm text-gray-300">
              {justAdjusted && (
                <div className={`font-semibold flex items-center gap-1.5 animate-in fade-in ${justAdjusted.delta > 0 ? 'text-[#F27D26]' : 'text-amber-300'}`}>
                  <Sparkles className="w-4 h-4" />
                  {justAdjusted.delta > 0
                    ? `Goal escalated by +${justAdjusted.delta} reps! New daily target: ${justAdjusted.newTarget} reps.`
                    : `Goal adjusted by -${Math.abs(justAdjusted.delta)} reps. New daily target: ${justAdjusted.newTarget} reps.`}
                </div>
              )}
              {!justAdjusted && dailyProgressPercent >= 100 && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Daily target crushed! {todayReps - targetReps > 0 ? `+${todayReps - targetReps} bonus reps logged.` : 'Outstanding form.'}
                </span>
              )}
              {!justAdjusted && dailyProgressPercent < 100 && (
                <span className="text-gray-400">
                  <strong className="text-white font-mono-stat">{targetReps - todayReps} reps</strong> needed to complete today's target.
                </span>
              )}
            </div>
          </div>

          {/* Hero Action Buttons (Start Workout & Share Sticker) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Share Sticker Button - Directly in Hero */}
            <button
              type="button"
              id="hero-share-sticker-btn"
              onClick={() => onOpenShareModal(workouts[0])}
              className="py-4 px-6 rounded-full bg-[#18181C] hover:bg-[#202026] text-white hover:text-[#F27D26] border border-[#2E2E36] hover:border-[#F27D26]/50 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 text-[#F27D26] group-hover:rotate-12 transition-transform" />
              Share Sticker
            </button>

            {/* Start Workout Button */}
            <button
              type="button"
              id="hero-start-workout-btn"
              onClick={onStartWorkout}
              className="py-4 px-8 sm:px-10 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(242,125,38,0.35)] transition-all active:scale-95"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
              START WORKOUT
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 space-y-2 pt-2">
          <div className="flex justify-between text-[11px] font-mono-stat text-gray-400">
            <span>Progress: {dailyProgressPercent}%</span>
            <span>Target: {targetReps} reps</span>
          </div>
          <div className="w-full bg-[#1A1A1E] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#26262D]">
            <div
              className="bg-gradient-to-r from-[#d96614] to-[#F27D26] h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(242,125,38,0.6)]"
              style={{ width: `${dailyProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Goal Milestone Escalation Banner (when target is hit) */}
        {isGoalReached && (
          <div className="relative z-10 mt-5 p-4 rounded-2xl bg-[#17171C]/90 border border-[#F27D26]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F27D26]/20 border border-[#F27D26]/40 flex items-center justify-center text-[#F27D26] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Goal Achieved! Adjust your target?</span>
                  {settings.autoIncrementOnGoal && (
                    <span className="px-1.5 py-0.5 bg-[#F27D26]/20 text-[#F27D26] text-[9px] font-bold rounded">
                      Auto-Escalate ON
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400">
                  Raise your target for extra challenge or adjust as needed.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleQuickAdjust(-10)}
                disabled={targetReps <= 10}
                className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-[#1F1F24] hover:bg-[#272730] disabled:opacity-30 border border-[#33333C] hover:border-gray-500 text-xs font-bold font-mono-stat text-gray-300 transition-colors flex items-center justify-center gap-1"
              >
                <Minus className="w-3 h-3" />
                10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(10)}
                className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-[#1F1F24] hover:bg-[#272730] border border-[#33333C] hover:border-[#F27D26]/60 text-xs font-bold font-mono-stat text-white hover:text-[#F27D26] transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                10 reps
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdjust(20)}
                className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-[#F27D26] hover:brightness-110 text-black text-xs font-bold font-mono-stat transition-all flex items-center justify-center gap-1 shadow-[0_2px_10px_rgba(242,125,38,0.3)]"
              >
                <Plus className="w-3 h-3" />
                20 reps
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* GOAL ADJUSTMENT MODAL */}
      {/* ==================================================================== */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111113] border border-[#222228] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1E24]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/30 flex items-center justify-center text-[#F27D26]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Adjust Daily Push-Up Goal</h2>
                  <p className="text-[11px] text-gray-400">Current target: {targetReps} reps/day</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#18181C] border border-[#26262E] flex items-center justify-center text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Quick Stepper */}
            <div className="p-3.5 rounded-2xl bg-[#16161A] border border-[#26262E] space-y-2">
              <label className="text-[10px] uppercase font-mono-stat tracking-wider text-gray-400 block font-semibold">
                Quick Reduce / Increment
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(-20)}
                  disabled={targetReps <= 20}
                  className="py-2 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-gray-300 hover:border-gray-500 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  20 reps
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(-10)}
                  disabled={targetReps <= 10}
                  className="py-2 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-gray-300 hover:border-gray-500 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  10 reps
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(10)}
                  className="py-2 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-[#F27D26] hover:border-[#F27D26]/50 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  10 reps
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjust(20)}
                  className="py-2 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-[#F27D26] hover:border-[#F27D26]/50 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  20 reps
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 block font-mono-stat">
                Select Preset Goal
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50, 75, 100, 150, 200].map((reps) => (
                  <button
                    key={reps}
                    type="button"
                    onClick={() => {
                      handleSetTarget(reps);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold font-mono-stat border transition-all ${
                      targetReps === reps
                        ? 'bg-[#F27D26] border-[#F27D26] text-black shadow-[0_0_12px_rgba(242,125,38,0.3)]'
                        : 'bg-[#16161A] border-[#26262E] text-gray-300 hover:border-[#383844]'
                    }`}
                  >
                    {reps}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleCustomGoalSubmit} className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 block font-mono-stat">
                Or Custom Daily Target
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#16161A] border border-[#26262E] text-white text-xs font-mono-stat focus:outline-none focus:border-[#F27D26]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] uppercase font-mono-stat text-gray-500">
                    reps
                  </span>
                </div>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Set
                </button>
              </div>
            </form>

            {/* Dynamic Auto-Increment Toggle */}
            <div className="p-3.5 rounded-2xl bg-[#16161A] border border-[#26262E] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Auto-Increment on Hit Goal</span>
                    <span className="px-1.5 py-0.5 bg-[#F27D26]/20 text-[#F27D26] text-[9px] font-bold rounded">
                      Dynamic
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Auto-raise daily goal when target is reached
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoIncrementOnGoal}
                  onChange={(e) => {
                    onSaveSettings({
                      ...settings,
                      autoIncrementOnGoal: e.target.checked,
                    });
                  }}
                  className="w-4 h-4 accent-[#F27D26] rounded cursor-pointer"
                />
              </div>

              {settings.autoIncrementOnGoal && (
                <div className="pt-2 border-t border-[#222228] space-y-2">
                  <label className="text-[10px] uppercase font-mono-stat tracking-wider text-gray-400 block font-semibold">
                    Step Increment Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 25, 50].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          onSaveSettings({
                            ...settings,
                            goalIncrementStep: step,
                          });
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold font-mono-stat border transition-all ${
                          settings.goalIncrementStep === step
                            ? 'bg-[#F27D26] border-[#F27D26] text-black'
                            : 'bg-[#111113] border-[#222228] text-gray-400 hover:border-[#383844]'
                        }`}
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="w-full py-3 rounded-full bg-[#18181C] hover:bg-[#202026] text-gray-300 font-bold text-xs uppercase tracking-wider border border-[#282830] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* AESTHETIC BENTO STATS GRID */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weekly Volume */}
        <div className="bg-[#121214] border border-[#202024] hover:border-[#2A2A30] rounded-2xl p-5 flex flex-col justify-between transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-mono-stat">
              Weekly Volume
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1E] flex items-center justify-center text-gray-400">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-stat tracking-tight">
              {thisWeekReps} <span className="text-xs font-normal text-gray-500">reps</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-[#F27D26]" />
              Lifetime: {stats.totalPushups} validated reps
            </div>
          </div>
        </div>

        {/* Personal Best */}
        <div className="bg-[#121214] border border-[#202024] hover:border-[#2A2A30] rounded-2xl p-5 flex flex-col justify-between transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-mono-stat">
              Personal Best (Set)
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F27D26]/10 flex items-center justify-center text-[#F27D26]">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#F27D26] font-mono-stat tracking-tight">
              {stats.bestSet} <span className="text-xs font-normal text-gray-500">reps</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Top single set performance
            </div>
          </div>
        </div>

        {/* Active Streak */}
        <div className="bg-[#121214] border border-[#202024] hover:border-[#2A2A30] rounded-2xl p-5 flex flex-col justify-between transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-mono-stat">
              Active Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F27D26]/10 flex items-center justify-center text-[#F27D26]">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-stat tracking-tight">
              {stats.currentStreak} <span className="text-xs font-normal text-gray-500">days</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Longest streak: {stats.longestStreak} days
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* DAILY CHALLENGE QUEST CARD */}
      {/* ==================================================================== */}
      {activeDailyChallenge && (
        <div 
          onClick={() => onNavigateTab('challenges')}
          className="bg-[#121214] border border-[#202024] hover:border-[#F27D26]/40 rounded-2xl p-5 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-semibold font-mono-stat">
                Daily Quest
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-xs font-bold text-white group-hover:text-[#F27D26] transition-colors">
                {activeDailyChallenge.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono-stat text-[#F27D26] font-bold">
              <span>+{activeDailyChallenge.xpReward} XP</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">{activeDailyChallenge.description}</p>
          <div className="w-full bg-[#1A1A1E] h-2 rounded-full overflow-hidden border border-[#26262D]">
            <div
              className="bg-[#F27D26] h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (activeDailyChallenge.current / activeDailyChallenge.target) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CLEAN RECENT WORKOUTS FEED */}
      {/* ==================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold font-mono-stat">
            Recent Workouts
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('stats')}
            className="text-xs font-bold text-[#F27D26] hover:underline flex items-center gap-1"
          >
            View History ({workouts.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="bg-[#121214] border border-[#202024] rounded-2xl p-8 text-center space-y-2">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">No push-up workouts logged yet.</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Start your first session above with AI pose tracking to build your streak and stickers!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentWorkouts.map((w) => (
              <div
                key={w.id}
                className="bg-[#121214] border border-[#202024] hover:border-[#2D2D34] rounded-2xl p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#1A1A1E] border border-[#26262D] flex flex-col items-center justify-center text-[#F27D26]">
                    <span className="font-mono-stat font-bold text-base leading-none">{w.totalReps}</span>
                    <span className="text-[8px] uppercase font-mono-stat text-gray-500 mt-0.5">reps</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 font-mono-stat">{formatDuration(w.durationSeconds)}</span>
                      {w.isPR && (
                        <span className="px-2 py-0.5 bg-[#F27D26]/20 border border-[#F27D26]/40 text-[#F27D26] rounded-full text-[9px] font-bold">
                          PR
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono-stat mt-0.5">
                      Best set: <span className="text-gray-200">{w.bestSet} reps</span> • Form accuracy: <span className="text-emerald-400">{w.avgFormScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono-stat text-[#F27D26] font-bold">
                    +{w.xpEarned} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
