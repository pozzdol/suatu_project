import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import Table, { type HeaderType } from "@/components/Table";
import FormButtons from "@/components/FormButtons";
import { parseNumericFilter } from "@/utils/filterOperators";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
};

type OrderData = Record<string, unknown> & {
  id: string;
  name: string;
  nopo: string;
  phone: string;
  address: string;
  status: string;
  orderItems: OrderItem[];
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

function OrdersIndexPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "ec07a1e31a4a4fc88a73246d73b6b30b"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          setIndexUrl(pageData.data.page.url);
          setPermit(pageData.data.permit.permission);
          setIsEditable(pageData.data.permit.isEditable);
        } else {
          setPermit(false);
          toast.error("You don't have permission to access this page");
        }
      } catch (error) {
        setPermit(false);
        toast.error("Failed to validate permissions");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  useDocumentTitle(title || "Orders");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [data, setData] = useState<OrderData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/transactions/orders/list");
      if (response && response.data.success) {
        setData(response.data.data.orders);
      } else {
        toast.error("Failed to fetch order data");
      }
    } catch (error) {
      console.error("Failed to fetch order data:", error);
      toast.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchData();
    }
  }, [permit]);
  // EFFECTS END

  // HELPERS
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
      confirm: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Confirmed",
      },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };
  // HELPERS END

  // FUNCTIONS
  const handleCreate = () => {
    navigate(`${indexUrl}/create`);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleDetail = (row: OrderData) => {
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

    setPendingDeleteIds(selectedIds);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);

    try {
      const response = await requestApi.post(
        "/transactions/orders/mass-delete",
        {
          ids: pendingDeleteIds,
        }
      );

      if (response.data.success) {
        toast.success(
          `Successfully deleted ${pendingDeleteIds.length} record(s)`
        );
        setSelectedRows([]);
        fetchData();
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
  // FUNCTIONS END

  // TABLE HEADERS
  const headers: TableHeader[] = useMemo(
    () => [
      {
        label: "",
        field: "id",
        type: "text" as HeaderType,
        width: "8px",
        minWidth: "8px",
        maxWidth: "8px",
        exportable: false,
        showOnMobile: true,
      },
      {
        label: "Customer",
        field: "name",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Order Date",
        field: "date_confirm",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "No. PO",
        field: "nopo",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Products",
        field: "orderItems",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Status",
        field: "status",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
    ],
    []
  );

  type FilterValue = string | string[] | CombinedFilter;
  type FilterType = {
    [key: string]: FilterValue;
  };

  interface CombinedFilter {
    selected: string[];
    searchText: string;
  }

  const initialFilters = headers.reduce(
    (acc, header) => ({
      ...acc,
      [header.field]: "",
    }),
    {} as FilterType
  );

  const [filters, setFilters] = useState<FilterType>(initialFilters);

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const filteredData = useMemo(() => {
    const source = data;
    return (
      source?.filter((item: OrderData) => {
        return headers.every((header) => {
          const filterValue = filters[header.field];
          const itemValue = item[header.field] as unknown;

          if (!filterValue) return true;

          if (header.type === "text") {
            if (header.isNumeric) {
              if (typeof filterValue !== "string" || !filterValue) return true;
              const numericFilter = parseNumericFilter(filterValue);
              if (numericFilter) {
                const numValue = parseFloat(String(itemValue));
                return (
                  !isNaN(numValue) &&
                  numericFilter.operator(numValue, numericFilter.threshold)
                );
              }
            }

            // Special handling for orderItems search
            if (header.field === "orderItems") {
              const orderItems = item.orderItems || [];
              const searchTerm = String(filterValue).toLowerCase();
              return orderItems.some(
                (oi) =>
                  oi.productName?.toLowerCase().includes(searchTerm) ||
                  String(oi.quantity).includes(searchTerm)
              );
            }

            return String(itemValue ?? "")
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          }

          return true;
        });
      }) || []
    );
  }, [data, filters, headers]);
  // TABLE END

  // PAGE LOAD RENDER
  if (loading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }
  // PAGE LOAD RENDER END

  return (
    <div className="pt-6 px-8 pb-14 min-h-[calc(100vh-64px)] md:py-6">
      <div className="text-gray-500 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center mb-6">
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
        fileName="orders_data"
        disabled={!isEditable}
      />
      <Table
        isLoading={loading}
        headers={headers}
        data={data}
        isTotalEnabled={false}
        onDetail={isEditable ? handleDetail : () => {}}
        filters={filters}
        setFilters={setFilters}
        handleResetFilters={handleResetFilters}
        filteredData={filteredData}
        itemsPerPage={10}
        isCheckboxEnabled={true}
        onSelectionChange={setSelectedRows}
        isSortEnabled={true}
        isMultiSortEnabled={false}
        defaultSorts={[{ field: "date_confirm", order: "asc", priority: 0 }]}
        renderRow={(row) => {
          return (
            <>
              <td className="py-2 text-xs text-gray-500 border-b border-gray-300 w-4 max-w-4">
                <button
                  className="rounded flex justify-center items-center hover:text-gray-700 cursor-pointer p-1 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-auto"
                  onClick={() => handleDetail(row)}
                  disabled={!isEditable}
                >
                  📄
                </button>
              </td>
              <td className="py-2 px-4 text-xs text-gray-700 border-b border-gray-300">
                <div className="font-medium">{row.name}</div>
                {row.address && (
                  <div className="text-gray-400 text-[10px] truncate max-w-[200px]">
                    {row.address}
                  </div>
                )}
              </td>
              <td className="py-2 px-4 text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.date_confirm
                  ? dayjs(row.date_confirm).format("DD MMMM YYYY")
                  : "-"}
              </td>
              <td className="py-2 px-4 text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.nopo || "-"}
              </td>
              <td className="py-2 px-4 text-xs text-gray-500 border-b border-gray-300">
                {Array.isArray(row.orderItems) && row.orderItems.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {row.orderItems.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {item.productName} × {item.quantity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No products</span>
                )}
              </td>
              <td className="py-2 px-4 text-xs border-b border-gray-300">
                {getStatusBadge(row.status)}
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
              Delete Orders
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
              {pendingDeleteIds.length} order
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
                  The selected order records and their items will be permanently
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

export default OrdersIndexPage;
