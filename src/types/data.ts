
// Data row interface
export interface DataRow {
  [key: string]: string | number | boolean | null;
}

// Data column interface
export interface DataColumn {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label: string;
}

// DataInsight interface
export interface DataInsight {
  type: 'summary' | 'trend' | 'correlation' | 'outlier' | 'distribution';
  title: string;
  description: string;
  value?: string | number;
  confidence?: 'high' | 'medium' | 'low';
  column?: string;
  details?: any;
}

// Column statistics interface
export interface ColumnStats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

// Updated DataSummary interface with columnTypes
export interface DataSummary {
  totalRows: number;
  columnStats: Record<string, ColumnStats>;
  columnTypes: Record<string, 'numeric' | 'text' | 'boolean'>;
}
