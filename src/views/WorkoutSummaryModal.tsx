import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Zap, Award, Sparkles, CheckCircle2, ArrowRight, Target, TrendingUp, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Workout, UserStats, Badge, UserSettings } from '../types';
import { formatDuration } from '../services/stickerGenerator';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout;
  stats: UserStats;
  settings: UserSettings;
  todayReps: number;
  newBadges: Badge[];
  autoIncrementedAmount?: number | null;
  onOpenShareModal: () => void;
  onSaveSettings: (newSettings: UserSettings) => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  isOpen,
  onClose,
  workout,
  stats,
  settings,
  todayReps,
  newBadges,
  autoIncrementedAmount,
  onOpenShareModal,
  onSaveSettings,
}) => {
  const [manualAdjusted, setManualAdjusted] = useState<{ delta: number; newTarget: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F27D26', '#ffffff', '#fbbf24', '#e06616'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetReps = settings.dailyTargetReps || 50;
  const isDailyGoalMet = todayReps >= targetReps;

  const handleAdjustGoal = (delta: number) => {
    const newTarget = Math.max(5, targetReps + delta);
    if (newTarget === targetReps) return;

    onSaveSettings({
      ...settings,
      dailyTargetReps: newTarget,
    });
    setManualAdjusted({ delta, newTarget });
    if (delta > 0) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#F27D26', '#ffffff'],
        });
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
        {/* Celebration Header */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#222222] text-[#F27D26] mb-1">
            <Trophy className="w-7 h-7" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-semibold block">
            Session Completed
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Workout Recorded
          </h2>
          <p className="text-xs text-gray-400">
            Validated on-device via real-time computer vision
          </p>
        </div>

        {/* Hero Reps Count */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-[#161616] border border-[#222222] text-center">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Zap className="w-24 h-24 text-[#F27D26]" />
          </div>
          <div className="text-[10px] uppercase font-mono-stat tracking-widest text-[#F27D26] font-semibold mb-1">
            Total Valid Push-ups
          </div>
          <div className="font-mono-stat text-5xl sm:text-6xl font-bold text-white tracking-tight">
            {workout.totalReps}
          </div>

          {workout.isPR && (
            <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-[#F27D26]/20 border border-[#F27D26]/40 text-[#F27D26] text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              NEW PERSONAL RECORD
            </div>
          )}
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Best Set</span>
            <div className="font-mono-stat text-xl font-bold text-white mt-0.5">
              {workout.bestSet} <span className="text-xs text-gray-500 font-normal">reps</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Duration</span>
            <div className="font-mono-stat text-xl font-bold text-white mt-0.5">
              {formatDuration(workout.durationSeconds)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">Avg Form Score</span>
            <div className="font-mono-stat text-xl font-bold text-emerald-400 mt-0.5">
              {workout.avgFormScore}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold block">XP Gained</span>
            <div className="font-mono-stat text-xl font-bold text-[#F27D26] mt-0.5">
              +{workout.xpEarned} <span className="text-xs text-gray-500">XP</span>
            </div>
          </div>
        </div>

        {/* Daily Goal Milestone / Escalation Section */}
        {isDailyGoalMet && (
          <div className="p-4 rounded-xl bg-[#161618] border border-[#F27D26]/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#F27D26]" />
                <span className="text-xs font-bold text-white">Daily Target Completed ({todayReps}/{targetReps} reps)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                100%
              </span>
            </div>

            {autoIncrementedAmount ? (
              <div className="text-[11px] text-gray-300 font-mono-stat bg-[#111113] p-2.5 rounded-lg border border-[#26262B]">
                ⚡ Auto-Escalate Active: Target increased by <strong className="text-[#F27D26]">+{autoIncrementedAmount} reps</strong> to <strong className="text-white">{targetReps} reps</strong>!
              </div>
            ) : manualAdjusted ? (
              <div className={`text-[11px] font-mono-stat bg-[#111113] p-2.5 rounded-lg border animate-in fade-in ${manualAdjusted.delta > 0 ? 'text-[#F27D26] border-[#F27D26]/30' : 'text-amber-300 border-amber-500/30'}`}>
                🎯 Target updated by {manualAdjusted.delta > 0 ? `+${manualAdjusted.delta}` : `${manualAdjusted.delta}`} reps! New goal: {targetReps} reps.
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] text-gray-400">
                  Adjust your daily goal target for the next workout:
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(-10)}
                    disabled={targetReps <= 10}
                    className="py-1.5 px-2 rounded-lg bg-[#1F1F24] hover:bg-[#2A2A32] disabled:opacity-30 border border-[#33333C] hover:border-gray-500 text-xs font-bold font-mono-stat text-gray-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Minus className="w-3 h-3" />
                    10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(10)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#1F1F24] hover:bg-[#2A2A32] border border-[#33333C] hover:border-[#F27D26]/60 text-xs font-bold font-mono-stat text-white hover:text-[#F27D26] transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#F27D26]" />
                    +10 reps
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustGoal(20)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#1F1F24] hover:bg-[#2A2A32] border border-[#33333C] hover:border-[#F27D26]/60 text-xs font-bold font-mono-stat text-white hover:text-[#F27D26] transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#F27D26]" />
                    +20 reps
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Streak & Achievements update */}
        <div className="p-3.5 rounded-xl bg-[#161616] border border-[#F27D26]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F27D26]/20 border border-[#F27D26]/40 flex items-center justify-center text-[#F27D26]">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Active Streak</div>
              <div className="text-[11px] text-gray-400 font-medium">Daily commitment maintained</div>
            </div>
          </div>
          <div className="font-mono-stat text-base font-bold text-[#F27D26]">
            {stats.currentStreak} Days
          </div>
        </div>

        {/* Newly Unlocked Badges */}
        {newBadges.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#161616] border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Award className="w-4 h-4" />
              <span>{newBadges.length} Badge{newBadges.length > 1 ? 's' : ''} Unlocked!</span>
            </div>
            <div className="space-y-1">
              {newBadges.map((b) => (
                <div key={b.id} className="text-xs text-gray-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-bold text-white">{b.title}</span>
                  <span className="text-gray-500">({b.description})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            id="summary-open-share-btn"
            onClick={() => {
              onClose();
              onOpenShareModal();
            }}
            className="w-full py-3.5 px-4 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(242,125,38,0.3)]"
          >
            <Sparkles className="w-4 h-4" />
            Create Share Card & Sticker
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-full bg-[#1A1A1A] hover:bg-[#222222] text-gray-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#262626] transition-colors"
          >
            Back to Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
