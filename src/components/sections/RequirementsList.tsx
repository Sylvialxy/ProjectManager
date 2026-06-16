import { useMemo, useState } from "react";
import { CheckCircle2, Search, Trash2 } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import AnomalyBanner from "@/components/shared/AnomalyBanner";
import { cn } from "@/lib/utils";
import {
  formatDayValue,
  getCurrentStage,
  getPriorityTone,
  getStageTone,
  sortProjects,
} from "@/utils";
import { STAGES } from "@/constants";
import type { DemandType, ProjectPriority, StageType } from "@/types";

const DONE_STAGES = new Set<StageType>(["已集成", "已上线"]);

export default function RequirementsList() {
  const data = useDataStore((s) => s.data);
  const projects = useMemo(() => sortProjects(data.projects), [data.projects]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<DemandType | "全部">("全部");
  const [filterPriority, setFilterPriority] = useState<ProjectPriority | "全部">("全部");
  const [filterDirection, setFilterDirection] = useState<string>("全部");
  const [filterStage, setFilterStage] = useState<StageType | "全部">("全部");
  const [showCompleted, setShowCompleted] = useState(false);
  const [modalId, setModalId] = useState<string | null>(null);

  const modalProject = useMemo(
    () => (modalId ? data.projects.find((p) => p.id === modalId) ?? null : null),
    [modalId, data.projects]
  );

  const allDirections = useMemo(
    () => ["全部", ...data.directions, "技术需求"],
    [data.directions]
  );

  const filtered = useMemo(() => {
    let result = projects;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.businessDirection ?? "").toLowerCase().includes(q) ||
          p.version.toLowerCase().includes(q) ||
          p.note.toLowerCase().includes(q)
      );
    }
    if (filterType !== "全部") result = result.filter((p) => p.demandType === filterType);
    if (filterPriority !== "全部") result = result.filter((p) => p.priority === filterPriority);
    if (filterDirection !== "全部") {
      if (filterDirection === "技术需求") {
        result = result.filter((p) => p.demandType === "技术需求");
      } else {
        result = result.filter((p) => p.businessDirection === filterDirection);
      }
    }
    if (filterStage !== "全部") {
      result = result.filter((p) => getCurrentStage(p) === filterStage);
    }
    return result;
  }, [projects, search, filterType, filterPriority, filterDirection, filterStage]);

  // Split by done stage
  const activeFiltered = useMemo(
    () => filtered.filter((p) => !DONE_STAGES.has(getCurrentStage(p))),
    [filtered]
  );
  const doneFiltered = useMemo(
    () => filtered.filter((p) => DONE_STAGES.has(getCurrentStage(p))),
    [filtered]
  );

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => !DONE_STAGES.has(getCurrentStage(p))).length,
      done: projects.filter((p) => DONE_STAGES.has(getCurrentStage(p))).length,
      p0: projects.filter((p) => p.priority === "P0" && !DONE_STAGES.has(getCurrentStage(p))).length,
    }),
    [projects]
  );

  return (
    <section className="space-y-6">
      {modalProject && (
        <ProjectDetailModal project={modalProject} onClose={() => setModalId(null)} />
      )}
      <AnomalyBanner />

      {/* 概览数字 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "全部需求", value: stats.total, cls: "text-white" },
          { label: "进行中", value: stats.active, cls: "text-sky-300" },
          { label: "已完成", value: stats.done, cls: "text-emerald-300" },
          { label: "P0 进行中", value: stats.p0, cls: "text-rose-300" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur">
            <div className={cn("text-3xl font-bold", cls)}>{value}</div>
            <div className="mt-0.5 text-xs text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索名称、备注、版本号…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as DemandType | "全部")}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40">
            <option value="全部">全部类型</option>
            <option value="业务需求">业务需求</option>
            <option value="技术需求">技术需求</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as ProjectPriority | "全部")}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40">
            <option value="全部">全部优先级</option>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
          </select>
          <select value={filterDirection} onChange={(e) => setFilterDirection(e.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40">
            {allDirections.map((d) => (
              <option key={d} value={d}>{d === "全部" ? "全部方向" : d}</option>
            ))}
          </select>
          <select value={filterStage} onChange={(e) => setFilterStage(e.target.value as StageType | "全部")}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40">
            <option value="全部">全部阶段</option>
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          进行中 {activeFiltered.length} · 已完成 {doneFiltered.length}，点击可查看详情
        </div>
      </div>

      {/* ── 进行中 ── */}
      <div className="space-y-3">
        {activeFiltered.length === 0 && doneFiltered.length === 0 && (
          <EmptyState title="暂无匹配结果" description="调整筛选条件或清空搜索关键词重试。" />
        )}
        {activeFiltered.length === 0 && doneFiltered.length > 0 && (
          <EmptyState title="进行中需求为空" description="所有匹配需求已完成。" />
        )}
        {activeFiltered.map((project) => (
          <ProjectCard key={project.id} project={project} members={data.members}
            onClick={() => setModalId(project.id)} />
        ))}
      </div>

      {/* ── 已完成 折叠区 ── */}
      {doneFiltered.length > 0 && (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-200">
                已完成（已集成 / 已上线）
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300">
                {doneFiltered.length} 个
              </span>
            </div>
            <span className="text-xs text-emerald-400">{showCompleted ? "收起" : "展开"}</span>
          </button>
          {showCompleted && (
            <div className="space-y-3 px-5 pb-5">
              {doneFiltered.map((project) => (
                <ProjectCard key={project.id} project={project} members={data.members}
                  onClick={() => setModalId(project.id)} done />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Shared card component ────────────────────────────────────────────────────

interface CardProps {
  project: ReturnType<typeof sortProjects>[number];
  members: { id: string; name: string; role: string }[];
  onClick: () => void;
  done?: boolean;
}

function ProjectCard({ project, members, onClick, done = false }: CardProps) {
  const deleteProject = useDataStore((s) => s.deleteProject);
  const readOnly = useDataStore((s) => s.readOnly);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stage = getCurrentStage(project);
  const memberIds = new Set<string>();
  project.phases.forEach((ph) => ph.assignments.forEach((a) => memberIds.add(a.memberId)));
  const memberNames = [...memberIds]
    .map((id) => members.find((m) => m.id === id)?.name)
    .filter(Boolean) as string[];

  const isP0 = project.priority === "P0";

  return (
    <div className={cn(
      "group relative w-full rounded-2xl border transition",
      done
        ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
        : isP0
        ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/20"
        : "border-white/10 bg-white/5"
    )}>
      {/* Main clickable area */}
      <button
        type="button"
        onClick={onClick}
        className="w-full p-4 text-left hover:brightness-110 transition"
      >
        {/* P0 accent bar */}
        {isP0 && !done && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_6px_2px_rgba(251,113,133,0.5)]" />
            <span className="text-xs font-bold tracking-wide text-rose-300">P0 · 最高优先级</span>
          </div>
        )}

        <div className="flex flex-wrap items-start gap-3 pr-20">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-xs", getPriorityTone(project.priority))}>
                {project.priority}
              </span>
              <span className={cn("truncate text-sm font-medium", isP0 && !done ? "text-rose-50" : "text-white")}>
                {project.name}
              </span>
              {project.version && (
                <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">
                  {project.version}
                </span>
              )}
              {project.owner && (
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-200">
                  Owner: {project.owner}
                </span>
              )}
              {project.inPool && !project.consumedAt && (
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-200">
                  需求池
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>{project.demandType}</span>
              {project.businessDirection && <span>{project.businessDirection}</span>}
              {project.startDate && <span>开始：{project.startDate}</span>}
              <span>交付：{project.deliveryDate}</span>
              {project.workEndDate && <span>人力结束：{project.workEndDate}</span>}
              <span>工作量：{formatDayValue(project.workloadDays)} 天</span>
              {memberNames.length > 0 && <span>参与：{memberNames.join("、")}</span>}
            </div>
            {project.note && (
              <div className="mt-1.5 truncate text-xs text-slate-500">{project.note}</div>
            )}
          </div>
          <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs", getStageTone(stage))}>
            {stage}
          </span>
        </div>
      </button>

      {/* Delete button — sits outside the main button to avoid nesting */}
      {!readOnly && (
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => deleteProject(project.id)}
                className="rounded-lg border border-rose-500/50 bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/30"
              >
                确认删除
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10"
              >
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-500 opacity-0 transition hover:border-rose-500/30 hover:text-rose-400 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
