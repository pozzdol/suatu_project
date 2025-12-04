import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import Loading from "@/components/Loading";
import requestApi from "@/utils/api";
import {
  UserIcon,
  EnvelopeIcon,
  LockIcon,
  FloppyDiskIcon,
  CircleNotchIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";

type UserProfile = {
  id: string;
  name: string;
  email: string;
};

function ProfileIndexPage() {
  // PAGE LOAD
  const [loading, setLoading] = useState(true);
  const [title] = useState("Profile Management");
  const [subTitle] = useState("Edit and Customize Your Profile");

  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await requestApi.get("/profile");
      if (response.data.success) {
        const userData = response.data.data;
        setProfile(userData);
        setName(userData.name || "");
        setEmail(userData.email || "");
      } else {
        toast.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    fetchProfile();
  }, []);
  // EFFECTS END

  //  HELPERS
  // HELPERS END

  // FUNCTIONS
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await requestApi.put("/profile", {
        name: name.trim(),
        email: email.trim(),
      });

      if (response.data.success) {
        toast.success("Profile updated successfully");
        await fetchProfile();
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!newPassword) {
      toast.error("New password is required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await requestApi.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.data.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.data.message || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(
        error?.response?.data?.message || "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    setName(profile?.name || "");
    setEmail(profile?.email || "");
  };
  // FUNCTIONS END

  // PAGE LOAD RENDER
  if (loading) {
    return <Loading />;
  }
  // PAGE LOAD RENDER END

  const hasProfileChanges = name !== profile?.name || email !== profile?.email;

  return (
    <div className="pt-6 px-4 md:px-8 pb-14 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="text-gray-500 mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">{title}</h1>
        <p>{subTitle}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Avatar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <img
              src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${profile?.name}`}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover border-2 border-primary-500"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile?.name}
              </h2>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>
        </div>

        {/* Edit Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon weight="duotone" className="w-6 h-6 text-sky-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Profile
            </h3>
          </div>

          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
                <PencilSimpleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
                <PencilSimpleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="flex gap-3 pt-2">
              {hasProfileChanges && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile || !hasProfileChanges}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-sm font-medium rounded-lg text-white hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? (
                  <CircleNotchIcon className="animate-spin w-4 h-4" />
                ) : (
                  <FloppyDiskIcon weight="bold" className="w-4 h-4" />
                )}
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <LockIcon weight="duotone" className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Change Password
            </h3>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Change Password Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={
                  savingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-sm font-medium rounded-lg text-white hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? (
                  <CircleNotchIcon className="animate-spin w-4 h-4" />
                ) : (
                  <LockIcon weight="bold" className="w-4 h-4" />
                )}
                {savingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileIndexPage;
