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
import { Modal, Input, InputNumber } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

type RawMaterialData = Record<string, unknown> & {
  id: string;
  name: string;
  stock: number;
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

function RawMaterialIndexPage() {
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
          "d879eecc4b274471bbc06576688c84b2"
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

  useDocumentTitle(title || "Raw Material");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [data, setData] = useState<RawMaterialData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Modal state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", stock: 0 });
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get(
        "/general/setup/raw-materials/list"
      );
      if (response && response.data.success) {
        setData(response.data.data.rawMaterials);
      } else {
        toast.error("Failed to fetch raw material data");
      }
    } catch (error) {
      console.error("Failed to fetch raw material data:", error);
      toast.error("Failed to fetch raw material data");
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

  // FUNCTIONS
  const handleCreate = () => {
    if (!isEditable) {
      toast.error("You don't have permission to create records");
      return;
    }
    setEditingId(null);
    setFormData({ name: "", stock: 0 });
    setFormModalVisible(true);
  };

  const handleEdit = (row: RawMaterialData) => {
    setEditingId(row.id);
    setFormData({
      name: String(row.name),
      stock: typeof row.stock === "number" ? row.stock : 0,
    });
    setFormModalVisible(true);
  };

  const handleFormCancel = () => {
    if (!formSubmitting) {
      setFormModalVisible(false);
      setEditingId(null);
      setFormData({ name: "", stock: 0 });
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!isEditable) {
      toast.error("You don't have permission to submit the form");
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingId) {
        // Update
        const response = await requestApi.put(
          `/general/setup/raw-materials/edit/${editingId}`,
          formData
        );
        if (response && response.data.success) {
          toast.success("Raw material updated successfully");
          fetchData();
          setFormModalVisible(false);
          setEditingId(null);
          setFormData({ name: "", stock: 0 });
        } else {
          toast.error("Failed to update raw material");
        }
      } else {
        // Create
        const response = await requestApi.post(
          "/general/setup/raw-materials",
          formData
        );
        if (response && response.data.success) {
          toast.success("Raw material created successfully");
          fetchData();
          setFormModalVisible(false);
          setFormData({ name: "", stock: 0 });
        } else {
          toast.error("Failed to create raw material");
        }
      }
    } catch (error) {
      toast.error(
        editingId
          ? "Failed to update raw material"
          : "Failed to create raw material"
      );
      console.error("Form error:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleDetail = (row: RawMaterialData) => {
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
        "/general/setup/raw-materials/mass-delete",
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
        label: "Name",
        field: "name",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Stock",
        field: "stock",
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
      source?.filter((item: RawMaterialData) => {
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
        fileName="raw_material_data"
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
        itemsPerPage={5}
        isCheckboxEnabled={true}
        onSelectionChange={setSelectedRows}
        isSortEnabled={true}
        isMultiSortEnabled={false}
        defaultSorts={[{ field: "name", order: "asc", priority: 0 }]}
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
                {row.name}
              </td>
              <td className="py-2 px-4 w-fit text-xs font-mono text-gray-500 border-b border-gray-300">
                {row.stock}
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
                  The selected raw material records will be permanently removed
                  from the system.
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
            {editingId ? "Edit Raw Material" : "Add Raw Material"}
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
              Material Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder="Enter raw material name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={formSubmitting}
                size="large"
                allowClear
                className="text-gray-900!"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The unique name for this raw material
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Stock Quantity
            </label>
            <div className="relative">
              <InputNumber
                placeholder="0"
                value={formData.stock}
                onChange={(value) =>
                  setFormData({ ...formData, stock: value || 0 })
                }
                disabled={formSubmitting}
                size="large"
                className="text-gray-900! w-full!"
                min={0}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current available stock (cannot be negative)
            </p>
          </div>
        </div>
      </Modal>
      {/* -- FORM MODAL END -- */}
    </div>
  );
}

export default RawMaterialIndexPage;
