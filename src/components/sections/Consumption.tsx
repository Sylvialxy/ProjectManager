import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Clock, Inbox, TrendingUp } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { buildConsumptionStats, formatDayValue, getPriorityTone, toDate } from "@/utils";

export default function Consumption() {
  const data = useDataStore((s) => s.data);

  const stats = useMemo(() => buildConsumptionStats(data.projects), [data.projects]);
  const poolCount = data.projects.filter((p) => p.inPool && !p.consumedAt).length;

  return (
    <section className="space-y-6">
      {/* 年度汇总 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">全年需求消化情况</div>
            <div className="text-sm text-slate-400">{new Date().getFullYear()} 年消化数据统计</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
              <div className="text-xs text-emerald-200">全年消化总数</div>
              <div className="text-xl font-semibold text-white">{stats.totalConsumed}</div>
            </div>
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-center">
              <div className="text-xs text-sky-200">总工作量</div>
              <div className="text-xl font-semibold text-white">{formatDayValue(stats.totalWorkload)} 天</div>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center">
              <div className="text-xs text-rose-200">P0 消化数</div>
              <div className="text-xl font-semibold text-white">{stats.p0Consumed}</div>
            </div>
          </div>
        </div>

        {/* 月度趋势 */}
        <div className="text-sm font-medium text-white mb-3">月度消化趋势</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {stats.monthlyStats.map((stat) => (
            <div key={stat.month} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm font-medium text-white">{stat.month}</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-400">消化数量</div>
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
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 消化需求明细 */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-4 text-lg font-semibold text-white">消化需求明细</div>
          <div className="space-y-3">
            {stats.consumed
              .sort((a, b) => toDate(b.consumedAt!).getTime() - toDate(a.consumedAt!).getTime())
              .map((project) => (
                <div key={project.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(project.priority))}>
                          {project.priority}
                        </span>
                        <span className="font-medium text-white">{project.name}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        消化：{project.consumedAt} · 负责人：{project.consumedBy ?? "—"}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                      {formatDayValue(project.workloadDays)} 天
                    </span>
                  </div>
                </div>
              ))}
            {stats.consumed.length === 0 && (
              <EmptyState title="暂无消化记录" description="消化需求后会在此显示全年消化明细。" />
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
                <div className="mt-1 rounded-full bg-emerald-500/20 p-1"><Clock className="h-3 w-3 text-emerald-300" /></div>
                <div><span className="font-medium text-white">入池规则：</span>需求完成粗评后可手动拎入需求池。</div>
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
                  <span className="text-sm text-slate-300">已消化（全年）</span>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200">{stats.totalConsumed} 个</span>
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
