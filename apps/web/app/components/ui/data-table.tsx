import type { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: (row: T, index: number) => ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
}

export type { Column };

export default function DataTable<T>({ columns, data, emptyMessage = "No data found.", emptyIcon, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 shadow-float">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-dark-850">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${col.align === "right" ? "text-right" : "text-left"} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  {emptyIcon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-dark-850 text-slate-500">{emptyIcon}</div>}
                  <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={`even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`px-6 py-4 ${col.align === "right" ? "text-right" : "text-left"} ${col.className || ""}`}
                    >
                      {col.accessor(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
