import { Landmark } from '../types';

export type PoseResultsCallback = (landmarks: Landmark[] | null) => void;

let scriptLoadingPromise: Promise<boolean> | null = null;

export class MediaPipePoseService {
  private pose: any = null;
  private isInitialized = false;
  private onResultsCallback: PoseResultsCallback | null = null;

  public async initialize(onResults: PoseResultsCallback): Promise<boolean> {
    this.onResultsCallback = onResults;

    if (this.isInitialized && this.pose) {
      return true;
    }

    try {
      const PoseClass = await this.ensurePoseClass();
      if (!PoseClass) {
        console.warn('Pose class not available in browser environment');
        return false;
      }

      // Safe initialization of MediaPipe Pose
      this.pose = new PoseClass({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        },
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.pose.onResults((results: any) => {
        if (results && results.poseLandmarks) {
          const landmarks: Landmark[] = results.poseLandmarks.map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          }));
          if (this.onResultsCallback) {
            this.onResultsCallback(landmarks);
          }
        } else {
          if (this.onResultsCallback) {
            this.onResultsCallback(null);
          }
        }
      });

      await this.pose.initialize();
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('MediaPipe Pose initialization bypassed:', err);
      this.isInitialized = false;
      return false;
    }
  }

  private async ensurePoseClass(): Promise<any> {
    if (typeof window !== 'undefined' && (window as any).Pose) {
      return (window as any).Pose;
    }

    if (!scriptLoadingPromise) {
      scriptLoadingPromise = new Promise<boolean>((resolve) => {
        if (typeof window === 'undefined') {
          resolve(false);
          return;
        }
        if ((window as any).Pose) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve(true);
        script.onerror = (e) => {
          console.warn('Could not load MediaPipe Pose CDN script:', e);
          resolve(false);
        };
        document.head.appendChild(script);
      });
    }

    const loaded = await scriptLoadingPromise;
    if (loaded && typeof window !== 'undefined') {
      return (window as any).Pose;
    }
    return null;
  }

  public async send(imageElement: HTMLVideoElement | HTMLCanvasElement): Promise<void> {
    if (this.pose && this.isInitialized) {
      try {
        await this.pose.send({ image: imageElement });
      } catch {
        // Drop frames silently if busy or during context swap
      }
    }
  }

  public close() {
    if (this.pose) {
      try {
        this.pose.close();
      } catch {
        // Ignore
      }
      this.pose = null;
      this.isInitialized = false;
    }
  }
}

