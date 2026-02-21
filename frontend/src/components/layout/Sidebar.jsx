import { Home, FolderKanban, BookText, MessageSquare, Brain, Settings, Zap } from "lucide-react";
import { Link, useLocation } from "react-router";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FolderKanban, label: "Projects", path: "/upload" },
  { icon: Brain, label: "AI Analysis", path: "/analysis" },
  { icon: BookText, label: "Dictionary", path: "/dictionary" },
  { icon: MessageSquare, label: "Chat", path: "/chat" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-ds-surface-solid/50 backdrop-blur-xl border-r border-ds-border flex flex-col z-20">
      
      {/* Logo */}
      <div className="p-6 border-b border-ds-border">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 bg-ds-primary rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 bg-ds-primary rounded-full blur-sm opacity-60" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-ds-text-primary to-ds-primary bg-clip-text text-transparent">
            DataSense AI
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 relative group
                ${
                  isActive
                    ? "bg-ds-primary/10 text-ds-primary"
                    : "text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface"
                }
              `}
            >
              {isActive && (
                <>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-ds-primary rounded-r-full" />
                  <div className="absolute inset-0 bg-ds-glow/20 rounded-lg blur-md pointer-events-none" />
                </>
              )}
              <Icon className="w-5 h-5 relative z-10 flex-shrink-0" />
              <span className="relative z-10 text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Separator */}
        <div className="pt-2 mt-2 border-t border-ds-border">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-surface"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Turgon AI Badge */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-br from-ds-secondary/10 to-ds-primary/5 border border-ds-secondary/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-ds-secondary flex-shrink-0" />
            <span className="text-xs font-bold text-ds-secondary uppercase tracking-wider">Built on Turgon AI</span>
          </div>
          <p className="text-xs text-ds-text-muted leading-relaxed">
            Powered by a multi-agent pipeline — Atlas, Sage & Guardian work together to deliver production-grade data documentation.
          </p>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-ds-border">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-ds-surface cursor-pointer transition-colors group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ds-primary to-ds-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ds-text-primary truncate">
              John Doe
            </div>
            <div className="text-xs text-ds-text-muted truncate">
              john@company.com
            </div>
          </div>
          <Settings className="w-4 h-4 text-ds-text-muted group-hover:text-ds-text-primary transition-colors flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}