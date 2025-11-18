// DataTable.tsx
import React from "react";

interface DataTableProps<T> {
  data: T[];
}

/**
 * Simple table component to preview an array of objects.
 * Dynamically creates columns based on keys of the first object.
 */
const DataTable = <T extends Record<string, any>>({ data }: DataTableProps<T>) => {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm text-center p-4">No data available</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="p-2 text-left border-b">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={`${idx}-${col}`} className="p-2 text-right border-b">
                  {row[col] != null ? row[col].toString() : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
