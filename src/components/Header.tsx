import React from 'react';
import { Flame, Award, Volume2, VolumeX, Settings, Zap } from 'lucide-react';
import { UserStats, UserSettings } from '../types';
import { getLevelInfo } from '../services/storage';

interface HeaderProps {
  stats: UserStats;
  settings: UserSettings;
  onOpenSettings: () => void;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  settings,
  onOpenSettings,
  onToggleSound,
}) => {
  const levelInfo = getLevelInfo(stats.xp);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0D0D0D] border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#F27D26] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(242,125,38,0.35)]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 18h12" />
              <path d="M6 6h12" />
              <path d="M6 12h12" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
              PUSH<span className="text-[#F27D26]">QUEST</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-0.5 block">
              AI Pose Detection
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Current Streak */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Current Streak
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[#F27D26] font-bold text-sm sm:text-base tracking-tight font-mono-stat">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'DAY' : 'DAYS'}
              </span>
            </div>
          </div>

          {/* Level Progress */}
          <div className="hidden xs:flex flex-col items-end border-l border-[#1A1A1A] pl-4 sm:pl-6">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                Level {levelInfo.level}
              </span>
              <span className="text-[9px] font-mono-stat text-gray-500">
                {stats.xp} XP
              </span>
            </div>
            <div className="w-24 sm:w-28 h-1.5 bg-[#1A1A1A] rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-[#F27D26] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(242,125,38,0.5)]"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls: Sound & Settings */}
          <div className="flex items-center gap-2 border-l border-[#1A1A1A] pl-3 sm:pl-4">
            <button
              id="header-sound-toggle-btn"
              onClick={onToggleSound}
              aria-label="Toggle Sound"
              className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#F27D26]" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
            </button>

            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              aria-label="Open Settings"
              className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] border border-[#222222] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
