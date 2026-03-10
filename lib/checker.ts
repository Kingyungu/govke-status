/**
 * lib/checker.ts
 *
 * Re-exports the monitoring logic from monitor/checker.ts for backwards
 * compatibility with any code that imports from this path.
 */
export {
  probeService,
  persistCheck,
  handleIncidentLogic,
  runChecks,
} from '@/monitor/checker'
export type { ProbeResult } from '@/monitor/checker'
