interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon: React.ReactNode;
}

export default function StatCard({ label, value, delta, deltaPositive, icon }: Props) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-cream-300 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {delta && (
          <p
            className={`mt-1 text-xs font-medium ${
              deltaPositive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {deltaPositive ? "▲" : "▼"} {delta}
          </p>
        )}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/8 text-navy">
        {icon}
      </div>
    </div>
  );
}
