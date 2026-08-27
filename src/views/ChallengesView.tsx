import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Shield, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Challenge, UserStats } from '../types';

interface ChallengesViewProps {
  challenges: Challenge[];
  stats: UserStats;
  onClaimChallenge: (challengeId: string) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  stats,
  onClaimChallenge,
}) => {
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'milestones'>('all');

  const filteredChallenges = challenges.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'daily') return c.type === 'daily';
    if (filter === 'weekly') return c.type === 'weekly';
    if (filter === 'milestones') return c.type === 'unbroken' || c.type === 'pr' || c.type === 'milestone';
    return true;
  });

  const handleClaim = (c: Challenge) => {
    if (!c.isCompleted || c.claimed) return;

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F27D26', '#ffffff', '#fbbf24', '#e06616'],
      });
    } catch {
      // Ignore
    }

    onClaimChallenge(c.id);
  };

  const getChallengeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-[#F27D26]" />;
      case 'Zap': return <Zap className="w-5 h-5 text-[#F27D26]" />;
      case 'Shield': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'Calendar': return <Calendar className="w-5 h-5 text-sky-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-400" />;
      default: return <Award className="w-5 h-5 text-[#F27D26]" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 sm:p-7 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#F27D26_0%,_transparent_70%)] opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#222222] flex items-center justify-center text-[#F27D26]">
              <Trophy className="w-5 h-5 text-[#F27D26]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-semibold">
                Achievements & XP
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight mt-0.5">
                Quests & Milestones
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-[#F27D26] font-mono-stat">
              {challenges.filter((c) => c.isCompleted).length} / {challenges.length} Done
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gray-500 block">
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Quests' },
          { id: 'daily', label: 'Daily (50 Today)' },
          { id: 'weekly', label: 'Weekly (500 Reps)' },
          { id: 'milestones', label: 'PR & Mastery' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all ${
              filter === tab.id
                ? 'bg-[#F27D26] border-[#F27D26] text-black'
                : 'bg-[#111111] border-[#222222] text-gray-400 hover:text-white hover:border-[#333333]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChallenges.map((c) => {
          const progressPercent = Math.min(100, Math.round((c.current / c.target) * 100));

          return (
            <div
              key={c.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                c.isCompleted && !c.claimed
                  ? 'bg-[#111111] border-[#F27D26] shadow-[0_0_20px_rgba(242,125,38,0.2)]'
                  : 'bg-[#111111] border-[#1A1A1A] hover:border-[#262626]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#222222] flex items-center justify-center shrink-0">
                      {getChallengeIcon(c.badgeIcon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {c.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#222222] text-[9px] font-mono-stat font-semibold text-gray-400 uppercase">
                          {c.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{c.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono-stat text-xs font-bold text-[#F27D26]">
                      +{c.xpReward} XP
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex items-center justify-between text-xs font-mono-stat">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider">Progress</span>
                    <span className="font-bold text-gray-300">
                      {c.current} / {c.target}{' '}
                      <span className="text-gray-500">({progressPercent}%)</span>
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.isCompleted
                          ? 'bg-[#F27D26] shadow-[0_0_8px_rgba(242,125,38,0.5)]'
                          : 'bg-[#F27D26]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Claim / Status Action */}
              <div className="mt-4 pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-mono-stat">
                  {c.claimed ? '✓ Reward Claimed' : c.isCompleted ? 'Goal Completed!' : `${c.target - c.current} reps remaining`}
                </span>

                {c.isCompleted && !c.claimed ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(c)}
                    className="py-1.5 px-4 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_4px_15px_rgba(242,125,38,0.3)] animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Claim +{c.xpReward} XP
                  </button>
                ) : c.claimed ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
