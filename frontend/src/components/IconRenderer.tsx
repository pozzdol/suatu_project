import {
  AppWindowIcon,
  BowlFoodIcon,
  BriefcaseIcon,
  BuildingApartmentIcon,
  BuildingIcon,
  DatabaseIcon,
  EnvelopeOpenIcon,
  FlagIcon,
  ForkKnifeIcon,
  GearIcon,
  HouseIcon,
  KeyIcon,
  PackageIcon,
  ShoppingBagIcon,
  ShrimpIcon,
  TruckIcon,
  UserCircleGearIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { BellSimpleIcon } from "@phosphor-icons/react/dist/ssr";

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
    Building: BuildingIcon,
    BuildingApartment: BuildingApartmentIcon,
    BowlFood: BowlFoodIcon,
    Database: DatabaseIcon,
    EnvelopeOpen: EnvelopeOpenIcon,
    Flag: FlagIcon,
    Package: PackageIcon,
    ShoppingBag: ShoppingBagIcon,
    Shrimp: ShrimpIcon,
    Truck: TruckIcon,
    BellSimple: BellSimpleIcon,
    ForkKnife: ForkKnifeIcon,
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
