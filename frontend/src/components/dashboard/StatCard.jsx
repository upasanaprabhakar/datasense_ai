export function StatCard({ icon: Icon, label, value, trend, color = "primary" }) {
  const colorMap = {
    primary: {
      iconBg: "bg-ds-primary/10",
      iconText: "text-ds-primary",
      hoverBorder: "hover:border-ds-primary/40",
      hoverGlow: "group-hover:shadow-[0_0_24px_rgba(99,102,241,0.15)]",
    },
    secondary: {
      iconBg: "bg-ds-secondary/10",
      iconText: "text-ds-secondary",
      hoverBorder: "hover:border-ds-secondary/40",
      hoverGlow: "group-hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]",
    },
    success: {
      iconBg: "bg-ds-success/10",
      iconText: "text-ds-success",
      hoverBorder: "hover:border-ds-success/40",
      hoverGlow: "group-hover:shadow-[0_0_24px_rgba(34,197,94,0.15)]",
    },
  };

  const c = colorMap[color];

  return (
    <div className="relative group cursor-default">
      <div
        className={`
          relative bg-ds-surface backdrop-blur-xl border border-ds-border rounded-xl p-6
          transition-all duration-300 hover:-translate-y-0.5
          ${c.hoverBorder} ${c.hoverGlow}
        `}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${c.iconBg}`}>
            {Icon && <Icon className={`w-5 h-5 ${c.iconText}`} />}
          </div>
          {trend && (
            <span className="text-xs font-medium text-ds-success bg-ds-success/10 px-2 py-1 rounded-full">
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-ds-text-primary font-heading">
            {value}
          </div>
          <div className="text-sm text-ds-text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}