import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, Users, Zap } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import MetricCard from "@/components/shared/MetricCard";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import { cn } from "@/lib/utils";
import {
  buildMemberCapacity,
  formatDayValue,
  getSaturationTone,
  getStageTone,
} from "@/utils";
import { ACTIVE_STAGES } from "@/constants";

export default function Capacity() {
  const data = useDataStore((s) => s.data);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalId, setModalId] = useState<string | null>(null);
  const modalProject = useMemo(
    () => (modalId ? data.projects.find((p) => p.id === modalId) ?? null : null),
    [modalId, data.projects]
  );

  const capacityList = useMemo(
    () => buildMemberCapacity(data.members, data.projects),
    [data.members, data.projects]
  );

  const iosCapacity = capacityList.filter((c) => c.member.role === "iOS");
  const androidCapacity = capacityList.filter((c) => c.member.role === "Android");

  const avgSaturation = capacityList.length > 0
    ? Math.round(capacityList.reduce((s, c) => s + c.saturation, 0) / capacityList.length)
    : 0;

  const overloadedCount = capacityList.filter((c) => c.isOverloaded).length;
  const totalPlanned = capacityList.reduce((s, c) => s + c.plannedDays, 0);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <section className="space-y-6">
      {modalProject && (
        <ProjectDetailModal project={modalProject} onClose={() => setModalId(null)} />
      )}

      {/* 汇总指标 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="团队人数"
          value={`${data.members.length} 人`}
          helper={`iOS ${iosCapacity.length} · Android ${androidCapacity.length}`}
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="平均饱和度"
          value={`${avgSaturation}%`}
          helper="基准：未来 20 天"
          accent={avgSaturation > 100 ? "rose" : avgSaturation >= 80 ? "amber" : "emerald"}
        />
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="超载成员"
          value={`${overloadedCount} 人`}
          helper={`总计划人天 ${formatDayValue(totalPlanned)} 天`}
          accent={overloadedCount > 0 ? "rose" : "default"}
        />
      </div>

      {/* 分角色面板 */}
      {[
        { label: "iOS 开发工程师", list: iosCapacity },
        { label: "Android 开发工程师", list: androidCapacity },
      ].map(({ label, list }) => (
        <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div className="font-semibold text-white">{label}</div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{list.length} 人</span>
          </div>

          {list.length === 0 ? (
            <EmptyState title={`暂无 ${label}`} description="前往「成员管理」添加成员。" />
          ) : (
            <div className="space-y-4">
              {list.map(({ member, plannedDays, actualDays, windowPlannedDays, saturation, isOverloaded, activeTaskCount, details, pendingProjects }) => {
                const isExpanded = expandedIds.has(member.id);
                return (
                  <div key={member.id} className={cn("rounded-2xl border", isOverloaded ? "border-rose-500/30 bg-rose-500/5" : "border-white/10 bg-white/5")}>
                    {/* 成员摘要行（可点击展开） */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(member.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-white">{member.name}</div>
                            {isOverloaded && (
                              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-300">超载</span>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            活跃任务 {activeTaskCount} 个 · 计划 {formatDayValue(plannedDays)} 天 · 实际 {formatDayValue(actualDays)} 天
                            <span className="ml-2 text-slate-500">（近20天投入 {formatDayValue(windowPlannedDays)} 天）</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", getSaturationTone(saturation))}>
                            {saturation}%
                          </span>
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-slate-400" />
                            : <ChevronDown className="h-4 w-4 text-slate-400" />
                          }
                        </div>
                      </div>

                      {/* 饱和度进度条 */}
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>0 天</span>
                          <span className={cn("font-medium", isOverloaded ? "text-rose-400" : "text-slate-300")}>
                            {formatDayValue(windowPlannedDays)} / 20 天
                          </span>
                        </div>
                        <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isOverloaded
                                ? "bg-gradient-to-r from-amber-500 to-rose-500"
                                : saturation >= 80
                                ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                                : "bg-gradient-to-r from-emerald-500 to-sky-500"
                            )}
                            style={{ width: `${Math.min(100, saturation)}%` }}
                          />
                        </div>
                      </div>
                    </button>

                    {/* 展开：需求明细列表 */}
                    {isExpanded && (
                      <div className="border-t border-white/10 px-4 pb-4 space-y-4">
                        {/* 进行中（开发中/联调中） */}
                        <div>
                          <div className="mt-3 mb-2 text-xs font-medium text-slate-400">
                            近20天有人力投入
                            <span className="ml-1.5 text-slate-500">（开发中 / 联调中）</span>
                          </div>
                          {details.length === 0 ? (
                            <div className="py-2 text-xs text-slate-500">暂无</div>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400">
                                  <th className="pb-2 text-left font-medium">需求名称</th>
                                  <th className="pb-2 text-left font-medium">阶段</th>
                                  <th className="pb-2 text-left font-medium">状态</th>
                                  <th className="pb-2 text-right font-medium">计划天</th>
                                  <th className="pb-2 text-right font-medium">实际天</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {details.map((d, i) => (
                                  <tr key={i} className="group">
                                    <td className="py-2 pr-3">
                                      <button
                                        type="button"
                                        onClick={() => setModalId(d.projectId)}
                                        className="text-left text-white transition hover:text-sky-300"
                                      >
                                        <span className={cn(
                                          "mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                          d.priority === "P0"
                                            ? "bg-rose-500/20 text-rose-300"
                                            : "bg-slate-500/20 text-slate-300"
                                        )}>
                                          {d.priority}
                                        </span>
                                        {d.projectName}
                                      </button>
                                    </td>
                                    <td className="py-2 pr-3 text-slate-400">{d.phaseName}</td>
                                    <td className="py-2 pr-3">
                                      <span className={cn(
                                        "rounded-full border px-2 py-0.5 text-[10px]",
                                        ACTIVE_STAGES.has(d.stage)
                                          ? getStageTone(d.stage)
                                          : "border-white/10 bg-white/5 text-slate-300"
                                      )}>
                                        {d.stage}
                                      </span>
                                    </td>
                                    <td className="py-2 text-right text-slate-200">{formatDayValue(d.plannedDays)}</td>
                                    <td className="py-2 text-right text-slate-400">{formatDayValue(d.actualDays)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* 待启动（未进入开发中） */}
                        {pendingProjects.length > 0 && (
                          <div className="border-t border-white/5 pt-3">
                            <div className="mb-2 text-xs font-medium text-slate-400">
                              暂未投入人力
                              <span className="ml-1.5 text-slate-500">（已排期，节点未到开发中）</span>
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400">
                                  <th className="pb-2 text-left font-medium">需求名称</th>
                                  <th className="pb-2 text-left font-medium">当前节点</th>
                                  <th className="pb-2 text-right font-medium">预计人天</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {pendingProjects.map((p) => (
                                  <tr key={p.projectId}>
                                    <td className="py-2 pr-3">
                                      <button
                                        type="button"
                                        onClick={() => setModalId(p.projectId)}
                                        className="text-left text-slate-300 transition hover:text-sky-300"
                                      >
                                        <span className={cn(
                                          "mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                                          p.priority === "P0"
                                            ? "bg-rose-500/20 text-rose-300"
                                            : "bg-slate-500/20 text-slate-300"
                                        )}>
                                          {p.priority}
                                        </span>
                                        {p.projectName}
                                      </button>
                                    </td>
                                    <td className="py-2 pr-3">
                                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", getStageTone(p.currentStage))}>
                                        {p.currentStage}
                                      </span>
                                    </td>
                                    <td className="py-2 text-right text-slate-400">{formatDayValue(p.totalPlannedDays)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* 说明 */}
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm leading-6 text-emerald-50/85">
        <div className="mb-2 font-medium text-emerald-100">饱和度计算说明</div>
        <div className="grid gap-1 sm:grid-cols-2">
          <div>1. 饱和度 = 未来 20 天内「开发中 / 联调中」阶段计划人天之和 / 20 天。</div>
          <div>2. 超过 100% 表示近期排期存在人力冲突。</div>
          <div>3. 列表只展示未来 20 天有资源投入的需求（开发中 / 联调中）。</div>
          <div>4. 点击成员卡片可展开查看明细，点击需求名可查看详情。</div>
        </div>
      </div>
    </section>
  );
}
