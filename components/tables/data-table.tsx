"use client";

/* eslint-disable react-hooks/incompatible-library */

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Cari data...",
  searchValue,
  onSearchChange,
  toolbar,
  isLoading = false,
  emptyTitle = "Data tidak ditemukan",
  emptyDescription = "Coba ubah kata kunci pencarian atau tambahkan data baru.",
  tableClassName,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  toolbar?: React.ReactNode;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  tableClassName?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const globalFilter = searchValue ?? internalGlobalFilter;
  const setGlobalFilter = onSearchChange ?? setInternalGlobalFilter;
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="surface-ring flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-3.5 backdrop-blur md:flex-row md:items-center md:justify-between dark:border-slate-800/90 dark:bg-slate-950/76">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-10"
          />
        </div>
        {toolbar ? <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">{toolbar}</div> : null}
      </div>

      <div className="surface-ring overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white/90 dark:border-slate-800/90 dark:bg-slate-950/84">
        <div className="overflow-x-auto">
          <table className={cn("w-full min-w-[680px] text-sm", tableClassName)}>
            <thead className="bg-slate-50/85 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/90 dark:text-slate-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-4 font-semibold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`}>
                    {columns.map((column, columnIndex) => (
                      <td key={`${String(column.id ?? columnIndex)}-${rowIndex}`} className="px-5 py-4 align-middle">
                        <Skeleton className="h-5 w-full max-w-[12rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group odd:bg-white even:bg-slate-50/40 hover:bg-cyan-50/50 dark:odd:bg-slate-950/50 dark:even:bg-slate-900/55 dark:hover:bg-cyan-400/6"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-4 align-middle text-slate-700 dark:text-slate-200">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-6">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-slate-200/70 bg-white/72 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-950/70">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {table.getFilteredRowModel().rows.length} item - Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
          {table.getPageCount() || 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
