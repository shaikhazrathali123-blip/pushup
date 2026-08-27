import { Workout, UserStats } from '../types';

export type StickerFormatId =
  | 'minimal-center'   // Format 1: Bold Center Hero Reps + Logo + Key Ticker
  | 'clean-stat-grid'  // Format 2: Centered 2x2 Telemetry Grid
  | 'compact-badge'    // Format 3: Centered Single-Line Clean Athleisure Strip
  | 'vertical-center'  // Format 4: Vertical Center Stack
  | 'cyber-telemetry'; // Format 5: Athletic HUD Monospace Center Stamp

export type StickerTimeScope = 'last_workout' | 'today' | 'this_week';

export interface StickerScopeOption {
  id: StickerTimeScope;
  label: string;
  subtitle: string;
  badge: string;
}

export const STICKER_SCOPES: StickerScopeOption[] = [
  {
    id: 'last_workout',
    label: 'Last Workout',
    subtitle: 'Single latest session',
    badge: 'LAST WORKOUT',
  },
  {
    id: 'today',
    label: "Today's Workouts",
    subtitle: 'All reps & time today',
    badge: "TODAY'S TOTAL",
  },
  {
    id: 'this_week',
    label: 'This Week',
    subtitle: '7-day weekly volume',
    badge: 'WEEKLY RECAP',
  },
];

export interface StickerFormatOption {
  id: StickerFormatId;
  name: string;
  subtitle: string;
  previewIcon: string;
}

export const STICKER_FORMATS: StickerFormatOption[] = [
  {
    id: 'minimal-center',
    name: 'Hero Reps Minimal',
    subtitle: 'App logo + huge rep number + ticker',
    previewIcon: '🔥',
  },
  {
    id: 'clean-stat-grid',
    name: 'Balanced Metric Grid',
    subtitle: 'Logo + reps + 4 balanced stats',
    previewIcon: '⚡',
  },
  {
    id: 'compact-badge',
    name: 'Compact Strip',
    subtitle: 'Slim horizontal text stats',
    previewIcon: '✨',
  },
  {
    id: 'vertical-center',
    name: 'Vertical Center Stack',
    subtitle: 'Top-down athletic typography',
    previewIcon: '🏆',
  },
  {
    id: 'cyber-telemetry',
    name: 'Cyber HUD Tech',
    subtitle: 'Bracketed AI biometric stamp',
    previewIcon: '🎯',
  },
];

export interface StickerScopeData {
  scope: StickerTimeScope;
  scopeBadge: string;
  scopeTitle: string;
  dateHeader: string;
  totalReps: number;
  bestSet: number;
  durationSeconds: number;
  avgFormScore: number;
  sessionCount: number;
  pace: number;
  streak: number;
  isPR?: boolean;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Compute the aggregated statistics based on the chosen time scope
 */
export function computeStickerScopeData(
  scope: StickerTimeScope,
  latestWorkout: Workout | undefined,
  allWorkouts: Workout[],
  stats: UserStats
): StickerScopeData {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (scope === 'today') {
    const todayWorkouts = allWorkouts.filter((w) => w.date.startsWith(todayStr));
    const totalReps =
      todayWorkouts.reduce((sum, w) => sum + w.totalReps, 0) || (latestWorkout?.totalReps || 0);
    const durationSeconds =
      todayWorkouts.reduce((sum, w) => sum + w.durationSeconds, 0) ||
      (latestWorkout?.durationSeconds || 60);
    const bestSet =
      todayWorkouts.reduce((max, w) => Math.max(max, w.bestSet), 0) ||
      (latestWorkout?.bestSet || 0);
    const totalWeightedForm = todayWorkouts.reduce(
      (sum, w) => sum + w.avgFormScore * w.totalReps,
      0
    );
    const avgFormScore =
      totalReps > 0 && todayWorkouts.length > 0
        ? Math.round(totalWeightedForm / totalReps)
        : latestWorkout?.avgFormScore || 96;
    const pace = Math.round((totalReps / Math.max(1, durationSeconds / 60)) * 10) / 10;
    const dateFormatted = now
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase();

    return {
      scope: 'today',
      scopeBadge: "TODAY'S WORKOUTS",
      scopeTitle: "TODAY'S TOTAL",
      dateHeader: `TODAY • ${dateFormatted}`,
      totalReps,
      bestSet,
      durationSeconds,
      avgFormScore,
      sessionCount: Math.max(1, todayWorkouts.length),
      pace,
      streak: stats.currentStreak,
      isPR: false,
    };
  }

  if (scope === 'this_week') {
    const weekWorkouts = allWorkouts.filter((w) => new Date(w.date) >= sevenDaysAgo);
    const totalReps =
      weekWorkouts.reduce((sum, w) => sum + w.totalReps, 0) ||
      (latestWorkout?.totalReps || 0);
    const durationSeconds =
      weekWorkouts.reduce((sum, w) => sum + w.durationSeconds, 0) ||
      (latestWorkout?.durationSeconds || 60) * Math.max(1, weekWorkouts.length);
    const bestSet =
      weekWorkouts.reduce((max, w) => Math.max(max, w.bestSet), 0) ||
      (stats.bestSet || latestWorkout?.bestSet || 0);
    const totalWeightedForm = weekWorkouts.reduce(
      (sum, w) => sum + w.avgFormScore * w.totalReps,
      0
    );
    const avgFormScore =
      totalReps > 0 && weekWorkouts.length > 0
        ? Math.round(totalWeightedForm / totalReps)
        : stats.avgFormScore || 96;
    const pace = Math.round((totalReps / Math.max(1, durationSeconds / 60)) * 10) / 10;

    return {
      scope: 'this_week',
      scopeBadge: 'WEEKLY WORKOUTS',
      scopeTitle: "THIS WEEK'S TOTAL",
      dateHeader: 'THIS WEEK • 7-DAY RECAP',
      totalReps,
      bestSet,
      durationSeconds,
      avgFormScore,
      sessionCount: Math.max(1, weekWorkouts.length),
      pace,
      streak: stats.currentStreak,
      isPR: false,
    };
  }

  // Default: 'last_workout'
  const targetWorkout = latestWorkout || allWorkouts[0] || {
    id: 'snap',
    date: new Date().toISOString(),
    totalReps: 25,
    validReps: 25,
    rejectedReps: 0,
    sets: [{ setNumber: 1, reps: 25, avgFormScore: 98, durationSeconds: 60 }],
    bestSet: 25,
    durationSeconds: 120,
    avgFormScore: 98,
    xpEarned: 150,
    isPR: true,
  };

  const dateFormatted = new Date(targetWorkout.date)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
  const pace = Math.round((targetWorkout.totalReps / Math.max(1, targetWorkout.durationSeconds / 60)) * 10) / 10;

  return {
    scope: 'last_workout',
    scopeBadge: 'LAST WORKOUT',
    scopeTitle: 'LATEST SESSION',
    dateHeader: `SESSION • ${dateFormatted}`,
    totalReps: targetWorkout.totalReps,
    bestSet: targetWorkout.bestSet,
    durationSeconds: targetWorkout.durationSeconds,
    avgFormScore: targetWorkout.avgFormScore,
    sessionCount: 1,
    pace,
    streak: stats.currentStreak,
    isPR: targetWorkout.isPR,
  };
}

/**
 * PushQuest Athletic Logo Mark (Clean vector drawn on canvas)
 */
export function drawPushQuestLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number = 32
) {
  ctx.save();
  ctx.translate(x, y);

  // Outer athletic chevron spark
  ctx.fillStyle = '#F27D26';
  ctx.beginPath();
  const half = size / 2;
  ctx.moveTo(0, -half);
  ctx.lineTo(half, -half * 0.3);
  ctx.lineTo(half * 0.7, half);
  ctx.lineTo(0, half * 0.6);
  ctx.lineTo(-half * 0.7, half);
  ctx.lineTo(-half, -half * 0.3);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 12;
  ctx.fill();

  // Center cutout
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(0, 0, half * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Spark dot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, half * 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Text renderer with crisp drop-shadow for 100% transparency readability
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string = '#FFFFFF',
  align: CanvasTextAlign = 'center'
) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Render pure transparent PNG sticker (Zero background, centered position)
 * Spacing and text measurements strictly calculated to avoid ANY overlapping.
 */
export function renderTransparentSticker(
  data: StickerScopeData,
  formatId: StickerFormatId
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // =========================================================================
  // FORMAT 1: HERO REPS MINIMAL
  // =========================================================================
  if (formatId === 'minimal-center') {
    canvas.width = 960;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Header: Logo + PUSHQUEST + Scope Badge (centered together without colliding)
    const logoSize = 28;
    const brandText = 'PUSHQUEST';
    ctx.font = '800 20px Syne, sans-serif';
    const brandWidth = ctx.measureText(brandText).width;
    
    ctx.font = '800 10px Plus Jakarta Sans, sans-serif';
    const badgeText = data.scopeBadge;
    const badgeTextWidth = ctx.measureText(badgeText).width;
    const badgeWidth = Math.max(76, badgeTextWidth + 18);
    const gap = 12;
    const totalHeaderWidth = logoSize + gap + brandWidth + gap + badgeWidth;
    const startX = cx - totalHeaderWidth / 2;

    // 1. Logo
    drawPushQuestLogo(ctx, startX + logoSize / 2, 50, logoSize);

    // 2. Brand Text
    drawText(ctx, brandText, startX + logoSize + gap, 57, '800 20px Syne, sans-serif', '#FFFFFF', 'left');

    // 3. Scope Badge
    const badgeX = startX + logoSize + gap + brandWidth + gap;
    ctx.save();
    ctx.fillStyle = '#F27D26';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(badgeX, 40, badgeWidth, 22, 11);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '800 10px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, 55);
    ctx.restore();

    // Date / Scope Header
    drawText(ctx, data.dateHeader, cx, 105, '700 13px JetBrains Mono, monospace', '#F27D26');

    // Huge Rep Number
    drawText(ctx, `${data.totalReps}`, cx, 235, '900 120px Syne, sans-serif', '#FFFFFF');

    // Subtitle / Scope Title
    const label = data.isPR ? '★ NEW PERSONAL RECORD ★' : `${data.scopeTitle} • VALIDATED`;
    drawText(
      ctx,
      label,
      cx,
      285,
      '800 16px Plus Jakarta Sans, sans-serif',
      data.isPR ? '#F27D26' : '#E2E8F0'
    );

    // Stats Ticker
    const ticker = `BEST SET ${data.bestSet}   •   TIME ${formatDuration(data.durationSeconds)}   •   PACE ${data.pace}/MIN   •   STREAK ${data.streak}D`;
    drawText(ctx, ticker, cx, 365, '700 15px JetBrains Mono, monospace', '#FFFFFF');

    return canvas;
  }

  // =========================================================================
  // FORMAT 2: BALANCED METRIC GRID (2x2 Balanced Stats)
  // =========================================================================
  if (formatId === 'clean-stat-grid') {
    canvas.width = 960;
    canvas.height = 520;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Header Logo & Brand
    drawPushQuestLogo(ctx, cx, 48, 34);
    drawText(ctx, 'PUSHQUEST AI', cx, 94, '800 18px Syne, sans-serif', '#F27D26');
    drawText(ctx, data.dateHeader, cx, 120, '700 12px JetBrains Mono, monospace', '#94A3B8');

    // Hero Total Reps
    drawText(ctx, `${data.totalReps}`, cx, 230, '900 100px Syne, sans-serif', '#FFFFFF');
    drawText(
      ctx,
      `${data.scopeTitle} (${data.sessionCount} ${data.sessionCount === 1 ? 'WORKOUT' : 'WORKOUTS'})`,
      cx,
      270,
      '800 14px Plus Jakarta Sans, sans-serif',
      '#CBD5E1'
    );

    // 4 Centered Metrics with exact column distribution
    const metrics = [
      { label: 'BEST SET', val: `${data.bestSet} reps` },
      { label: 'DURATION', val: formatDuration(data.durationSeconds) },
      { label: 'FORM SCORE', val: `${data.avgFormScore}%` },
      { label: 'STREAK', val: `🔥 ${data.streak}d` },
    ];

    const colWidth = 200;
    const startX = cx - (colWidth * 4) / 2 + colWidth / 2;
    const statsY = 365;

    metrics.forEach((m, idx) => {
      const colX = startX + idx * colWidth;
      drawText(ctx, m.label, colX, statsY, '700 12px JetBrains Mono, monospace', '#94A3B8');
      drawText(ctx, m.val, colX, statsY + 36, '800 24px JetBrains Mono, monospace', '#FFFFFF');
    });

    // Subtitle Footer mentioning Scope
    drawText(ctx, `● VERIFIED ${data.scopeBadge} TELEMETRY ●`, cx, 465, '700 12px JetBrains Mono, monospace', '#F27D26');

    return canvas;
  }

  // =========================================================================
  // FORMAT 3: COMPACT STRIP (Slim Horizontal Athletic Island)
  // =========================================================================
  if (formatId === 'compact-badge') {
    canvas.width = 980;
    canvas.height = 220;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cy = canvas.height / 2;

    const logoX = 55;
    drawPushQuestLogo(ctx, logoX, cy, 36);

    ctx.font = '900 72px Syne, sans-serif';
    const repStr = `${data.totalReps}`;
    const repWidth = ctx.measureText(repStr).width;

    const repStartX = 105;
    drawText(ctx, repStr, repStartX, cy + 24, '900 72px Syne, sans-serif', '#F27D26', 'left');

    ctx.font = '800 18px Plus Jakarta Sans, sans-serif';
    const repsLabel = 'REPS';
    const repsLabelWidth = ctx.measureText(repsLabel).width;
    const labelX = repStartX + repWidth + 12;
    drawText(ctx, repsLabel, labelX, cy + 20, '800 18px Plus Jakarta Sans, sans-serif', '#FFFFFF', 'left');

    // Divider bar
    const dividerX = labelX + repsLabelWidth + 30;
    drawText(ctx, '|', dividerX, cy + 18, '400 32px JetBrains Mono, monospace', 'rgba(255,255,255,0.3)', 'center');

    // Right inline telemetry items
    const rightStart = dividerX + 30;
    const remainingWidth = canvas.width - rightStart - 30;
    const colW = remainingWidth / 4;

    const items = [
      { label: 'SCOPE', val: data.scopeBadge },
      { label: 'BEST SET', val: `${data.bestSet}` },
      { label: 'TIME', val: formatDuration(data.durationSeconds) },
      { label: 'STREAK', val: `${data.streak}d` },
    ];

    items.forEach((it, idx) => {
      const colX = rightStart + idx * colW + colW / 2;
      drawText(ctx, it.label, colX, cy - 12, '700 11px JetBrains Mono, monospace', '#94A3B8', 'center');
      drawText(
        ctx,
        it.val,
        colX,
        cy + 24,
        it.label === 'SCOPE' ? '800 15px JetBrains Mono, monospace' : '800 22px JetBrains Mono, monospace',
        it.label === 'SCOPE' ? '#F27D26' : '#FFFFFF',
        'center'
      );
    });

    return canvas;
  }

  // =========================================================================
  // FORMAT 4: VERTICAL CENTER STACK (Mobile Story Optimized)
  // =========================================================================
  if (formatId === 'vertical-center') {
    canvas.width = 480;
    canvas.height = 840;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Header
    drawPushQuestLogo(ctx, cx, 55, 36);
    drawText(ctx, 'PUSHQUEST', cx, 105, '800 22px Syne, sans-serif', '#FFFFFF');
    drawText(ctx, data.dateHeader, cx, 134, '700 12px JetBrains Mono, monospace', '#F27D26');

    // Scope Pill
    ctx.save();
    ctx.fillStyle = 'rgba(242, 125, 38, 0.15)';
    ctx.strokeStyle = '#F27D26';
    ctx.lineWidth = 1.5;
    const pillW = 160;
    ctx.beginPath();
    ctx.roundRect(cx - pillW / 2, 146, pillW, 24, 12);
    ctx.fill();
    ctx.stroke();
    drawText(ctx, data.scopeBadge, cx, 162, '800 11px JetBrains Mono, monospace', '#FFFFFF');
    ctx.restore();

    // Huge Number
    drawText(ctx, `${data.totalReps}`, cx, 275, '900 110px Syne, sans-serif', '#FFFFFF');
    drawText(ctx, data.scopeTitle, cx, 316, '800 15px Plus Jakarta Sans, sans-serif', '#F27D26');

    // Divider Line
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 140, 350);
    ctx.lineTo(cx + 140, 350);
    ctx.stroke();
    ctx.restore();

    // Stacked stats with clear 72px step increments
    const vStats = [
      { label: 'BEST SET', val: `${data.bestSet} reps` },
      { label: 'TOTAL DURATION', val: formatDuration(data.durationSeconds) },
      { label: 'AVG FORM', val: `${data.avgFormScore}%` },
      { label: 'ACTIVE STREAK', val: `${data.streak} Days 🔥` },
      { label: 'SESSIONS LOGGED', val: `${data.sessionCount} ${data.sessionCount === 1 ? 'Session' : 'Sessions'}` },
    ];

    let currentY = 400;
    vStats.forEach((st) => {
      drawText(ctx, st.label, cx, currentY, '700 12px JetBrains Mono, monospace', '#94A3B8');
      drawText(ctx, st.val, cx, currentY + 26, '800 22px JetBrains Mono, monospace', '#FFFFFF');
      currentY += 72;
    });

    return canvas;
  }

  // =========================================================================
  // FORMAT 5: CYBER TELEMETRY HUD (Bracketed Athletic Tech)
  // =========================================================================
  if (formatId === 'cyber-telemetry') {
    canvas.width = 960;
    canvas.height = 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;

    // Corner tech brackets
    ctx.save();
    ctx.strokeStyle = '#F27D26';
    ctx.lineWidth = 2.5;
    const b = 28;
    const pad = 24;
    const w = canvas.width;
    const h = canvas.height;

    // Top-Left
    ctx.beginPath(); ctx.moveTo(pad, pad + b); ctx.lineTo(pad, pad); ctx.lineTo(pad + b, pad); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(w - pad - b, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + b); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(pad, h - pad - b); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + b, h - pad); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(w - pad - b, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - b); ctx.stroke();
    ctx.restore();

    // Top Tech Header
    drawPushQuestLogo(ctx, cx - 165, 58, 24);
    drawText(ctx, 'PUSHQUEST // AI POSE TELEMETRY', cx + 14, 64, '800 16px JetBrains Mono, monospace', '#FFFFFF');
    drawText(ctx, `REC [${data.dateHeader}] :: SCOPE [${data.scopeBadge}]`, cx, 98, '700 12px JetBrains Mono, monospace', '#F27D26');

    // Huge Reps Counter
    drawText(ctx, `${data.totalReps}`, cx, 225, '900 110px Syne, sans-serif', '#FFFFFF');
    drawText(ctx, `VERIFIED ${data.scopeBadge} TELEMETRY`, cx, 268, '700 14px JetBrains Mono, monospace', '#F27D26');

    // Telemetry strip with 4 balanced columns
    const hStats = [
      { label: 'BEST_SET', val: `${data.bestSet} reps` },
      { label: 'PACE', val: `${data.pace} /min` },
      { label: 'FORM_SCORE', val: `${data.avgFormScore}%` },
      { label: 'STREAK', val: `${data.streak} DAYS` },
    ];

    const colW = 200;
    const startX = cx - (colW * 4) / 2 + colW / 2;
    const statsY = 350;

    hStats.forEach((h, idx) => {
      const colX = startX + idx * colW;
      drawText(ctx, `[${h.label}]`, colX, statsY, '700 12px JetBrains Mono, monospace', '#94A3B8');
      drawText(ctx, h.val, colX, statsY + 34, '800 24px JetBrains Mono, monospace', '#FFFFFF');
    });

    // Subtitle Tech Footer
    drawText(ctx, `● SKELETAL TRACKING RECAP: ${data.scopeTitle} ●`, cx, 435, '700 11px JetBrains Mono, monospace', '#64748B');

    return canvas;
  }

  return canvas;
}
