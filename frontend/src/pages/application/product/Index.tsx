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
import { Modal, Input, InputNumber, Select, Button } from "antd";
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

type ProductData = Record<string, unknown> & {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{ rawMaterialId: string; quantity: number }>;
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

function ProductIndexPage() {
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
          "3abc2cc5be684bb69ee8d036aade7bc0"
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

  useDocumentTitle(title || "Product");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [data, setData] = useState<ProductData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Raw materials for select
  const [rawMaterials, setRawMaterials] = useState<
    { label: string; value: string }[]
  >([]);

  // Modal state
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ingredients: [{ rawMaterialId: "", quantity: 0 }],
  });
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/general/setup/products/list");
      if (response && response.data.success) {
        setData(response.data.data.products);
      } else {
        toast.error("Failed to fetch product data");
      }
    } catch (error) {
      console.error("Failed to fetch product data:", error);
      toast.error("Failed to fetch product data");
    } finally {
      setLoading(false);
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
      name: "",
      description: "",
      ingredients: [{ rawMaterialId: "", quantity: 0 }],
    });
    setFormModalVisible(true);
  };

  const handleEdit = (row: ProductData) => {
    setEditingId(row.id);
    setFormData({
      name: String(row.name),
      description: String(row.description),
      ingredients: Array.isArray(row.ingredients)
        ? row.ingredients.map((ing: any) => ({
            rawMaterialId: ing.rawMaterialId || ing.id || "",
            quantity: typeof ing.quantity === "number" ? ing.quantity : 0,
          }))
        : [{ rawMaterialId: "", quantity: 0 }],
    });
    setFormModalVisible(true);
  };

  const handleFormCancel = () => {
    if (!formSubmitting) {
      setFormModalVisible(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        ingredients: [{ rawMaterialId: "", quantity: 0 }],
      });
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (
      !formData.ingredients.some((ing) => ing.rawMaterialId && ing.quantity > 0)
    ) {
      toast.error("At least one ingredient with quantity is required");
      return;
    }

    if (!isEditable) {
      toast.error("You don't have permission to submit the form");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        ingredients: formData.ingredients.filter(
          (ing) => ing.rawMaterialId && ing.quantity > 0
        ),
      };

      if (editingId) {
        // Update
        const response = await requestApi.put(
          `/general/setup/products/edit/${editingId}`,
          payload
        );
        if (response && response.data.success) {
          toast.success("Product updated successfully");
          fetchData();
          setFormModalVisible(false);
          setEditingId(null);
          setFormData({
            name: "",
            description: "",
            ingredients: [{ rawMaterialId: "", quantity: 0 }],
          });
        } else {
          toast.error("Failed to update product");
        }
      } else {
        // Create
        // console.log(JSON.stringify(payload));
        const response = await requestApi.post(
          "/general/setup/products",
          payload
        );
        if (response && response.data.success) {
          toast.success("Product created successfully");
          fetchData();
          setFormModalVisible(false);
          setFormData({
            name: "",
            description: "",
            ingredients: [{ rawMaterialId: "", quantity: 0 }],
          });
        } else {
          toast.error("Failed to create product");
        }
      }
    } catch (error) {
      toast.error(
        editingId ? "Failed to update product" : "Failed to create product"
      );
      console.error("Form error:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleDetail = (row: ProductData) => {
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
        "/general/setup/products/mass-delete",
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

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { rawMaterialId: "", quantity: 0 },
      ],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData({
        ...formData,
        ingredients: formData.ingredients.filter((_, i) => i !== index),
      });
    } else {
      toast.error("At least one ingredient is required");
    }
  };

  const handleIngredientChange = (
    index: number,
    field: "rawMaterialId" | "quantity",
    value: any
  ) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
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
        label: "Description",
        field: "description",
        type: "text" as HeaderType,
        showOnMobile: true,
        exportable: true,
      },
      {
        label: "Ingredients",
        field: "ingredients",
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
      source?.filter((item: ProductData) => {
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
        fileName="product_data"
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
          // Helper function to get material name by id
          const getMaterialName = (materialId: string) => {
            const material = rawMaterials.find((m) => m.value === materialId);
            return material ? material.label : materialId;
          };

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
                {String(row.description).substring(0, 50)}
                {String(row.description).length > 50 ? "..." : ""}
              </td>
              <td className="py-2 px-4 w-fit text-xs text-gray-500 border-b border-gray-300">
                {Array.isArray(row.ingredients) &&
                row.ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {row.ingredients.map((ing: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {getMaterialName(ing.rawMaterialId || ing.id)} ×{" "}
                        {ing.quantity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No ingredients</span>
                )}
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
                  The selected product records will be permanently removed from
                  the system.
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
          <div className="text-xl font-semibold text-gray-900 tracking-tight">
            {editingId ? "Edit Product" : "Add New Product"}
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
        }}
        cancelButtonProps={{
          size: "large",
          disabled: formSubmitting,
        }}
        closable={!formSubmitting}
        maskClosable={!formSubmitting}
        width={640}
        centered
        className="apple-modal"
        styles={{
          body: { padding: "0" },
          header: {
            padding: "24px 28px 16px 28px",
            borderBottom: "none",
            marginBottom: 0,
          },
          footer: {
            padding: "16px 28px 24px 28px",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            marginTop: 0,
          },
          content: {
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            overflow: "hidden",
          },
        }}
      >
        <div className="px-7 pb-2 max-h-[65vh] overflow-y-auto">
          {/* PRODUCT INFO SECTION */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product Information
              </span>
            </div>

            <div className="space-y-5 pl-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Cable Ladder etc."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={formSubmitting}
                  size="large"
                  allowClear
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Input.TextArea
                  placeholder="Describe your product details, specifications, or notes..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={formSubmitting}
                  rows={3}
                  style={{ resize: "none" }}
                />
              </div>
            </div>
          </div>

          {/* INGREDIENTS SECTION */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recipe / Ingredients
                </span>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddIngredient}
                disabled={formSubmitting}
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-3 pl-3">
              {formData.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="group relative bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200"
                >
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 shadow-sm">
                    {index + 1}
                  </div>

                  <div className="flex gap-4 items-start ml-4">
                    <div className="flex-2 space-y-1">
                      <label className="text-xs font-medium text-gray-500">
                        Raw Material
                      </label>
                      <Select
                        placeholder="Select material"
                        value={ingredient.rawMaterialId || undefined}
                        onChange={(value) =>
                          handleIngredientChange(index, "rawMaterialId", value)
                        }
                        disabled={formSubmitting}
                        options={rawMaterials.map((material) => ({
                          ...material,
                          disabled: formData.ingredients.some(
                            (ing, i) =>
                              i !== index &&
                              ing.rawMaterialId === material.value
                          ),
                        }))}
                        className="w-full"
                        size="large"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium text-gray-500">
                        Qty
                      </label>
                      <InputNumber
                        placeholder="0"
                        value={ingredient.quantity}
                        onChange={(value) =>
                          handleIngredientChange(index, "quantity", value || 0)
                        }
                        disabled={formSubmitting}
                        size="large"
                        className="w-full!"
                        min={0}
                      />
                    </div>

                    <div className="pt-6">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveIngredient(index)}
                        disabled={
                          formSubmitting || formData.ingredients.length === 1
                        }
                        className="opacity-50 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {formData.ingredients.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No ingredients added yet</p>
                  <p className="text-xs mt-1">
                    Click "Add Item" to add raw materials
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3 pl-3 italic">
              Define the raw materials and quantities required to produce this
              product
            </p>
          </div>
        </div>
      </Modal>
      {/* -- FORM MODAL END -- */}
    </div>
  );
}

export default ProductIndexPage;
