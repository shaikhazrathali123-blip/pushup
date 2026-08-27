import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Share2,
  Sparkles,
  Check,
  Calendar,
  Flame,
  Zap,
} from 'lucide-react';
import { Workout, UserStats } from '../types';
import {
  STICKER_FORMATS,
  STICKER_SCOPES,
  StickerFormatId,
  StickerTimeScope,
  computeStickerScopeData,
  renderTransparentSticker,
  formatDuration,
} from '../services/stickerGenerator';

interface ShareStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout?: Workout;
  allWorkouts?: Workout[];
  stats: UserStats;
}

export const ShareStickerModal: React.FC<ShareStickerModalProps> = ({
  isOpen,
  onClose,
  workout,
  allWorkouts = [],
  stats,
}) => {
  const [selectedScope, setSelectedScope] = useState<StickerTimeScope>('last_workout');
  const [selectedFormat, setSelectedFormat] = useState<StickerFormatId>('minimal-center');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute aggregated stats for the selected scope
  const scopeData = useMemo(() => {
    return computeStickerScopeData(selectedScope, workout, allWorkouts, stats);
  }, [selectedScope, workout, allWorkouts, stats]);

  // Redraw preview canvas whenever format or scope changes
  useEffect(() => {
    if (!isOpen) return;

    const previewCanvas = canvasRef.current;
    if (!previewCanvas) return;

    const stickerCanvas = renderTransparentSticker(scopeData, selectedFormat);

    previewCanvas.width = stickerCanvas.width;
    previewCanvas.height = stickerCanvas.height;
    const ctx = previewCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      ctx.drawImage(stickerCanvas, 0, 0);
    }
  }, [isOpen, selectedFormat, scopeData]);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    const stickerCanvas = renderTransparentSticker(scopeData, selectedFormat);
    stickerCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PushQuest-${selectedScope}-${scopeData.totalReps}reps.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(`Transparent ${scopeData.scopeBadge} Sticker Downloaded!`);
        setTimeout(() => setDownloadSuccess(null), 3000);
      }
      setIsDownloading(false);
    }, 'image/png');
  };

  const handleCopyToClipboard = async () => {
    setIsCopying(true);
    try {
      const stickerCanvas = renderTransparentSticker(scopeData, selectedFormat);
      stickerCanvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCopying(false);
          return;
        }
        try {
          if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setDownloadSuccess('Sticker copied to clipboard! Paste directly into Stories or chats.');
            setTimeout(() => setDownloadSuccess(null), 3500);
          } else {
            handleDownload();
            setDownloadSuccess('Downloaded PNG sticker to your device.');
            setTimeout(() => setDownloadSuccess(null), 3500);
          }
        } catch (err) {
          console.warn('Clipboard write note:', err);
          handleDownload();
          setDownloadSuccess('Downloaded PNG sticker to your device.');
          setTimeout(() => setDownloadSuccess(null), 3500);
        } finally {
          setIsCopying(false);
        }
      }, 'image/png');
    } catch {
      setIsCopying(false);
    }
  };

  const handleNativeShare = async () => {
    const stickerCanvas = renderTransparentSticker(scopeData, selectedFormat);
    stickerCanvas.toBlob(async (blob) => {
      if (blob && navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], `pushquest-${selectedScope}-${scopeData.totalReps}reps.png`, {
            type: 'image/png',
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `PushQuest ${scopeData.scopeBadge}`,
              text: `Crushed ${scopeData.totalReps} push-ups (${scopeData.scopeBadge}) on PushQuest! 🔥`,
              files: [file],
            });
            return;
          }
        } catch {
          // Fallback to download
        }
      }
      handleDownload();
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#111113] border border-[#222226] rounded-3xl max-h-[95vh] flex flex-col overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1E1E22] bg-[#161619]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#1F1F24] border border-[#2D2D35] flex items-center justify-center text-[#F27D26] shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#F27D26] font-bold font-mono-stat block">
                Transparent Sticker Studio
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight font-display">
                Create & Share Push-Up Sticker
              </h2>
            </div>
          </div>
          <button
            type="button"
            id="share-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1F1F24] hover:bg-[#28282E] border border-[#2E2E36] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ================================================================ */}
          {/* STEP 1: STATS SCOPE SELECTOR (LAST WORKOUT / TODAY / THIS WEEK) */}
          {/* ================================================================ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] uppercase tracking-wider text-gray-300 font-bold font-mono-stat">
                1. Select Stats Scope to Feature
              </label>
              <span className="text-[11px] text-[#F27D26] font-mono-stat font-bold">
                {scopeData.scopeBadge}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {STICKER_SCOPES.map((sc) => {
                const isSelected = selectedScope === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    id={`scope-btn-${sc.id}`}
                    onClick={() => setSelectedScope(sc.id)}
                    className={`py-2.5 px-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#F27D26] bg-[#F27D26]/10 text-white shadow-[0_0_15px_rgba(242,125,38,0.2)]'
                        : 'border-[#222226] bg-[#161619] text-gray-400 hover:border-[#33333A]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        {sc.id === 'last_workout' && <Zap className="w-3 h-3 text-[#F27D26]" />}
                        {sc.id === 'today' && <Calendar className="w-3 h-3 text-[#F27D26]" />}
                        {sc.id === 'this_week' && <Flame className="w-3 h-3 text-[#F27D26]" />}
                        <span className="truncate">{sc.label}</span>
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-[#F27D26] shrink-0" />}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate block">
                      {sc.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Scope Summary Preview Pill */}
            <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-[#16161A] border border-[#232329] flex flex-wrap items-center justify-between gap-2 text-xs font-mono-stat text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{scopeData.totalReps} total reps</span>
                <span className="text-gray-600">•</span>
                <span>{formatDuration(scopeData.durationSeconds)} time</span>
                <span className="text-gray-600">•</span>
                <span>Best: {scopeData.bestSet} reps</span>
              </div>
              <span className="text-[#F27D26] font-bold">
                {scopeData.sessionCount} {scopeData.sessionCount === 1 ? 'Session' : 'Sessions'}
              </span>
            </div>
          </div>

          {/* ================================================================ */}
          {/* STEP 2: FORMAT SELECTION (5 STYLES) */}
          {/* ================================================================ */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-gray-300 font-bold font-mono-stat block mb-2.5">
              2. Choose Sticker Layout ({STICKER_FORMATS.length} Styles)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STICKER_FORMATS.map((fmt, idx) => (
                <button
                  key={fmt.id}
                  type="button"
                  id={`format-btn-${fmt.id}`}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                    selectedFormat === fmt.id
                      ? 'border-[#F27D26] bg-[#F27D26]/10 text-white shadow-sm'
                      : 'border-[#222226] bg-[#161619] text-gray-400 hover:border-[#33333A]'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{fmt.previewIcon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Format {idx + 1}: {fmt.name}</span>
                      {selectedFormat === fmt.id && (
                        <Check className="w-3.5 h-3.5 text-[#F27D26]" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5">
                      {fmt.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ================================================================ */}
          {/* STEP 3: TRANSPARENT LIVE PREVIEW */}
          {/* ================================================================ */}
          <div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              <span>Live Sticker Preview (100% Transparent PNG)</span>
              <span className="text-[#F27D26] font-mono-stat lowercase">
                mentioning: {scopeData.scopeBadge}
              </span>
            </div>

            <div
              className="relative w-full rounded-2xl overflow-hidden border border-[#222226] p-6 sm:p-8 flex items-center justify-center min-h-[220px]"
              style={{
                backgroundColor: '#0a0a0c',
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            >
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[300px] object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Success Notification */}
          {downloadSuccess && (
            <div className="py-2.5 px-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              {downloadSuccess}
            </div>
          )}

          {/* ================================================================ */}
          {/* ACTION BUTTONS (COPY, DOWNLOAD PNG, SHARE) */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              id="btn-copy-sticker-clipboard"
              disabled={isCopying}
              onClick={handleCopyToClipboard}
              className="py-3.5 px-4 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(242,125,38,0.3)] active:scale-95"
            >
              <Copy className="w-4 h-4" />
              {isCopying ? 'Copying...' : 'Copy to Clipboard'}
            </button>

            <button
              type="button"
              id="btn-download-transparent-sticker"
              disabled={isDownloading}
              onClick={handleDownload}
              className="py-3.5 px-4 rounded-full bg-[#1C1C20] hover:bg-[#25252A] border border-[#2E2E36] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Download className="w-4 h-4 text-[#F27D26]" />
              {isDownloading ? 'Saving...' : 'Download PNG'}
            </button>

            <button
              type="button"
              id="btn-share-sticker"
              onClick={handleNativeShare}
              className="py-3.5 px-4 rounded-full bg-[#161619] hover:bg-[#1E1E22] border border-[#26262C] text-gray-200 hover:text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Share2 className="w-4 h-4 text-[#F27D26]" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
