// ==========================================
// 🔢 dataAnalysis.ts - Data Processing Utilities
// ==========================================

import { DataRow, DataInsight } from '@/types/data';
import { DataSummary, ColumnStats } from '@/types/data';

/**
 * getDataSummary
 * Returns total rows and per-column numeric statistics
 */
export const getDataSummary = (data: DataRow[]): DataSummary | null => {
  if (!data || data.length === 0) return null;

  const totalRows = data.length;
  const numericCols: Record<string, number[]> = {};

  // Collect numeric values per column
  data.forEach(row => {
    Object.keys(row).forEach(col => {
      const val = row[col];
      if (typeof val === 'number' && Number.isFinite(val)) {
        if (!numericCols[col]) numericCols[col] = [];
        numericCols[col].push(val);
      }
    });
  });

  const columnStats: Record<string, ColumnStats> = {};
  Object.entries(numericCols).forEach(([col, arr]) => {
    if (!arr.length) return;
    const mean = arr.reduce((sum, v) => sum + v, 0) / arr.length;
    const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
    columnStats[col] = {
      mean,
      std: Math.sqrt(variance),
      min: Math.min(...arr),
      max: Math.max(...arr),
    };
  });

  return { totalRows, columnStats };
};

/**
 * generateDataInsights
 * Produces a list of insights for a dataset
 */
export const generateDataInsights = (data: DataRow[]): DataInsight[] => {
  if (!data || data.length === 0) return [];

  const insights: DataInsight[] = [];
  const summary = getDataSummary(data);
  if (!summary) return insights;

  const columns = Object.keys(data[0]);

  // Dataset overview
  insights.push({
    type: 'summary',
    title: 'Dataset Overview',
    description: `Your dataset contains ${summary.totalRows} rows and ${columns.length} columns.`,
    confidence: 'high',
  });

  // Numeric column analysis
  columns.forEach(col => {
    const stats = summary.columnStats[col];
    if (stats) {
      const { mean, min, max } = stats;
      insights.push({
        type: 'summary',
        title: `${col} Stats`,
        description: `Mean: ${mean.toFixed(2)}, Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}`,
        confidence: 'high',
        column: col,
        details: stats,
      });
    }
  });

  return insights.slice(0, 10);
};

/**
 * getNumericColumns
 * Returns names of numeric columns in the dataset
 */
export const getNumericColumns = (data: DataRow[]): string[] => {
  if (!data || data.length === 0) return [];
  const summary = getDataSummary(data);
  if (!summary) return [];
  return Object.keys(summary.columnStats);
};

/**
 * getColumnValues
 * Returns values for a specific column (ignoring null/boolean)
 */
export const getColumnValues = (data: DataRow[], column: string): (string | number)[] => {
  return data
    .map(row => row[column])
    .filter(val => val !== null && typeof val !== 'boolean') as (string | number)[];
};

/**
 * calculateStatistics
 * Returns descriptive statistics for an array of numbers
 */
export const calculateStatistics = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);

  // Mode
  const frequency: Record<number, number> = {};
  values.forEach(v => {
    frequency[v] = (frequency[v] || 0) + 1;
  });
  const mode = parseFloat(
    Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'NaN'
  );

  return { mean, median, mode, min, max, range, std, variance, count: values.length };
};
