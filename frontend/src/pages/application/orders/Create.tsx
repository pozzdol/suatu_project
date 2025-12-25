import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import { ArrowCircleLeftIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { AutoComplete, Input } from "antd";
import useDocumentTitle from "@/hooks/useDocumentTitle";

interface FormData {
  name: string;
  address: string;
  phone: string;
  nopo: string;
}

function OrdersCreatePage() {
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

  useDocumentTitle(title || "Create Order");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const initialFormData: FormData = {
    name: "",
    address: "",
    phone: "",
    nopo: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [nameData, setNameData] = useState<Array<{ name: string }>>([]);
  // STATE MANAGEMENT END

  // FETCHING DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/transactions/orders/list");
      if (response && response.data.success) {
        const res = response.data.data.orders;
        const dataOrder = res.map((item: any) => ({
          name: item.name,
        }));
        setNameData(dataOrder);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  // FETCHING DATA END

  // EFFECTS
  useEffect(() => {
    fetchData();
  }, []);
  // EFFECTS END

  // HELPERS
  const uniqueNames = Array.from(
    new Set(nameData.map((item) => item.name))
  ).map((name) => {
    return { name };
  });
  // HELPERS END

  // FUNCTIONS
  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const normalizedFormData: Record<string, any> = {
      name: formData.name.trim(),
    };

    if (formData.nopo.trim()) {
      normalizedFormData.nopo = formData.nopo.trim();
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
      const response = await requestApi.post(
        "/transactions/orders",
        normalizedFormData
      );
      console.log(JSON.stringify(response));
      if (response && response.data.success) {
        toast.success("Order created successfully");
        navigate(`${indexUrl}/${response.data.data.order.id}`);
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
              Name<span className="text-red-500 ml-1">*</span>
            </label>
            <AutoComplete
              options={uniqueNames.map((item) => ({ value: item.name }))}
              className="mt-1 block w-full p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().includes(inputValue.toUpperCase())
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone
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
              No. PO
            </label>
            <Input
              type="po"
              className="mt-1 block w-full border border-gray-300 p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter No. PO"
              value={formData.nopo}
              onChange={(e) =>
                setFormData({ ...formData, nopo: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
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
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersCreatePage;
