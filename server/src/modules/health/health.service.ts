export type ReadinessCheck = () => Promise<void> | void;

export interface ReadinessResult {
  name: string;
  ok: boolean;
}

/** Keeps the list of dependencies that must respond before the app can take traffic. */
export class HealthService {
  private readonly checks = new Map<string, ReadinessCheck>();

  register(name: string, check: ReadinessCheck): void {
    this.checks.set(name, check);
  }

  uptime(): number {
    return process.uptime();
  }

  runChecks(): Promise<ReadinessResult[]> {
    return Promise.all(
      [...this.checks].map(async ([name, check]) => {
        try {
          await check();
          return { name, ok: true };
        } catch {
          return { name, ok: false };
        }
      }),
    );
  }
}
