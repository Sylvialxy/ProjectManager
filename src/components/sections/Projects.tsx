import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { formatDayValue, getPriorityTone, getStageTone, getCurrentStage, toIsoDate, sortProjects } from "@/utils";
import { STAGES, ACTIVE_STAGES, PRIORITIES } from "@/constants";
import type { DemandType, ProjectPriority, StageType } from "@/types";

export default function Projects() {
  const data = useDataStore((s) => s.data);
  const sortedProjects = useMemo(() => sortProjects(data.projects), [data.projects]);
  const {
    addProject, updateProject, deleteProject,
    addPhase, updatePhase, deletePhase,
    addAssignment, updateAssignment, deleteAssignment,
  } = useDataStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => sortedProjects[0]?.id ?? null
  );
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(
    () => sortedProjects[0]?.phases[0]?.id ?? null
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedProjects;
    return sortedProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.businessDirection ?? "").toLowerCase().includes(q) ||
        p.priority.toLowerCase().includes(q)
    );
  }, [sortedProjects, search]);

  const businessProjects = filtered.filter((p) => p.demandType === "业务需求");
  const techProjects = filtered.filter((p) => p.demandType === "技术需求");

  const selectedProject = sortedProjects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedPhase = selectedProject?.phases.find((ph) => ph.id === selectedPhaseId) ?? null;

  function handleAddProject(type: DemandType) {
    const id = addProject(type);
    setSelectedProjectId(id);
    setSelectedPhaseId(null);
  }

  function handleDeleteProject(id: string) {
    deleteProject(id);
    if (selectedProjectId === id) {
      const next = sortedProjects.find((p) => p.id !== id);
      setSelectedProjectId(next?.id ?? null);
      setSelectedPhaseId(next?.phases[0]?.id ?? null);
    }
  }

  function handleAddPhase(projectId: string) {
    const id = addPhase(projectId);
    setSelectedPhaseId(id);
  }

  function handleDeletePhase(projectId: string, phaseId: string) {
    deletePhase(projectId, phaseId);
    if (selectedPhaseId === phaseId) {
      const project = sortedProjects.find((p) => p.id === projectId);
      const remaining = project?.phases.filter((ph) => ph.id !== phaseId) ?? [];
      setSelectedPhaseId(remaining[0]?.id ?? null);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
      {/* 左侧：需求列表 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
        <div className="mb-4">
          <div className="text-lg font-semibold text-white">需求列表</div>
          <div className="text-sm text-slate-400">P0 默认优先，按交付日期排序</div>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索需求名称 / 优先级 / 方向"
          className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40"
        />

        {/* 业务需求 */}
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-white">业务需求</div>
            <button type="button" onClick={() => handleAddProject("业务需求")} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10">
              + 新增
            </button>
          </div>
          <div className="space-y-2">
            {businessProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedProjectId(p.id); setSelectedPhaseId(p.phases[0]?.id ?? null); }}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition",
                  selectedProjectId === p.id
                    ? "border-sky-500/40 bg-sky-500/15"
                    : p.priority === "P0"
                    ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/20 hover:bg-rose-500/15"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{p.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{p.businessDirection ?? "未指定方向"}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(p.priority))}>{p.priority}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs", getStageTone(getCurrentStage(p)))}>{getCurrentStage(p)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">交付：{p.deliveryDate}{p.version && <span className="ml-2 text-slate-400">{p.version} 版本</span>}</div>
              </button>
            ))}
            {!businessProjects.length && <EmptyState title="暂无业务需求" description="点击「+ 新增」添加业务需求。" />}
          </div>
        </div>

        {/* 技术需求 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-white">技术需求</div>
            <button type="button" onClick={() => handleAddProject("技术需求")} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10">
              + 新增
            </button>
          </div>
          <div className="space-y-2">
            {techProjects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedProjectId(p.id); setSelectedPhaseId(p.phases[0]?.id ?? null); }}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition",
                  selectedProjectId === p.id
                    ? "border-sky-500/40 bg-sky-500/15"
                    : p.priority === "P0"
                    ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/20 hover:bg-rose-500/15"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{p.name}</div>
                    <div className="mt-0.5 text-xs text-slate-400">技术需求</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(p.priority))}>{p.priority}</span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-xs", getStageTone(getCurrentStage(p)))}>{getCurrentStage(p)}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">交付：{p.deliveryDate}</div>
              </button>
            ))}
            {!techProjects.length && <EmptyState title="暂无技术需求" description="点击「+ 新增」添加技术需求。" />}
          </div>
        </div>
      </div>

      {/* 右侧：需求详情编辑 */}
      {selectedProject ? (
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">需求基本信息</div>
                <div className="text-sm text-slate-400">完善版本号、交付日期等基础字段</div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
              >
                <Trash2 className="h-4 w-4" /> 删除需求
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">需求名称</span>
                <input
                  value={selectedProject.name}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">优先级</span>
                <select
                  value={selectedProject.priority}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, priority: e.target.value as ProjectPriority }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                >
                  {PRIORITIES.map((pr) => <option key={pr} value={pr}>{pr}</option>)}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">需求类型</span>
                <select
                  value={selectedProject.demandType}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({
                    ...p,
                    demandType: e.target.value as DemandType,
                    businessDirection: e.target.value === "业务需求" ? (p.businessDirection ?? data.directions[0] ?? null) : null,
                  }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                >
                  <option value="业务需求">业务需求</option>
                  <option value="技术需求">技术需求</option>
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">业务方向</span>
                <select
                  value={selectedProject.businessDirection ?? ""}
                  disabled={selectedProject.demandType === "技术需求"}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, businessDirection: e.target.value || null }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-sky-500/40"
                >
                  {selectedProject.demandType === "技术需求" && <option value="">— 技术需求无方向 —</option>}
                  {data.directions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">开始日期（进入开发后填写）</span>
                <input
                  type="date"
                  value={selectedProject.startDate ?? ""}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, startDate: e.target.value || null }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">交付日期</span>
                <input
                  type="date"
                  value={selectedProject.deliveryDate}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, deliveryDate: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">人力投入结束日期</span>
                <input
                  type="date"
                  value={selectedProject.workEndDate ?? ""}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, workEndDate: e.target.value || null }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                  placeholder="可选，进测试后结束"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">版本号</span>
                <input
                  value={selectedProject.version}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, version: e.target.value }))}
                  placeholder="如 0528"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-sky-500/40"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">需求 Owner（选填）</span>
                <select
                  value={selectedProject.owner ?? ""}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, owner: e.target.value || null }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                >
                  <option value="">— 未指定 —</option>
                  {data.members.map((m) => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">总工作量（天）</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={selectedProject.workloadDays}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, workloadDays: Number(e.target.value) || 0 }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-500/40"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-slate-300">DDP / 设计文档链接</span>
                <input
                  value={selectedProject.ddp}
                  onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, ddp: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-sky-500/40"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-1.5">
              <span className="text-sm text-slate-300">需求说明</span>
              <textarea
                value={selectedProject.description}
                onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-sky-500/40"
              />
            </label>

            <label className="mt-4 block space-y-1.5">
              <span className="text-sm text-slate-300">备注</span>
              <textarea
                value={selectedProject.note}
                onChange={(e) => updateProject(selectedProject.id, (p) => ({ ...p, note: e.target.value }))}
                rows={2}
                placeholder="内部沟通记录、风险点等"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-sky-500/40"
              />
            </label>
          </div>

          {/* 阶段管理 */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white">阶段管理</div>
                <div className="text-sm text-slate-400">开发中 / 联调中 计入全人力占用</div>
              </div>
              <button
                type="button"
                onClick={() => handleAddPhase(selectedProject.id)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              >
                <Plus className="h-4 w-4" /> 新增阶段
              </button>
            </div>
            <div className="space-y-3">
              {selectedProject.phases.map((phase) => {
                const active = ACTIVE_STAGES.has(phase.stage);
                const selected = selectedPhaseId === phase.id;
                return (
                  <div
                    key={phase.id}
                    className={cn("rounded-2xl border p-4", selected ? "border-sky-500/40 bg-sky-500/10" : "border-white/10 bg-white/5")}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <button type="button" onClick={() => setSelectedPhaseId(phase.id)} className="text-left">
                        <div className="font-medium text-white">{phase.name}</div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {active ? "计入全人力占用" : "仅展示排期，不计入占用"}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhase(selectedProject.id, phase.id)}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <input
                        value={phase.name}
                        onChange={(e) => updatePhase(selectedProject.id, phase.id, (ph) => ({ ...ph, name: e.target.value }))}
                        placeholder="阶段名"
                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      />
                      <select
                        value={phase.stage}
                        onChange={(e) => updatePhase(selectedProject.id, phase.id, (ph) => ({ ...ph, stage: e.target.value as StageType }))}
                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      >
                        {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="date"
                        value={phase.startDate}
                        onChange={(e) => updatePhase(selectedProject.id, phase.id, (ph) => ({ ...ph, startDate: e.target.value }))}
                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      />
                      <input
                        type="date"
                        value={phase.endDate}
                        onChange={(e) => updatePhase(selectedProject.id, phase.id, (ph) => ({ ...ph, endDate: e.target.value }))}
                        className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      />
                    </div>
                  </div>
                );
              })}
              {!selectedProject.phases.length && <EmptyState title="暂无阶段" description="先添加阶段，再录入成员投入。" />}
            </div>
          </div>

          {/* 成员投入录入 */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-white">成员投入录入</div>
                <div className="text-sm text-slate-400">
                  {selectedPhase
                    ? `当前阶段：${selectedPhase.name}（${selectedPhase.stage}）`
                    : "请先从上方选择一个阶段"}
                </div>
              </div>
              {selectedPhase && (
                <button
                  type="button"
                  onClick={() => addAssignment(selectedProject.id, selectedPhase.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" /> 新增成员
                </button>
              )}
            </div>

            {!selectedPhase && <EmptyState title="未选择阶段" description="请先点击上方阶段选择一个阶段。" />}

            {selectedPhase && (
              <div className="space-y-3">
                {selectedPhase.assignments.map((assignment) => (
                  <div key={assignment.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
                    <label className="space-y-1">
                      <span className="text-xs text-slate-400">成员</span>
                      <select
                        value={assignment.memberId}
                        onChange={(e) => updateAssignment(selectedProject.id, selectedPhase.id, assignment.id, (a) => ({ ...a, memberId: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      >
                        {data.members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-slate-400">计划人天</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={assignment.plannedDays}
                        onChange={(e) => updateAssignment(selectedProject.id, selectedPhase.id, assignment.id, (a) => ({ ...a, plannedDays: Number(e.target.value) || 0 }))}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-slate-400">实际人天</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={assignment.actualDays}
                        onChange={(e) => updateAssignment(selectedProject.id, selectedPhase.id, assignment.id, (a) => ({ ...a, actualDays: Number(e.target.value) || 0 }))}
                        className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
                      />
                    </label>
                    <div className="flex items-end gap-2">
                      <span className={cn("rounded-2xl border px-3 py-3 text-xs", ACTIVE_STAGES.has(selectedPhase.stage) ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300")}>
                        {ACTIVE_STAGES.has(selectedPhase.stage) ? "100%" : "0%"}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteAssignment(selectedProject.id, selectedPhase.id, assignment.id)}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!selectedPhase.assignments.length && <EmptyState title="暂无成员投入" description="点击「新增成员」录入 iOS / Android 成员投入。" />}
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState title="未选择需求" description="从左侧列表选择一个需求开始编辑。" />
      )}
    </section>
  );
}
