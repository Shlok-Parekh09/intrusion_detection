import { useState, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import './Table.css';

interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  sticky?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  showPagination?: boolean;
  virtualScroll?: boolean;
  virtualScrollHeight?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function Table<T>({
  data,
  columns,
  emptyMessage = 'No data available',
  emptyAction,
  pageSize = 20,
  showPagination = true,
  virtualScroll = false,
  className = '',
  onRowClick,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Virtual scroll setup
  const virtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Keep user on the same page during live updates, only clamp if out of bounds
  useEffect(() => {
    const maxPage = Math.ceil(data.length / pageSize);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    } else if (data.length === 0) {
      setCurrentPage(1);
    }
  }, [data.length, pageSize]);

  // Empty state
  if (sortedData.length === 0) {
    return (
      <div className={`table-container ${className}`}>
        <EmptyState
          variant="table"
          heading="No data available"
          description={emptyMessage}
          actionLabel={emptyAction ? 'Add Item' : undefined}
          onAction={emptyAction ? () => {} : undefined}
        />
        {emptyAction && <div className="table__empty-action">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className={`table-container ${className}`}>
      <div className="table-wrapper" ref={parentRef}>
        <table className="table">
          <thead className="table__header">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`
                    table__header-cell
                    ${col.sticky ? 'table__header-cell--sticky' : ''}
                    ${col.sortable ? 'table__header-cell--sortable' : ''}
                  `}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="table__header-content">
                    {col.header}
                    {col.sortable && (
                      <span className={`table__sort-icon ${sortConfig?.key === col.key ? 'table__sort-icon--active' : ''}`}>
                        {sortConfig?.key === col.key && sortConfig.direction === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="table__body">
            {virtualScroll ? (
              <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
                {virtualizer.getVirtualItems().map(virtualRow => {
                  const item = paginatedData[virtualRow.index];
                  const index = virtualRow.index;
                  return (
                    <tr
                      key={(item as any).id || virtualRow.key}
                      className={`table__row ${onRowClick ? 'table__row--clickable' : ''}`}
                      style={{
                        transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                      }}
                      onClick={() => onRowClick?.(item, index)}
                    >
                      {columns.map(col => (
                        <td
                          key={col.key}
                          className={`
                            table__cell
                            ${col.sticky ? 'table__cell--sticky' : ''}
                          `}
                          style={{ 
                            width: col.width,
                            minWidth: col.width,
                            left: col.sticky ? 0 : undefined,
                          }}
                        >
                          {col.render ? col.render(item, index) : String(item[col.key as keyof T])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={(item as any).id || index}
                  className={`table__row ${onRowClick ? 'table__row--clickable' : ''}`}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`
                        table__cell
                        ${col.sticky ? 'table__cell--sticky' : ''}
                      `}
                      style={{ 
                        width: col.width,
                        minWidth: col.width,
                        left: col.sticky ? 0 : undefined,
                      }}
                    >
                      {col.render ? col.render(item, index) : String(item[col.key as keyof T])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="table__pagination">
          <div className="table__pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </div>
          
          <div className="table__pagination-controls">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="First page"
            >
              <ChevronsLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </Button>
            
            <span className="table__pagination-current">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              <ChevronRight size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Last page"
            >
              <ChevronsRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
