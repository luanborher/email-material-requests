export interface HealthCheckResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
  };
}
