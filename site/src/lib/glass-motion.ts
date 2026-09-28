/** Pointer motion and inertial rotation, independent of rendering and frame rate. */
export type AngularVelocity = { x: number; y: number };
export type PointerRotation = { x: number; y: number };

const SENSITIVITY = 0.007; // radians per pointer pixel
const SAMPLE_WINDOW_MS = 90;
const STALE_RELEASE_MS = 100;
const MAX_SPEED = 10; // radians per second, across both axes
const DECAY_PER_SECOND = 1;
const STOP_SPEED = 0.015;
const ZERO: AngularVelocity = { x: 0, y: 0 };

type Sample = { x: number; y: number; time: number };

export class DragMotion {
  private samples: Sample[] = [];

  begin(x: number, y: number, time: number): void {
    this.samples = [{ x, y, time }];
  }

  move(x: number, y: number, time: number): PointerRotation {
    const previous = this.samples.at(-1);
    if (!previous || time < previous.time) return { ...ZERO };
    if (x === previous.x && y === previous.y) return { ...ZERO };
    this.samples.push({ x, y, time });
    // Keep one sample just outside the window for a stable release estimate.
    while (this.samples.length > 2 && time - this.samples[1]!.time > SAMPLE_WINDOW_MS) {
      this.samples.shift();
    }
    return {
      x: (y - previous.y) * SENSITIVITY,
      y: (x - previous.x) * SENSITIVITY,
    };
  }

  release(time: number): AngularVelocity {
    const last = this.samples.at(-1);
    if (!last || this.samples.length < 2 || time - last.time > STALE_RELEASE_MS) {
      this.cancel();
      return { ...ZERO };
    }
    const recent = this.samples.filter((sample) => last.time - sample.time <= SAMPLE_WINDOW_MS);
    if (recent.length < 2) {
      this.cancel();
      return { ...ZERO };
    }
    const first = recent[0]!;
    const seconds = (last.time - first.time) / 1000;
    this.cancel();
    if (seconds <= 0) return { ...ZERO };
    const speedX = ((last.y - first.y) * SENSITIVITY) / seconds;
    const speedY = ((last.x - first.x) * SENSITIVITY) / seconds;
    const magnitude = Math.hypot(speedX, speedY);
    const scale = magnitude > MAX_SPEED ? MAX_SPEED / magnitude : 1;
    return {
      x: speedX * scale,
      y: speedY * scale,
    };
  }

  cancel(): void {
    this.samples = [];
  }
}

/** Exact exponential integration: one 1-second step equals sixty 1/60 steps. */
export function advanceInertia(velocity: AngularVelocity, seconds: number): {
  rotation: PointerRotation;
  velocity: AngularVelocity;
} {
  if (seconds <= 0) return { rotation: { ...ZERO }, velocity: { ...velocity } };
  const axis = (speed: number) => {
    if (Math.abs(speed) <= STOP_SPEED) return { rotation: 0, velocity: 0 };
    const timeToStop = Math.log(Math.abs(speed) / STOP_SPEED) / DECAY_PER_SECOND;
    const elapsed = Math.min(seconds, timeToStop);
    const decay = Math.exp(-DECAY_PER_SECOND * elapsed);
    return {
      rotation: (speed * (1 - decay)) / DECAY_PER_SECOND,
      velocity: seconds >= timeToStop ? 0 : speed * decay,
    };
  };
  const x = axis(velocity.x);
  const y = axis(velocity.y);
  return {
    rotation: { x: x.rotation, y: y.rotation },
    velocity: { x: x.velocity, y: y.velocity },
  };
}
