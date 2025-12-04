import React, { useEffect } from "react";
import axios from "axios";
import { useState, useMemo } from "react";
import {
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  FunnelIcon,
} from "@phosphor-icons/react";
import { Input, Select, Checkbox } from "antd";

export type HeaderType = "text" | "select" | "dynamicSelect";
export type SortOrder = "asc" | "desc" | "none";

type FilterValue = string | string[] | CombinedFilter;

interface TableProps {
  isLoading?: boolean;
  headers: {
    label: string;
    field: string;
    type?: HeaderType;
    options?: { value: string; label: string }[];
    endpoint?: {
      rkd: string;
      type: string;
      responseKey: string;
    };
    showOnMobile?: boolean;
    isMultiSelect?: boolean;
    allowTextInput?: boolean;
    minWidth?: string;
    maxWidth?: string;
    width?: string;
    isNumeric?: boolean;
    sticky?: "left" | "right" | false; // Add sticky support
    stickyPosition?: number; // For ordering sticky columns
  }[];
  data: any[];
  onDetail: (item: any) => void;
  isEditable?: boolean;
  isDoubleClickEnabled?: boolean;
  isCheckboxEnabled?: boolean;
  isSortEnabled?: boolean;
  defaultSortField?: string;
  defaultSortOrder?: SortOrder;
  isMultiSortEnabled?: boolean;
  defaultSorts?: SortState[];
  setSelectedRows?: (rows: string[]) => void;
  filters: {
    [key: string]: FilterValue;
  };
  setFilters: React.Dispatch<
    React.SetStateAction<{
      [key: string]: FilterValue;
    }>
  >;
  handleResetFilters: () => void;
  filteredData: any[];
  onSelectionChange?: (selectedIds: string[]) => void;
  renderRow: (item: any, index: number) => React.ReactNode;
  isTotalEnabled?: boolean;
  itemsPerPage?: number;
  // New props for state persistence
  persistState?: boolean;
  tableKey?: string;
}

interface CombinedFilter {
  selected: string[];
  searchText: string;
}

interface SortState {
  field: string;
  order: SortOrder;
  priority: number;
}

// interface TableState {
//   currentPage: number;
//   selectedRows: string[];
//   sorts: SortState[];
//   itemsPerPage: number;
// }

const Table = ({
  headers,
  isLoading = false,
  onDetail,
  isEditable = true,
  isDoubleClickEnabled = true,
  isCheckboxEnabled = true,
  isSortEnabled = false,
  isMultiSortEnabled = false,
  isTotalEnabled = true,
  defaultSorts = [],
  filters,
  setFilters,
  handleResetFilters,
  filteredData,
  onSelectionChange,
  renderRow,
  itemsPerPage = 10,
  persistState = true,
  tableKey = "default",
}: TableProps) => {
  // sticky columns logic
  const calculateStickyPosition = (
    headers: any[],
    currentIndex: number,
    direction: "left" | "right"
  ) => {
    let position = 0;

    if (direction === "left") {
      for (let i = 0; i < currentIndex; i++) {
        if (headers[i].sticky === "left") {
          const width = parseInt(
            headers[i].width || headers[i].minWidth || "120px"
          );
          position += width;
        }
      }
    } else {
      for (let i = headers.length - 1; i > currentIndex; i--) {
        if (headers[i].sticky === "right") {
          const width = parseInt(
            headers[i].width || headers[i].minWidth || "120px"
          );
          position += width;
        }
      }
    }

    return position;
  };

  const getStickyStyles = (
    header: any,
    index: number,
    headers: any[],
    isCheckboxEnabled: boolean
  ) => {
    if (!header.sticky) return {};

    let position = 0;

    if (header.sticky === "left") {
      // Calculate position from left
      position = calculateStickyPosition(headers, index, "left");

      // Only add checkbox width if checkbox is enabled
      if (isCheckboxEnabled) {
        position += 48; // checkbox column width
      }

      return {
        position: "sticky" as const,
        left: `${position}px`,
        zIndex: 10,
        backgroundColor: "white",
        boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
      };
    }

    if (header.sticky === "right") {
      position = calculateStickyPosition(headers, index, "right");

      return {
        position: "sticky" as const,
        right: `${position}px`,
        zIndex: 10,
        backgroundColor: "white",
        boxShadow: "-2px 0 4px rgba(0,0,0,0.1)",
      };
    }

    return {};
  };

  // State persistence utilities
  const getStorageKey = (key: string) => `table_${tableKey}_${key}`;

  const saveState = (key: string, value: any) => {
    if (persistState) {
      try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(value));
      } catch (error) {
        console.warn("Failed to save table state:", error);
      }
    }
  };

  const loadState = (key: string, defaultValue: any) => {
    if (!persistState) return defaultValue;
    try {
      const saved = localStorage.getItem(getStorageKey(key));
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn("Failed to load table state:", error);
      return defaultValue;
    }
  };

  // Initialize states with persistence
  const [selectedRows, setSelectedRows] = useState<string[]>(
    loadState("selectedRows", [])
  );
  const [currentPage, setCurrentPage] = useState(loadState("currentPage", 1));
  const [sorts, setSorts] = useState<SortState[]>(
    loadState("sorts", defaultSorts)
  );
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(
    loadState("itemsPerPage", itemsPerPage)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / currentItemsPerPage);
  const startIndex = (currentPage - 1) * currentItemsPerPage;
  const endIndex = startIndex + currentItemsPerPage;

  // Save state when values change
  useEffect(() => {
    saveState("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    saveState("selectedRows", selectedRows);
  }, [selectedRows]);

  useEffect(() => {
    saveState("sorts", sorts);
  }, [sorts]);

  useEffect(() => {
    saveState("itemsPerPage", currentItemsPerPage);
  }, [currentItemsPerPage]);

  // Update sort handler to handle multiple sorts
  const handleSort = (field: string, event: React.MouseEvent) => {
    if (!isSortEnabled) return;

    setSorts((prevSorts) => {
      const existingSort = prevSorts.find((s) => s.field === field);

      // If holding Command (Mac) or Ctrl (Windows) key, add to multi-sort
      if (isMultiSortEnabled && (event.metaKey || event.ctrlKey)) {
        if (!existingSort) {
          // Add new sort
          return [
            ...prevSorts,
            {
              field,
              order: "asc",
              priority: prevSorts.length,
            },
          ];
        }

        // Update existing sort in multi-sort
        if (existingSort.order === "asc") {
          return prevSorts.map((s) =>
            s.field === field ? { ...s, order: "desc" } : s
          );
        } else if (existingSort.order === "desc") {
          return prevSorts.filter((s) => s.field !== field);
        }
      }

      // Single sort behavior
      if (!existingSort) {
        return [
          {
            field,
            order: "asc",
            priority: 0,
          },
        ];
      }

      if (existingSort.order === "asc") {
        return [
          {
            field,
            order: "desc",
            priority: 0,
          },
        ];
      }

      return [];
    });
  };

  // Update sorted data logic to handle multiple sorts
  const sortedData = useMemo(() => {
    if (!isSortEnabled || sorts.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      // Sort by each criteria in priority order
      for (const sort of sorts) {
        const aValue = a[sort.field];
        const bValue = b[sort.field];

        if (typeof aValue === "number" && typeof bValue === "number") {
          const comparison =
            sort.order === "asc" ? aValue - bValue : bValue - aValue;
          if (comparison !== 0) return comparison;
        } else {
          const aString = String(aValue).toLowerCase();
          const bString = String(bValue).toLowerCase();
          const comparison =
            sort.order === "asc"
              ? aString.localeCompare(bString)
              : bString.localeCompare(aString);
          if (comparison !== 0) return comparison;
        }
      }
      return 0;
    });
  }, [filteredData, sorts]);

  const currentData = sortedData.slice(startIndex, endIndex);

  // Adjust current page if it's out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Don't reset selected rows to maintain state
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked
      ? filteredData.map((item: any) => item.id)
      : [];
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedRows, id]
      : selectedRows.filter((rowId) => rowId !== id);
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const [dynamicOptions, setDynamicOptions] = useState<{
    [key: string]: { value: string; label: string }[];
  }>({});

  useEffect(() => {
    const fetchDynamicOptions = async () => {
      const dynamicHeaders = headers.filter(
        (h) => h.type === "dynamicSelect" && h.endpoint
      );

      for (const header of dynamicHeaders) {
        if (!header.endpoint) continue;

        try {
          const response = await axios.post("/api/board", {
            rkd: header.endpoint.rkd,
            type: header.endpoint.type,
          });

          const options =
            response.data.object.board[header.endpoint.responseKey] || [];
          setDynamicOptions((prev) => ({
            ...prev,
            [header.field]: options,
          }));
        } catch (error) {
          console.error(`Error fetching options for ${header.field}:`, error);
        }
      }
    };

    fetchDynamicOptions();
  }, [headers]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  // Handle detail function with state preservation
  const handleDetail = (item: any) => {
    // Save current state before navigating
    saveState("currentPage", currentPage);
    saveState("selectedRows", selectedRows);
    saveState("sorts", sorts);
    saveState("itemsPerPage", currentItemsPerPage);
    onDetail(item); // Pass the full item instead of just item.id
  };

  // Items per page options
  const itemsPerPageOptions = [
    { value: 10, label: "10" },
    { value: 25, label: "25" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
  ];

  return (
    <div className="flex flex-col relative min-h-64">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      )}

      {/* Responsive wrapper */}
      <div
        className={`overflow-x-auto ${totalPages <= 1 ? "rounded-b-lg" : ""}`}
      >
        <div
          className="inline-block min-w-full align-middle"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#E5E7EB transparent",
          }}
        >
          <div className="">
            <table className="w-full relative min-w-max">
              <thead className="sticky top-0 z-20">
                <tr className="bg-white border-b border-gray-200">
                  {isCheckboxEnabled && (
                    <th
                      className="sticky top-0 bg-white text-gray-600 text-xs py-3 text-center px-4 w-12 min-w-12"
                      style={{
                        position: "sticky",
                        left: "0px",
                        zIndex: 15,
                        backgroundColor: "white",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      {/* Header checkbox will be in filter row */}
                    </th>
                  )}
                  {headers.map((header, headerIndex) => (
                    <th
                      key={header.field}
                      className={`
      sticky top-0 border-b border-gray-200 text-xs py-3 px-4 bg-white text-gray-900 font-medium text-left
      ${!header.showOnMobile ? "hidden lg:table-cell" : ""}
      ${isSortEnabled ? "cursor-pointer select-none hover:bg-background" : ""}
    `}
                      style={{
                        minWidth: header.minWidth || "120px",
                        maxWidth: header.maxWidth || "none",
                        width: header.width || "auto",
                        ...getStickyStyles(
                          header,
                          headerIndex, // Use headerIndex instead of index
                          headers,
                          isCheckboxEnabled
                        ),
                        top: "0px", // Ensure it stays at top
                      }}
                      onClick={(e) =>
                        isSortEnabled && handleSort(header.field, e)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="truncate">{header.label}</span>
                          {isSortEnabled &&
                            sorts.find((s) => s.field === header.field) && (
                              <span className="text-[10px] bg-gray-600 text-white rounded px-1">
                                {sorts.findIndex(
                                  (s) => s.field === header.field
                                ) + 1}
                              </span>
                            )}
                        </div>
                        {isSortEnabled && (
                          <div className="flex flex-col ml-2">
                            {(() => {
                              const currentSort = sorts.find(
                                (s) => s.field === header.field
                              );
                              if (currentSort) {
                                return currentSort.order === "asc" ? (
                                  <CaretUpIcon
                                    weight="duotone"
                                    className="w-4 h-4 text-gray-600"
                                  />
                                ) : (
                                  <CaretDownIcon
                                    weight="duotone"
                                    className="w-4 h-4 text-gray-600"
                                  />
                                );
                              }
                              return (
                                <div className="w-4 h-4 opacity-30">
                                  <CaretUpIcon
                                    weight="duotone"
                                    className="w-3 h-3 -mb-1"
                                  />
                                  <CaretDownIcon
                                    weight="duotone"
                                    className="w-3 h-3"
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>

                {/* Filter row */}
                <tr className="relative bg-gray-50 border-b border-gray-200">
                  {isCheckboxEnabled && (
                    <th
                      className="sticky top-[41px] bg-gray-50 py-2 px-4"
                      style={{
                        position: "sticky",
                        left: "0px",
                        zIndex: 15,
                        backgroundColor: "#f9fafb",
                        boxShadow: "2px 0 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <div className="flex justify-center items-center">
                        <Checkbox
                          checked={
                            filteredData.length > 0 &&
                            selectedRows.length === filteredData.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </div>
                    </th>
                  )}
                  {headers.map((header, headerIndex) => (
                    <th
                      key={header.field}
                      className={`
          sticky top-[41px] bg-gray-50 py-2 px-4 relative
          ${!header.showOnMobile ? "hidden lg:table-cell" : ""}
        `}
                      style={{
                        ...getStickyStyles(
                          header,
                          headerIndex,
                          headers,
                          isCheckboxEnabled
                        ),
                        top: "41px", // Position below the main header
                        backgroundColor: header.sticky ? "#f9fafb" : "#f9fafb",
                      }}
                    >
                      {header.type === "select" ||
                      header.type === "dynamicSelect" ? (
                        <Select
                          // mode multiple kalau header.isMultiSelect = true
                          mode={header.isMultiSelect ? "multiple" : undefined}
                          allowClear
                          showSearch
                          dropdownMatchSelectWidth={false}
                          getPopupContainer={() => document.body}
                          suffixIcon={
                            <CaretDownIcon
                              className="h-3 w-3"
                              weight="duotone"
                            />
                          }
                          className="w-full text-xs"
                          placeholder=""
                          // ====== OPTIONS ======
                          options={(
                            header.options ||
                            dynamicOptions[header.field] ||
                            []
                          ).map((opt) => ({
                            value: opt.value,
                            label: opt.label,
                          }))}
                          // ====== VALUE ======
                          value={
                            header.isMultiSelect
                              ? // untuk multiple: array string
                                ((filters[header.field] as CombinedFilter)
                                  ?.selected as string[]) || []
                              : // untuk single: string | undefined
                                (filters[header.field] as string) || undefined
                          }
                          // ====== CHANGE HANDLER ======
                          onChange={(value) => {
                            if (header.isMultiSelect) {
                              setFilters({
                                ...filters,
                                [header.field]: {
                                  ...(((filters[
                                    header.field
                                  ] as CombinedFilter) ||
                                    {}) as CombinedFilter),
                                  selected: (value as string[]) || [],
                                },
                              });
                            } else {
                              setFilters({
                                ...filters,
                                [header.field]: (value as string) ?? "",
                              });
                            }
                          }}
                          // ====== SEARCH ======
                          // Simpan teks pencarian (dipakai logika filter Anda di index.tsx)
                          onSearch={(input) => {
                            if (header.isMultiSelect) {
                              setFilters({
                                ...filters,
                                [header.field]: {
                                  ...(((filters[
                                    header.field
                                  ] as CombinedFilter) ||
                                    {}) as CombinedFilter),
                                  searchText: input,
                                  selected:
                                    ((filters[header.field] as CombinedFilter)
                                      ?.selected as string[]) || [],
                                },
                              });
                            }
                          }}
                          // Filter opsi di dropdown (mendukung multi kata)
                          filterOption={(input, option) => {
                            if (!input) return true;
                            const terms = input
                              .toLowerCase()
                              .split(" ")
                              .filter(Boolean);
                            const val = String(
                              option?.value ?? ""
                            ).toLowerCase();
                            const lab =
                              typeof option?.label === "string"
                                ? option.label.toLowerCase()
                                : val;
                            return terms.every(
                              (t) => val.includes(t) || lab.includes(t)
                            );
                          }}
                          // Custom dropdown render untuk menampilkan checkbox
                          optionRender={
                            header.isMultiSelect
                              ? (option) => {
                                  const isSelected = (
                                    (filters[header.field] as CombinedFilter)
                                      ?.selected || []
                                  ).includes(String(option.value));
                                  return (
                                    <div className="flex items-center gap-2 px-2 py-1">
                                      <Checkbox
                                        checked={isSelected}
                                        style={{ pointerEvents: "none" }}
                                      />
                                      <span>{option.label}</span>
                                    </div>
                                  );
                                }
                              : undefined
                          }
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder=""
                          value={
                            typeof filters[header.field] === "string"
                              ? (filters[header.field] as string)
                              : ""
                          }
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              [header.field]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
                        />
                      )}
                      {headerIndex === headers.length - 1 && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <button
                            onClick={handleResetFilters}
                            className="hover:text-gray-600 cursor-pointer p-1 rounded"
                            title="Reset filters"
                          >
                            <FunnelIcon weight="duotone" className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {currentData.map((item: any, index: number) => (
                  <tr
                    key={item.id}
                    className={`
                      transition-colors duration-150 ease-in-out border-b border-gray-100
                      ${!isEditable ? "cursor-default" : "cursor-pointer"}
                      ${
                        selectedRows.includes(item.id)
                          ? "bg-gray-100"
                          : "bg-white hover:bg-gray-50"
                      }
                    `}
                    onClick={() => {
                      const newSelection = selectedRows.includes(item.id)
                        ? []
                        : [item.id];
                      setSelectedRows(newSelection);
                      onSelectionChange?.(newSelection);
                    }}
                    onDoubleClick={
                      () =>
                        isEditable && isDoubleClickEnabled && handleDetail(item) // Pass full item
                    }
                  >
                    {isCheckboxEnabled && (
                      <td className="py-3 px-4 text-xs text-gray-500">
                        <div className="flex justify-center items-center">
                          <Checkbox
                            checked={selectedRows.includes(item.id)}
                            onChange={(e) => {
                              handleSelectRow(item.id, e.target.checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </td>
                    )}
                    {renderRow(item, index)}
                  </tr>
                ))}
              </tbody>

              {isTotalEnabled && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr className="bg-gray-100 font-medium border-t border-gray-300">
                    {isCheckboxEnabled && (
                      <td className="py-3 px-4 text-xs text-gray-600"></td>
                    )}
                    {headers.map((header, index) => (
                      <td
                        key={`total-${header.field}`}
                        className={`
                          py-3 px-4 text-xs text-gray-600
                          ${index === 0 ? "text-left" : "text-right"}
                        `}
                        style={{
                          minWidth: header.minWidth || "120px",
                          maxWidth: header.maxWidth || "none",
                          width: header.width || "auto",
                        }}
                      >
                        {index === 0
                          ? "Total"
                          : header.isNumeric
                          ? formatNumber(
                              filteredData.reduce(
                                (sum, item) =>
                                  sum + (Number(item[header.field]) || 0),
                                0
                              )
                            )
                          : ""}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Pagination UI - Enhanced */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredData.length)} of {filteredData.length}{" "}
              entries
            </span>

            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs">Show:</span>
              <Select
                size="small"
                showSearch={false}
                dropdownMatchSelectWidth={false}
                getPopupContainer={() => document.body}
                className="text-xs"
                value={currentItemsPerPage} // antd butuh nilai primitif
                onChange={(val) => {
                  setCurrentItemsPerPage(val as number);
                  setCurrentPage(1);
                }}
                options={itemsPerPageOptions} // [{ label: string, value: number }]
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-secondary-700">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-background disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <CaretDoubleLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-background disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <CaretLeftIcon className="w-4 h-4" />
            </button>

            {/* Dynamic page buttons with ellipsis */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (page >= currentPage - 1 && page <= currentPage + 1)
                  return true;
                return false;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[2.5rem] h-10 px-3 rounded-md text-sm transition-colors ${
                      currentPage === page
                        ? "bg-secondary-700 text-white"
                        : "hover:bg-background text-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-background disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <CaretRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-background disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <CaretDoubleRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
