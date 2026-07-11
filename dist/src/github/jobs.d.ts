import type { WorkflowTimingReport } from '../model/timing';
import type { RunContext } from '../model/test-run';
export declare function resolveCurrentJobUrl(token: string, context: RunContext): Promise<string | undefined>;
export declare function fetchWorkflowTiming(token: string, context: RunContext): Promise<WorkflowTimingReport | undefined>;
//# sourceMappingURL=jobs.d.ts.map