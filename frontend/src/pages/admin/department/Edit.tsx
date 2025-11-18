import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import {
  ArrowCircleLeftIcon,
  CircleNotchIcon,
  GearSixIcon,
  ShuffleIcon,
} from "@phosphor-icons/react";
import { Checkbox, Input, InputNumber, Select } from "antd";
import useDocumentTitle from "@/hooks/useDocumentTitle";

interface FormData {
  name: string;
  email: string;
  employee_id: string;
  password: string;
  role_id: string;
  department_id: string;
  organization_id: string;
}

function AdminUserEditPage() {
  // PAGE LOAD
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  useDocumentTitle(title || "Admin User Update");
  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);
  const [passwordSettings, setPasswordSettings] = useState({
    length: 12,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const initialFormData: FormData = {
    name: "",
    email: "",
    employee_id: "",
    password: "",
    role_id: "",
    department_id: "",
    organization_id: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<{ label: string; value: string }[]>([]);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get(`/general/setup/users/edit/${id}`);

      if (response.data.success) {
        setFormData(response.data.data.user);
        setOriginalData(response.data.data.user);
      } else {
        toast.error("Failed to fetch user data");
      }
    } catch (error) {
      toast.error("Failed to fetch user data");
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await requestApi.get("/general/setup/roles/list");
      if (response.data.success) {
        const rolesData = response.data.data.roles.map((role: any) => ({
          label: role.name,
          value: role.id,
        }));
        setRoles(rolesData);
      } else {
        toast.error("Failed to fetch roles");
        return [];
      }
    } catch (error) {
      toast.error("Failed to fetch roles");
      console.error("Failed to fetch roles:", error);
      return [];
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchData();
      fetchRoles();
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
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!formData.employee_id) {
      toast.error("Employee ID is required");
      return;
    }

    setSubmitting(true);
    try {
      // console.log("Form Data to submit:", JSON.stringify(formData));
      const response = await requestApi.put(
        "/general/setup/users/edit/" + id,
        formData
      );
      if (response && response.data.success) {
        toast.success("User updated successfully");
        navigate(`${indexUrl}`);
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
      console.error("Failed to update user:", error);
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

      <div className="mt-6 p-6 bg-white rounded-lg shadow space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              type="text"
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter User Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              type="email"
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Employee Id
            </label>
            <Input
              type="text"
              className="mt-1 block w-full border border-gray-300  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Employee Id"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
            />
          </div>
        </div>

        <div className="font-medium text-gray-700">More Information</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <Select
              className="mt-1 block w-full  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter User Name"
              options={roles}
              value={formData.role_id}
              onChange={(value) => setFormData({ ...formData, role_id: value })}
            />
          </div>
          <div className=""></div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <Select
              className="mt-1 block w-full  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Department"
              value={formData.department_id}
              onChange={(value) =>
                setFormData({ ...formData, department_id: value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Organization
            </label>
            <Select
              className="mt-1 block w-full  p-2 focus:ring-sky-500 focus:border-sky-500"
              size="large"
              allowClear
              placeholder="Enter Organization"
              value={formData.organization_id}
              onChange={(value) =>
                setFormData({ ...formData, organization_id: value })
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

export default AdminUserEditPage;
