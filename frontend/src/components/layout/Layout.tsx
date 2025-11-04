import logoApp from "@/assets/logoApp.png";
import requestApi from "@/utils/api";
import { logout } from "@/utils/auth";
import {
  AppWindowIcon,
  CaretUpIcon,
  GearIcon,
  HouseIcon,
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
  const [sidebarMenu, setSidebarMenu] = useState<MenuItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);
  const navigate = useNavigate();

  const fetchMenu = async () => {
    try {
      const response = await requestApi.get<any>("/general/setup/windows");

      if (response.data.success) {
        setSidebarMenu(response.data.data.menuList);
      } else {
        console.error("Failed to fetch menu:", response.data.message);
        toast.error("Failed to fetch menu");
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      toast.error("Failed to fetch menu");
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

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

  const renderMenuItem = (menu: MenuItem, isSub: boolean = false) => {
    const Icon = getIcon(menu.icon);
    const isExpanded = expandedGroups.has(menu.id);
    const isGroup = menu.type === "group";

    return (
      <li key={menu.id}>
        {isGroup ? (
          <button
            onClick={() => toggleGroup(menu.id)}
            className={`flex items-center gap-2 font-medium w-full text-left ${
              isActive === menu.url ? "text-gray-600 bg-white" : "text-gray-800"
            } hover:text-gray-600 hover:bg-white/60 rounded-lg px-3 py-2 transition-colors duration-200 cursor-pointer`}
          >
            <Icon size={24} weight="duotone" className="text-primary-500" />
            {menu.name}
            <CaretUpIcon
              size={16}
              className={`ml-auto ${
                isExpanded ? "" : "rotate-180"
              } transition-transform duration-200`}
            />
          </button>
        ) : (
          <a
            href={menu.url}
            className={`flex items-center gap-2 font-medium ${
              isActive === menu.url ? "text-gray-600 bg-white" : "text-gray-800"
            } hover:text-gray-600 hover:bg-white/60 rounded-lg px-3 py-2 transition-colors duration-200 ${
              isSub ? "ml-4" : ""
            }`}
          >
            <Icon size={24} weight="duotone" className="text-primary-500" />
            {menu.name}
          </a>
        )}
        {isGroup && menu.subMenu && (
          <ul
            className={`ml-4 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
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
        <div className="w-64 mx-4 h-[calc(100vh-1.5rem)] my-auto space-y-4">
          <div className="mt-1 flex items-center gap-3 h-16">
            <img src={logoApp} alt="Logo" className="w-10 h-10" />
            <div className="text-2xl font-medium text-gray-800">
              {import.meta.env.VITE_APP_NAME}
            </div>
          </div>
          <nav>
            <ul className="space-y-2">
              {sidebarMenu.map((menu) => renderMenuItem(menu))}
            </ul>
          </nav>
        </div>
        <div className="w-full mr-4 space-y-4">
          <div className="mt-4 rounded-2xl h-16 bg-white text-gray-800 flex items-center pl-4 pr-2">
            <div className="">
              <h1 className="font-medium">My Application</h1>
            </div>
            <div className="ml-auto flex items-center gap-2 h-full py-2">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2 cursor-pointer ${
                    isUserMenuOpen
                      ? "bg-background shadow-sm"
                      : "hover:bg-background"
                  } transition-colors duration-300`}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=udin`}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover border-2 border-primary-500"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-gray-800">
                      udin
                    </span>
                    <span className="text-xs text-gray-500">
                      udin@example.com
                    </span>
                  </div>
                </button>

                <div
                  className={`absolute z-50 right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 transform origin-top-right transition-all duration-300 ${
                    isUserMenuOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="bg-linear-to-br from-primary-50 via-background to-white rounded-t-2xl p-6 border-b border-gray-200/50">
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={`https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=udin`}
                        alt={"User Avatar"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="text-lg font-semibold text-gray-800">
                        udin
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
          <div className="bg-white rounded-2xl p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
