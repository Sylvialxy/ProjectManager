type Props = { title: string; description: string };

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
      <div className="font-medium text-slate-200">{title}</div>
      <div className="mt-2 leading-6">{description}</div>
    </div>
  );
}
