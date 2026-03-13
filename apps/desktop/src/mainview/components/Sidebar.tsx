import {
  BookMarked,
  BookOpen,
  Library,
  NotepadText,
  Palette,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const topItems = [
  {
    title: "Library",
    icon: Library,
    tooltip: "Your Library",
    url: "/library",
  },
  {
    title: "Browse",
    icon: BookOpen,
    tooltip: "Browse Sites",
    url: "/browse",
  },
  {
    title: "Favorites",
    icon: BookMarked,
    tooltip: "Your Favorites",
    url: "/favorites",
  },
  {
    title: "Notes",
    icon: NotepadText,
    tooltip: "Your Notes",
    url: "/notes",
  },
];

const bottomItems = [
  {
    title: "Theme",
    icon: Palette,
    tooltip: "Change Theme",
    url: "/theme",
  },
  {
    title: "Settings",
    icon: Settings,
    tooltip: "Settings",
    url: "/settings",
  },
];

function Sidebar() {
  return (
    <div
      className="sticky top-0 left-0 h-screen w-16 flex flex-col items-center py-4 border-r"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Top Items */}
      <div className="flex flex-col items-center gap-3 flex-1">
        {topItems.map((i) => (
          <SidebarIcon key={i.title} icon={i.icon} tooltip={i.tooltip} url={i.url} />
        ))}
      </div>

      {/* Bottom Items */}
      <div className="flex flex-col items-center gap-3">
        {bottomItems.map((i) => (
          <SidebarIcon key={i.title} icon={i.icon} tooltip={i.tooltip} url={i.url} />
        ))}
      </div>
    </div>
  );
}

function SidebarIcon({
  icon: Icon,
  tooltip,
  url,
}: {
  icon: LucideIcon;
  tooltip: string;
  url: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === url;

  return (
    <Link to={url} className="group relative flex items-center justify-center">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors duration-200"
        style={{
          color: isActive ? "var(--color-secondary)" : "var(--color-primary)",
          backgroundColor: isActive ? "var(--color-border)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-border)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Icon className="w-6 h-6" />
      </div>

      {/* Tooltip */}
      <div
        className="absolute left-full ml-2 px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-accent)",
          border: "1px solid var(--color-border)",
        }}
      >
        {tooltip}
        {/* Arrow */}
        <div
          className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
          style={{ borderRightColor: "var(--color-border)" }}
        />
      </div>
    </Link>
  );
}

export default Sidebar;
