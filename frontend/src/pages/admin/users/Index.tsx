import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { validatePermit } from "@/utils/validation";
import Table, { type HeaderType } from "@/components/Table";
import FormButtons from "@/components/FormButtons";
import { parseNumericFilter } from "@/utils/filterOperators";
import { useNavigate } from "react-router-dom";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import requestApi from "@/utils/api";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useDocumentTitle from "@/hooks/useDocumentTitle";

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

export default function AdminUserIndexPage() {
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
          "f246e11b2401428fb586e6fb49a2be96"
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

  useDocumentTitle(title || "User Management");
  // FETCH DATA
  const [data, setData] = useState<WindowData[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/general/setup/users/list");
      if (response && response.data.success) {
        setData(response.data.data.users);
      } else {
        toast.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error("Failed to fetch user data");
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
    fetchData();
  };

  const handleDetail = (row: WindowData) => {
    navigate(`${indexUrl}/${row.id}`);
  };

  const handleMassDelete = async (selectedIds: string[]) => {
    if (!isEditable) {
      toast.error("You don't have permission to delete records");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Please select records to delete");
      return;
    }

    // Set pending delete IDs and show modal
    setPendingDeleteIds(selectedIds);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      const response = await requestApi.post(
        "/general/setup/users/mass-delete",
        {
          ids: pendingDeleteIds,
        }
      );
      // console.log(response);

      if (response.data.success) {
        toast.success(
          `Successfully deleted ${pendingDeleteIds.length} record(s)`
        );
        setSelectedRows([]); // Clear selection
        fetchData(); // Refresh data
        setDeleteModalVisible(false);
        setPendingDeleteIds([]);
      } else {
        toast.error(response.data.message || "Failed to delete records");
      }
    } catch (error) {
      console.error("Failed to delete records:", error);
      toast.error("Failed to delete records");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleting) {
      setDeleteModalVisible(false);
      setPendingDeleteIds([]);
    }
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
        label: "Name",
        field: "name",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Email",
        field: "email",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Role",
        field: "role_name",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Employee ID",
        field: "employee_id",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Department",
        field: "department_id",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Organization",
        field: "organization_id",
        type: "text" as HeaderType,
        isNumeric: false,
        isMultiSelect: false,
        allowTextInput: false,
        showOnMobile: true,
        exportable: true,
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
          "refresh",
          "export",
          ...(selectedRows.length > 0 ? ["delete"] : []),
          ...(isEditable ? ["new"] : []),
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
                {row.email}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.role_name}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.employee_id}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.department_name}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.organization_name}
              </td>
            </>
          );
        }}
      />

      {/* DELETE MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <ExclamationCircleOutlined className="text-red-500 text-xl" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Delete Records
            </span>
          </div>
        }
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deleting,
          size: "large",
          className: "font-medium min-w-[100px] h-11 rounded-lg shadow-sm",
        }}
        cancelButtonProps={{
          size: "large",
          disabled: deleting,
          className:
            "font-medium min-w-[100px] h-11 rounded-lg border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-800",
        }}
        closable={!deleting}
        maskClosable={!deleting}
        width={520}
        centered
        className="apple-modal"
        styles={{
          body: { padding: "24px" },
          header: {
            padding: "24px 24px 16px 24px",
            borderBottom: "none",
            marginBottom: 0,
          },
          footer: {
            padding: "16px 24px 24px 24px",
            borderTop: "none",
            marginTop: 0,
          },
        }}
      >
        <div className="py-2">
          <p className="text-gray-700 mb-4 text-base leading-relaxed">
            Are you sure you want to delete{" "}
            <strong className="text-gray-900 font-semibold">
              {pendingDeleteIds.length} record
              {pendingDeleteIds.length > 1 ? "s" : ""}
            </strong>
            ?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <div>
                <p className="text-red-800 text-sm font-medium mb-1">
                  This action cannot be undone
                </p>
                <p className="text-red-700 text-sm leading-relaxed">
                  The selected mill test certificate records will be permanently
                  removed from the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* -- DELETE MODAL END -- */}
    </div>
  );
}
