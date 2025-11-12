import {
  AppWindowIcon,
  BriefcaseIcon,
  GearIcon,
  HouseIcon,
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
  };

  const Icon = iconMap[name] || HouseIcon; // Default ke HouseIcon jika tidak ditemukan

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
