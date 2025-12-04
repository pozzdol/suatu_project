import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import { ArrowCircleLeftIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Input, Select } from "antd";
import useDocumentTitle from "@/hooks/useDocumentTitle";

interface FormData {
  name: string;
  description: string;
  organization: string;
}

function AdminDepartmentCreatePage() {
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
          "3e8645ee994a4189bea1d8126ef5f22b"
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

  useDocumentTitle(title || "Create Organization");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const initialFormData: FormData = {
    name: "",
    description: "",
    organization: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [organizationData, setOrganizationData] = useState([]);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get(
        "/general/setup/organizations/list"
      );
      if (response && response.data.success) {
        // console.log(JSON.stringify(response.data.data));
        setOrganizationData(
          response.data.data.organizations.map((organization: any) => ({
            value: organization.id,
            label: organization.name,
          }))
        );
      } else {
        toast.error("Failed to fetch organizations");
      }
    } catch (error) {
      toast.error("Failed to fetch organizations");
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchOrganizations();
    }
  }, [permit]);
  // EFFECTS END

  //  HELPERS
  // HELPERS END

  // FUNCTIONS

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!formData.organization.trim()) {
      toast.error("Organization name is required");
      return;
    }

    // Buat object payload, hanya kirim address jika tidak kosong
    const normalizedFormData: Record<string, any> = {
      name: formData.name.trim(),
      organization: formData.organization,
    };

    // Hanya tambahkan address jika tidak kosong
    if (formData.description.trim()) {
      normalizedFormData.description = formData.description.trim();
    }

    setSubmitting(true);
    try {
      // console.log("Form Data to submit:", JSON.stringify(normalizedFormData));
      const response = await requestApi.post(
        "/general/setup/departments",
        normalizedFormData
      );
      if (response && response.data.success) {
        toast.success("Organization created successfully");
        // console.log(JSON.stringify(response.data.data));
        navigate(`${indexUrl}/${response.data.data.department.id}`);
      } else {
        toast.error("Failed to create organization");
      }
    } catch (error) {
      toast.error("Failed to create organization");
      console.error("Failed to create organization:", error);
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
              Department Name <span className="text-red-500 ml-1">*</span>
            </label>
            <Input
              type="text"
              className="block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Department Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Department Description{" "}
              <span className="text-xs italic">(optional)</span>
            </label>
            <Input.TextArea
              rows={1}
              className="block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter Full Department Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Organization
            </label>
            <Select
              size="large"
              className="w-full"
              placeholder="Select Organization"
              value={formData.organization || undefined}
              onChange={(value) =>
                setFormData({ ...formData, organization: value })
              }
              options={organizationData}
            />
          </div>

          <div className=""></div>
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

export default AdminDepartmentCreatePage;
