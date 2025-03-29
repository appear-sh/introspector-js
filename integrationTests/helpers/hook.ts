import { registerAppear } from '../../src/otel/index.js';

// Get collector URL from environment
const collectorUrl = process.env.COLLECTOR_URL;
if (!collectorUrl) {
  throw new Error('COLLECTOR_URL environment variable is required');
}

// Register OpenTelemetry with mock collector
registerAppear({
  apiKey: 'test-key',
  environment: 'test',
  reporting: {
    endpoint: collectorUrl,
    batchIntervalSeconds: 0, // Disable batching for tests
  }
}); 