import React, { useState } from 'react';
import { X, Volume2, Mic, Smartphone, Sliders, Database, Trash2, Target, TrendingUp, Sparkles, Plus, Minus } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onSeedDemo: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSeedDemo,
  onResetData,
}) => {
  const [customGoalInput, setCustomGoalInput] = useState(settings.dailyTargetReps.toString());

  if (!isOpen) return null;

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    onSaveSettings(updated);
  };

  const handleAdjustGoal = (delta: number) => {
    const newTarget = Math.max(5, (settings.dailyTargetReps || 50) + delta);
    handleChange('dailyTargetReps', newTarget);
    setCustomGoalInput(newTarget.toString());
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customGoalInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleChange('dailyTargetReps', parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111111] border border-[#1A1A1A] rounded-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#222222] flex items-center justify-center text-[#F27D26]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-semibold block">
                Preferences
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">PushQuest Settings</h2>
            </div>
          </div>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#222222] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 pt-5">
          {/* Pose Detection Depth Strictness */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 flex items-center justify-between">
              <span>Elbow Depth Threshold</span>
              <span className="font-mono-stat text-[#F27D26] font-bold">{settings.targetDepthAngle}°</span>
            </label>
            <p className="text-xs text-gray-500">
              Angle threshold your elbow must reach at the bottom of each rep to trigger valid DOWN state.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Lenient (95°)', val: 95 },
                { label: 'Standard (90°)', val: 90 },
                { label: 'Strict (80°)', val: 80 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleChange('targetDepthAngle', opt.val)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    settings.targetDepthAngle === opt.val
                      ? 'bg-[#F27D26] border-[#F27D26] text-black'
                      : 'bg-[#161616] border-[#222222] text-gray-400 hover:border-[#333333]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal Target & Auto-Increment */}
          <div className="space-y-4 pt-2 border-t border-[#1A1A1A]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
                Daily Goal Progression
              </span>
              <span className="font-mono-stat text-[#F27D26] font-bold text-xs">
                {settings.dailyTargetReps} reps / day
              </span>
            </div>

            {/* Quick Goal Adjuster Stepper */}
            <div className="p-3 rounded-2xl bg-[#161618] border border-[#222226] space-y-2">
              <label className="text-[10px] uppercase font-mono-stat tracking-wider text-gray-400 block font-semibold">
                Quick Reduce / Increment Target
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustGoal(-20)}
                  disabled={(settings.dailyTargetReps || 50) <= 20}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-gray-300 hover:border-gray-500 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  20 reps
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustGoal(-10)}
                  disabled={(settings.dailyTargetReps || 50) <= 10}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-gray-300 hover:border-gray-500 disabled:opacity-30 transition-all flex items-center justify-center gap-1"
                >
                  <Minus className="w-3 h-3" />
                  10 reps
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustGoal(10)}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-[#F27D26] hover:border-[#F27D26]/50 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  10 reps
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustGoal(20)}
                  className="py-1.5 px-2 rounded-xl text-xs font-bold font-mono-stat border bg-[#1A1A1F] border-[#2A2A34] text-[#F27D26] hover:border-[#F27D26]/50 transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  20 reps
                </button>
              </div>
            </div>

            {/* Target Presets */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 block">
                Daily Target Presets
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {[10, 20, 30, 50, 75, 100, 150, 200].map((reps) => (
                  <button
                    key={reps}
                    type="button"
                    onClick={() => {
                      handleChange('dailyTargetReps', reps);
                      setCustomGoalInput(reps.toString());
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold font-mono-stat border transition-all ${
                      settings.dailyTargetReps === reps
                        ? 'bg-[#F27D26] border-[#F27D26] text-black shadow-[0_0_12px_rgba(242,125,38,0.3)]'
                        : 'bg-[#161616] border-[#222222] text-gray-400 hover:border-[#333333]'
                    }`}
                  >
                    {reps}
                  </button>
                ))}
              </div>

              {/* Custom Goal Input Form */}
              <form onSubmit={handleCustomGoalSubmit} className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    placeholder="Custom target (e.g. 40)"
                    className="w-full py-2 px-3 rounded-xl bg-[#161616] border border-[#222222] text-white text-xs font-mono-stat focus:outline-none focus:border-[#F27D26]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono-stat text-gray-500">
                    reps
                  </span>
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-[#222226] hover:bg-[#2C2C32] text-xs font-bold text-white border border-[#33333A] transition-colors"
                >
                  Set Target
                </button>
              </form>
            </div>

            {/* Auto-Increment Target on Goal Reached */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#161618] border border-[#222226]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/30 flex items-center justify-center text-[#F27D26]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Auto-Increment on Hit Goal</span>
                      <span className="px-1.5 py-0.2 bg-[#F27D26]/20 text-[#F27D26] text-[9px] font-bold rounded-md">
                        Dynamic
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Automatically raise daily goal when today's target is crushed
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="toggle-auto-increment"
                  checked={settings.autoIncrementOnGoal}
                  onChange={(e) => handleChange('autoIncrementOnGoal', e.target.checked)}
                  className="w-4 h-4 accent-[#F27D26] rounded cursor-pointer"
                />
              </div>

              {settings.autoIncrementOnGoal && (
                <div className="pt-2 border-t border-[#222226] space-y-2 animate-in fade-in">
                  <label className="text-[11px] uppercase font-mono-stat tracking-wider text-gray-400 block font-semibold">
                    Escalation Step Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 25, 50].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => handleChange('goalIncrementStep', step)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                          settings.goalIncrementStep === step
                            ? 'bg-[#F27D26] border-[#F27D26] text-black'
                            : 'bg-[#121214] border-[#26262B] text-gray-400 hover:border-[#383842]'
                        }`}
                      >
                        +{step} reps
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#F27D26]/80 flex items-center gap-1 font-mono-stat">
                    <Sparkles className="w-3 h-3" />
                    Target will advance by +{settings.goalIncrementStep || 10} reps on each completion.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Audio, Voice & Haptics */}
          <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
              Audio & Tactile Feedback
            </span>

            {/* Sound FX */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-[#F27D26]" />
                <div>
                  <div className="text-sm font-medium text-white">Audio Beeps & Chimes</div>
                  <div className="text-xs text-gray-500">Low-latency synthesizer chimes for Down/Up</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                className="w-5 h-5 accent-[#F27D26] rounded cursor-pointer"
              />
            </div>

            {/* Voice Counting */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-[#F27D26]" />
                <div>
                  <div className="text-sm font-medium text-white">Voice Rep Announcements</div>
                  <div className="text-xs text-gray-500">Speaks rep numbers and milestone cues</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => handleChange('voiceEnabled', e.target.checked)}
                className="w-5 h-5 accent-[#F27D26] rounded cursor-pointer"
              />
            </div>

            {/* Haptic Feedback */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-[#F27D26]" />
                <div>
                  <div className="text-sm font-medium text-white">Haptic Vibration</div>
                  <div className="text-xs text-gray-500">Tactile pulse on each completed rep</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticEnabled}
                onChange={(e) => handleChange('hapticEnabled', e.target.checked)}
                className="w-5 h-5 accent-[#F27D26] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Camera Preferences */}
          <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
              Camera & HUD Settings
            </span>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
              <div>
                <div className="text-sm font-medium text-white">Mirror Front Camera</div>
                <div className="text-xs text-gray-500">Natural mirror reflection view</div>
              </div>
              <input
                type="checkbox"
                checked={settings.mirrorCamera}
                onChange={(e) => handleChange('mirrorCamera', e.target.checked)}
                className="w-5 h-5 accent-[#F27D26] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#161616] border border-[#222222]">
              <div>
                <div className="text-sm font-medium text-white">Show Pose Skeleton Overlay</div>
                <div className="text-xs text-gray-500">Display real-time biometric kinetic joints</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showSkeleton}
                onChange={(e) => handleChange('showSkeleton', e.target.checked)}
                className="w-5 h-5 accent-[#F27D26] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Local Storage & Data Management */}
          <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold block">
              Local Storage (On-Device)
            </span>
            <p className="text-xs text-gray-500">
              All workout history, streaks, and personal records are saved 100% locally on this device with zero external cloud accounts.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                id="btn-seed-demo"
                onClick={() => {
                  onSeedDemo();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#161616] hover:bg-[#222222] text-gray-300 text-xs font-semibold border border-[#222222] transition-colors"
              >
                <Database className="w-4 h-4 text-[#F27D26]" />
                Seed Sample Workouts
              </button>

              <button
                type="button"
                id="btn-reset-data"
                onClick={() => {
                  if (window.confirm('Reset all local workout logs and streaks?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 text-xs font-semibold border border-red-900/40 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                Clear Local Data
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-4 border-t border-[#1A1A1A] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(242,125,38,0.3)]"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
