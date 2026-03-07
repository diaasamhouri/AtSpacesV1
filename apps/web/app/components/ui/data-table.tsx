"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { exportToCSV, exportToPDF } from "./table-export";

// ==================== Types ====================

export interface ActionItem<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: ReactNode;
  roleRequired?: string;
  hidden?: (row: T) => boolean;
}

export interface Column<T> {
  header: string;
  accessor: (row: T, index: number) => ReactNode;
  align?: "left" | "right";
  className?: string;
  sortable?: boolean;
  sortKey?: string;
  exportAccessor?: (row: T) => string;
  hideable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  // Search
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // Pagination
  showPerPage?: boolean;
  perPage?: number;
  onPerPageChange?: (value: number) => void;
  perPageOptions?: (number | "All")[];
  // Sort
  sortKey?: string;
  sortDirection?: "asc" | "desc" | null;
  onSortChange?: (key: string, direction: "asc" | "desc" | null) => void;
  // Column visibility
  columnVisibility?: boolean;
  // Export
  exportable?: boolean;
  exportFilename?: string;
  exportTitle?: string;
  // Actions
  actions?: ActionItem<T>[];
  // Toolbar extras
  toolbarExtra?: ReactNode;
}

// ==================== Sub-components ====================

function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <span className={direction === "asc" ? "text-brand-500" : "text-slate-500"}>&#9650;</span>
      <span className={direction === "desc" ? "text-brand-500" : "text-slate-500"}>&#9660;</span>
    </span>
  );
}

function DropdownMenu({ trigger, children, align = "right" }: { trigger: ReactNode; children: ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[180px] rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 ${align === "right" ? "right-0" : "left-0"}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ==================== Main Component ====================

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = "No data found.",
  emptyIcon,
  onRowClick,
  searchable = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showPerPage = false,
  perPage,
  onPerPageChange,
  perPageOptions = [5, 10, 20, 30, 50, "All"],
  sortKey: externalSortKey,
  sortDirection: externalSortDir,
  onSortChange,
  columnVisibility = false,
  exportable = false,
  exportFilename = "export",
  exportTitle,
  actions,
  toolbarExtra,
}: DataTableProps<T>) {
  // Internal search state (if no external control)
  const [internalSearch, setInternalSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Column visibility
  const storageKey = `dt-cols-${exportFilename}`;
  const [hiddenCols, setHiddenCols] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set<number>();
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved) as number[]) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify([...hiddenCols]));
    }
  }, [hiddenCols, storageKey]);

  // Internal sort state (if no external control)
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc" | null>(null);

  const currentSortKey = externalSortKey ?? internalSortKey;
  const currentSortDir = externalSortDir ?? internalSortDir;

  const handleSort = useCallback(
    (key: string) => {
      let nextDir: "asc" | "desc" | null;
      if (currentSortKey !== key) nextDir = "asc";
      else if (currentSortDir === "asc") nextDir = "desc";
      else nextDir = null;

      if (onSortChange) {
        onSortChange(key, nextDir);
      } else {
        setInternalSortKey(nextDir ? key : null);
        setInternalSortDir(nextDir);
      }
    },
    [currentSortKey, currentSortDir, onSortChange]
  );

  const handleSearchInput = useCallback(
    (val: string) => {
      setInternalSearch(val);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        onSearchChange?.(val);
      }, 300);
    },
    [onSearchChange]
  );

  // Combine columns + action column
  const allColumns: Column<T>[] = actions
    ? [
        ...columns,
        {
          header: "Actions",
          accessor: () => null as unknown as ReactNode,
          align: "right" as const,
        },
      ]
    : columns;

  const visibleColumns = allColumns.filter((_, i) => !hiddenCols.has(i));

  // Export handlers
  const handleExportCSV = () => {
    const exportCols = columns.filter((_, i) => !hiddenCols.has(i));
    const headers = exportCols.map((c) => c.header);
    const rows = data.map((row) =>
      exportCols.map((c) => {
        if (c.exportAccessor) return c.exportAccessor(row);
        const val = c.accessor(row, 0);
        return typeof val === "string" || typeof val === "number" ? String(val) : "";
      })
    );
    exportToCSV(headers, rows, exportFilename);
  };

  const handleExportPDF = async () => {
    const exportCols = columns.filter((_, i) => !hiddenCols.has(i));
    const headers = exportCols.map((c) => c.header);
    const rows = data.map((row) =>
      exportCols.map((c) => {
        if (c.exportAccessor) return c.exportAccessor(row);
        const val = c.accessor(row, 0);
        return typeof val === "string" || typeof val === "number" ? String(val) : "";
      })
    );
    await exportToPDF(headers, rows, exportFilename, exportTitle);
  };

  const hasToolbar = searchable || showPerPage || columnVisibility || exportable || toolbarExtra;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={searchValue ?? internalSearch}
                onChange={(e) => (onSearchChange ? onSearchChange(e.target.value) : handleSearchInput(e.target.value))}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {toolbarExtra}

            {/* Per page */}
            {showPerPage && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Show</span>
                <select
                  value={perPage ?? 10}
                  onChange={(e) => {
                    const val = e.target.value === "All" ? 9999 : Number(e.target.value);
                    onPerPageChange?.(val);
                  }}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  {perPageOptions.map((opt) => (
                    <option key={String(opt)} value={String(opt)}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Column visibility */}
            {columnVisibility && (
              <DropdownMenu
                trigger={
                  <button className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 p-2 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors" title="Toggle columns">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                  </button>
                }
              >
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Columns</div>
                {allColumns.map((col, i) => {
                  if (actions && i === allColumns.length - 1) return null; // skip actions column
                  return (
                    <label key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-dark-800 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(i)}
                        onChange={() => {
                          setHiddenCols((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-slate-300">{col.header}</span>
                    </label>
                  );
                })}
              </DropdownMenu>
            )}

            {/* Export */}
            {exportable && (
              <DropdownMenu
                trigger={
                  <button className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-800 p-2 hover:bg-slate-50 dark:hover:bg-dark-800 transition-colors" title="Export">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                }
              >
                <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                  Export CSV
                </button>
                <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                  Export PDF
                </button>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 shadow-float">
        <div className="overflow-x-auto rounded-2xl">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-dark-850">
              <tr>
                {visibleColumns.map((col, vi) => {
                  const isAction = actions && vi === visibleColumns.length - 1 && col.header === "Actions";
                  const isSortable = col.sortable && col.sortKey;
                  const isActive = isSortable && currentSortKey === col.sortKey;

                  return (
                    <th
                      key={vi}
                      className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${col.align === "right" ? "text-right" : "text-left"} ${col.className || ""} ${isSortable ? "cursor-pointer select-none hover:text-gray-900 dark:hover:text-slate-300" : ""}`}
                      onClick={isSortable && col.sortKey ? () => handleSort(col.sortKey!) : undefined}
                    >
                      <span className="inline-flex items-center gap-0.5">
                        {col.header}
                        {isSortable && <SortIcon direction={isActive ? currentSortDir ?? null : null} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-4 py-12 text-center">
                    {emptyIcon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-dark-850 text-slate-500">{emptyIcon}</div>}
                    <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={`even:bg-slate-50/50 dark:even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {visibleColumns.map((col, colIdx) => {
                      const isAction = actions && colIdx === visibleColumns.length - 1 && col.header === "Actions";
                      return (
                        <td
                          key={colIdx}
                          className={`px-4 py-3.5 ${col.align === "right" ? "text-right" : "text-left"} ${col.className || ""}`}
                        >
                          {isAction ? (
                            <ActionMenu actions={actions!} row={row} />
                          ) : (
                            col.accessor(row, rowIdx)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==================== Action Menu ====================

function ActionMenu<T>({ actions, row }: { actions: ActionItem<T>[]; row: T }) {
  const visibleActions = actions.filter((a) => !a.hidden || !a.hidden(row));
  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu
      trigger={
        <button
          className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
        >
          <svg className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      }
    >
      {visibleActions.map((action, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(row);
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-800 flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </DropdownMenu>
  );
}
