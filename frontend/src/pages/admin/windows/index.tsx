import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { validatePermit } from "@/utils/validation";
import { FilePlusIcon } from "@phosphor-icons/react";
import Table from "@/components/Table";
import FormButtons from "@/components/FormButtons";
import { parseNumericFilter } from "@/utils/filterOperators";

type WindowData = Record<string, unknown> & {
  id: string;
  header2: string;
  header3: string;
  header4: string;
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
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isEditable] = useState(true);

  // Add missing functions
  const handleCreate = () => {
    console.log("Create new item");
    // Implement create logic
  };

  const handleRefresh = () => {
    console.log("Refresh data");
    // Implement refresh logic
  };

  const handleMassDelete = (rows: string[]) => {
    console.log("Delete selected rows:", rows);
    // Implement mass delete logic
  };

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

  const headers: TableHeader[] = useMemo(
    () => [
      {
        label: "City",
        field: "header2",
        sortable: true,
        filter: true,
        filterType: "search",
        type: "text",
        showOnMobile: true,
        minWidth: "120px",
      },
      {
        label: "District",
        field: "header3",
        sortable: true,
        filter: true,
        filterType: "option",
        type: "select",
        showOnMobile: true,
        isMultiSelect: true,
        minWidth: "120px",
        options: [
          { value: "Ciwidey", label: "Ciwidey" },
          { value: "Gubeng", label: "Gubeng" },
          { value: "Jakarta Selatan", label: "Jakarta Selatan" },
          { value: "Denpasar", label: "Denpasar" },
          { value: "Medan Timur", label: "Medan Timur" },
          { value: "Semarang Utara", label: "Semarang Utara" },
          { value: "Sleman", label: "Sleman" },
          { value: "Mariso", label: "Mariso" },
          { value: "Ilir Barat", label: "Ilir Barat" },
          { value: "Tanjung Karang", label: "Tanjung Karang" },
          { value: "Marpoyan Damai", label: "Marpoyan Damai" },
          { value: "Batu Aji", label: "Batu Aji" },
          { value: "Pontianak Kota", label: "Pontianak Kota" },
          { value: "Samarinda Ulu", label: "Samarinda Ulu" },
          { value: "Wenang", label: "Wenang" },
          { value: "Padang Utara", label: "Padang Utara" },
          { value: "Banjarmasin Utara", label: "Banjarmasin Utara" },
          { value: "Klojen", label: "Klojen" },
          { value: "Pasar Kliwon", label: "Pasar Kliwon" },
          { value: "Bogor Barat", label: "Bogor Barat" },
        ],
      },
      {
        label: "Color",
        field: "header4",
        sortable: true,
        filter: true,
        filterType: "search",
        type: "text",
        showOnMobile: true,
        minWidth: "120px",
      },
    ],
    []
  );

  const data: WindowData[] = useMemo(
    () => [
      {
        id: "1",
        header2: "Bandung",
        header3: "Ciwidey",
        header4: "Hejo",
      },
      {
        id: "2",
        header2: "Surabaya",
        header3: "Gubeng",
        header4: "Bodas",
      },
      {
        id: "3",
        header2: "Jakarta",
        header3: "Jakarta Selatan",
        header4: "Biru",
      },
      {
        id: "4",
        header2: "Bali",
        header3: "Denpasar",
        header4: "Beureum",
      },
      {
        id: "5",
        header2: "Medan",
        header3: "Medan Timur",
        header4: "Kuning",
      },
      {
        id: "6",
        header2: "Semarang",
        header3: "Semarang Utara",
        header4: "Hijau",
      },
      {
        id: "7",
        header2: "Yogyakarta",
        header3: "Sleman",
        header4: "Merah",
      },
      {
        id: "8",
        header2: "Makassar",
        header3: "Mariso",
        header4: "Ungu",
      },
      {
        id: "9",
        header2: "Palembang",
        header3: "Ilir Barat",
        header4: "Orange",
      },
      {
        id: "10",
        header2: "Bandar Lampung",
        header3: "Tanjung Karang",
        header4: "Pink",
      },
      {
        id: "11",
        header2: "Pekanbaru",
        header3: "Marpoyan Damai",
        header4: "Coklat",
      },
      {
        id: "12",
        header2: "Batam",
        header3: "Batu Aji",
        header4: "Abu-abu",
      },
      {
        id: "13",
        header2: "Pontianak",
        header3: "Pontianak Kota",
        header4: "Emas",
      },
      {
        id: "14",
        header2: "Samarinda",
        header3: "Samarinda Ulu",
        header4: "Perak",
      },
      {
        id: "15",
        header2: "Manado",
        header3: "Wenang",
        header4: "Biru Muda",
      },
      {
        id: "16",
        header2: "Padang",
        header3: "Padang Utara",
        header4: "Hijau Muda",
      },
      {
        id: "17",
        header2: "Banjarmasin",
        header3: "Banjarmasin Utara",
        header4: "Merah Muda",
      },
      {
        id: "18",
        header2: "Malang",
        header3: "Klojen",
        header4: "Ungu Muda",
      },
      {
        id: "19",
        header2: "Solo",
        header3: "Pasar Kliwon",
        header4: "Orange Muda",
      },
      {
        id: "20",
        header2: "Bogor",
        header3: "Bogor Barat",
        header4: "Pink Muda",
      },
    ],
    []
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
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="pt-6 px-8 pb-14 min-h-[calc(100vh-64px)] md:py-6">
      <div className="text-secondary-600 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors w-fit">
          <FilePlusIcon size={20} />
          Add New
        </button>
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
        onDetail={(row) => {
          console.log(`Detail clicked on row:`, row);
          return false;
        }}
        filters={filters}
        setFilters={setFilters}
        handleResetFilters={handleResetFilters}
        filteredData={filteredData}
        itemsPerPage={10}
        isCheckboxEnabled={true}
        onSelectionChange={setSelectedRows}
        isSortEnabled={true}
        isMultiSortEnabled={false}
        defaultSorts={[{ field: "header2", order: "asc", priority: 0 }]}
        renderRow={(row) => {
          // Render table cells for each header
          return (
            <>
              {headers.map((header) => (
                <td
                  key={header.field}
                  className="py-3 px-4 text-xs text-gray-500"
                >
                  {String(row[header.field])}
                </td>
              ))}
            </>
          );
        }}
      />
    </div>
  );
}
