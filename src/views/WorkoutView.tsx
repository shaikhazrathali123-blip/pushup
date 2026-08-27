import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  FlipHorizontal,
  Play,
  Square,
  RotateCcw,
  Eye,
  EyeOff,
  Timer,
  Plus,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  PushupState,
  PoseAngles,
  FormFeedback,
  Workout,
  WorkoutSet,
  UserSettings,
  UserStats,
} from '../types';
import { PushupEngine, drawPoseSkeleton } from '../services/poseDetection';
import { MediaPipePoseService } from '../services/mediapipeLoader';
import { soundManager } from '../services/sound';
import { formatDuration } from '../services/stickerGenerator';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface WorkoutViewProps {
  settings: UserSettings;
  stats: UserStats;
  onFinishWorkout: (workout: Workout) => void;
  onCancelWorkout: () => void;
}

type CameraFacing = 'user' | 'environment';

interface VideoDimensions {
  width: number;
  height: number;
}

/**
 * `navigator.wakeLock` / `WakeLockSentinel` aren't in every TS `lib.dom.d.ts`
 * version yet, so we declare the minimal shape we actually use instead of
 * reaching for `any`.
 */
interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

/** Narrow an unknown catch value into a readable message + optional DOM error name. */
function describeError(err: unknown): { message: string; name?: string } {
  if (err instanceof DOMException) {
    return { message: err.message, name: err.name };
  }
  if (err instanceof Error) {
    return { message: err.message, name: err.name };
  }
  if (typeof err === 'string') {
    return { message: err };
  }
  return { message: 'Unknown error' };
}

const DEFAULT_ANGLES: PoseAngles = {
  leftElbowAngle: 180,
  rightElbowAngle: 180,
  activeElbowAngle: 180,
  bodyAlignmentAngle: 180,
  depthPercentage: 0,
  isFacingLeft: true,
  visibilityScore: 0,
};

const DEFAULT_FEEDBACK: FormFeedback = {
  isValidPlank: true,
  isGoodDepth: false,
  isFullExtension: true,
  message: 'Position camera sideways to capture full body',
  type: 'info',
  score: 95,
};

const MODEL_LOAD_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  settings,
  stats,
  onFinishWorkout,
  onCancelWorkout,
}) => {
  // Session tracking
  const [sessionReps, setSessionReps] = useState<number>(0);
  const [currentSetReps, setCurrentSetReps] = useState<number>(0);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [repPulseAnimation, setRepPulseAnimation] = useState<boolean>(false);
  const [downPulseAnimation, setDownPulseAnimation] = useState<boolean>(false);

  // Actual rendered video/camera resolution (NOT hardcoded) — needed so the
  // skeleton canvas and any coordinate math line up on mobile portrait screens.
  const [videoDims, setVideoDims] = useState<VideoDimensions>({ width: 720, height: 1280 });

  // Pose & State Machine Feedback
  const [pushupState, setPushupState] = useState<PushupState>('IDLE');
  const [angles, setAngles] = useState<PoseAngles>(DEFAULT_ANGLES);
  const [feedback, setFeedback] = useState<FormFeedback>(DEFAULT_FEEDBACK);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(settings.showSkeleton);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseServiceRef = useRef<MediaPipePoseService | null>(null);
  const engineRef = useRef<PushupEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const setStartTimeRef = useRef<number>(Date.now());
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  // Live refs mirroring the latest angles/feedback/pushupState/showSkeleton/
  // cameraFacing. The pose-service init effect only reruns on a small
  // dependency list, so its landmark callback closure would otherwise
  // capture STALE values of these (a real bug in the original code — it
  // read them straight from render scope). Refs always give the current value.
  const angleRef = useRef<PoseAngles>(angles);
  const feedbackRef = useRef<FormFeedback>(feedback);
  const pushupStateRef = useRef<PushupState>(pushupState);
  const showSkeletonRef = useRef<boolean>(showSkeleton);
  const cameraFacingRef = useRef<CameraFacing>(cameraFacing);

  useEffect(() => {
    angleRef.current = angles;
  }, [angles]);
  useEffect(() => {
    feedbackRef.current = feedback;
  }, [feedback]);
  useEffect(() => {
    pushupStateRef.current = pushupState;
  }, [pushupState]);
  useEffect(() => {
    showSkeletonRef.current = showSkeleton;
  }, [showSkeleton]);
  useEffect(() => {
    cameraFacingRef.current = cameraFacing;
  }, [cameraFacing]);

  // Sound settings
  useEffect(() => {
    soundManager.updateSettings(settings.soundEnabled, settings.voiceEnabled, settings.hapticEnabled);
  }, [settings]);

  // Request Screen WakeLock so device screen doesn't sleep during workout
  useEffect(() => {
    const requestWakeLock = async (): Promise<void> => {
      try {
        if ('wakeLock' in navigator) {
          const wakeLock = (navigator as Navigator & { wakeLock: WakeLockLike }).wakeLock;
          wakeLockRef.current = await wakeLock.request('screen');
        }
      } catch {
        // Ignore wake lock error — non-critical (e.g. tab not visible, unsupported browser)
      }
    };
    void requestWakeLock();

    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // Main Timer loop
  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Rest Timer tick
      if (isResting) {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            soundManager.playTimerBeep(true);
            setIsResting(false);
            soundManager.speak('Ready for next set');
            return 0;
          }
          if (prev <= 4) {
            soundManager.playTimerBeep(false);
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isResting]);

  // Handle Rep counted by engine
  const handleRepCounted = useCallback((totalReps: number, _formScore: number, _depthAngle: number): void => {
    setSessionReps(totalReps);
    if (engineRef.current) {
      setCurrentSetReps(engineRef.current.getCurrentSetReps());
    }
    // Trigger visual pop
    setRepPulseAnimation(true);
    window.setTimeout(() => setRepPulseAnimation(false), 450);
  }, []);

  // Handle Down bottom state
  const handleDownTriggered = useCallback((): void => {
    setDownPulseAnimation(true);
    window.setTimeout(() => setDownPulseAnimation(false), 300);
  }, []);

  // Initialize Pose Engine & MediaPipe
  useEffect(() => {
    let cancelled = false;

    const engine = new PushupEngine(
      {
        onRepCounted: handleRepCounted,
        onStateChange: (st: PushupState) => setPushupState(st),
        onPoseUpdate: (ang: PoseAngles, fb: FormFeedback, st: PushupState) => {
          setAngles(ang);
          setFeedback(fb);
          setPushupState(st);
        },
        onDownTriggered: handleDownTriggered,
      },
      settings.targetDepthAngle
    );
    engineRef.current = engine;

    const poseService = new MediaPipePoseService();
    poseServiceRef.current = poseService;

    // Fallback: if the model hasn't reported back within MODEL_LOAD_TIMEOUT_MS,
    // stop blocking the UI and let the person fall back to manual tap-rep
    // mode instead of staring at a frozen loading indicator forever (common
    // on slow mobile connections where the WASM/model assets are large).
    const loadTimeout = window.setTimeout(() => {
      if (cancelled) return;
      setIsModelLoading((prev) => {
        if (prev) {
          setCameraError(
            (prevErr) =>
              prevErr ?? 'Pose model is taking a while to load. You can keep waiting or use Tap Rep mode.'
          );
        }
        return false;
      });
    }, MODEL_LOAD_TIMEOUT_MS);

    poseService
      .initialize((landmarks) => {
        if (cancelled) return;

        if (!landmarks) {
          setAngles((prev) => ({ ...prev, visibilityScore: 0 }));
          setFeedback({
            isValidPlank: false,
            isGoodDepth: false,
            isFullExtension: false,
            message: 'Looking for body in frame...',
            type: 'info',
            score: 70,
          });
          return;
        }

        engine.processPose(landmarks);

        // Render skeleton on canvas — always read the LATEST values via
        // refs, not the values captured when this effect first ran.
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (showSkeletonRef.current) {
          drawPoseSkeleton(
            ctx,
            landmarks,
            angleRef.current,
            feedbackRef.current,
            pushupStateRef.current,
            canvas.width,
            canvas.height,
            settings.mirrorCamera && cameraFacingRef.current === 'user'
          );
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      })
      .then((success: boolean) => {
        if (cancelled) return;
        window.clearTimeout(loadTimeout);
        setIsModelLoading(false);
        if (!success) {
          console.warn('Pose model had issue, manual tap mode available');
          setCameraError((prev) => prev ?? 'Pose detection could not start. Tap Rep mode is active.');
        }
      })
      .catch((err: unknown) => {
        const { message } = describeError(err);
        console.error('Pose model failed to initialize:', message);
        if (cancelled) return;
        window.clearTimeout(loadTimeout);
        setIsModelLoading(false);
        setCameraError((prev) => prev ?? 'Pose detection failed to load. Tap Rep mode is active.');
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      poseService.close();
    };
    // NOTE: showSkeleton/cameraFacing/angles/feedback/pushupState intentionally
    // excluded — they're read via refs above, so changing them no longer tears
    // down and re-initializes MediaPipe (expensive, and itself a cause of
    // dropped frames / stuck feedback on mobile).
  }, [settings.targetDepthAngle, settings.mirrorCamera, handleRepCounted, handleDownTriggered]);

  // Start Camera Stream
  const startCamera = useCallback(async (): Promise<void> => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setCameraError(null);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setHasCameraPermission(false);
        setCameraError('Camera API not available on this browser/iframe. Tap Rep mode is active.');
        return;
      }

      // Detect portrait vs landscape so we ask for a resolution that
      // actually matches the device instead of forcing a landscape frame
      // onto a portrait phone screen (a common cause of a video element
      // that never reaches readyState >= 2 on mobile).
      const isPortrait: boolean = window.innerHeight >= window.innerWidth;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: isPortrait ? 720 : 1280 },
          height: { ideal: isPortrait ? 1280 : 720 },
          aspectRatio: { ideal: isPortrait ? 9 / 16 : 16 / 9 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setHasCameraPermission(true);
      }
    } catch (err: unknown) {
      const { message, name } = describeError(err);
      console.warn('Camera access note:', message);
      setHasCameraPermission(false);

      if (name === 'NotAllowedError' || message.includes('Permission denied')) {
        setCameraError(
          'Camera permission was blocked. You can continue using Tap Rep mode or grant permission in browser settings.'
        );
        return;
      }

      if (name === 'OverconstrainedError') {
        // Some mobile browsers reject the exact ideal constraints above.
        // Retry once with much looser constraints before giving up.
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing },
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play().catch(() => {});
            setHasCameraPermission(true);
            setCameraError(null);
          }
          return;
        } catch {
          setCameraError('Camera stream unavailable. Tap Rep mode is ready to track your workout.');
          return;
        }
      }

      setCameraError('Camera stream unavailable. Tap Rep mode is ready to track your workout.');
    }
  }, [cameraFacing]);

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // Keep the skeleton canvas sized to the ACTUAL camera resolution rather
  // than a hardcoded 640x480. This is what lets drawPoseSkeleton's
  // coordinate math (and anything in poseDetection.ts that assumes canvas
  // dimensions) line up correctly on mobile.
  const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>): void => {
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) {
      setVideoDims({ width: v.videoWidth, height: v.videoHeight });
    }
  }, []);

  // Pose processing RAF loop
  useEffect(() => {
    let active = true;

    const processFrame = async (): Promise<void> => {
      if (!active) return;

      const video = videoRef.current;
      const pose = poseServiceRef.current;

      if (video && video.readyState >= 2 && pose && !isResting && !video.paused && !video.ended) {
        try {
          await pose.send(video);
        } catch {
          // Drop frames silently if busy
        }
      }

      animFrameRef.current = requestAnimationFrame(() => {
        void processFrame();
      });
    };

    animFrameRef.current = requestAnimationFrame(() => {
      void processFrame();
    });

    return () => {
      active = false;
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isResting]);

  // Sets & Rest management
  const handleFinishCurrentSet = (): void => {
    const currentRepsInSet = engineRef.current ? engineRef.current.getCurrentSetReps() : currentSetReps;
    if (currentRepsInSet === 0) return;

    const duration = Math.round((Date.now() - setStartTimeRef.current) / 1000);
    const newSet: WorkoutSet = {
      setNumber: currentSetIndex,
      reps: currentRepsInSet,
      durationSeconds: Math.max(5, duration),
      avgDepthAngle: settings.targetDepthAngle,
      avgFormScore: engineRef.current ? engineRef.current.getAverageFormScore() : 95,
      timestamp: new Date().toISOString(),
    };

    setSets((prev) => [...prev, newSet]);
    setCurrentSetIndex((prev) => prev + 1);

    engineRef.current?.startNewSet();
    setCurrentSetReps(0);
    setStartTimeRef.current = Date.now();

    // Trigger Rest Timer
    if (settings.autoRestTimer) {
      setIsResting(true);
      setRestSecondsRemaining(settings.restDurationSeconds);
    }
  };

  const handleManualAddRep = (): void => {
    if (engineRef.current) {
      engineRef.current.manualIncrementRep();
    } else {
      setSessionReps((prev) => prev + 1);
      setCurrentSetReps((prev) => prev + 1);
      soundManager.playRepCount(sessionReps + 1);
    }
  };

  const handleCompleteWorkout = (): void => {
    // Commit current set if reps > 0
    const allSets: WorkoutSet[] = [...sets];
    const curReps = engineRef.current ? engineRef.current.getCurrentSetReps() : currentSetReps;
    if (curReps > 0) {
      const duration = Math.round((Date.now() - setStartTimeRef.current) / 1000);
      allSets.push({
        setNumber: currentSetIndex,
        reps: curReps,
        durationSeconds: Math.max(5, duration),
        avgDepthAngle: settings.targetDepthAngle,
        avgFormScore: engineRef.current ? engineRef.current.getAverageFormScore() : 95,
        timestamp: new Date().toISOString(),
      });
    }

    const totalReps = allSets.reduce((sum, s) => sum + s.reps, 0);
    if (totalReps === 0 && sessionReps === 0) {
      onCancelWorkout();
      return;
    }

    const bestSet = allSets.reduce((max, s) => Math.max(max, s.reps), sessionReps);
    const avgForm = engineRef.current ? engineRef.current.getAverageFormScore() : 94;
    const finalTotal = Math.max(totalReps, sessionReps);

    // XP calculation: 10 XP per rep + 5 XP per best set rep + 50 workout completion bonus
    const xpEarned = finalTotal * 10 + bestSet * 5 + 50;

    const completedWorkout: Workout = {
      id: `wo_${Date.now()}`,
      date: new Date().toISOString(),
      totalReps: finalTotal,
      bestSet,
      durationSeconds: Math.max(10, elapsedSeconds),
      sets:
        allSets.length > 0
          ? allSets
          : [
              {
                setNumber: 1,
                reps: finalTotal,
                durationSeconds: Math.max(10, elapsedSeconds),
                avgDepthAngle: settings.targetDepthAngle,
                avgFormScore: avgForm,
                timestamp: new Date().toISOString(),
              },
            ],
      avgFormScore: avgForm,
      xpEarned,
      isPR: bestSet > (stats.bestSet || 0) && bestSet > 0,
    };

    soundManager.playFanfare();
    onFinishWorkout(completedWorkout);
  };

  const toggleCamera = (): void => {
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col bg-[#0A0A0A] text-white overflow-hidden pb-24">
      {/* Top Session Stats Bar */}
      <div className="px-4 py-2.5 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-[#1A1A1A] flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161616] border border-[#222222] text-xs font-mono-stat text-gray-300">
            <Timer className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>{formatDuration(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#161616] border border-[#222222] text-xs font-mono-stat text-gray-300">
            <span className="text-gray-500">Set</span>
            <span className="font-bold text-white">#{currentSetIndex}</span>
          </div>
        </div>

        {/* Camera HUD Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSkeleton((prev) => !prev)}
            aria-label="Toggle Skeleton Overlay"
            className={`p-2 rounded-full border text-xs transition-colors ${
              showSkeleton
                ? 'bg-[#F27D26]/20 border-[#F27D26]/60 text-[#F27D26]'
                : 'bg-[#161616] border-[#222222] text-gray-500'
            }`}
          >
            {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            aria-label="Flip Camera"
            className="p-2 rounded-full bg-[#161616] hover:bg-[#222222] border border-[#222222] text-gray-400 hover:text-white transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCancelWorkout}
            className="px-3 py-1 rounded-full bg-[#161616] border border-[#222222] text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Camera / Pose Stage */}
      <div className="relative flex-1 w-full max-w-xl mx-auto flex flex-col justify-center items-center overflow-hidden bg-black">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          className={`w-full h-full object-cover max-h-[62vh] ${
            settings.mirrorCamera && cameraFacing === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Skeleton Canvas Overlay — sized to the real camera resolution */}
        <canvas
          ref={canvasRef}
          width={videoDims.width}
          height={videoDims.height}
  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"        />

        {/* Down Glow Flare on bottom depth reached */}
        {downPulseAnimation && (
          <div className="absolute inset-0 bg-emerald-500/20 pointer-events-none z-10 transition-opacity animate-out fade-out duration-300" />
        )}

        {/* Rep Flash Flare */}
        {repPulseAnimation && (
          <div className="absolute inset-0 bg-[#F27D26]/25 pointer-events-none z-10 transition-opacity animate-out fade-out duration-400" />
        )}

        {/* Camera Permission / Error Warning */}
        {cameraError && (
          <div className="absolute inset-0 bg-[#0A0A0A]/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-amber-500/40 flex items-center justify-center text-amber-400 mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">Camera Inactive</h3>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">{cameraError}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleManualAddRep}
                className="py-2.5 px-5 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(242,125,38,0.3)] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tap +1 Rep
              </button>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="py-2.5 px-4 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#262626] text-gray-300 font-semibold text-xs uppercase tracking-wider transition-colors"
              >
                Retry Camera
              </button>
            </div>
          </div>
        )}

        {/* Model Loading State */}
        {isModelLoading && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-mono-stat text-[#F27D26]">
            <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-ping" />
            Loading AI Pose Engine...
          </div>
        )}

        {/* Live Form Guidance Pill (Top Center) */}
        <div className="absolute top-3 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md border transition-all shadow-lg ${
              feedback.type === 'good'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/85 border-amber-500/60 text-amber-300'
                : 'bg-[#111111]/90 border-[#222222] text-gray-200'
            }`}
          >
            {feedback.type === 'good' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : feedback.type === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Info className="w-3.5 h-3.5 text-[#F27D26]" />
            )}
            <span>{feedback.message}</span>
          </div>
        </div>

        {/* Rep & Biometrics Telemetry (Bottom Overlay) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
          {/* Big Rep Counter */}
          <div className="flex flex-col items-start">
            <div className="text-[10px] uppercase font-mono-stat tracking-widest text-[#F27D26] font-semibold bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm mb-1 border border-white/5">
              Valid Reps
            </div>
            <div
              className={`font-mono-stat text-6xl sm:text-7xl font-black text-white leading-none tracking-tight drop-shadow-lg transition-transform ${
                repPulseAnimation ? 'scale-125 text-[#F27D26]' : 'scale-100'
              }`}
            >
              {sessionReps}
            </div>
            <div className="text-xs font-mono-stat text-gray-400 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm mt-1 border border-white/5">
              Set: <span className="text-white font-bold">{currentSetReps}</span>
            </div>
          </div>

          {/* Biometrics & State Pill */}
          <div className="flex flex-col items-end gap-1.5">
            {/* Pushup State Pill */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-mono-stat font-bold uppercase tracking-wider backdrop-blur-md border ${
                pushupState === 'DOWN'
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/40 scale-105'
                  : pushupState === 'UP'
                  ? 'bg-[#F27D26] text-black border-[#F27D26] shadow-lg shadow-[#F27D26]/40'
                  : pushupState === 'DESCENDING'
                  ? 'bg-[#F27D26]/20 text-[#F27D26] border-[#F27D26]/50'
                  : 'bg-black/70 text-gray-400 border-[#222222]'
              }`}
            >
              {pushupState}
            </div>

            {/* Depth Angle & Percentage */}
            <div className="bg-[#111111]/85 backdrop-blur-md border border-[#222222] p-2.5 rounded-xl flex flex-col items-end min-w-[120px]">
              <div className="flex items-center justify-between w-full text-[11px] font-mono-stat text-gray-400">
                <span>Elbow</span>
                <span className="font-bold text-white">{angles.activeElbowAngle}°</span>
              </div>

              {/* Depth progress bar */}
              <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-75 ${
                    angles.depthPercentage >= 95 ? 'bg-emerald-400' : 'bg-[#F27D26]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, angles.depthPercentage))}%` }}
                />
              </div>

              <div className="flex items-center justify-between w-full text-[10px] font-mono-stat text-gray-500 mt-1">
                <span>Target</span>
                <span className="text-[#F27D26]">{settings.targetDepthAngle}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Control Deck */}
      <div className="max-w-xl mx-auto w-full px-4 pt-3 flex flex-col gap-3">
        <div className="grid grid-cols-12 gap-2">
          {/* Manual +1 Tap Fallback button (Touch friendly) */}
          <button
            type="button"
            id="btn-manual-rep-tap"
            onClick={handleManualAddRep}
            className="col-span-4 py-3.5 px-2 rounded-2xl bg-[#161616] hover:bg-[#202020] border border-[#222222] text-gray-200 font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#F27D26]" />
            <span>Tap +1 Rep</span>
          </button>

          {/* Finish Set & Rest Button */}
          <button
            type="button"
            id="btn-finish-set"
            onClick={handleFinishCurrentSet}
            disabled={currentSetReps === 0}
            className={`col-span-4 py-3.5 px-2 rounded-2xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
              currentSetReps > 0
                ? 'bg-[#161616] hover:bg-[#202020] border-[#F27D26]/40 text-[#F27D26]'
                : 'bg-[#111111] border-[#1A1A1A] text-gray-600 cursor-not-allowed'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>Finish Set #{currentSetIndex}</span>
          </button>

          {/* Finish Workout CTA */}
          <button
            type="button"
            id="btn-complete-workout"
            onClick={handleCompleteWorkout}
            className="col-span-4 py-3.5 px-2 rounded-2xl bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs sm:text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-[0_4px_15px_rgba(242,125,38,0.3)]"
          >
            <Square className="w-4 h-4 fill-black" />
            <span>Finish</span>
          </button>
        </div>

        {/* Sets Mini Log */}
        {sets.length > 0 && (
          <div className="p-3 rounded-xl bg-[#161616] border border-[#222222] flex items-center gap-3 overflow-x-auto">
            <span className="text-[10px] uppercase tracking-wider font-mono-stat text-gray-500 shrink-0">Logged Sets:</span>
            <div className="flex gap-2">
              {sets.map((s) => (
                <div
                  key={s.setNumber}
                  className="px-2.5 py-1 rounded-lg bg-[#111111] border border-[#262626] text-xs font-mono-stat text-gray-300 shrink-0"
                >
                  S{s.setNumber}: <span className="font-bold text-[#F27D26]">{s.reps}</span> reps
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rest Timer Modal Overlay */}
      {isResting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#111111] border border-[#222222] rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <span className="text-[10px] uppercase font-mono-stat font-bold tracking-widest text-[#F27D26] block">
              Rest Between Sets
            </span>

            {/* Circular Countdown Display */}
            <div className="relative w-36 h-36 mx-auto rounded-full border-4 border-[#F27D26]/30 flex items-center justify-center">
              <div className="font-mono-stat text-5xl font-bold text-white">{restSecondsRemaining}s</div>
            </div>

            <div className="text-xs text-gray-400">Catch your breath, shake out your arms & hydrate.</div>

            {/* Rest adjustments */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRestSecondsRemaining((prev) => Math.max(5, prev - 15))}
                className="py-1.5 px-3 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#222222] text-xs font-mono-stat text-gray-300"
              >
                -15s
              </button>
              <button
                type="button"
                onClick={() => setRestSecondsRemaining((prev) => prev + 15)}
                className="py-1.5 px-3 rounded-full bg-[#161616] hover:bg-[#202020] border border-[#222222] text-xs font-mono-stat text-gray-300"
              >
                +15s
              </button>
            </div>

            <button
              type="button"
              id="btn-skip-rest"
              onClick={() => setIsResting(false)}
              className="w-full py-3.5 rounded-full bg-[#F27D26] hover:brightness-110 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(242,125,38,0.3)]"
            >
              Start Next Set Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};