import logoApp from "@/assets/logoApp.png";
import requestApi from "@/utils/api";
import { logout } from "@/utils/auth";
import {
  AppWindowIcon,
  CaretUpIcon,
  GearIcon,
  HouseIcon,
  SidebarIcon,
  SignOutIcon,
  SpinnerBallIcon,
  UserCircleGearIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  isActive: string;
}

interface MenuItem {
  id: string;
  name: string;
  icon: string;
  order: number;
  type: "window" | "group";
  url: string;
  subMenu?: MenuItem[];
}

function Layout({ children, isActive }: LayoutProps) {
  const navigate = useNavigate();
  const [sidebarMenu, setSidebarMenu] = useState<MenuItem[]>([]);
  const [profile, setProfile] = useState<{ [key: string]: string }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("isSidebarOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("expandedGroups");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);

  const fetchMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const response = await requestApi.get("/general/setup/windows");

      if (response.data.success && response.data.data?.menuList) {
        setSidebarMenu(response.data.data.menuList);
      } else {
        console.error("Failed to fetch menu:", response.data.message);
        toast.error("Failed to fetch menu");
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      toast.error("Failed to fetch menu");
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const fetchProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const res = await requestApi.get("/profile", { withCredentials: true });

      if (res.data.success) {
        const data = res.data.data;
        setProfile(data);
      } else {
        console.error("Failed to fetch profile:", res.data.message);
        toast.error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to fetch profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem("isSidebarOpen", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem(
      "expandedGroups",
      JSON.stringify(Array.from(expandedGroups))
    );
  }, [expandedGroups]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getIcon = (iconName: string) => {
    const iconMap = {
      HouseIcon: HouseIcon,
      GearIcon: GearIcon,
      AppWindowIcon: AppWindowIcon,
    };
    return iconMap[iconName as keyof typeof iconMap] || HouseIcon; // Default ke HouseIcon jika kosong
  };

  const handleLogout = async () => {
    setIsLoadingLogout(true);
    try {
      await logout();
      setIsLoadingLogout(false);
      toast.success("Logout berhasil!");
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoadingLogout(false);
    }
  };

  const SkeletonMenuItem = () => (
    <li className="flex items-center gap-2 px-3 py-2">
      <div className="h-6 w-6 rounded-full bg-gray-300 animate-pulse shrink-0"></div>
      <div className="h-4 w-32 bg-gray-300 animate-pulse rounded"></div>
    </li>
  );

  const renderMenuItem = (menu: MenuItem, isSub: boolean = false) => {
    const Icon = getIcon(menu.icon);
    const isGroupExpanded = expandedGroups.has(menu.id);
    const isGroup = menu.type === "group";

    return (
      <li key={menu.id}>
        {isGroup ? (
          <button
            onClick={() => toggleGroup(menu.id)}
            className={`flex items-center ${
              isSidebarOpen ? "gap-2" : "justify-center"
            } font-medium w-full text-left ${
              isActive === menu.url
                ? "text-gray-600 bg-white"
                : "text-secondary-700"
            } hover:text-gray-600 hover:bg-background rounded-lg px-3 py-2 transition-colors duration-200 cursor-pointer overflow-hidden`}
          >
            <Icon
              size={24}
              weight="duotone"
              className="text-primary-500 shrink-0"
            />
            <div
              className={`flex-1 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
              }`}
            >
              {menu.name}
            </div>
            <CaretUpIcon
              size={16}
              className={`shrink-0 ${
                isGroupExpanded ? "" : "rotate-180"
              } transition-all duration-200 ${
                isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
              }`}
            />
          </button>
        ) : (
          <a
            href={menu.url}
            className={`flex items-center ${
              isSidebarOpen ? "gap-2" : "justify-center"
            } font-medium ${
              isActive === menu.url
                ? "text-gray-600 bg-background"
                : "text-secondary-700"
            } hover:text-gray-600 hover:bg-background rounded-lg px-3 py-2 transition-colors duration-200 overflow-hidden ${
              isSub ? "ml-4" : ""
            }`}
          >
            <Icon
              size={24}
              weight="duotone"
              className="text-primary-500 shrink-0"
            />
            <span
              className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
              }`}
            >
              {menu.name}
            </span>
          </a>
        )}
        {isGroup && menu.subMenu && (
          <ul
            className={`ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
              isGroupExpanded && isSidebarOpen
                ? "max-h-screen opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {menu.subMenu.map((sub) => renderMenuItem(sub, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="bg-background">
      <div className="flex w-screen max-w-screen h-screen overflow-hidden">
        <div
          className={`h-screen bg-white border-r border-gray-200 pl-4 space-y-4 transition-all duration-300 overflow-hidden ${
            isSidebarOpen ? "w-64" : "w-16"
          }`}
        >
          <div
            className={`flex ${
              isSidebarOpen ? "justify-start" : "justify-center"
            } items-center gap-3 h-16 whitespace-nowrap`}
          >
            <img src={logoApp} alt="Logo" className="w-10 h-10 shrink-0" />
            <div
              className={`text-xl leading-6 font-medium text-secondary-700 transition-all duration-300 overflow-hidden ${
                isSidebarOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0"
              }`}
            >
              {import.meta.env.VITE_APP_NAME}
            </div>
          </div>
          <nav className="overflow-y-auto h-[calc(100vh-5rem)] pr-4">
            <ul className="space-y-2">
              {isLoadingMenu
                ? Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonMenuItem key={index} />
                  ))
                : sidebarMenu.map((menu) => renderMenuItem(menu))}
            </ul>
          </nav>
        </div>
        <div className="flex-1 flex flex-col h-screen overflow-auto">
          <div className="border-b border-gray-200 h-16 sticky top-0 z-1000 w-full bg-white text-secondary-700 flex items-center pl-4 pr-2 shrink-0">
            <button
              className="p-2 rounded-lg hover:bg-background cursor-pointer transition-colors duration-200"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <SidebarIcon
                weight="duotone"
                className={`w-6 h-6 text-primary-700 transition-transform duration-300 ${
                  isSidebarOpen ? "" : "rotate-180"
                }`}
              />
            </button>
            <div className="ml-auto flex items-center gap-2 h-full py-2">
              <div className="relative">
                {isLoadingProfile ? (
                  // Skeleton loading: Mirip struktur button tapi dengan animasi pulse
                  <div className="flex items-center gap-3 rounded-xl px-4 py-2">
                    <div className="h-8 w-8 rounded-full bg-gray-300 animate-pulse"></div>
                    <div className="flex flex-col text-left gap-1">
                      <div className="h-4 w-24 bg-gray-300 animate-pulse rounded"></div>
                      <div className="h-3 w-32 bg-gray-300 animate-pulse rounded"></div>
                    </div>
                  </div>
                ) : (
                  // Button asli, hanya tampil jika tidak loading
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2 cursor-pointer ${
                      isUserMenuOpen
                        ? "bg-background shadow-sm"
                        : "hover:bg-background"
                    } transition-colors duration-300`}
                    disabled={isLoadingProfile} // Disable saat loading
                  >
                    <img
                      src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${profile?.name}`}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover border-2 border-primary-500"
                    />
                    <div className="flex flex-col text-left">
                      <span
                        className={`text-sm font-semibold text-secondary-700`}
                      >
                        {profile?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {profile?.email}
                      </span>
                    </div>
                  </button>
                )}

                <div
                  className={`absolute z-50 right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 transform origin-top-right transition-all duration-300 ${
                    isUserMenuOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="bg-linear-to-br from-primary-50 to-white rounded-t-2xl p-6 border-b border-gray-200/50">
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${profile?.name}`}
                        alt={"User Avatar"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="text-lg font-semibold text-secondary-700">
                        {profile?.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        PT Tata Metal Lestari
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <Link
                      to="/account"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200"
                    >
                      <UserCircleGearIcon
                        className="w-5 h-5"
                        weight="duotone"
                      />
                      <span className="font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      {isLoadingLogout ? (
                        <SpinnerBallIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <SignOutIcon className="w-5 h-5" weight="duotone" />
                      )}
                      <span className="font-medium text-sm">Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-background min-h-[calc(100vh-64px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
