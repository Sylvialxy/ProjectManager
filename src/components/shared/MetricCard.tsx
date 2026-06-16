type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  accent?: "default" | "rose" | "amber" | "emerald" | "sky";
};

const accentBorder: Record<string, string> = {
  default: "border-white/10",
  rose:    "border-rose-500/30",
  amber:   "border-amber-500/30",
  emerald: "border-emerald-500/30",
  sky:     "border-sky-500/30",
};

const accentIcon: Record<string, string> = {
  default: "border-white/10 bg-white/5 text-slate-200",
  rose:    "border-rose-500/30 bg-rose-500/15 text-rose-200",
  amber:   "border-amber-500/30 bg-amber-500/15 text-amber-200",
  emerald: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  sky:     "border-sky-500/30 bg-sky-500/15 text-sky-200",
};

export default function MetricCard({ icon, label, value, helper, accent = "default" }: Props) {
  return (
    <div className={`rounded-2xl border ${accentBorder[accent]} bg-white/5 p-4 shadow-lg shadow-slate-950/20`}>
      <div className="mb-3 flex items-center justify-between text-slate-300">
        <span className="text-sm">{label}</span>
        <span className={`rounded-xl border p-2 ${accentIcon[accent]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-xs text-slate-400">{helper}</div>
    </div>
  );
}
