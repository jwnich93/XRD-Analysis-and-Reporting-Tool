import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function DashboardCard({ title, children, action, className = "" }: Props) {
  return (
    <div className={`rounded-xl border border-cream-300 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-cream-300 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
