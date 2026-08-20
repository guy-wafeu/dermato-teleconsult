import React from "react";
import { Circle, Line, Path, Rect, Svg } from "react-native-svg";

// Petit jeu d'icônes maison en traits (style "line icons"), pour éviter une
// dépendance supplémentaire (react-native-vector-icons) juste pour une dizaine de
// pictos utilisés dans les écrans splash / onboarding / login / accueil.
export type IconName =
  | "mail"
  | "lock"
  | "eye"
  | "eyeOff"
  | "bell"
  | "arrowRight"
  | "chevronRight"
  | "message"
  | "document"
  | "calendar"
  | "user"
  | "bulb"
  | "shieldCheck"
  | "folder"
  | "camera"
  | "clock"
  | "clipboard"
  | "checkCircle"
  | "logout"
  | "plus"
  | "users"
  | "menu"
  | "home"
  | "search";

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const common = { stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderPaths(name, common, color)}
    </Svg>
  );
}

function renderPaths(name: IconName, common: Record<string, unknown>, color: string) {
  switch (name) {
    case "mail":
      return (
        <>
          <Rect x={3} y={5} width={18} height={14} rx={2.5} {...common} />
          <Path d="M4 6.5L12 13L20 6.5" {...common} />
        </>
      );
    case "lock":
      return (
        <>
          <Rect x={4.5} y={10.5} width={15} height={10} rx={2.5} {...common} />
          <Path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" {...common} />
        </>
      );
    case "eye":
      return (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" {...common} />
          <Circle cx={12} cy={12} r={3} {...common} />
        </>
      );
    case "eyeOff":
      return (
        <>
          <Path d="M3.5 3.5L20.5 20.5" {...common} />
          <Path
            d="M6.2 6.9C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.1-.4 4.3-1.1M9.9 5.7C10.6 5.6 11.3 5.5 12 5.5c6 0 9.5 6.5 9.5 6.5s-.8 1.5-2.3 3"
            {...common}
          />
          <Path d="M9.9 10a3 3 0 0 0 4.2 4.2" {...common} />
        </>
      );
    case "bell":
      return (
        <>
          <Path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14.5 6 10.5Z" {...common} />
          <Path d="M10.3 19a1.9 1.9 0 0 0 3.4 0" {...common} />
        </>
      );
    case "arrowRight":
      return (
        <>
          <Line x1={4.5} y1={12} x2={18.5} y2={12} {...common} />
          <Path d="M13 6.5L18.5 12L13 17.5" {...common} />
        </>
      );
    case "chevronRight":
      return <Path d="M9 5.5L15.5 12L9 18.5" {...common} />;
    case "message":
      return (
        <Path
          d="M4 5.5h16v10.5H9.5L5 20V16H4V5.5Z"
          {...common}
        />
      );
    case "document":
      return (
        <>
          <Path d="M6.5 3.5h8L19 8v12.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" {...common} />
          <Path d="M9 13h6M9 16.5h6" {...common} />
        </>
      );
    case "calendar":
      return (
        <>
          <Rect x={3.5} y={5.5} width={17} height={15} rx={2} {...common} />
          <Path d="M3.5 10h17M8 3.5v3M16 3.5v3" {...common} />
        </>
      );
    case "user":
      return (
        <>
          <Circle cx={12} cy={8.5} r={3.5} {...common} />
          <Path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" {...common} />
        </>
      );
    case "bulb":
      return (
        <>
          <Path d="M9 18h6M10 21h4" {...common} />
          <Path d="M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3.5Z" {...common} />
        </>
      );
    case "shieldCheck":
      return (
        <>
          <Path d="M12 3.5l7 2.7v5.4c0 4.6-3 7.8-7 9-4-1.2-7-4.4-7-9V6.2l7-2.7Z" {...common} />
          <Path d="M9 12l2 2 4-4.3" {...common} />
        </>
      );
    case "folder":
      return (
        <>
          <Path d="M3.5 7a1 1 0 0 1 1-1H10l2 2h7.5a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7Z" {...common} />
          <Circle cx={12} cy={15} r={2.4} fill={color} stroke="none" />
        </>
      );
    case "camera":
      return (
        <>
          <Path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" {...common} />
          <Circle cx={12} cy={13} r={3.3} {...common} />
        </>
      );
    case "clock":
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} {...common} />
          <Path d="M12 7.5V12l3 2" {...common} />
        </>
      );
    case "clipboard":
      return (
        <>
          <Rect x={5.5} y={4.5} width={13} height={16} rx={2} {...common} />
          <Path d="M9 4.5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v.5" {...common} />
          <Path d="M8.5 11h7M8.5 15h7" {...common} />
        </>
      );
    case "checkCircle":
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} {...common} />
          <Path d="M8.5 12.3l2.4 2.4 4.6-5" {...common} />
        </>
      );
    case "logout":
      return (
        <>
          <Path d="M9.5 20H5.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" {...common} />
          <Path d="M14 16l4.5-4L14 8" {...common} />
          <Line x1={18.5} y1={12} x2={9} y2={12} {...common} />
        </>
      );
    case "plus":
      return <Path d="M12 5v14M5 12h14" {...common} />;
    case "users":
      return (
        <>
          <Circle cx={9} cy={8.2} r={3} {...common} />
          <Path d="M3 19c.9-3.2 3-5 6-5s5.1 1.8 6 5" {...common} />
          <Path d="M15.5 6a3 3 0 0 1 0 5.8" {...common} />
          <Path d="M17 14.3c2 .5 3.3 2 4 4.7" {...common} />
        </>
      );
    case "menu":
      return (
        <>
          <Line x1={4} y1={7} x2={20} y2={7} {...common} />
          <Line x1={4} y1={12} x2={20} y2={12} {...common} />
          <Line x1={4} y1={17} x2={20} y2={17} {...common} />
        </>
      );
    case "home":
      return (
        <>
          <Path d="M4 11.5L12 4l8 7.5" {...common} />
          <Path d="M6 10v9.5a1 1 0 0 0 1 1h3.5v-6h3v6H17a1 1 0 0 0 1-1V10" {...common} />
        </>
      );
    case "search":
      return (
        <>
          <Circle cx={10.5} cy={10.5} r={6.5} {...common} />
          <Line x1={15.3} y1={15.3} x2={20} y2={20} {...common} />
        </>
      );
    default:
      return null;
  }
}
