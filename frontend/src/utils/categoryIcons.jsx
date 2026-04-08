import {
  Wrench, Zap, Sparkles, Paintbrush, Hammer, Truck,
  MoreHorizontal, Grid3X3, Settings, Sofa, Bike,
  Wind, TreePine, Home, UtensilsCrossed, Tv, PenTool,
  CircleDot, Droplets, PaintBucket
} from 'lucide-react';

export const categoryIcons = {
  plumbing: Wrench,
  bolt: Zap,
  electrical: Zap,
  cleaning: Sparkles,
  cleaning_services: Sparkles,
  format_paint: Paintbrush,
  painting: Paintbrush,
  carpenter: Hammer,
  carpentry: Hammer,
  local_shipping: Truck,
  moving: Truck,
  handyman: CircleDot,
  repair: Wrench,
  more: MoreHorizontal,
  grid_view: Grid3X3,
  settings: Settings,
  furniture: Sofa,
  assembly: Bike,
  hvac: Wind,
  ac_unit: Wind,
  gardening: TreePine,
  grass: TreePine,
  landscaping: TreePine,
  roofing: Home,
  kitchen: UtensilsCrossed,
  appliance: Tv,
  pest: PenTool,
  droplets: Droplets,
  'water-drop': Droplets,
  'paint-bucket': PaintBucket,
};

export const getCategoryIcon = (iconName, defaultSize = 24) => {
  const IconComponent = categoryIcons[iconName?.toLowerCase()] || MoreHorizontal;
  return <IconComponent size={defaultSize} />;
};

export const defaultCategories = [
  { name: 'Plumbing', icon: 'plumbing', color: 'bg-blue-50 text-blue-600' },
  { name: 'Electrical', icon: 'bolt', color: 'bg-yellow-50 text-yellow-600' },
  { name: 'Cleaning', icon: 'cleaning', color: 'bg-purple-50 text-purple-600' },
  { name: 'Painting', icon: 'format_paint', color: 'bg-pink-50 text-pink-600' },
  { name: 'Carpentry', icon: 'carpenter', color: 'bg-amber-50 text-amber-700' },
  { name: 'Moving', icon: 'moving', color: 'bg-green-50 text-green-600' },
  { name: 'Repair', icon: 'repair', color: 'bg-red-50 text-red-500' },
  { name: 'More', icon: 'more', color: 'bg-slate-100 text-slate-500' },
];
