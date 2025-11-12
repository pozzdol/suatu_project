import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import IconRenderer from "@/components/IconRenderer";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Checkbox } from "antd";

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  order: number;
  type: "window" | "group";
  url: string;
  subMenu?: MenuItem[];
}

type TreeData = {
  key: string;
  data: {
    id: string;
    name: string;
    type: "group" | "window";
    url: string;
    icon: string;
  };
  children?: TreeData[];
};

type RoleWindowTreeProps = {
  permitData: string;
  id: string;
};

function RoleWindowTree({ permitData, id }: RoleWindowTreeProps) {
  // PAGE LOAD
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
        const pageData = await validatePermit(permitData);

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

  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});
  const [treeData, setTreeData] = useState<TreeData[]>([]);

  const [windowPermissions, setWindowPermissions] = useState<{
    [windowId: string]: {
      isAccess: boolean;
      isEdit: boolean;
      isAdmin: boolean;
    };
  }>({});

  const [submitting, setSubmitting] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchWindow = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/general/setup/windows");
      if (response && response.data.success) {
        const menuList: MenuItem[] = response.data.data.menuList;
        const convertedTree = convertMenuToTree(menuList);
        setTreeData(convertedTree);

        // Set all groups as expanded by default
        const groupKeys: { [key: string]: boolean } = {};
        menuList.forEach((item) => {
          if (item.type === "group") {
            groupKeys[item.id] = true;
          }
        });
        setOpenItems(groupKeys);
      } else {
        toast.error("Failed to fetch window data");
      }
    } catch (error) {
      console.error("Failed to fetch window data:", error);
      toast.error("Failed to fetch window data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermission = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get(
        "/general/setup/role-windows/role-id/" + id
      );
      if (response && response.data.success) {
        const roleWindows = response.data.data.role_windows || [];
        const permissions: {
          [windowId: string]: {
            isAccess: boolean;
            isEdit: boolean;
            isAdmin: boolean;
          };
        } = {};

        roleWindows.forEach(
          (rw: { window_id: string; isEdit: boolean; isAdmin: boolean }) => {
            permissions[rw.window_id] = {
              isAccess: true,
              isEdit: rw.isEdit,
              isAdmin: rw.isAdmin,
            };
          }
        );

        setWindowPermissions(permissions);
      } else {
        toast.error("Failed to fetch window data");
      }
    } catch (error) {
      console.error("Failed to fetch window data:", error);
      toast.error("Failed to fetch window data");
    } finally {
      setLoading(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchWindow();
      fetchPermission();
    }
  }, [permit]);
  // EFFECTS END

  //  HELPERS
  const convertMenuToTree = (menuList: MenuItem[]): TreeData[] => {
    return menuList.map((item) => ({
      key: item.id,
      data: {
        id: item.id,
        name: item.name,
        type: item.type === "group" ? "group" : "window",
        url: item.url,
        icon: item.icon,
      },
      children:
        item.type === "group" && item.subMenu
          ? convertMenuToTree(item.subMenu)
          : undefined,
    }));
  };

  const toggleGroup = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  // HELPERS END

  // FUNCTIONS
  const TreeNode: React.FC<{ item: TreeData; level?: number }> = ({
    item,
    level = 0,
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems[item.key] ?? true;
    const isGroup = item.data.type === "group";

    const permission = windowPermissions[item.key] || {
      isAccess: false,
      isEdit: false,
      isAdmin: false,
    };

    // PAGE LOAD RENDER
    if (loading) {
      return <Loading />;
    }

    if (!permit) {
      return <Permit />;
    }

    return (
      <div key={item.key} className="select-none">
        <div
          className={`flex justify-between items-center gap-3 py-2.5 px-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 ${
            isGroup && "cursor-pointer"
          } ${level! > 0 ? "ml-4" : ""}`}
          onClick={() => isGroup && toggleGroup(item.key)}
        >
          <div className="flex items-center gap-3">
            {/* Expand/Collapse Icon */}
            {hasChildren && (
              <CaretDownIcon
                size={16}
                weight="bold"
                className={`shrink-0 text-gray-400 ${
                  isOpen ? "" : "rotate-180"
                } transition-all duration-200`}
              />
            )}
            {!hasChildren && <div className="w-4 shrink-0" />}
            {/* Checkbox Akses */}
            <Checkbox
              checked={permission.isAccess}
              onChange={(e) =>
                setWindowPermissions((prev) => ({
                  ...prev,
                  [item.key]: {
                    ...prev[item.key],
                    isAccess: e.target.checked,
                  },
                }))
              }
            />

            {/* Item Icon */}
            <IconRenderer
              name={item.data.icon}
              size={18}
              className="shrink-0"
            />

            {/* Item Name */}
            <span
              className={`flex-1 font-medium ${
                isGroup ? "text-gray-700 font-semibold" : "text-gray-600"
              }`}
            >
              {item.data.name}
            </span>
          </div>
          {!isGroup && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {/* Checkbox Edit */}
                <Checkbox
                  checked={permission.isEdit}
                  onChange={(e) =>
                    setWindowPermissions((prev) => ({
                      ...prev,
                      [item.key]: {
                        ...prev[item.key],
                        isEdit: e.target.checked,
                      },
                    }))
                  }
                />
                <span className="text-xs text-gray-400">Edit</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Checkbox Admin */}
                <Checkbox
                  checked={permission.isAdmin}
                  onChange={(e) =>
                    setWindowPermissions((prev) => ({
                      ...prev,
                      [item.key]: {
                        ...prev[item.key],
                        isAdmin: e.target.checked,
                      },
                    }))
                  }
                />
                <span className="text-xs text-gray-400">Admin</span>
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {isOpen && hasChildren && (
          <div className="space-y-0.5">
            {item.children?.map((child) => (
              <TreeNode key={child.key} item={child} level={(level || 0) + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Filter hanya windows yang isAccess = true
    const selectedWindows = Object.entries(windowPermissions)
      .filter(([_, permission]) => permission.isAccess)
      .map(([windowId, permission]) => ({
        window_id: windowId,
        role_id: id,
        isEdit: permission.isEdit,
        isAdmin: permission.isAdmin,
      }));

    if (selectedWindows.length === 0) {
      toast.error("Please select at least one window");
      return;
    }

    setSubmitting(true);
    try {
      console.log(JSON.stringify(selectedWindows));
      // const response = await requestApi.post(
      //   "/general/setup/role-windows/update",
      //   {
      //     role_id: id,
      //     windows: selectedWindows,
      //   }
      // );

      // if (response && response.data.success) {
      //   toast.success("Role windows updated successfully");
      //   fetchPermission(); // Refresh data
      // } else {
      //   toast.error("Failed to update role windows: " + response.data.message);
      // }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("You do not have permission");
      } else {
        toast.error("Failed to update role windows");
      }
      console.error("Failed to update role windows:", error);
    } finally {
      setSubmitting(false);
    }
  };
  // FUNCTIONS END

  // TABLE
  // TABLE END

  // PAGE LOAD RENDER
  // PAGE LOAD RENDER END

  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl text-gray-500 font-semibold">
          Access Windows and Permissions
        </h2>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`bg-primary-600 hover:bg-primary-700 text-white py-1 px-6 rounded-lg transition duration-200 ease-in-out cursor-pointer ${
            submitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? "Saving..." : "Save Permissions"}
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
        {treeData.length > 0 ? (
          <div className="space-y-1">
            {treeData.map((item) => (
              <TreeNode key={item.key} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p>No windows available</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Selected:</strong>{" "}
          {Object.values(windowPermissions).filter((p) => p.isAccess).length}{" "}
          window(s)
        </p>
      </div>
    </div>
  );
}

export default RoleWindowTree;
