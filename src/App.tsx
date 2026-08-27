/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserStats, 
  UserSettings, 
  Workout, 
  Challenge, 
  Badge 
} from './types';
import { 
  storage, 
  DEFAULT_SETTINGS 
} from './services/storage';
import { soundManager } from './services/sound';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { WorkoutView } from './views/WorkoutView';
import { ChallengesView } from './views/ChallengesView';
import { StatsView } from './views/StatsView';
import { SettingsModal } from './components/SettingsModal';
import { WorkoutSummaryModal } from './views/WorkoutSummaryModal';
import { ShareStickerModal } from './views/ShareStickerModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  // App Data State (Local IndexedDB + LocalStorage)
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalPushups: 0,
    totalWorkouts: 0,
    totalDurationSeconds: 0,
    bestSet: 0,
    maxRepsDay: 0,
    xp: 0,
    level: 1,
    levelTitle: 'Recruit',
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    avgFormScore: 90,
  });
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Modals & Overlays
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [summaryWorkout, setSummaryWorkout] = useState<Workout | null>(null);
  const [summaryNewBadges, setSummaryNewBadges] = useState<Badge[]>([]);
  const [summaryAutoIncrementedAmount, setSummaryAutoIncrementedAmount] = useState<number | null>(null);
  const [shareWorkout, setShareWorkout] = useState<Workout | null>(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Initial Load from Storage
  useEffect(() => {
    const loadData = async () => {
      const savedSettings = storage.getSettings();
      setSettings(savedSettings);
      soundManager.updateSettings(
        savedSettings.soundEnabled,
        savedSettings.voiceEnabled,
        savedSettings.hapticEnabled
      );

      const loadedWorkouts = await storage.getWorkouts();
      setWorkouts(loadedWorkouts);

      const computedStats = storage.computeStats(loadedWorkouts);
      setStats(computedStats);

      const loadedChallenges = storage.getChallenges(loadedWorkouts, computedStats);
      setChallenges(loadedChallenges);

      const loadedBadges = storage.getBadges();
      setBadges(loadedBadges);
    };

    loadData();

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    storage.saveSettings(updated);
    soundManager.updateSettings(updated.soundEnabled, updated.voiceEnabled, updated.hapticEnabled);
  };

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    soundManager.updateSettings(
      newSettings.soundEnabled,
      newSettings.voiceEnabled,
      newSettings.hapticEnabled
    );
  };

  // Workout Session Handlers
  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setActiveTab('workout');
  };

  const handleFinishWorkout = async (completedWorkout: Workout) => {
    setIsWorkoutActive(false);
    setActiveTab('home');

    // Check today's reps prior to this session
    const todayStr = new Date().toISOString().split('T')[0];
    const prevTodayReps = workouts
      .filter((w) => w.date.startsWith(todayStr))
      .reduce((sum, w) => sum + w.totalReps, 0);
    const newTodayReps = prevTodayReps + completedWorkout.totalReps;

    let autoIncrementAmount: number | null = null;
    const currentTarget = settings.dailyTargetReps || 50;

    // Check if auto-increment is enabled and goal was crossed in this workout
    if (
      settings.autoIncrementOnGoal &&
      prevTodayReps < currentTarget &&
      newTodayReps >= currentTarget
    ) {
      const step = settings.goalIncrementStep || 10;
      const updatedTarget = currentTarget + step;
      const updatedSettings: UserSettings = {
        ...settings,
        dailyTargetReps: updatedTarget,
      };
      setSettings(updatedSettings);
      storage.saveSettings(updatedSettings);
      autoIncrementAmount = step;
    }

    setSummaryAutoIncrementedAmount(autoIncrementAmount);

    // Save locally
    const { updatedStats, newBadges } = await storage.saveWorkout(completedWorkout);
    const updatedWorkouts = await storage.getWorkouts();
    setWorkouts(updatedWorkouts);
    setStats(updatedStats);

    const updatedChallenges = storage.getChallenges(updatedWorkouts, updatedStats);
    setChallenges(updatedChallenges);

    const updatedBadges = storage.getBadges();
    setBadges(updatedBadges);

    // Show Workout Summary celebration modal
    setSummaryWorkout(completedWorkout);
    setSummaryNewBadges(newBadges);
  };

  const handleCancelWorkout = () => {
    setIsWorkoutActive(false);
    setActiveTab('home');
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const updatedStats = await storage.deleteWorkout(workoutId);
    const updatedWorkouts = await storage.getWorkouts();
    setWorkouts(updatedWorkouts);
    setStats(updatedStats);

    const updatedChallenges = storage.getChallenges(updatedWorkouts, updatedStats);
    setChallenges(updatedChallenges);
  };

  const handleClaimChallenge = (challengeId: string) => {
    storage.claimChallenge(challengeId);
    // Find challenge reward
    const target = challenges.find((c) => c.id === challengeId);
    if (target) {
      const bonusXP = target.xpReward;
      const updatedStats = { ...stats, xp: stats.xp + bonusXP };
      setStats(updatedStats);
    }
    const updatedChallenges = storage.getChallenges(workouts, stats);
    setChallenges(updatedChallenges);
  };

  const handleSeedDemoData = async () => {
    await storage.seedDemoData();
    const loadedWorkouts = await storage.getWorkouts();
    setWorkouts(loadedWorkouts);
    const computedStats = storage.computeStats(loadedWorkouts);
    setStats(computedStats);
    setChallenges(storage.getChallenges(loadedWorkouts, computedStats));
    setBadges(storage.getBadges());
  };

  const handleResetData = async () => {
    await storage.clearAllData();
    setWorkouts([]);
    const resetStats = storage.computeStats([]);
    setStats(resetStats);
    setChallenges(storage.getChallenges([], resetStats));
    setBadges(storage.getBadges());
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#F27D26] selection:text-black">
      {/* Header */}
      {!isWorkoutActive && (
        <Header
          stats={stats}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && !isWorkoutActive && (
        <div className="bg-[#111111] border-b border-[#1A1A1A] px-4 py-2.5 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-pulse" />
            <span className="font-medium text-gray-300">
              Install PushQuest PWA for full-screen camera workout mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallPWA}
              className="py-1 px-3 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider shadow-[0_2px_10px_rgba(242,125,38,0.3)]"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="text-gray-500 hover:text-gray-300 text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1">
        {isWorkoutActive || activeTab === 'workout' ? (
          <WorkoutView
            settings={settings}
            stats={stats}
            onFinishWorkout={handleFinishWorkout}
            onCancelWorkout={handleCancelWorkout}
          />
        ) : activeTab === 'home' ? (
          <HomeView
            stats={stats}
            settings={settings}
            workouts={workouts}
            challenges={challenges}
            onStartWorkout={handleStartWorkout}
            onNavigateTab={(tab) => {
              if (tab === 'workout') handleStartWorkout();
              else setActiveTab(tab);
            }}
            onSaveSettings={handleSaveSettings}
            onOpenShareModal={(w) => {
              if (w) {
                setShareWorkout(w);
              } else if (workouts.length > 0) {
                setShareWorkout(workouts[0]);
              } else {
                setShareWorkout({
                  id: 'snapshot',
                  date: new Date().toISOString(),
                  totalReps: stats.totalPushups > 0 ? stats.totalPushups : 25,
                  sets: [{ setNumber: 1, reps: stats.bestSet > 0 ? stats.bestSet : 25, avgDepthAngle: 85, avgFormScore: 98, durationSeconds: 60, timestamp: new Date().toISOString() }],
                  bestSet: stats.bestSet > 0 ? stats.bestSet : 25,
                  durationSeconds: 120,
                  avgFormScore: 98,
                  xpEarned: 150,
                  isPR: true,
                });
              }
            }}
          />
        ) : activeTab === 'challenges' ? (
          <ChallengesView
            challenges={challenges}
            stats={stats}
            onClaimChallenge={handleClaimChallenge}
          />
        ) : (
          <StatsView
            stats={stats}
            workouts={workouts}
            badges={badges}
            onDeleteWorkout={handleDeleteWorkout}
            onOpenShareModal={(w) => setShareWorkout(w)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {!isWorkoutActive && (
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'workout') {
              handleStartWorkout();
            } else {
              setActiveTab(tab);
            }
          }}
          isWorkoutActive={isWorkoutActive}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onSeedDemo={handleSeedDemoData}
        onResetData={handleResetData}
      />

      {/* Workout Summary Celebration Modal */}
      {summaryWorkout && (
        <WorkoutSummaryModal
          isOpen={!!summaryWorkout}
          onClose={() => {
            setSummaryWorkout(null);
            setSummaryAutoIncrementedAmount(null);
          }}
          workout={summaryWorkout}
          stats={stats}
          settings={settings}
          todayReps={
            workouts
              .filter((w) => w.date.startsWith(new Date().toISOString().split('T')[0]))
              .reduce((sum, w) => sum + w.totalReps, 0)
          }
          newBadges={summaryNewBadges}
          autoIncrementedAmount={summaryAutoIncrementedAmount}
          onOpenShareModal={() => {
            setShareWorkout(summaryWorkout);
          }}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* Strava-Style Share Card & Transparent Sticker Creator */}
      {shareWorkout && (
        <ShareStickerModal
          isOpen={!!shareWorkout}
          onClose={() => setShareWorkout(null)}
          workout={shareWorkout}
          allWorkouts={workouts}
          stats={stats}
        />
      )}
    </div>
  );
}
