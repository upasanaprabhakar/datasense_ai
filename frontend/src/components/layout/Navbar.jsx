import { Search, Bell } from "lucide-react";

export function Navbar() {
  return (
    <div className="h-16 border-b border-ds-border bg-ds-surface-solid/30 backdrop-blur-xl relative z-10">
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ds-primary/40 to-transparent" />

      <div className="h-full px-6 flex items-center justify-between gap-6">
        
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search across all dictionaries..."
              className="
                w-full bg-ds-surface border border-ds-border rounded-lg
                pl-10 pr-4 py-2 text-sm text-ds-text-primary
                placeholder:text-ds-text-muted
                focus:outline-none focus:ring-2 focus:ring-ds-primary/40 focus:border-ds-primary/60
                transition-all duration-200
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2 rounded-lg hover:bg-ds-surface transition-colors group">
            <Bell className="w-5 h-5 text-ds-text-muted group-hover:text-ds-text-primary transition-colors" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-ds-error rounded-full animate-pulse" />
          </button>

          {/* User Avatar */}
          <button className="w-8 h-8 rounded-full bg-gradient-to-br from-ds-primary to-ds-secondary flex items-center justify-center text-xs font-bold text-white hover:scale-105 transition-transform">
            UP
          </button>
        </div>
      </div>
    </div>
  );
}