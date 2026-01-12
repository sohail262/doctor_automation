import { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import {
    ChevronUp,
    ChevronDown,
    ChevronsLeft,
    ChevronsRight,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react';

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    searchPlaceholder?: string;
    searchColumn?: string;
    pageSize?: number;
    loading?: boolean;
    onRowClick?: (row: T) => void;
    selectedRows?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

function DataTable<T extends { id: string }>({
    data,
    columns,
    searchPlaceholder = 'Search...',
    searchColumn,
    pageSize = 10,
    loading = false,
    onRowClick,
    selectedRows = [],
    onSelectionChange,
}: DataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            rowSelection,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    if (loading) {
        return (
            <div className="table-container">
                <div className="animate-pulse">
                    <div className="h-12 bg-dark-800 border-b border-dark-700"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-dark-900 border-b border-dark-800"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={16} />
                    <input
                        type="text"
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="input pl-9 w-full"
                    />
                </div>
                <div className="text-sm text-dark-400">
                    {table.getFilteredRowModel().rows.length} results
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                                    >
                                        <div className="flex items-center space-x-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() ? (
                                                header.column.getIsSorted() === 'asc' ? (
                                                    <ChevronUp size={14} />
                                                ) : (
                                                    <ChevronDown size={14} />
                                                )
                                            ) : null}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-dark-800">
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick?.(row.original)}
                                className={onRowClick ? 'cursor-pointer' : ''}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-dark-400">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        className="btn-ghost btn-sm"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="btn-ghost btn-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="btn-ghost btn-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        className="btn-ghost btn-sm"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DataTable;