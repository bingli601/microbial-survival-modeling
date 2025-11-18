// ==========================================
// 🔢 dataAnalysis.ts - Data Processing Utilities (Final Clean Version)
// ==========================================

import { DataRow, DataInsight, ColumnStats, DataSummary } from '@/types/data';

/**
 * getDataSummary
 * Returns total rows, per-column numeric statistics, and column types
 */
export const getDataSummary = (data: DataRow[]): DataSummary | null => {
  if (!data || data.length === 0) return null;

  const totalRows = data.length;
  const columnStats: Record<string, ColumnStats> = {};
  const columnTypes: Record<string, 'numeric' | 'text' | 'boolean'> = {};
  const numericCols: Record<string, number[]> = {};

  // Analyze columns exactly as provided (no log, no modification)
  Object.keys(data[0]).forEach(col => {
    const values = data.map(row => row[col]);
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    if (nums.length / values.length > 0.8) {
      columnTypes[col] = 'numeric';
      numericCols[col] = nums;
    } else if (values.every(v => typeof v === 'boolean')) {
      columnTypes[col] = 'boolean';
    } else {
      columnTypes[col] = 'text';
    }
  });

  // Compute numeric column stats only for numeric columns
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

  return { totalRows, columnStats, columnTypes };
};

/**
 * generateDataInsights
 * Produces a short list of insights
 */
export const generateDataInsights = (data: DataRow[]): DataInsight[] => {
  if (!data || data.length === 0) return [];

  const summary = getDataSummary(data);
  if (!summary) return [];

  const insights: DataInsight[] = [];
  const columns = Object.keys(data[0]);

  // Overview
  insights.push({
    type: 'summary',
    title: 'Dataset Overview',
    description: `Your dataset contains ${summary.totalRows} rows and ${columns.length} columns.`,
    confidence: 'high',
  });

  // Numeric stats
  columns.forEach(col => {
    if (summary.columnTypes[col] === 'numeric') {
      const stats = summary.columnStats[col];
      if (stats) {
        insights.push({
          type: 'summary',
          title: `${col} Statistics`,
          description: `Mean: ${stats.mean.toFixed(2)}, Min: ${stats.min.toFixed(2)}, Max: ${stats.max.toFixed(2)}`,
          confidence: 'high',
          column: col,
          details: stats,
        });
      }
    }
  });

  return insights.slice(0, 10);
};

/**
 * Returns numeric column names
 */
export const getNumericColumns = (data: DataRow[]): string[] => {
  if (!data || data.length === 0) return [];
  const summary = getDataSummary(data);
  if (!summary) return [];
  return Object.entries(summary.columnTypes)
    .filter(([_, t]) => t === 'numeric')
    .map(([col]) => col);
};

/**
 * Get raw values from a specific column
 */
export const getColumnValues = (data: DataRow[], column: string): (string | number)[] => {
  return data
    .map(row => row[column])
    .filter(val => val !== null && typeof val !== 'boolean') as (string | number)[];
};

/**
 * Basic descriptive stats for an array of numbers
 */
export const calculateStatistics = (values: number[]) => {
  if (!values.length) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min;

  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  // mode
  const freq: Record<number, number> = {};
  values.forEach(v => (freq[v] = (freq[v] || 0) + 1));
  const mode = parseFloat(
    Object.entries(freq).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'NaN'
  );

  return { mean, median, mode, min, max, range, std, variance, count: values.length };
};
