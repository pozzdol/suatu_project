import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import Table, { type HeaderType } from "@/components/Table";
import FormButtons from "@/components/FormButtons";
import { parseNumericFilter } from "@/utils/filterOperators";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { Modal, InputNumber, Select } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

type RawMaterialUsageData = Record<string, unknown> & {
  id: string;
  orderId?: string;
  nameOrder?: string;
  orderItemId?: string;
  productId?: string;
  productName: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantityUsed: number;
  unit: string;
  workOrder?: {
    id: string;
    workOrderNumber: string;
    status: string;
  };
  created_at: string;
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

function RawMaterialUsageIndexPage() {
  // PAGE LOAD
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "078e840cc86e4074954c123f87ad08b4"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
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

  useDocumentTitle(title || "Raw Material Usage");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [data, setData] = useState<RawMaterialUsageData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Dropdown data
  const [orders, setOrders] = useState<{ label: string; value: string }[]>([]);
  const [products, setProducts] = useState<{ label: string; value: string }[]>(
    []
  );
  const [rawMaterials, setRawMaterials] = useState<
    { label: string; value: string; unit?: string }[]
  >([]);

  // Modal state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    order_id: "",
    product_id: "",
    raw_material_id: "",
    quantity_used: 0,
  });
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get(
        "/transactions/raw-material-usage/list"
      );
      if (response && response.data.success) {
        setData(response.data.data.rawMaterialUsages);
      } else {
        toast.error("Failed to fetch raw material usage data");
      }
    } catch (error) {
      console.error("Failed to fetch raw material usage data:", error);
      toast.error("Failed to fetch raw material usage data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await requestApi.get("/transactions/work-orders/list");
      if (response && response.data.success) {
        const orderList = response.data.data.workOrders.map((order: any) => ({
          label: `${order.noSurat} - ${order.orderName}`,
          value: order.orderId,
        }));
        setOrders(orderList);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await requestApi.get("/general/setup/products/list");
      if (response && response.data.success) {
        const productList = response.data.data.products.map((product: any) => ({
          label: product.name,
          value: product.id,
        }));
        setProducts(productList);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await requestApi.get(
        "/general/setup/raw-materials/list"
      );
      if (response && response.data.success) {
        const materials = response.data.data.rawMaterials.map(
          (material: any) => ({
            label: material.name,
            value: material.id,
            unit: material.unit || "pcs",
          })
        );
        setRawMaterials(materials);
      }
    } catch (error) {
      console.error("Failed to fetch raw materials:", error);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchData();
      fetchOrders();
      fetchProducts();
      fetchRawMaterials();
    }
  }, [permit]);
  // EFFECTS END

  // FUNCTIONS
  const handleCreate = () => {
    if (!isEditable) {
      toast.error("You don't have permission to create records");
      return;
    }
    setEditingId(null);
    setFormData({
      order_id: "",
      product_id: "",
      raw_material_id: "",
      quantity_used: 0,
    });
    setFormModalVisible(true);
  };

  const handleEdit = (row: RawMaterialUsageData) => {
    setEditingId(row.id);
    setFormData({
      order_id: row.orderId || "",
      product_id: row.productId || "",
      raw_material_id: row.rawMaterialId || "",
      quantity_used:
        typeof row.quantityUsed === "number"
          ? row.quantityUsed
          : parseFloat(String(row.quantityUsed)) || 0,
    });
    setFormModalVisible(true);
  };

  const handleFormCancel = () => {
    if (!formSubmitting) {
      setFormModalVisible(false);
      setEditingId(null);
      setFormData({
        order_id: "",
        product_id: "",
        raw_material_id: "",
        quantity_used: 0,
      });
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.raw_material_id) {
      toast.error("Raw material is required");
      return;
    }

    if (!formData.quantity_used || formData.quantity_used <= 0) {
      toast.error("Quantity used must be greater than 0");
      return;
    }

    if (!isEditable) {
      toast.error("You don't have permission to submit the form");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        order_id: formData.order_id || null,
        product_id: formData.product_id || null,
        raw_material_id: formData.raw_material_id,
        quantity_used: formData.quantity_used,
      };

      if (editingId) {
        // Update
        const response = await requestApi.put(
          `/transactions/raw-material-usage/edit/${editingId}`,
          payload
        );
        if (response && response.data.success) {
          toast.success("Raw material usage updated successfully");
          fetchData();
          setFormModalVisible(false);
          setEditingId(null);
          setFormData({
            order_id: "",
            product_id: "",
            raw_material_id: "",
            quantity_used: 0,
          });
        } else {
          toast.error("Failed to update raw material usage");
        }
      } else {
        // Create
        const response = await requestApi.post(
          "/transactions/raw-material-usage",
          payload
        );
        if (response && response.data.success) {
          toast.success("Raw material usage created successfully");
          fetchData();
          setFormModalVisible(false);
          setFormData({
            order_id: "",
            product_id: "",
            raw_material_id: "",
            quantity_used: 0,
          });
        } else {
          toast.error("Failed to create raw material usage");
        }
      }
    } catch (error) {
      toast.error(
        editingId
          ? "Failed to update raw material usage"
          : "Failed to create raw material usage"
      );
      console.error("Form error:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleDetail = (row: RawMaterialUsageData) => {
    handleEdit(row);
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
        "/transactions/raw-material-usage/mass-delete",
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

  const getSelectedMaterialUnit = () => {
    const material = rawMaterials.find(
      (m) => m.value === formData.raw_material_id
    );
    return material?.unit || "pcs";
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
        label: "Product",
        field: "productName",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Order Info",
        field: "nameOrder",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Raw Material",
        field: "rawMaterialName",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Quantity Used",
        field: "quantityUsed",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
        isNumeric: true,
      },
      {
        label: "Unit",
        field: "unit",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Date",
        field: "created_at",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
    ],
    []
  );

  const initialFilters = headers.reduce(
    (acc, header) => ({
      ...acc,
      [header.field]: "",
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

  const filteredData = useMemo(() => {
    const source = data;
    return (
      source?.filter((item: RawMaterialUsageData) => {
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
            return String(itemValue ?? "")
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          }

          return true;
        });
      }) || []
    );
  }, [data, filters, headers]);

  // PAGE LOAD RENDER
  if (loading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }
  // PAGE LOAD RENDER END

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
        fileName="raw_material_usage_data"
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
        defaultSorts={[{ field: "created_at", order: "desc", priority: 0 }]}
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
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.productName || "-"}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.nameOrder && row.workOrder?.workOrderNumber
                  ? `${row.nameOrder} - ${row.workOrder.workOrderNumber}`
                  : row.nameOrder || row.workOrder?.workOrderNumber || "-"}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.rawMaterialName}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300 text-right">
                {parseFloat(String(row.quantityUsed)).toFixed(2)}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.unit || "pcs"}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {dayjs(row.created_at).format("DD MMM YYYY - HH:mm")}
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
                  The selected raw material usage records will be permanently
                  removed from the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* -- DELETE MODAL END -- */}

      {/* FORM MODAL */}
      <Modal
        title={
          <div className="text-lg font-semibold text-gray-900">
            {editingId ? "Edit Raw Material Usage" : "Add Raw Material Usage"}
          </div>
        }
        open={formModalVisible}
        onOk={handleFormSubmit}
        onCancel={handleFormCancel}
        okText={editingId ? "Update" : "Create"}
        cancelText="Cancel"
        okButtonProps={{
          loading: formSubmitting,
          size: "large",
          className: `font-semibold min-w-[120px] h-11 rounded-lg text-white shadow-sm hover:shadow-md transition-all duration-200`,
        }}
        cancelButtonProps={{
          size: "large",
          disabled: formSubmitting,
          className:
            "font-semibold min-w-[120px] h-11 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 transition-all duration-200",
        }}
        closable={!formSubmitting}
        maskClosable={!formSubmitting}
        width={520}
        centered
        className="apple-modal"
        styles={{
          body: { padding: "32px" },
          header: {
            padding: "28px 32px 20px 32px",
            borderBottom: "none",
            marginBottom: 0,
          },
          footer: {
            padding: "20px 32px 28px 32px",
            borderTop: "1px solid rgba(0,0,0,0.05)",
            marginTop: "24px",
          },
          content: {
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          },
        }}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Order <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <Select
                placeholder="Select order"
                value={formData.order_id || undefined}
                onChange={(value) =>
                  setFormData({ ...formData, order_id: value })
                }
                disabled={formSubmitting}
                options={orders}
                className="w-full"
                size="large"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Link this usage to a specific order (optional)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Product <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <Select
                placeholder="Select product"
                value={formData.product_id || undefined}
                onChange={(value) =>
                  setFormData({ ...formData, product_id: value })
                }
                disabled={formSubmitting}
                options={products}
                className="w-full"
                size="large"
                allowClear
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Link this usage to a specific product (optional)
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Raw Material <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Select
                placeholder="Select raw material"
                value={formData.raw_material_id || undefined}
                onChange={(value) =>
                  setFormData({ ...formData, raw_material_id: value })
                }
                disabled={formSubmitting}
                options={rawMaterials}
                className="w-full"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select the raw material that was used
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Quantity Used <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <InputNumber
                placeholder="0.00"
                value={formData.quantity_used}
                onChange={(value) =>
                  setFormData({ ...formData, quantity_used: value || 0 })
                }
                disabled={formSubmitting}
                size="large"
                className="text-gray-900! w-full!"
                min={0.01}
                step={0.01}
                precision={2}
                addonAfter={getSelectedMaterialUnit()}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Amount of raw material consumed (minimum 0.01)
            </p>
          </div>
        </div>
      </Modal>
      {/* -- FORM MODAL END -- */}
    </div>
  );
}

export default RawMaterialUsageIndexPage;
