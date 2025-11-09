import { use, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { validatePermit } from "@/utils/validation";
import { FilePlusIcon } from "@phosphor-icons/react";
import Table, { type HeaderType } from "@/components/Table";
import FormButtons from "@/components/FormButtons";
import { parseNumericFilter } from "@/utils/filterOperators";
import { useNavigate } from "react-router-dom";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import requestApi from "@/utils/api";

type WindowData = Record<string, unknown> & {
  id: string;
  name: string;
  url: string;
  data_isParent: boolean;
  access: string;
};

interface TableHeader {
  label: string;
  field: string;
  width?: string;
  sortable?: boolean;
  filter?: boolean;
  checkbox?: boolean;
  filterType?: "search" | "option";
  type?: "text" | "select" | "dynamicSelect";
  options?: { value: string; label: string }[];
  showOnMobile?: boolean;
  isMultiSelect?: boolean;
  allowTextInput?: boolean;
  minWidth?: string;
  maxWidth?: string;
  isNumeric?: boolean;
  sticky?: "left" | "right" | false;
  stickyPosition?: number;
}

export default function AdminWindowIndexPage() {
  const navigate = useNavigate();
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [indexUrl, setIndexUrl] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "evosd4d2d55a4faab5a082386def0bee"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          setIndexUrl(pageData.data.page.url);

          setPermit(pageData.data.permit.permission);
          setIsEditable(pageData.data.permit.isEditable);
          setIsAdmin(pageData.data.permit.isAdmin);
        } else {
          toast.error("You don't have permission to access this page");
        }
      } catch {
        toast.error("Failed to validate permissions");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // FETCH DATA
  const [data, setData] = useState<WindowData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/general/setup/windows/list");
      if (response && response.data.success) {
        setData(response.data.data.windows);
      } else {
        toast.error("Failed to fetch window data");
      }
    } catch (error) {
      console.error("Failed to fetch window data:", error);
      toast.error("Failed to fetch window data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permit) {
      fetchData();
    }
  }, [permit]);
  // FETCH DATA END

  // Add missing functions
  const handleCreate = () => {
    navigate(`${indexUrl}/create`);
  };

  const handleRefresh = () => {
    console.log("Refresh data");
    // Implement refresh logic
  };

  const handleDetail = (row: WindowData) => {
    navigate(`${indexUrl}/${row.id}`);
  };

  const handleMassDelete = (rows: string[]) => {
    console.log("Delete selected rows:", rows);
    // Implement mass delete logic
  };

  // TABLE HEADERS
  const getUniqueIsParent = (
    data: WindowData[]
  ): { value: string; label: string }[] => {
    if (!data) return [];

    const uniqueIsParent = Array.from(
      new Set(data.map((item) => item.data_isParent))
    )
      .sort()
      .map((item) => ({
        value: String(item),
        label: item ? "Yes" : "No",
      }));

    return [...uniqueIsParent];
  };

  const headers: TableHeader[] = useMemo(
    () => [
      {
        label: "",
        field: "id",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        width: "8px",
        minWidth: "8px",
        maxWidth: "8px",
        exportable: false,
        showOnMobile: true,
      },
      {
        label: "Window Name",
        field: "name",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Url",
        field: "url",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Is Parent",
        field: "data_isParent",
        type: "dynamicSelect" as HeaderType,
        options: getUniqueIsParent(data || []),
        showOnMobile: true,
        allowTextInput: true,
        isMultiSelect: true,
        exportable: true,
      },
      {
        label: "Access",
        field: "access",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
    ],
    [data]
  );

  const initialFilters = headers.reduce(
    (acc, header) => ({
      ...acc,
      [header.field]: header.isMultiSelect
        ? { selected: [], searchText: "" }
        : "",
    }),
    {} as FilterType
  );

  type FilterValue = string | string[] | CombinedFilter;
  type FilterType = {
    [key: string]: FilterValue;
  };

  interface CombinedFilter {
    selected: string[];
    searchText: string;
  }

  const [filters, setFilters] = useState<FilterType>(initialFilters);

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const source = data;
    return (
      source?.filter((item: WindowData) => {
        return headers.every((header) => {
          const filterValue = filters[header.field];
          const itemValue = item[header.field] as unknown;

          if (!filterValue) return true;

          switch (header.type) {
            case "dynamicSelect": {
              if (header.isMultiSelect) {
                const combinedFilter = filterValue as CombinedFilter;
                const { selected, searchText } = combinedFilter;

                // Check selected values
                if (selected?.length > 0) {
                  if (!selected.includes(String(itemValue))) return false;
                }

                // Check search text
                if (searchText) {
                  const searchTerms = searchText.toLowerCase().split(" ");
                  const itemString = String(itemValue).toLowerCase();
                  return searchTerms.every((term) => itemString.includes(term));
                }

                return true;
              }
              return (
                String(itemValue).toLowerCase() ===
                String(filterValue).toLowerCase()
              );
            }

            case "text": {
              if (header.isNumeric) {
                if (typeof filterValue !== "string" || !filterValue)
                  return true;
                const numericFilter = parseNumericFilter(filterValue);
                if (numericFilter) {
                  const numValue = parseFloat(String(itemValue));
                  return (
                    !isNaN(numValue) &&
                    numericFilter.operator(numValue, numericFilter.threshold)
                  );
                }
              }
              return String(itemValue ?? "")
                .toLowerCase()
                .includes(String(filterValue).toLowerCase());
            }

            case "select": {
              if (header.isMultiSelect) {
                const combinedFilter = filterValue as CombinedFilter;
                const { selected, searchText } = combinedFilter;

                const isSelectedMatch =
                  !selected ||
                  selected.length === 0 ||
                  selected.includes(String(itemValue));

                const isSearchMatch =
                  !searchText ||
                  String(itemValue)
                    .toLowerCase()
                    .includes(searchText.toLowerCase());

                if (selected?.length > 0) {
                  return isSelectedMatch;
                }

                return isSelectedMatch && isSearchMatch;
              }

              if (header.field === "isActive") {
                return String(Boolean(itemValue)) === filterValue;
              }
              return String(itemValue) === filterValue;
            }

            default:
              return true;
          }
        });
      }) || []
    );
  }, [data, filters, headers]);

  if (loading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }

  return (
    <div className="pt-6 px-8 pb-14 md:py-6">
      <div className="text-secondary-600 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <FormButtons
        activeButtons={[
          "new",
          "refresh",
          "export",
          ...(selectedRows.length > 0 ? ["delete"] : []),
        ]}
        onNew={handleCreate}
        onRefresh={handleRefresh}
        onDelete={() => handleMassDelete(selectedRows)}
        tableData={filteredData}
        tableHeaders={headers.map((h) => ({ label: h.label, field: h.field }))}
        fileName="window_data"
        disabled={!isEditable}
      />
      <Table
        isLoading={loading}
        headers={headers}
        data={data}
        isTotalEnabled={false}
        onDetail={handleDetail}
        filters={filters}
        setFilters={setFilters}
        handleResetFilters={handleResetFilters}
        filteredData={filteredData}
        itemsPerPage={5}
        isCheckboxEnabled={true}
        onSelectionChange={setSelectedRows}
        isSortEnabled={true}
        isMultiSortEnabled={false}
        defaultSorts={[{ field: "name", order: "asc", priority: 0 }]}
        renderRow={(row) => {
          // Render table cells for each header
          return (
            <>
              <td className="py-2 text-xs text-gray-500 border-b border-gray-300 w-4 max-w-4">
                <button
                  className="rounded flex justify-center items-center hover:text-gray-700 cursor-pointer p-1 hover:bg-gray-200"
                  onClick={() => handleDetail(row)}
                  disabled={!isEditable}
                >
                  📄
                </button>
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.name}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.url}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.data_isParent ? (
                  <div className="text-emerald-600">Yes</div>
                ) : (
                  <div className="text-rose-600">No</div>
                )}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.access}
              </td>
            </>
          );
        }}
      />
    </div>
  );
}
