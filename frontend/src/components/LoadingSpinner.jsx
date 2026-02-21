export function LoadingSpinner({ size = "md" }) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className={`${sizeMap[size]} rounded-full border-2 border-ds-border`} />
        <div
          className={`${sizeMap[size]} absolute inset-0 rounded-full border-2 border-ds-primary border-t-transparent animate-spin`}
        />
        <div className="absolute inset-0 bg-ds-glow rounded-full blur-md opacity-40" />
      </div>
    </div>
  );
}