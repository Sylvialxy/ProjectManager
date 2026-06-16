import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Inbox, TrendingUp } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import { cn } from "@/lib/utils";
import { buildConsumptionStats, formatDayValue, getCurrentStage, getPriorityTone, getStageTone } from "@/utils";

// 固定方向颜色，保持跨月一致
const DIRECTION_COLORS = [
  "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

function getDirectionColor(directions: string[], dir: string) {
  const idx = directions.indexOf(dir);
  return DIRECTION_COLORS[idx % DIRECTION_COLORS.length] ?? "bg-slate-500";
}

export default function Consumption() {
  const data = useDataStore((s) => s.data);

  const stats = useMemo(() => buildConsumptionStats(data.projects), [data.projects]);
  const poolCount = data.projects.filter((p) => p.inPool && !p.consumedAt).length;

  // 全部出现过的方向（含技术需求）
  const allDirections = useMemo(() => {
    const dirs = new Set<string>();
    stats.monthlyStats.forEach((m) => Object.keys(m.directionBreakdown).forEach((d) => dirs.add(d)));
    return [...dirs];
  }, [stats.monthlyStats]);

  const [modalId, setModalId] = useState<string | null>(null);
  const modalProject = useMemo(
    () => (modalId ? data.projects.find((p) => p.id === modalId) ?? null : null),
    [modalId, data.projects]
  );

  return (
    <section className="space-y-6">
      {modalProject && (
        <ProjectDetailModal project={modalProject} onClose={() => setModalId(null)} />
      )}

      {/* 年度汇总 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">全年需求完成情况</div>
            <div className="text-sm text-slate-400">{new Date().getFullYear()} 年已上线 / 已集成需求统计</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
              <div className="text-xs text-emerald-200">全年完成总数</div>
              <div className="text-xl font-semibold text-white">{stats.totalDelivered}</div>
            </div>
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-center">
              <div className="text-xs text-sky-200">总工作量</div>
              <div className="text-xl font-semibold text-white">{formatDayValue(stats.totalWorkload)} 天</div>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center">
              <div className="text-xs text-rose-200">P0 完成数</div>
              <div className="text-xl font-semibold text-white">{stats.p0Delivered}</div>
            </div>
          </div>
        </div>

        {/* 月度趋势 */}
        <div className="mb-3 text-sm font-medium text-white">月度完成趋势（按交付日期）</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.monthlyStats.map((stat) => (
            <div key={stat.month} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-medium text-white">{stat.month}</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-400">完成数量</div>
                  <div className="text-2xl font-semibold text-emerald-400">{stat.count}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">工作量</div>
                  <div className="text-lg font-semibold text-sky-400">{formatDayValue(stat.workload)} 天</div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                  style={{ width: `${(stat.count / stats.maxMonthCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 各月方向占比 */}
        {allDirections.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 text-sm font-medium text-white">各月方向人力占比</div>
            {/* 图例 */}
            <div className="mb-3 flex flex-wrap gap-3">
              {allDirections.map((dir) => (
                <div key={dir} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full", getDirectionColor(allDirections, dir))} />
                  <span className="text-xs text-slate-300">{dir}</span>
                </div>
              ))}
            </div>
            {/* 每月一行堆叠条 */}
            <div className="space-y-2">
              {stats.monthlyStats.filter((m) => m.workload > 0).map((stat) => (
                <div key={stat.month} className="group/row relative flex items-center gap-3">
                  <span className="w-8 shrink-0 text-xs text-slate-400">{stat.month}</span>
                  <div className="flex h-5 flex-1 overflow-hidden rounded-full bg-white/5">
                    {allDirections.map((dir) => {
                      const w = stat.directionBreakdown[dir] ?? 0;
                      const pct = stat.workload > 0 ? (w / stat.workload) * 100 : 0;
                      return pct > 0 ? (
                        <div
                          key={dir}
                          className={cn("h-full transition-all", getDirectionColor(allDirections, dir))}
                          style={{ width: `${pct}%` }}
                        />
                      ) : null;
                    })}
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs text-slate-400">
                    {formatDayValue(stat.workload)} 天
                  </span>
                  {/* Tooltip：定位到行容器，不受 overflow-hidden 影响 */}
                  <div className="pointer-events-none absolute bottom-full left-10 z-20 mb-1.5 hidden min-w-max rounded-xl border border-white/10 bg-slate-800 p-2.5 shadow-xl group-hover/row:block">
                    <div className="space-y-1.5">
                      {allDirections.filter((dir) => (stat.directionBreakdown[dir] ?? 0) > 0).map((dir) => {
                        const w = stat.directionBreakdown[dir];
                        const pct = Math.round((w / stat.workload) * 100);
                        return (
                          <div key={dir} className="flex items-center gap-2 text-xs">
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", getDirectionColor(allDirections, dir))} />
                            <span className="text-slate-200">{dir}</span>
                            <span className="ml-2 text-sky-300">{formatDayValue(w)} 天</span>
                            <span className="text-slate-400">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 完成需求明细 */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-4 text-lg font-semibold text-white">完成需求明细</div>
          <div className="space-y-3">
            {stats.delivered.length === 0 ? (
              <EmptyState title="暂无已完成需求" description="需求进入「已集成」或「已上线」后会在此显示。" />
            ) : (
              stats.delivered
                .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate))
                .map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setModalId(project.id)}
                    className="flex w-full items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:brightness-110"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(project.priority))}>
                          {project.priority}
                        </span>
                        <span className="font-medium text-white">{project.name}</span>
                        {project.version && (
                          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">
                            {project.version}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        交付：{project.deliveryDate}
                        {project.owner && <span> · Owner：{project.owner}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs", getStageTone(getCurrentStage(project)))}>
                        {getCurrentStage(project)}
                      </span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                        {formatDayValue(project.workloadDays)} 天
                      </span>
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>

        {/* 规则说明 + 状态统计 */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
            <div className="mb-4 text-lg font-semibold text-white">消化规则说明</div>
            <div className="space-y-3 text-sm leading-6 text-slate-300">
              <div className="flex items-start gap-2">
                <div className="mt-1 rounded-full bg-sky-500/20 p-1"><TrendingUp className="h-3 w-3 text-sky-300" /></div>
                <div><span className="font-medium text-white">消化顺序：</span>优先消化 P0，同优先级按入池时间排序。</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 rounded-full bg-emerald-500/20 p-1"><CheckCircle2 className="h-3 w-3 text-emerald-300" /></div>
                <div><span className="font-medium text-white">完成标准：</span>需求进入「已集成」或「已上线」阶段视为完成。</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 rounded-full bg-rose-500/20 p-1"><AlertTriangle className="h-3 w-3 text-rose-300" /></div>
                <div><span className="font-medium text-white">P0 优先：</span>P0 无论入池时间，始终优先消化。</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
            <div className="mb-4 text-lg font-semibold text-white">需求池状态</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-sky-300" />
                  <span className="text-sm text-slate-300">需求池中</span>
                </div>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sm font-medium text-sky-200">{poolCount} 个</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-slate-300">已完成（全年）</span>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">{stats.totalDelivered} 个</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-300" />
                  <span className="text-sm text-slate-300">P0 待消化</span>
                </div>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-sm font-medium text-rose-200">
                  {data.projects.filter((p) => p.inPool && !p.consumedAt && p.priority === "P0").length} 个
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
