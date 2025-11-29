import { useState, useEffect, use } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import { ArrowCircleLeftIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Input, Select, InputNumber, Button } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import useDocumentTitle from "@/hooks/useDocumentTitle";

interface OrderItem {
  productId: string;
  quantity: number;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  orderItems: OrderItem[];
}

function OrdersEditPage() {
  // PAGE LOAD
  const { id } = useParams<{ id: string }>();
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

  useDocumentTitle(title || "Create Order");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const initialFormData: FormData = {
    name: "",
    address: "",
    phone: "",
    email: "",
    status: "draft",
    orderItems: [{ productId: "", quantity: 1 }],
  };

  const [originalData, setOriginalData] = useState<FormData>(initialFormData);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<{ label: string; value: string }[]>(
    []
  );

  // Fetch products
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await requestApi.get("/transactions/orders/edit/" + id);
      if (response && response.data.success) {
        const order = response.data.data.order;
        setFormData({
          name: order.name || "",
          address: order.address || "",
          phone: order.phone || "",
          email: order.email || "",
          status: order.status || "draft",
          orderItems: order.orderItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
        setOriginalData({
          name: order.name || "",
          address: order.address || "",
          phone: order.phone || "",
          email: order.email || "",
          status: order.status || "draft",
          orderItems: order.orderItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
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

  const fetchProducts = async () => {
    try {
      const response = await requestApi.get("/general/setup/products/list");
      if (response && response.data.success) {
        const productOptions = response.data.data.products.map(
          (product: { id: string; name: string }) => ({
            label: product.name,
            value: product.id,
          })
        );
        setProducts(productOptions);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);
  // STATE MANAGEMENT END

  // FUNCTIONS
  const handleReset = () => {
    setFormData(originalData || initialFormData);
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      orderItems: [...formData.orderItems, { productId: "", quantity: 1 }],
    });
  };

  const removeOrderItem = (index: number) => {
    if (formData.orderItems.length <= 1) {
      toast.error("At least one product is required");
      return;
    }
    const newItems = formData.orderItems.filter((_, i) => i !== index);
    setFormData({ ...formData, orderItems: newItems });
  };

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const newItems = [...formData.orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, orderItems: newItems });
  };

  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = formData.orderItems
      .filter((_, i) => i !== currentIndex)
      .map((item) => item.productId);

    return products.map((product) => ({
      ...product,
      disabled: selectedProductIds.includes(product.value),
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    const normalizedFormData: Record<string, any> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      status: formData.status,
      orderItems: formData.orderItems.filter((item) => item.productId),
    };

    if (normalizedFormData.orderItems.length === 0) {
      toast.error("At least one product is required");
      return;
    }

    if (formData.address.trim()) {
      normalizedFormData.address = formData.address.trim();
    }

    if (formData.phone.trim()) {
      normalizedFormData.phone = formData.phone.trim();
    }

    setSubmitting(true);
    try {
      // console.log(JSON.stringify(normalizedFormData));
      const response = await requestApi.put(
        "/transactions/orders/edit/" + id,
        normalizedFormData
      );
      if (response && response.data.success) {
        toast.success("Order created successfully");
        fetchData();
      } else {
        toast.error("Failed to create order");
      }
    } catch (error) {
      toast.error("Failed to create order");
      console.error("Failed to create order:", error);
    } finally {
      setSubmitting(false);
    }
  };
  // FUNCTIONS END

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
      <div className="text-gray-500 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <button
          className="flex items-center text-sky-600 font-medium cursor-pointer hover:text-sky-700 transition duration-200 ease-in-out"
          onClick={() => navigate(`${indexUrl}`)}
        >
          <ArrowCircleLeftIcon weight="duotone" className="w-5 h-5 mr-2" /> Back
        </button>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Customer Detail
          </h2>
          <p className="text-sm text-gray-500">
            Detailed information about the selected customer.
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500 ml-1">*</span>
            </label>
            <Input
              type="text"
              className="mt-1 block w-full border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500 ml-1">*</span>
            </label>
            <Input
              type="email"
              className="mt-1 block w-full border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone{" "}
              <span className="font-normal italic text-xs">(Optional)</span>
            </label>
            <Input
              type="tel"
              className="mt-1 block w-full border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Address{" "}
              <span className="font-normal italic text-xs">(Optional)</span>
            </label>
            <Input.TextArea
              rows={4}
              className="mt-1 block w-full border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter Full Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Order Detail Section */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Order Detail</h2>
          <p className="text-sm text-gray-500">
            Products ordered by the customer.
          </p>
        </div>
        <div className="p-6">
          {/* Status Field */}
          <div className="mb-6">
            <div className="space-y-2 max-w-xs">
              <label className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500 ml-1">*</span>
              </label>
              <Select
                className="w-full"
                size="large"
                placeholder="Select Status"
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Confirm", value: "confirm" },
                ]}
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Products <span className="text-red-500 ml-1">*</span>
              </label>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addOrderItem}
                size="small"
              >
                Add Product
              </Button>
            </div>

            <div className="space-y-3">
              {formData.orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <Select
                      className="w-full"
                      size="large"
                      placeholder="Select Product"
                      value={item.productId || undefined}
                      onChange={(value) =>
                        updateOrderItem(index, "productId", value)
                      }
                      options={getAvailableProducts(index)}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </div>
                  <div className="w-32">
                    <InputNumber
                      className="w-full"
                      size="large"
                      min={1}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(value) =>
                        updateOrderItem(index, "quantity", value || 1)
                      }
                    />
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeOrderItem(index)}
                    disabled={formData.orderItems.length <= 1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between px-6 pb-6">
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-6 rounded-lg transition duration-200 ease-in-out cursor-pointer"
            onClick={() => navigate(`${indexUrl}`)}
          >
            Cancel
          </button>
          <div className="flex justify-end gap-4">
            <button
              className="bg-amber-200 hover:bg-amber-300 text-amber-700 border border-amber-400 py-1 px-6 rounded-lg transition duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>
            <button
              className={`bg-primary-600 hover:bg-primary-700 text-white py-1 px-6 rounded-lg transition duration-200 ease-in-out cursor-pointer ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleSubmit}
              disabled={!isEditable || submitting}
            >
              {submitting && (
                <CircleNotchIcon className="animate-spin w-4 h-4 mr-2 inline" />
              )}
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersEditPage;
