export function GlowButton({
  children,
  icon: Icon,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  disabled = false,
}) {
  const sizeMap = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const variantMap = {
    primary:
      "bg-gradient-to-r from-ds-primary to-ds-secondary text-white " +
      "shadow-[0_0_15px_rgba(99,102,241,0.3)] " +
      "hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-[1.02]",
    secondary:
      "bg-ds-surface border border-ds-border text-ds-text-primary " +
      "hover:border-ds-primary/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:scale-[1.02]",
    outline:
      "border border-ds-primary text-ds-primary " +
      "hover:bg-ds-primary/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:scale-[1.02]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center
        rounded-lg font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${sizeMap[size]}
        ${variantMap[variant]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      {children}
    </button>
  );
}