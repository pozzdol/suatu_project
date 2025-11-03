import logoApp from "@/assets/logoApp.png";
import { GearIcon, HouseIcon } from "@phosphor-icons/react";

interface LayoutProps {
  children: React.ReactNode;
  isActive: string;
}

function Layout({ children, isActive }: LayoutProps) {
  const sidebarMenu = [
    { title: "Dashboard", link: "/app", icon: "HouseIcon" },
    { title: "Settings", link: "/app/settings", icon: "GearIcon" },
  ];
  console.log("isActive:", isActive);
  const icons = {
    HouseIcon: HouseIcon,
    GearIcon: GearIcon,
  };

  return (
    <div className="bg-background">
      <div className="flex w-screen max-w-screen h-screen overflow-hidden">
        <div className="w-64 mx-4 h-[calc(100vh-1.5rem)] my-auto space-y-4">
          <div className="mt-1 flex items-center gap-3 h-16">
            <img src={logoApp} alt="Logo" className="w-10 h-10" />
            <div className="text-2xl font-medium text-gray-800">Test App</div>
          </div>
          <nav>
            <ul className="space-y-2">
              {sidebarMenu.map((menu) => {
                console.log(JSON.stringify(menu));
                const Icon = icons[menu.icon as keyof typeof icons];
                return (
                  <li key={menu.title}>
                    <a
                      href={menu.link}
                      className={`flex items-center gap-2 font-medium ${
                        isActive === menu.link
                          ? "text-gray-600 bg-white"
                          : "text-gray-800"
                      } hover:text-gray-600 hover:bg-white/60 rounded-lg px-3 py-2 transition-colors duration-200`}
                    >
                      <Icon
                        size={24}
                        weight="duotone"
                        className="text-primary"
                      />
                      {menu.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="w-full mr-4 space-y-4">
          <div className="mt-4 rounded-2xl h-16 bg-white text-gray-800 flex items-center px-4">
            <h1 className="font-medium">My Application</h1>
          </div>
          <div className="bg-white rounded-2xl p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
