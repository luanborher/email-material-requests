import { checkDatabaseConnection } from "../../database/connection.js";
import type { HealthCheckResponse } from "../../types/health.js";
import { getUptimeSeconds } from "../../utils/uptime.js";

export async function getHealthStatus(): Promise<HealthCheckResponse> {
  let databaseConnected = false;

  try {
    databaseConnected = await checkDatabaseConnection();
  } catch {
    databaseConnected = false;
  }

  return {
    status: databaseConnected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: getUptimeSeconds(),
    database: {
      status: databaseConnected ? "connected" : "disconnected",
    },
  };
}
