import { useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, X } from "lucide-react";
import { useDataStore } from "@/store";
import { cn } from "@/lib/utils";
import { isAnomalous, getCurrentStage, getNextStage, getMissingPhaseDates } from "@/utils";

export default function AnomalyBanner() {
  const data = useDataStore((s) => s.data);
  const { advanceStage } = useDataStore();

  const anomalous = data.projects.filter(isAnomalous);

  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  // projectId → confirm pending
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // track which ones just advanced this session
  const [advanced, setAdvanced] = useState<Set<string>>(new Set());

  if (anomalous.length === 0 || dismissed) return null;

  const visible = anomalous.filter((p) => !advanced.has(p.id));
  if (visible.length === 0) return null;

  function handleAdvance(projectId: string) {
    advanceStage(projectId);
    setAdvanced((prev) => new Set([...prev, projectId]));
    setConfirmId(null);
  }

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-sm font-semibold text-amber-200">
            {visible.length} 个需求存在流转异常（已超交付日期但未进入测试阶段）
          </span>
          {expanded
            ? <ChevronUp className="h-4 w-4 shrink-0 text-amber-400" />
            : <ChevronDown className="h-4 w-4 shrink-0 text-amber-400" />
          }
        </button>
        <button type="button" onClick={() => setDismissed(true)}
          className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-300 transition hover:bg-amber-500/20">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Item list */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {visible.map((project) => {
            const currentStage = getCurrentStage(project);
            const nextStage = getNextStage(currentStage);
            const missingDates = getMissingPhaseDates(project);
            const isConfirming = confirmId === project.id;

            return (
              <div key={project.id}
                className={cn(
                  "rounded-2xl border p-3 transition",
                  project.priority === "P0"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-amber-500/20 bg-amber-500/5"
                )}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-bold",
                        project.priority === "P0"
                          ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                      )}>
                        {project.priority}
                      </span>
                      <span className="text-sm font-medium text-white">{project.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>当前阶段：<span className="text-amber-300">{currentStage}</span></span>
                      <span>交付日期：<span className="text-rose-300">{project.deliveryDate}</span></span>
                      {nextStage && (
                        <span className="flex items-center gap-1">
                          流转至
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-sky-300">{nextStage}</span>
                        </span>
                      )}
                    </div>
                    {missingDates.length > 0 && (
                      <div className="mt-1.5 text-xs text-amber-400">
                        ⚠ 进入开发中后需补充阶段日期：{missingDates.join("、")}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {isConfirming ? (
                      <>
                        <button type="button" onClick={() => handleAdvance(project.id)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> 确认流转
                        </button>
                        <button type="button" onClick={() => setConfirmId(null)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10">
                          取消
                        </button>
                      </>
                    ) : (
                      nextStage && (
                        <button type="button" onClick={() => setConfirmId(project.id)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-200 transition hover:bg-sky-500/20">
                          流转至 {nextStage} <ArrowRight className="h-3 w-3" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
