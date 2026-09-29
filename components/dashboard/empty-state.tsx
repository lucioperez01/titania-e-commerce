import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-xl ${
        isCompact ? "py-10 px-6" : "py-16 px-8"
      }`}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
        <Icon
          className={`${
            isCompact ? "w-32 h-32" : "w-40 h-40"
          } text-purple-400`}
          strokeWidth={0.8}
        />
      </div>

      <div className="relative flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/20 ${
            isCompact ? "p-3" : "p-4"
          }`}
        >
          <Icon
            className={`${
              isCompact ? "w-8 h-8" : "w-10 h-10"
            } text-purple-300`}
          />
        </div>

        <h3
          className={`font-semibold text-white text-center ${
            isCompact ? "mt-4 text-base" : "mt-6 text-lg"
          }`}
        >
          {title}
        </h3>

        <p
          className={`text-slate-300 text-center max-w-sm ${
            isCompact ? "mt-1.5 text-sm" : "mt-2 text-base"
          }`}
        >
          {description}
        </p>

        {action && (
          <div className="mt-6">
            {action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                {action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
