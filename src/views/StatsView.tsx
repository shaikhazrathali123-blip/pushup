import React, { useState } from 'react';
import { 
  BarChart3, 
  Flame, 
  Trophy, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  ShieldCheck,
  TrendingUp,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { UserStats, Workout, Badge } from '../types';
import { formatDuration } from '../services/stickerGenerator';

interface StatsViewProps {
  stats: UserStats;
  workouts: Workout[];
  badges: Badge[];
  onDeleteWorkout: (workoutId: string) => void;
  onOpenShareModal?: (workout: Workout) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  workouts,
  badges,
  onDeleteWorkout,
}) => {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Compute Today, Week (7d), Month (30d) totals
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const todayTotal = workouts
    .filter((w) => w.date.startsWith(todayStr))
    .reduce((sum, w) => sum + w.totalReps, 0);

  const weekTotal = workouts
    .filter((w) => new Date(w.date) >= sevenDaysAgo)
    .reduce((sum, w) => sum + w.totalReps, 0);

  const monthTotal = workouts
    .filter((w) => new Date(w.date) >= thirtyDaysAgo)
    .reduce((sum, w) => sum + w.totalReps, 0);

  // Prepare Last 7 Days chart data
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayReps = workouts
      .filter((w) => w.date.startsWith(dayStr))
      .reduce((sum, w) => sum + w.totalReps, 0);

    chartData.push({
      day: dayLabel,
      date: dayStr,
      reps: dayReps,
      isToday: i === 0,
    });
  }

  // Export CSV
  const handleExportCSV = () => {
    if (workouts.length === 0) return;

    const headers = ['Workout ID', 'Date', 'Total Reps', 'Best Set', 'Duration (s)', 'Avg Form Score %', 'XP'];
    const rows = workouts.map((w) => [
      w.id,
      w.date,
      w.totalReps,
      w.bestSet,
      w.durationSeconds,
      w.avgFormScore,
      w.xpEarned,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pushquest_history_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Overview Hero Card */}
      <div className="relative overflow-hidden bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#F27D26_0%,_transparent_70%)] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-semibold">
              Lifetime Push-Ups
            </span>
            <div className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight mt-1">
              {stats.totalPushups.toLocaleString()}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
              Total Workouts Logged
            </span>
            <div className="font-mono-stat text-2xl font-bold text-gray-200 mt-0.5">
              {stats.totalWorkouts} sessions
            </div>
          </div>
        </div>

        {/* Time Windows (Today, Week, Month) */}
        <div className="relative z-10 grid grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#222222] text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Today</div>
            <div className="font-mono-stat text-lg sm:text-xl font-bold text-white mt-1">{todayTotal}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#222222] text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">This Week</div>
            <div className="font-mono-stat text-lg sm:text-xl font-bold text-[#F27D26] mt-1">{weekTotal}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#222222] text-center">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">This Month</div>
            <div className="font-mono-stat text-lg sm:text-xl font-bold text-white mt-1">{monthTotal}</div>
          </div>
        </div>
      </div>

      {/* Personal Records Grid */}
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
          Personal Records & Milestones
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#1A1A1A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">Best Set</span>
              <Trophy className="w-4 h-4 text-[#F27D26]" />
            </div>
            <div className="font-mono-stat text-2xl font-bold text-white">
              {stats.bestSet} <span className="text-xs text-gray-500 font-normal">reps</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-[#1A1A1A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">Streak</span>
              <Flame className="w-4 h-4 text-[#F27D26]" />
            </div>
            <div className="font-mono-stat text-2xl font-bold text-[#F27D26]">
              {stats.longestStreak} <span className="text-xs text-gray-500 font-normal">days</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-[#1A1A1A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">Max 1-Day</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="font-mono-stat text-2xl font-bold text-white">
              {stats.maxRepsDay} <span className="text-xs text-gray-500 font-normal">reps</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-[#1A1A1A] flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-[10px] uppercase tracking-widest font-semibold">Avg Form</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono-stat text-2xl font-bold text-emerald-400">
              {stats.avgFormScore}%
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Push-up Volume Chart */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#F27D26]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Weekly Volume Distribution
            </span>
          </div>
          <span className="text-xs font-mono-stat text-[#F27D26] font-semibold">{weekTotal} reps past 7 days</span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="day"
                stroke="#666666"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#555555"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  borderColor: '#222222',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                formatter={(value: any) => [`${value} reps`, 'Push-ups']}
              />
              <Bar dataKey="reps" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? '#F27D26' : entry.reps > 0 ? '#b85814' : '#1A1A1A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F27D26]" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Badges & Achievements
            </span>
          </div>
          <span className="text-xs font-mono-stat text-[#F27D26] font-bold">
            {badges.filter((b) => b.unlockedAt).length} / {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
          {badges.map((b) => {
            const isUnlocked = !!b.unlockedAt;

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                  isUnlocked
                    ? 'bg-[#1A1A1A] border-[#F27D26]/40 shadow-sm'
                    : 'bg-[#0D0D0D] border-[#1A1A1A] opacity-40'
                }`}
                title={isUnlocked ? `Unlocked on ${new Date(b.unlockedAt!).toLocaleDateString()}` : b.description}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                    isUnlocked
                      ? 'bg-[#F27D26]/20 text-[#F27D26] border border-[#F27D26]/40'
                      : 'bg-[#111111] text-gray-600 border border-[#222222]'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold text-white line-clamp-1 leading-tight">
                  {b.title}
                </div>
                <div className="text-[9px] font-mono-stat text-gray-500 mt-1">
                  {isUnlocked ? `+${b.xp} XP` : 'Locked'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workout History Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
            Workout History Logs ({workouts.length})
          </span>

          {workouts.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="text-xs font-semibold text-gray-400 hover:text-[#F27D26] bg-[#111111] border border-[#222222] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>

        {workouts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#111111] border border-[#1A1A1A] text-center text-xs text-gray-500">
            No workouts logged yet. Your session history will appear here.
          </div>
        ) : (
          <div className="space-y-2.5">
            {workouts.map((w) => {
              const isExpanded = expandedWorkoutId === w.id;

              return (
                <div
                  key={w.id}
                  className="rounded-2xl bg-[#111111] border border-[#1A1A1A] overflow-hidden transition-all"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedWorkoutId(isExpanded ? null : w.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#161616] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] border border-[#222222] flex flex-col items-center justify-center text-[#F27D26]">
                        <span className="font-mono-stat font-bold text-base leading-none">{w.totalReps}</span>
                        <span className="text-[8px] uppercase font-mono-stat text-gray-500 mt-0.5">reps</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>
                            {new Date(w.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400 font-mono-stat">{formatDuration(w.durationSeconds)}</span>
                          {w.isPR && (
                            <span className="px-2 py-0.5 bg-[#F27D26]/20 border border-[#F27D26]/40 text-[#F27D26] rounded-full text-[9px] font-bold">
                              PR
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono-stat mt-0.5">
                          {w.sets.length} sets • Best: <span className="text-gray-300">{w.bestSet} reps</span> • Form: <span className="text-gray-300">{w.avgFormScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 text-gray-500">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Sets Breakdown */}
                  {isExpanded && (
                    <div className="p-5 pt-3 border-t border-[#1A1A1A] bg-[#0A0A0A] space-y-4 animate-in fade-in">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block">
                        Sets Breakdown
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {w.sets.map((s) => (
                          <div
                            key={s.setNumber}
                            className="p-3 rounded-xl bg-[#111111] border border-[#1A1A1A] text-xs font-mono-stat"
                          >
                            <div className="text-gray-500 text-[10px]">Set #{s.setNumber}</div>
                            <div className="font-bold text-white text-base mt-0.5">
                              {s.reps} <span className="text-[10px] text-gray-500">reps</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              {formatDuration(s.durationSeconds)} • Form: <span className="text-gray-400">{s.avgFormScore}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]">
                        <span className="text-[11px] text-gray-500 font-mono-stat">
                          +{w.xpEarned} XP Earned
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this workout from local history?')) {
                              onDeleteWorkout(w.id);
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-mono-stat transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Log
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
