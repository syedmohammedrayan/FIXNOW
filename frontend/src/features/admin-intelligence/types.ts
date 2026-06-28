/**
 * FixNow AI Workflow 6 — Operations & Admin Intelligence Types
 *
 * Strongly typed interfaces for admin-grade operational insights.
 * Consumes data from all five prior workflows and platform traces.
 */

// ─── Operations Summary ───────────────────────────────────────

export interface OperationsSummary {
  /** Reporting period (e.g., "2026-06-21 to 2026-06-28"). */
  period: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  unresolvedJobs: number;
  urgentCases: number;
  /** Top appliance categories by volume. */
  topCategories: { category: string; count: number }[];
  /** Most common failure types. */
  topFailureTypes: { fault: string; count: number }[];
  /** Top performing technicians. */
  topTechnicians: { name: string; completedJobs: number; successRate: number }[];
}

// ─── Technician Performance ───────────────────────────────────

export type PerformanceRating = 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Critical';

export interface TechnicianPerformanceInsight {
  technicianId: string;
  technicianName: string;
  /** Overall performance rating. */
  rating: PerformanceRating;
  /** Job success rate (0.0 – 1.0). */
  successRate: number;
  /** Average completion time in minutes. */
  avgCompletionMinutes: number;
  /** How often the same appliance needs a re-visit within 30 days. */
  repeatFailureRate: number;
  /** Average customer satisfaction score (1–5). */
  customerFeedbackScore: number;
  /** Number of escalated jobs. */
  escalationCount: number;
  /** AI-generated improvement suggestions. */
  recommendations: string[];
}

// ─── Customer Risk ────────────────────────────────────────────

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CustomerRiskInsight {
  customerId: string;
  customerName: string;
  /** Likelihood of escalation or churn (0.0 – 1.0). */
  riskScore: number;
  /** Categorized risk level. */
  riskLevel: RiskLevel;
  /** Factors contributing to this risk. */
  riskFactors: string[];
  /** Recommended actions to mitigate the risk. */
  mitigationActions: string[];
}

// ─── Recurring Faults ─────────────────────────────────────────

export interface RecurringFaultInsight {
  /** Appliance type + brand pattern (e.g., "Samsung Split AC"). */
  appliancePattern: string;
  /** The specific recurring fault. */
  faultType: string;
  /** Number of occurrences in the reporting period. */
  occurrences: number;
  /** Trend direction. */
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  /** Percentage change from previous period. */
  changePercent: number;
  /** Root cause hypothesis. */
  probableRootCause: string;
  /** Recommended platform action. */
  recommendation: string;
}

// ─── SLA Compliance ───────────────────────────────────────────

export type SLAStatus = 'On Track' | 'At Risk' | 'Breached';

export interface SLAComplianceInsight {
  jobId: string;
  customerId: string;
  /** Current SLA status. */
  status: SLAStatus;
  /** Probability of missing SLA (0.0 – 1.0). */
  missRiskScore: number;
  /** Estimated delay in hours (0 if on track). */
  estimatedDelayHours: number;
  /** Factors contributing to SLA risk. */
  riskFactors: string[];
  /** Recommended interventions. */
  interventions: string[];
}

// ─── Model Usage ──────────────────────────────────────────────

export interface ModelUsageInsight {
  /** Reporting period. */
  period: string;
  /** Total AI calls made. */
  totalCalls: number;
  /** Breakdown by model tier. */
  modelBreakdown: { model: string; calls: number; avgLatencyMs: number; costEstimate: number }[];
  /** How often the agent escalated to a more expensive model. */
  escalationRate: number;
  /** Quality gate failure rate. */
  qualityGateFailureRate: number;
  /** AI-generated cost optimization recommendations. */
  costRecommendations: string[];
}

// ─── Weekly Admin Brief ───────────────────────────────────────

export interface WeeklyAdminBrief {
  /** Reporting week. */
  week: string;
  /** Executive summary (2-3 sentences). */
  executiveSummary: string;
  /** Key metrics. */
  operations: OperationsSummary;
  /** Top technician issues. */
  technicianAlerts: TechnicianPerformanceInsight[];
  /** Customers at risk. */
  customerAlerts: CustomerRiskInsight[];
  /** Recurring fault patterns. */
  faultPatterns: RecurringFaultInsight[];
  /** SLA compliance overview. */
  slaOverview: { onTrack: number; atRisk: number; breached: number };
  /** AI cost and usage. */
  modelUsage: ModelUsageInsight;
}

// ─── Admin Alert ──────────────────────────────────────────────

export type AlertSeverity = 'Info' | 'Warning' | 'Critical';

export interface AdminAlert {
  /** Alert title. */
  title: string;
  /** Detailed description. */
  description: string;
  /** Alert severity. */
  severity: AlertSeverity;
  /** Which area this alert concerns. */
  category: 'technician' | 'customer' | 'sla' | 'fault' | 'cost' | 'operations';
  /** Recommended action. */
  recommendedAction: string;
  /** Timestamp (ISO string). */
  timestamp: string;
}

// ─── Validation ───────────────────────────────────────────────

export interface AdminValidationResult<T> {
  valid: boolean;
  result?: T;
  errors?: string[];
}
