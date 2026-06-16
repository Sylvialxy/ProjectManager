import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
};

export default function SectionButton({ active, icon, label, badge, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition",
        active
          ? "border-sky-500/40 bg-sky-500/15 text-white shadow-lg shadow-sky-950/30"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white",
      )}
    >
      <span className="shrink-0 text-slate-200">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
