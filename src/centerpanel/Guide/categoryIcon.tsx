import React from "react";
import {
  BarChart3,
  Globe2,
  Satellite,
  Building2,
  Bus,
  Trees,
  Wallet,
  Box,
  Database,
  FileText,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "Spatial Statistics": BarChart3,
  "Network Analysis": Globe2,
  "Remote Sensing": Satellite,
  "Urban Morphology": Building2,
  "Transport Planning": Bus,
  "Environmental Analysis": Trees,
  Socioeconomic: Wallet,
  "3D & Simulation": Box,
  "Data Engineering": Database,
};

export function CategoryIcon({
  category,
  size = 14,
  className,
}: {
  category: string | undefined | null;
  size?: number;
  className?: string;
}): React.ReactElement {
  const Comp = (category && ICON_MAP[category]) || FileText;
  return <Comp size={size} {...(className ? { className } : {})} />;
}
