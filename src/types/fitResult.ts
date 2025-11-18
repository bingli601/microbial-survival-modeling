// ==========================================
// 📄 types/fitResult.ts
// ==========================================

import { DataRow } from './data';

export interface FitResult {
  fittedData: DataRow[];   // 每行的拟合结果，key 对应原始 numeric column 名称
  parameters?: Record<string, any>; // 改为 any 以容纳复杂结构，如嵌套的温度参数
  method?: string;          // 可选：拟合方法名称，例如 "linear regression"
  rSquared?: number;        // 可选：拟合优度
}