"use client";

export function GlassPanel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.1] p-4 backdrop-blur-xl ${className}`}
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.04) inset, 0 12px 40px rgba(0,0,0,0.25)",
      }}
    >
      {title && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/75">
          {title}
        </p>
      )}
      <div className={title ? "mt-2.5" : undefined}>{children}</div>
    </div>
  );
}
