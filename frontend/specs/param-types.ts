import type {
  BusinessType,
  OperationType,
} from "../src/lib/financial-types";

export interface DateRangeFilter {
  /** Optional inclusive lower date bound, formatted as ISO YYYY-MM-DD. */
  start_date?: string;
  /** Optional inclusive upper date bound, formatted as ISO YYYY-MM-DD. */
  end_date?: string;
}

/** API-supported summary grouping values. */
export type GroupBy = "day" | "week" | "month";

export interface AlertsParams extends DateRangeFilter {
  /** Non-negative relative increase threshold; default is 0.3. Alerts require increase_ratio > threshold. */
  threshold?: number;
  /** Alert aggregation period; values are "day", "week", or "month"; default is "month". */
  group_by?: GroupBy;
  /** Optional segment filter; values are "B2B" or "B2C". */
  business_type?: BusinessType;
}

export interface TopCategoriesParams extends DateRangeFilter {
  /** Movement type to rank; values are "income" or "outcome"; default is "outcome". */
  operation_type?: OperationType;
  /** Maximum number of ranked entries; integer from 1 through 20; default is 5. */
  limit?: number;
  /** Optional segment filter; values are "B2B" or "B2C". Use separate filtered requests to compare both segments. */
  business_type?: BusinessType;
}
