import {
  AppWindowIcon,
  BriefcaseIcon,
  GearIcon,
  HouseIcon,
  KeyIcon,
  UserCircleGearIcon,
  WrenchIcon,
} from "@phosphor-icons/react";

interface IconRendererProps {
  name: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
  className?: string;
}

export function IconRenderer({
  name,
  size = 24,
  weight = "duotone",
  color,
  className = "",
  ...props
}: IconRendererProps) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    House: HouseIcon,
    Gear: GearIcon,
    AppWindow: AppWindowIcon,
    Briefcase: BriefcaseIcon,
    UserCircleGear: UserCircleGearIcon,
    Wrench: WrenchIcon,
    Key: KeyIcon,
  };

  const Icon = iconMap[name] || AppWindowIcon; // Default ke AppWindowIcon jika tidak ditemukan

  return (
    <Icon
      size={size}
      weight={weight}
      className={`${color || "text-primary-500"} ${className}`}
      {...props}
    />
  );
}

export default IconRenderer;
