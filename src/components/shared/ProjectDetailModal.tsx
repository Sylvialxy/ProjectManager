import { useEffect, useState } from "react";
import { ArrowRight, Crown, Edit2, ExternalLink, Plus, Save, Trash2, X, XCircle } from "lucide-react";
import { useDataStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  createId,
  formatDayValue,
  getCurrentStage,
  getMissingPhaseDates,
  getNextStage,
  getPriorityTone,
  getStageTone,
  toIsoDate,
} from "@/utils";
import { PRIORITIES, STAGES } from "@/constants";
import type { Assignment, DemandType, Project, ProjectPhase, ProjectPriority, StageType } from "@/types";

interface Props {
  project: Project;
  onClose: () => void;
  initialEditing?: boolean;
  onDiscard?: () => void; // 新建取消时丢弃草稿
}

const STAGE_ORDER: StageType[] = [
  "需求粗评", "需求方案制定", "开发中", "联调中", "测试中", "已集成", "已上线",
];

export default function ProjectDetailModal({ project, onClose, initialEditing, onDiscard }: Props) {
  const data = useDataStore((s) => s.data);
  const readOnly = useDataStore((s) => s.readOnly);
  const { updateProject, advanceStage } = useDataStore();

  const [isEditing, setIsEditing] = useState(initialEditing ?? false);
  const [hasSaved, setHasSaved] = useState(false);
  // 只读模式下强制禁用编辑模式
  const effectiveEditing = isEditing && !readOnly;
  const [draft, setDraft] = useState<Project>(project);

  useEffect(() => {
    if (!isEditing) setDraft(project);
  }, [project]); // eslint-disable-line react-hooks/exhaustive-deps

  // True when this is a new-project modal that hasn't been saved yet
  const isNewUnsaved = !!(initialEditing && !hasSaved && onDiscard);

  function handleClose() {
    if (isNewUnsaved) { onDiscard!(); } else { onClose(); }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewUnsaved]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Top-level field setter ──────────────────────────────────────────────────
  function set<K extends keyof Project>(key: K, val: Project[K]) {
    setDraft((p) => ({ ...p, [key]: val }));
  }

  // ── Phase / assignment draft helpers ──────────────────────────────────────
  function setPhase(phaseId: string, updater: (ph: ProjectPhase) => ProjectPhase) {
    setDraft((d) => ({ ...d, phases: d.phases.map((ph) => ph.id === phaseId ? updater(ph) : ph) }));
  }

  function addDraftPhase() {
    const today = toIsoDate(new Date());
    const newPhase: ProjectPhase = {
      id: createId("phase"),
      name: "新阶段",
      stage: "需求粗评",
      startDate: today,
      endDate: draft.deliveryDate,
      assignments: [],
    };
    setDraft((d) => ({ ...d, phases: [...d.phases, newPhase] }));
  }

  function removeDraftPhase(phaseId: string) {
    setDraft((d) => ({ ...d, phases: d.phases.filter((ph) => ph.id !== phaseId) }));
  }

  function addDraftAssignment(phaseId: string) {
    const defaultMember = data.members[0];
    if (!defaultMember) return;
    const assignment: Assignment = {
      id: createId("assign"),
      memberId: defaultMember.id,
      plannedDays: 1,
      actualDays: 0,
    };
    setPhase(phaseId, (ph) => ({ ...ph, assignments: [...ph.assignments, assignment] }));
  }

  function removeDraftAssignment(phaseId: string, assignmentId: string) {
    setPhase(phaseId, (ph) => ({
      ...ph,
      assignments: ph.assignments.filter((a) => a.id !== assignmentId),
    }));
  }

  function updateDraftAssignment(
    phaseId: string, assignmentId: string, updater: (a: Assignment) => Assignment
  ) {
    setPhase(phaseId, (ph) => ({
      ...ph,
      assignments: ph.assignments.map((a) => a.id === assignmentId ? updater(a) : a),
    }));
  }

  // ── Save / cancel ──────────────────────────────────────────────────────────
  function handleSave() {
    updateProject(draft.id, () => draft);
    setHasSaved(true);
    setIsEditing(false);
  }
  function handleCancel() {
    if (isNewUnsaved) { onDiscard!(); return; }
    setDraft(project);
    setIsEditing(false);
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const p = effectiveEditing ? draft : project;
  const currentStage = getCurrentStage(p);
  const currentStageIdx = STAGE_ORDER.indexOf(currentStage);
  const missingDates = getMissingPhaseDates(p);

  const nextStage = getNextStage(currentStage);
  const REQUIRES_MANPOWER = new Set<StageType>(["开发中", "联调中"]);
  const hasManpower = p.phases
    .filter((ph) => ph.stage === currentStage)
    .some((ph) => ph.assignments.length > 0);
  const canQuickAdvance = !REQUIRES_MANPOWER.has(currentStage) || hasManpower;

  const totalPlanned = p.phases.reduce(
    (s, ph) => s + ph.assignments.reduce((ss, a) => ss + a.plannedDays, 0), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 border-b border-white/10 p-5">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", getPriorityTone(p.priority))}>
                {p.priority}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                {p.demandType}
              </span>
              {p.businessDirection && (
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-200">
                  {p.businessDirection}
                </span>
              )}
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", getStageTone(currentStage))}>
                {currentStage}
              </span>
              {p.owner && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-200">
                  <Crown className="h-3 w-3" /> {p.owner}
                </span>
              )}
            </div>
            {effectiveEditing ? (
              <input value={draft.name} onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-lg font-semibold text-white outline-none focus:border-sky-500/40" />
            ) : (
              <h2 className="text-lg font-semibold leading-snug text-white">{project.name}</h2>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {effectiveEditing ? (
              <>
                <button type="button" onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/30">
                  <Save className="h-3.5 w-3.5" /> 保存
                </button>
                <button type="button" onClick={handleCancel}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10">
                  <XCircle className="h-3.5 w-3.5" /> 取消
                </button>
              </>
            ) : !readOnly && (
              <button type="button" onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20">
                <Edit2 className="h-3.5 w-3.5" /> 编辑
              </button>
            )}
            <button type="button" onClick={handleClose}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">

          {/* 阶段进度 */}
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">阶段进度</div>
            <div className="flex items-start">
              {STAGE_ORDER.map((stage, idx) => (
                <div key={stage} className="flex flex-1 items-start">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-3 w-3 rounded-full border-2 transition-all",
                      idx < currentStageIdx ? "border-emerald-400 bg-emerald-400"
                        : idx === currentStageIdx ? "border-sky-400 bg-sky-400 ring-2 ring-sky-400/30"
                          : "border-white/20 bg-transparent"
                    )} />
                    <span className={cn(
                      "mt-1.5 w-12 text-center text-[10px] leading-tight",
                      idx <= currentStageIdx ? "text-slate-200" : "text-slate-500"
                    )}>
                      {stage}
                    </span>
                  </div>
                  {idx < STAGE_ORDER.length - 1 && (
                    <div className={cn("mt-1.5 h-px flex-1", idx < currentStageIdx ? "bg-emerald-400/60" : "bg-white/10")} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 快捷流转 */}
          {!effectiveEditing && !readOnly && nextStage && (
            <div className="flex items-center gap-3">
              {canQuickAdvance ? (
                <button
                  type="button"
                  onClick={() => advanceStage(project.id)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200 transition hover:bg-sky-500/20"
                >
                  流转至 {nextStage} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-500 cursor-not-allowed">
                  流转至 {nextStage} <ArrowRight className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs text-amber-400">需先填写人力投入</span>
                </div>
              )}
            </div>
          )}

          {/* 缺少阶段排期警告 */}
          {missingDates.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <span className="font-medium">⚠ 需补充阶段排期：</span>
              {missingDates.join("、")} —— 进入开发中后需明确各阶段时间
            </div>
          )}

          {/* 基本信息 */}
          <div>
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">基本信息</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="优先级">
                {effectiveEditing ? (
                  <select value={draft.priority} onChange={(e) => set("priority", e.target.value as ProjectPriority)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none">
                    {PRIORITIES.map((pr) => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                ) : (
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", getPriorityTone(project.priority))}>
                    {project.priority}
                  </span>
                )}
              </Field>

              <Field label="需求类型">
                {effectiveEditing ? (
                  <select value={draft.demandType} onChange={(e) => set("demandType", e.target.value as DemandType)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none">
                    <option value="业务需求">业务需求</option>
                    <option value="技术需求">技术需求</option>
                  </select>
                ) : (
                  <span className="text-sm text-slate-200">{project.demandType}</span>
                )}
              </Field>

              {(p.demandType === "业务需求") && (
                <Field label="业务方向">
                  {effectiveEditing ? (
                    <select value={draft.businessDirection ?? ""}
                      onChange={(e) => set("businessDirection", e.target.value || null)}
                      className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none">
                      <option value="">未指定</option>
                      {data.directions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <span className="text-sm text-slate-200">{project.businessDirection ?? "未指定"}</span>
                  )}
                </Field>
              )}

              <Field label="版本号">
                {effectiveEditing ? (
                  <input value={draft.version} onChange={(e) => set("version", e.target.value)}
                    placeholder="如 0528"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40" />
                ) : (
                  <span className="text-sm text-slate-200">{project.version || "—"}</span>
                )}
              </Field>

              <Field label="交付日期">
                {effectiveEditing ? (
                  <input type="date" value={draft.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40" />
                ) : (
                  <span className="text-sm text-slate-200">{project.deliveryDate}</span>
                )}
              </Field>

              <Field label="开始日期（进入开发后填写）">
                {effectiveEditing ? (
                  <input type="date" value={draft.startDate ?? ""}
                    onChange={(e) => set("startDate", e.target.value || null)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40" />
                ) : (
                  <span className="text-sm text-slate-200">{project.startDate ?? "—"}</span>
                )}
              </Field>

              <Field label="人力结束日期（进测试后填写）">
                {effectiveEditing ? (
                  <input type="date" value={draft.workEndDate ?? ""}
                    onChange={(e) => set("workEndDate", e.target.value || null)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40" />
                ) : (
                  <span className="text-sm text-slate-200">{project.workEndDate ?? "—"}</span>
                )}
              </Field>

              <Field label="总工作量">
                {effectiveEditing ? (
                  <input type="number" min={0} step={0.5} value={draft.workloadDays}
                    onChange={(e) => set("workloadDays", Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40" />
                ) : (
                  <span className="text-sm text-slate-200">
                    {formatDayValue(project.workloadDays)} 天（已排 {formatDayValue(totalPlanned)} 天）
                  </span>
                )}
              </Field>
            </div>

            {(effectiveEditing || !!project.ddp) && (
              <div className="mt-3">
                <Field label="DDP / 文档链接">
                  {effectiveEditing ? (
                    <input value={draft.ddp} onChange={(e) => set("ddp", e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40" />
                  ) : (
                    <a href={project.ddp} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-sky-400 transition hover:text-sky-300">
                      {project.ddp} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                </Field>
              </div>
            )}

            {(effectiveEditing || !!project.note) && (
              <div className="mt-3 space-y-1.5">
                <div className="text-xs text-slate-400">备注</div>
                {effectiveEditing ? (
                  <textarea value={draft.note} onChange={(e) => set("note", e.target.value)}
                    rows={2} placeholder="内部沟通记录、风险点等"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40" />
                ) : (
                  <p className="text-sm text-slate-300">{project.note}</p>
                )}
              </div>
            )}

            {(effectiveEditing || !!project.description) && (
              <div className="mt-3 space-y-1.5">
                <div className="text-xs text-slate-400">需求说明</div>
                {effectiveEditing ? (
                  <textarea value={draft.description} onChange={(e) => set("description", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40" />
                ) : (
                  <p className="text-sm text-slate-300">{project.description}</p>
                )}
              </div>
            )}
          </div>

          {/* ── 成员投入 ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                成员投入
                {totalPlanned > 0 && (
                  <span className="ml-2 normal-case text-sky-300">{formatDayValue(totalPlanned)} 人天</span>
                )}
              </div>
              {effectiveEditing && (
                <button type="button" onClick={addDraftPhase}
                  className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/10">
                  <Plus className="h-3 w-3" /> 添加阶段
                </button>
              )}
            </div>

            {p.phases.length === 0 && !effectiveEditing && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-500">
                暂无阶段排期，点击「编辑」添加。
              </div>
            )}

            <div className="space-y-3">
              {p.phases.map((phase) => {
                const phaseTotal = phase.assignments.reduce((s, a) => s + a.plannedDays, 0);
                return (
                  <div key={phase.id} className="rounded-xl border border-white/10 bg-white/5">
                    {/* Phase header */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-3 py-2">
                      {effectiveEditing ? (
                        <>
                          <input
                            value={phase.name}
                            onChange={(e) => setPhase(phase.id, (ph) => ({ ...ph, name: e.target.value }))}
                            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-sky-500/40"
                          />
                          <select
                            value={phase.stage}
                            onChange={(e) => setPhase(phase.id, (ph) => ({ ...ph, stage: e.target.value as StageType }))}
                            className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none"
                          >
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <input type="date" value={phase.startDate}
                            onChange={(e) => setPhase(phase.id, (ph) => ({ ...ph, startDate: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-sky-500/40" />
                          <span className="text-xs text-slate-500">~</span>
                          <input type="date" value={phase.endDate}
                            onChange={(e) => setPhase(phase.id, (ph) => ({ ...ph, endDate: e.target.value }))}
                            className="rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-sky-500/40" />
                          <button type="button" onClick={() => removeDraftPhase(phase.id)}
                            className="ml-auto rounded-lg border border-rose-500/30 bg-rose-500/10 p-1 text-rose-400 transition hover:bg-rose-500/20">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={cn("rounded-full border px-2 py-0.5 text-xs", getStageTone(phase.stage))}>
                            {phase.stage}
                          </span>
                          <span className="text-sm font-medium text-white">{phase.name}</span>
                          <span className="ml-auto text-xs text-slate-400">
                            {phase.startDate} ~ {phase.endDate}
                            {phaseTotal > 0 && <span className="ml-2 text-sky-300">{formatDayValue(phaseTotal)} 人天</span>}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Assignments */}
                    <div className="p-3 space-y-1.5">
                      {phase.assignments.map((a) => {
                        const member = data.members.find((m) => m.id === a.memberId);
                        const isOwner = p.owner === (member?.name ?? "");

                        return effectiveEditing ? (
                          <div key={a.id} className="flex items-center gap-1.5">
                            {/* Member select */}
                            <select
                              value={a.memberId}
                              onChange={(e) => updateDraftAssignment(phase.id, a.id, (ass) => ({ ...ass, memberId: e.target.value }))}
                              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-white outline-none focus:border-sky-500/40"
                            >
                              {data.members.map((m) => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                              ))}
                            </select>
                            {/* Planned */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">计划</span>
                              <input
                                type="number" min={0} step={0.5} value={a.plannedDays}
                                onChange={(e) => updateDraftAssignment(phase.id, a.id, (ass) => ({ ...ass, plannedDays: Number(e.target.value) || 0 }))}
                                className="w-14 rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-white outline-none focus:border-sky-500/40"
                              />
                              <span className="text-[10px] text-slate-500">天</span>
                            </div>
                            {/* Actual */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500">实际</span>
                              <input
                                type="number" min={0} step={0.5} value={a.actualDays}
                                onChange={(e) => updateDraftAssignment(phase.id, a.id, (ass) => ({ ...ass, actualDays: Number(e.target.value) || 0 }))}
                                className="w-14 rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-white outline-none focus:border-sky-500/40"
                              />
                              <span className="text-[10px] text-slate-500">天</span>
                            </div>
                            {/* Set as owner */}
                            <button
                              type="button"
                              title={isOwner ? "取消 Owner" : "设为 Owner"}
                              onClick={() => set("owner", isOwner ? null : (member?.name ?? null))}
                              className={cn(
                                "rounded-lg border p-1.5 transition",
                                isOwner
                                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                  : "border-white/10 bg-white/5 text-slate-500 hover:text-amber-300 hover:border-amber-500/30"
                              )}
                            >
                              <Crown className="h-3.5 w-3.5" />
                            </button>
                            {/* Delete */}
                            <button type="button"
                              onClick={() => removeDraftAssignment(phase.id, a.id)}
                              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-500 transition hover:border-rose-500/30 hover:text-rose-400">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* View mode assignment chip */
                          <div key={a.id}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5",
                              isOwner
                                ? "border-amber-500/30 bg-amber-500/10"
                                : "border-white/10 bg-white/5"
                            )}>
                            {isOwner && <Crown className="h-3 w-3 text-amber-400" />}
                            <span className="text-xs font-medium text-white">{member?.name ?? "?"}</span>
                            <span className="text-xs text-slate-400">{member?.role}</span>
                            <span className="text-xs text-sky-300">{formatDayValue(a.plannedDays)} 天</span>
                            {a.actualDays > 0 && (
                              <span className="text-xs text-emerald-300">实 {formatDayValue(a.actualDays)} 天</span>
                            )}
                          </div>
                        );
                      })}

                      {/* Add assignment button (edit mode only) */}
                      {effectiveEditing && (
                        <button type="button" onClick={() => addDraftAssignment(phase.id)}
                          className="mt-1 inline-flex items-center gap-1 rounded-lg border border-dashed border-white/20 bg-transparent px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-sky-500/40 hover:text-sky-300">
                          <Plus className="h-3 w-3" /> 添加成员
                        </button>
                      )}

                      {phase.assignments.length === 0 && !effectiveEditing && (
                        <span className="text-xs text-slate-500">暂无成员分配</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 需求池状态 */}
          {(project.inPool || !!project.consumedAt) && (
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">需求池状态</div>
              {project.consumedAt ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
                  已于 {project.consumedAt} 由 {project.consumedBy ?? "—"} 消化
                </div>
              ) : (
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-200">
                  在需求池中，入池：{project.pooledAt ?? "—"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-1.5 text-xs text-slate-400">{label}</div>
      <div>{children}</div>
    </div>
  );
}
