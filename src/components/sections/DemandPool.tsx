import { useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2, Clock, Inbox } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import { cn } from "@/lib/utils";
import { formatDayValue, getPriorityTone, toDate, sortProjects } from "@/utils";

export default function DemandPool() {
  const data = useDataStore((s) => s.data);
  const readOnly = useDataStore((s) => s.readOnly);
  const { addToPool, removeFromPool, consumeProject } = useDataStore();
  const sortedProjects = useMemo(() => sortProjects(data.projects), [data.projects]);

  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [consumeMember, setConsumeMember] = useState("");
  const [modalId, setModalId] = useState<string | null>(null);
  const modalProject = useMemo(
    () => (modalId ? data.projects.find((p) => p.id === modalId) ?? null : null),
    [modalId, data.projects]
  );

  const poolProjects = useMemo(() => {
    return data.projects
      .filter((p) => p.inPool && !p.consumedAt)
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority === "P0" ? -1 : 1;
        return toDate(a.pooledAt ?? a.workloadDate).getTime() - toDate(b.pooledAt ?? b.workloadDate).getTime();
      });
  }, [data.projects]);

  const unscheduled = useMemo(() => {
    return sortedProjects.filter((p) => !p.inPool && p.phases.length === 0 && !p.consumedAt);
  }, [sortedProjects]);

  function handleConsume(projectId: string) {
    const name = consumeMember.trim() || (data.members[0]?.name ?? "未指定");
    consumeProject(projectId, name);
    setConsumingId(null);
    setConsumeMember("");
  }

  return (
    <section className="space-y-6">
      {modalProject && (
        <ProjectDetailModal project={modalProject} onClose={() => setModalId(null)} />
      )}
      {/* 待消化需求池 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">需求池</div>
            <div className="text-sm text-slate-400">P0 优先，同优先级按入池时间排序</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            <span>共 {poolProjects.length} 个待消化</span>
          </div>
        </div>

        {poolProjects.length === 0 ? (
          <EmptyState title="需求池为空" description="从下方「待排期需求」将需求拎入需求池。" />
        ) : (
          <div className="space-y-3">
            {poolProjects.map((project) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => setModalId(project.id)}
                onKeyDown={(e) => e.key === "Enter" && setModalId(project.id)}
                className={cn(
                  "cursor-pointer rounded-2xl border p-4 transition hover:brightness-110",
                  project.priority === "P0" ? "border-rose-500/30 bg-rose-500/5" : "border-white/10 bg-white/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(project.priority))}>
                        {project.priority}
                      </span>
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-200">
                        {project.demandType}
                      </span>
                      {project.businessDirection && (
                        <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-200">
                          {project.businessDirection}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-medium text-white">{project.name}</div>
                    {project.description && (
                      <div className="mt-1 text-xs text-slate-400">{project.description}</div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>入池：{project.pooledAt}</span>
                      <span>工作量：{formatDayValue(project.workloadDays)} 天</span>
                      <span>交付：{project.deliveryDate}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {consumingId === project.id ? (
                      <div className="flex flex-col gap-2">
                        <select
                          value={consumeMember}
                          onChange={(e) => setConsumeMember(e.target.value)}
                          className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="">选择消化负责人</option>
                          {data.members.map((m) => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleConsume(project.id)}
                            className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/30"
                          >
                            确认消化
                          </button>
                          <button
                            type="button"
                            onClick={() => setConsumingId(null)}
                            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : !readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConsumingId(project.id)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
                        >
                          <CheckCircle2 className="h-3 w-3" /> 消化
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromPool(project.id)}
                          className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> 移出
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 待排期需求（未入池） */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
        <div className="mb-4 text-lg font-semibold text-white">待排期需求</div>
        <div className="space-y-3">
          {unscheduled.map((project) => (
            <div key={project.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(project.priority))}>
                    {project.priority}
                  </span>
                  <span className="font-medium text-white">{project.name}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {project.demandType} · 交付：{project.deliveryDate}
                </div>
              </div>
              {!readOnly && (
              <button
                type="button"
                onClick={() => addToPool(project.id)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 transition hover:bg-sky-500/20"
              >
                <Inbox className="h-3 w-3" /> 入需求池
              </button>
              )}
            </div>
          ))}
          {unscheduled.length === 0 && (
            <EmptyState title="暂无待排期需求" description="所有需求已在需求池中或已进入排期阶段。" />
          )}
        </div>
      </div>
    </section>
  );
}
