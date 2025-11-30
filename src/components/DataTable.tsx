import React, { useState, useMemo } from "react";

interface DataTableProps<T> {
  data: T[];
  pageSize?: number;
}

const DataTable = <T extends Record<string, any>>({
  data,
  pageSize = 5,
}: DataTableProps<T>) => {
  const [page, setPage] = useState(0);

  const hasData = data && data.length > 0;
  const columns = hasData ? Object.keys(data[0]) : [];

  const totalPages = hasData ? Math.ceil(data.length / pageSize) : 1;

  const pageData = useMemo(() => {
    if (!hasData) return [];
    const start = page * pageSize;
    return data.slice(start, start + pageSize);
  }, [page, data, pageSize, hasData]);

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages - 1));
  const prevPage = () => setPage((p) => Math.max(p - 1, 0));

  return (
    <div>
      {!hasData ? (
        <div className="text-gray-500 text-sm text-center p-4">
          No data available
        </div>
      ) : (
        <>
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
                {pageData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={`${idx}-${col}`} className="p-2 text-left border-b">
                        {row[col] != null ? row[col].toString() : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3">
            <button
              onClick={prevPage}
              disabled={page === 0}
              className="px-3 py-1 bg-gray-200 rounded disabled:bg-gray-300 disabled:text-gray-500 hover:bg-gray-300 transition"
            >
              Previous
            </button>

            <div className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </div>

            <button
              onClick={nextPage}
              disabled={page === totalPages - 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:bg-gray-300 disabled:text-gray-500 hover:bg-gray-300 transition"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default DataTable;
