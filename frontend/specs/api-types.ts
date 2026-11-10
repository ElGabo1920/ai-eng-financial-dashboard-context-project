import type {
  BusinessType,
  Category,
  OperationType,
} from "../src/lib/financial-types";

export interface FacetsResponse {
  /** Available operation types; values are "income" or "outcome". */
  operation_types: OperationType[];
  /** Available customer segments; values are "B2B" or "B2C". */
  business_types: BusinessType[];
  /** Available movement categories: suppliers, sales, operational, administrative, or others. */
  categories: Category[];
  /** Earliest movement date in ISO YYYY-MM-DD format. */
  min_date: string;
  /** Latest movement date in ISO YYYY-MM-DD format. */
  max_date: string;
}

export interface AlertEntry {
  /** Period key for the alert; its format depends on the requested group_by value. */
  period: string;
  /** Total outcome amount for this period, rounded to two decimal places. */
  outcome_total: number;
  /** Average outcome amount across preceding periods, rounded to two decimal places. */
  baseline_average: number;
  /** Relative increase over baseline, (outcome_total - baseline_average) / baseline_average, rounded to four decimals; emitted only when it exceeds threshold and baseline is positive. */
  increase_ratio: number;
}

/** Array response from GET /api/metrics/alerts. */
export type AlertsResponse = AlertEntry[];

export interface CategoryEntry {
  /** Category being ranked: suppliers, sales, operational, administrative, or others. */
  category: Category;
  /** Movement type included in the total; "income" or "outcome". */
  operation_type: OperationType;
  /** Total amount for this category and operation type, subject to the query filters. */
  total_amount: number;
}

/**
 * Array response from GET /api/metrics/categories/top. The API does not include
 * business_type in each item; associate entries with the query filter used.
 */
export type TopCategoriesResponse = CategoryEntry[];
