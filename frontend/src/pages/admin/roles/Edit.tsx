import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import { Input } from "antd";
import { ArrowCircleLeftIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import RoleWindowTree from "./components/RoleWindowTree";

interface FormData {
  name: string;
  description?: string;
}

function AdminRoleEditPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "17df972f2f8345b1b46d9b29c03c0934"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          setIndexUrl(pageData.data.page.url);
          setPermit(pageData.data.permit.permission);
          setIsEditable(pageData.data.permit.isEditable);
          setIsAdmin(pageData.data.permit.isAdmin);
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

  useDocumentTitle(title || "Edit Role");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT

  const initialFormData: FormData = {
    name: "",
    description: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(
    initialFormData
  );
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get(`/general/setup/roles/edit/${id}`);
      if (response && response.data.success) {
        setFormData(response.data.data.role);
        setOriginalData(response.data.data.role);
      } else {
        toast.error("Failed to fetch role data");
      }
    } catch (error) {
      console.error("Failed to fetch role data:", error);
      toast.error("Failed to fetch role data");
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

  //  HELPERS
  // HELPERS END

  // FUNCTIONS
  const handleReset = () => {
    setFormData(originalData || initialFormData);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSubmitting(true);
    try {
      // console.log("Form Data to submit:", JSON.stringify(formData));
      const response = await requestApi.put("/general/setup/roles/edit/" + id, {
        name: formData.name,
        description: formData.description,
      });
      if (response && response.data.success) {
        toast.success("Role updated successfully");
        navigate(`${indexUrl}`);
      } else {
        toast.error("Failed to update role: " + response.data.message);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("You do not have permission");
      } else {
        toast.error("Failed to update role");
      }
      console.error("Failed to update role:", JSON.stringify(error.response));
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
              Role Name
            </label>
            <Input
              type="text"
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter role name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Role Description
            </label>
            <Input.TextArea
              rows={1}
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              placeholder="Enter role description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
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
                <SpinnerGapIcon className="animate-spin w-4 h-4 mr-2 inline" />
              )}
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      <RoleWindowTree
        permitData="17df972f2f8345b1b46d9b29c03c0934"
        id={id || ""}
      />
    </div>
  );
}

export default AdminRoleEditPage;
