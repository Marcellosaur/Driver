type AnalyticsName = 'trip_started' | 'trip_ended' | 'alert_triggered' | 'location_batch_sent';

export function trackEvent(name: AnalyticsName, props?: Record<string, string | number | boolean>) {
  if (__DEV__) {
    console.info(`[analytics] ${name}`, props);
  }
}
