export class MetricsCollector {
  private static counters = new Map<string, number>();
  private static distributions = new Map<string, number[]>();

  static increment(metricName: string, value: number = 1) {
    const current = this.counters.get(metricName) || 0;
    this.counters.set(metricName, current + value);
  }

  static recordDistribution(metricName: string, value: number) {
    if (!this.distributions.has(metricName)) {
      this.distributions.set(metricName, []);
    }
    this.distributions.get(metricName)!.push(value);
  }

  static getCounters(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }

  static getDistributions(): Record<string, number[]> {
    return Object.fromEntries(this.distributions);
  }

  static reset() {
    this.counters.clear();
    this.distributions.clear();
  }
}
