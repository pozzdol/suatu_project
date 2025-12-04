import useDocumentTitle from "@/hooks/useDocumentTitle";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";

import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import {
  ArrowCircleLeftIcon,
  BellIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UsersIcon,
} from "@phosphor-icons/react";

type User = {
  id: string;
  name: string;
  email: string;
  receive_stock_notification?: boolean;
};

function NotificationCreatePage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "6b77f858b967403f8e34b61c62969b1a"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          setIndexUrl(pageData.data.page.url);
          setPermit(pageData.data.permit.permission);
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

  useDocumentTitle(title);

  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await requestApi.get("/notifications/users");
      if (response.data.success) {
        const fetchedUsers = response.data.data.users || [];
        setUsers(fetchedUsers);

        // Pre-select users who already have receive_stock_notification enabled
        const preSelectedIds = fetchedUsers
          .filter((user: User) => user.receive_stock_notification)
          .map((user: User) => user.id);
        setSelectedUserIds(preSelectedIds);
        setInitialSelectedIds(preSelectedIds);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchUsers();
    }
  }, [permit]);
  // EFFECTS END

  // HELPERS
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    navigate(indexUrl);
  };
  // HELPERS END

  // FUNCTIONS
  const handleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((user) => user.id));
    }
  };

  const handleSubmit = async () => {
    // Check if there are any changes
    const hasChanges =
      selectedUserIds.length !== initialSelectedIds.length ||
      selectedUserIds.some((id) => !initialSelectedIds.includes(id)) ||
      initialSelectedIds.some((id) => !selectedUserIds.includes(id));

    if (!hasChanges) {
      toast.error("No changes to save");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userIds: selectedUserIds,
        receive_stock_notification: true,
      };

      const response = await requestApi.post(
        "/notifications/users/bulk-preference",
        payload
      );

      if (response && response.data.success) {
        toast.success(
          `Stock notification preferences updated for ${selectedUserIds.length} user(s)`
        );
        // Refresh data to get latest state
        await fetchUsers();
      } else {
        toast.error(response?.data?.message || "Failed to update preferences");
      }
    } catch (error: any) {
      console.error("Failed to update preferences:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update preferences"
      );
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
    <div className="pt-6 px-4 md:px-8 pb-14 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="text-gray-500 mb-2 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex items-center space-x-2 mb-6">
        <button
          className="flex items-center text-sky-600 font-medium cursor-pointer hover:text-sky-700 transition duration-200 ease-in-out"
          onClick={handleBack}
        >
          <ArrowCircleLeftIcon weight="duotone" className="w-5 h-5 mr-2" /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Selection Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Header with Search and Select All */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <UsersIcon weight="duotone" className="w-6 h-6 text-sky-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Select Users
              </h3>
              {selectedUserIds.length > 0 && (
                <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">
                  {selectedUserIds.length} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-full md:w-64"
                />
              </div>

              {/* Select All Button */}
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
              >
                {selectedUserIds.length === filteredUsers.length &&
                filteredUsers.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          </div>

          {/* Users List */}
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <CircleNotchIcon className="animate-spin w-8 h-8 text-sky-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserIcon
                weight="duotone"
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
              />
              <p>
                {searchQuery
                  ? "No users found matching your search"
                  : "No users available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-sky-50 border-sky-300 shadow-sm"
                        : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected ? "bg-sky-500" : "border-2 border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircleIcon
                            weight="bold"
                            className="w-4 h-4 text-white"
                          />
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isSelected
                            ? "bg-sky-200 text-sky-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                submitting ||
                (selectedUserIds.length === initialSelectedIds.length &&
                  selectedUserIds.every((id) =>
                    initialSelectedIds.includes(id)
                  ))
              }
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-sm font-medium rounded-lg text-white hover:bg-sky-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <CircleNotchIcon className="animate-spin w-4 h-4" />
              ) : (
                <BellIcon weight="bold" className="w-4 h-4" />
              )}
              {submitting
                ? "Saving..."
                : `Save Preferences (${selectedUserIds.length} User(s))`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationCreatePage;
