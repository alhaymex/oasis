import type { CatalogSiteSummary } from "@/shared/types";
import { Globe, BookOpen, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

const iconMap: Record<string, React.ReactNode> = {
  globe: <Globe className="w-10 h-10" />,
  book: <BookOpen className="w-10 h-10" />,
  vial: <FlaskConical className="w-10 h-10" />,
};

interface SiteCardProps {
  site: CatalogSiteSummary;
}

export default function SiteCard({ site }: SiteCardProps) {
  const icon = iconMap[site.icon] ?? <Globe className="w-10 h-10" />;

  return (
    <Link
      to={`/browse/${site.id}`}
      className="group relative flex flex-col w-full max-w-[12rem] cursor-pointer transition-transform duration-300 hover:-translate-y-1 focus:outline-none"
    >
      <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden shadow-lg ring-1 ring-[var(--color-border)] group-hover:ring-[var(--color-primary)] transition-all duration-300">
        <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/50 to-transparent z-10" />

        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface)] via-[#15303f] to-[var(--color-bg)]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full p-5 gap-4">
          <div className="text-[var(--color-primary)] opacity-80 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
          <span className="text-sm font-bold text-[var(--color-accent)] text-center leading-tight line-clamp-2">
            {site.name}
          </span>
          <span className="text-xs text-[var(--color-muted)] text-center leading-snug line-clamp-3">
            {site.description}
          </span>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
      </div>

      <span className="mt-2 text-xs text-[var(--color-muted)] text-center">
        {site.variantCount} {site.variantCount === 1 ? "version" : "versions"}
      </span>
    </Link>
  );
}
