/**
 * Precision athletic audio synthesizer for PushQuest
 * Uses standard Web Audio API for zero latency and offline reliability.
 */
class SoundService {
  private audioCtx: AudioContext | null = null;
  private isSoundEnabled = true;
  private isVoiceEnabled = true;
  private isHapticEnabled = true;

  constructor() {
    // Lazy AudioContext creation on first interaction
  }

  private getContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public updateSettings(sound: boolean, voice: boolean, haptic: boolean) {
    this.isSoundEnabled = sound;
    this.isVoiceEnabled = voice;
    this.isHapticEnabled = haptic;
  }

  /**
   * Played when reaching valid bottom depth (DOWN state)
   */
  public playDownCue() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    this.vibrate(35);
  }

  /**
   * Played on valid UP pushup rep count
   */
  public playRepCount(repNumber: number) {
    if (this.isHapticEnabled) {
      this.vibrate([40, 30, 60]);
    }

    if (this.isSoundEnabled) {
      const ctx = this.getContext();
      if (ctx) {
        const isMilestone = repNumber % 10 === 0 || repNumber === 25 || repNumber === 50;
        const baseFreq = isMilestone ? 880 : 587.33; // D5 or A5

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    }

    // Voice announcement for every 5 reps or milestone
    if (this.isVoiceEnabled && (repNumber <= 5 || repNumber % 5 === 0)) {
      this.speak(`${repNumber}`);
    }
  }

  /**
   * Form warning buzz
   */
  public playFormWarning(msg?: string) {
    if (this.isHapticEnabled) {
      this.vibrate([80, 50, 80]);
    }

    if (this.isSoundEnabled) {
      const ctx = this.getContext();
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.setValueAtTime(110, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    }

    if (this.isVoiceEnabled && msg) {
      this.speak(msg);
    }
  }

  /**
   * Rest timer countdown beep
   */
  public playTimerBeep(isLast: boolean = false) {
    if (!this.isSoundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isLast ? 1046.5 : 523.25; // C6 or C5
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(isLast ? 0.4 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isLast ? 0.35 : 0.15));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isLast ? 0.35 : 0.15));

    if (isLast) {
      this.vibrate([100, 50, 150]);
    } else {
      this.vibrate(30);
    }
  }

  /**
   * Workout finish / PR fanfare
   */
  public playFanfare() {
    if (!this.isSoundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
    });

    this.vibrate([100, 50, 100, 50, 200]);
  }

  public speak(text: string) {
    if (!this.isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors on restricted browsers
    }
  }

  private vibrate(pattern: number | number[]) {
    if (this.isHapticEnabled && typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore haptic errors
      }
    }
  }
}

export const soundManager = new SoundService();
