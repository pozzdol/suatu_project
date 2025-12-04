import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import {
  ArrowCircleLeftIcon,
  CircleNotchIcon,
  ShuffleIcon,
} from "@phosphor-icons/react";
import { Checkbox, Input, InputNumber, Select } from "antd";
import useDocumentTitle from "@/hooks/useDocumentTitle";

interface FormData {
  name: string;
  subtitle?: string;
  access: string;
  order: number;
  type: string;
  parent?: string;
  isParent: boolean;
  icon: string;
  url: string;
}

function AdminWindowCreatePage() {
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
          "evosd4d2d55a4faab5a082386def0bee"
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

  useDocumentTitle(title || "Create Window");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [parentOptions, setParentOptions] = useState<any[]>([]);

  const initialFormData: FormData = {
    name: "",
    subtitle: "",
    access: "",
    order: 0,
    type: "",
    parent: "",
    isParent: false,
    icon: "",
    url: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchDataParent = async () => {
    try {
      const response = await requestApi.get("/general/setup/windows/parents");
      if (response && response.data.success) {
        setParentOptions(response.data.data.parents);
      } else {
        toast.error("Failed to fetch parent options");
      }
    } catch (error) {
      console.error("Failed to fetch parent options:", error);
      toast.error("Failed to fetch parent options");
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchDataParent();
    }
  }, [permit]);
  // EFFECTS END

  //  HELPERS
  const generateUUID = () => {
    if (typeof window !== "undefined" && window.crypto) {
      if (typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID().replace(/-/g, "");
      }
      if (typeof window.crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) =>
          b.toString(16).padStart(2, "0")
        ).join("");
        return hex.replace(/-/g, "");
      }
    }
    return (
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 10)
    );
  };
  // HELPERS END

  // FUNCTIONS
  const handleRegenerateUUID = () => {
    setFormData({ ...formData, access: generateUUID() });
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error("Window name is required");
      return;
    }

    if (!formData.access.trim()) {
      toast.error("Window access is required");
      return;
    }

    if (formData.order < 0) {
      toast.error("Window order must be greater than 0");
      return;
    }

    if (!formData.type.trim()) {
      toast.error("Window type is required");
      return;
    }

    if (!formData.url.trim()) {
      toast.error("Window URL is required");
      return;
    }

    if (!formData.icon.trim()) {
      toast.error("Window icon is required");
      return;
    }

    setSubmitting(true);
    try {
      // console.log("Form Data to submit:", JSON.stringify(formData));
      const response = await requestApi.post(
        "/general/setup/windows",
        formData
      );
      if (response && response.data.success) {
        toast.success("Window created successfully");
        navigate(`${indexUrl}`);
      } else {
        toast.error("Failed to create window");
      }
    } catch (error) {
      toast.error("Failed to create window");
    } finally {
      setSubmitting(false);
    }
  };
  // FUNCTIONS END

  // TABLE
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

      <div className="mt-6 p-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Window Name
            </label>
            <Input
              type="text"
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter window name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Window Subtitle
            </label>
            <Input.TextArea
              rows={2}
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter window subtitle"
              value={formData.subtitle}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Access
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
                size="large"
                placeholder="Auto-generated"
                value={formData.access}
                onChange={(e) =>
                  setFormData({ ...formData, access: e.target.value })
                }
                readOnly
              />
              <button
                type="button"
                onClick={handleRegenerateUUID}
                className="inline-flex items-center justify-center p-2 border border-gray-300 text-primary-600 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                title="Generate new UUID"
              >
                <ShuffleIcon weight="bold" className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Order
            </label>
            <InputNumber
              className="mt-1 block w-full! border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter window order"
              value={formData.order}
              onChange={(value) =>
                setFormData({ ...formData, order: value ?? 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <Select
              className="mt-1 block w-full  p-2 "
              size="large"
              placeholder="Select window type"
              value={formData.type || undefined}
              onChange={(value) => setFormData({ ...formData, type: value })}
              options={[
                { label: "Group", value: "group" },
                { label: "Window", value: "window" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Parent
            </label>
            <Select
              className="mt-1 block w-full  p-2 "
              size="large"
              placeholder="Select parent window"
              value={formData.parent || undefined}
              onChange={(value) => setFormData({ ...formData, parent: value })}
              options={
                parentOptions.map((parent) => ({
                  label: parent.data.name,
                  value: parent.id,
                })) || []
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Icon
            </label>
            <Input
              className="mt-1 block w-full  p-2 "
              size="large"
              placeholder="Select icon"
              value={formData.icon || undefined}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <Input
              type="text"
              className="mt-1 block w-full p-2"
              size="large"
              placeholder="Enter window URL"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <Checkbox
            className="w-full bg-primary-100 px-6! py-4! rounded-lg border border-primary-600"
            checked={formData.isParent}
            onChange={(e) =>
              setFormData({ ...formData, isParent: e.target.checked })
            }
          >
            <div className="ml-2">
              <div className="text-primary-900 font-semibold text-lg">
                Is Parent?
              </div>
              <div className="text-primary-700">
                If checked, this window will be the parent of all child windows.
              </div>
            </div>
          </Checkbox>
        </div>

        <div className="flex justify-between mt-6">
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
              disabled={submitting} // Disable saat submit
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

export default AdminWindowCreatePage;
