import { ReactNode } from "react";

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export default function Card({ title, children, className = "", action }: Props) {
  return (
    <div
      className={`rounded-xl border border-cream-300 bg-white shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
          {title && (
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          )}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
