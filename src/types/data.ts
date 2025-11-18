
// ==========================================
// 📊 WEEK 1: data.ts - Type Definitions for Data Structures
// ==========================================
// This file defines the "shape" of our data - like blueprints for objects!
// TypeScript uses these interfaces to help catch errors and provide autocompletion.

// 🔧 WEEK 2: Students will learn about interfaces and type safety
// 🔧 WEEK 3: Students will extend these types for form validation
// 🔧 WEEK 4: Students will add computed properties and derived types
// 🔧 WEEK 5: Students will add advanced data transformation types

// 📋 DataRow Interface - Represents a single row of data from your CSV
// Think of this as describing what each row in your spreadsheet looks like
// The [key: string] syntax means "any property name is allowed"
// Values can be text, numbers, true/false, or empty (null)
export interface DataRow {
  [key: string]: string | number | boolean | null;
  // Examples of what this might look like:
  // { name: "John", age: 25, active: true, score: null }
  // { product: "Widget", price: 19.99, inStock: false, category: "Tools" }
}

// 📊 DataColumn Interface - Describes the structure of each column
// This helps us understand what type of data is in each column
// and how to display it properly in charts and tables
export interface DataColumn {
  key: string;        // 🔑 The column name (like "age" or "price")
  type: 'string' | 'number' | 'boolean' | 'date';  // 📝 What kind of data
  label: string;      // 🏷️ Display name for the user interface
  
  // 🔧 WEEK 3: Students will add validation rules here
  // 🔧 WEEK 4: Students will add formatting options
  // Example additions students will make:
  // required?: boolean;
  // min?: number;
  // max?: number;
  // format?: string;
}

// 💡 DataInsight Interface - Represents AI-generated insights about your data
// These are the "smart observations" that help you understand patterns
export interface DataInsight {
  type: 'summary' | 'trend' | 'correlation' | 'outlier' | 'distribution';
  title: string;
  description: string;
  value?: string | number;
  confidence?: 'high' | 'medium' | 'low';
  
  // 🔧 扩展字段，用于指定列或附加信息
  column?: string;    // 针对哪一列的洞察
  details?: any;      // 额外的详细信息，比如统计数据
}


// -----------------------------
// DataSummary Types
// -----------------------------

export interface ColumnStats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface DataSummary {
  totalRows: number;
  columnStats: Record<string, ColumnStats>; // 每列的统计信息
}

