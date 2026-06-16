import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useDataStore } from "@/store";
import MetricCard from "@/components/shared/MetricCard";
import EmptyState from "@/components/shared/EmptyState";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import AnomalyBanner from "@/components/shared/AnomalyBanner";
import {
  buildDashboardStats,
  formatDate,
  formatDayValue,
  getPriorityTone,
  getStageTone,
  getCurrentStage,
} from "@/utils";
import { cn } from "@/lib/utils";
import { STAGES } from "@/constants";

export default function Dashboard() {
  const data = useDataStore((s) => s.data);
  const [modalId, setModalId] = useState<string | null>(null);
  const modalProject = useMemo(
    () => (modalId ? data.projects.find((p) => p.id === modalId) ?? null : null),
    [modalId, data.projects]
  );

  const stats = useMemo(() => buildDashboardStats(data), [data]);

  const stageDistribution = useMemo(() => {
    return STAGES.map((stage) => ({
      stage,
      count: stats.stageCount[stage] ?? 0,
    }));
  }, [stats.stageCount]);

  const maxStageCount = Math.max(1, ...stageDistribution.map((s) => s.count));

  return (
    <section className="space-y-6">
      {modalProject && (
        <ProjectDetailModal project={modalProject} onClose={() => setModalId(null)} />
      )}
      {/* 异常流转提醒 */}
      <AnomalyBanner />
      {/* 关键指标 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          label="进行中需求"
          value={`${stats.activeCount}`}
          helper={`共 ${stats.totalProjects} 个需求`}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="逾期需求"
          value={`${stats.overdueProjects.length}`}
          helper="交付日期已过且未上线"
          accent={stats.overdueProjects.length > 0 ? "rose" : "default"}
        />
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="P0 进行中"
          value={`${stats.p0Projects.length}`}
          helper="最高优先级未上线需求"
          accent={stats.p0Projects.length > 0 ? "amber" : "default"}
        />
        <MetricCard
          icon={<Inbox className="h-4 w-4" />}
          label="需求池待消化"
          value={`${stats.poolCount}`}
          helper="已入池但尚未排期"
          accent={stats.poolCount > 0 ? "sky" : "default"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="3天内交付"
          value={`${stats.soonProjects.length}`}
          helper="即将到期需重点关注"
          accent={stats.soonProjects.length > 0 ? "amber" : "default"}
        />
        <MetricCard
          icon={<Target className="h-4 w-4" />}
          label="全人力总投入"
          value={`${formatDayValue(stats.totalActivePlannedDays)} 人天`}
          helper="开发中 + 联调中阶段计划天数"
        />
        <MetricCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="团队平均饱和度"
          value={`${stats.avgSaturation}%`}
          helper="基于计划人天 / 月工作日(20天)"
          accent={stats.avgSaturation > 100 ? "rose" : stats.avgSaturation >= 80 ? "amber" : "emerald"}
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          label="超载成员"
          value={`${stats.overloadedCount} 人`}
          helper="计划人天 > 20天/月"
          accent={stats.overloadedCount > 0 ? "rose" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 需求状态分布 */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <BarChart3 className="h-4 w-4 text-slate-200" />
            </div>
            <div>
              <div className="font-semibold text-white">需求状态分布</div>
              <div className="text-xs text-slate-400">各阶段需求数量</div>
            </div>
          </div>
          <div className="space-y-3">
            {stageDistribution.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <span className={cn("w-24 shrink-0 rounded-full border px-2 py-0.5 text-center text-xs", getStageTone(stage))}>
                  {stage}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={cn("h-2 rounded-full transition-all", getStageTone(stage).split(" ")[0])}
                      style={{ width: `${(count / maxStageCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-sm font-medium text-white">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 逾期需求列表 */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/15 p-2">
                <AlertTriangle className="h-4 w-4 text-rose-300" />
              </div>
              <div>
                <div className="font-semibold text-white">逾期需求</div>
                <div className="text-xs text-slate-400">交付日期已过且未上线</div>
              </div>
            </div>
            {stats.overdueProjects.length > 0 && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-200">
                {stats.overdueProjects.length} 个
              </span>
            )}
          </div>
          {stats.overdueProjects.length === 0 ? (
            <EmptyState title="暂无逾期需求" description="所有需求均在交付期限内，保持良好！" />
          ) : (
            <div className="space-y-3">
              {stats.overdueProjects.slice(0, 5).map((p) => (
                <button key={p.id} type="button" onClick={() => setModalId(p.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-left transition hover:brightness-110">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(p.priority))}>
                        {p.priority}
                      </span>
                      <span className="text-sm font-medium text-white">{p.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      交付日期：{p.deliveryDate} · {p.businessDirection ?? "技术需求"}
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs", getStageTone(getCurrentStage(p)))}>
                    {getCurrentStage(p)}
                  </span>
                </button>
              ))}
              {stats.overdueProjects.length > 5 && (
                <div className="text-center text-xs text-slate-500">还有 {stats.overdueProjects.length - 5} 个逾期需求</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 即将交付 */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/15 p-2">
              <Clock className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <div className="font-semibold text-white">3天内需交付</div>
              <div className="text-xs text-slate-400">需重点跟进</div>
            </div>
          </div>
          {stats.soonProjects.length === 0 ? (
            <EmptyState title="近期无紧急交付" description="未来3天内没有需要交付的需求。" />
          ) : (
            <div className="space-y-3">
              {stats.soonProjects.map((p) => (
                <button key={p.id} type="button" onClick={() => setModalId(p.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left transition hover:brightness-110">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getPriorityTone(p.priority))}>
                        {p.priority}
                      </span>
                      <span className="text-sm font-medium text-white">{p.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">交付：{formatDate(p.deliveryDate)}</div>
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs", getStageTone(getCurrentStage(p)))}>
                    {getCurrentStage(p)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* P0 需求总览 */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/15 p-2">
              <Zap className="h-4 w-4 text-rose-300" />
            </div>
            <div>
              <div className="font-semibold text-white">P0 需求追踪</div>
              <div className="text-xs text-slate-400">最高优先级，持续关注</div>
            </div>
          </div>
          {stats.p0Projects.length === 0 ? (
            <EmptyState title="暂无 P0 进行中需求" description="当前所有 P0 需求均已上线。" />
          ) : (
            <div className="space-y-3">
              {stats.p0Projects.map((p) => (
                <button key={p.id} type="button" onClick={() => setModalId(p.id)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:brightness-110">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{p.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>交付：{p.deliveryDate}</span>
                        {p.version && <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-slate-300">{p.version} 版本</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs", getStageTone(getCurrentStage(p)))}>
                        {getCurrentStage(p)}
                      </span>
                      {p.deliveryDate < new Date().toISOString().slice(0, 10) && (
                        <span className="text-xs font-medium text-rose-400">已逾期</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快速说明 */}
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
        <div className="mb-2 flex items-center gap-2 font-medium text-emerald-100">
          <TrendingUp className="h-4 w-4" /> 人力投入规则说明
        </div>
        <div className="grid gap-1.5 text-xs leading-5 text-emerald-50/85 sm:grid-cols-2">
          <div>1. 仅 <strong>开发中</strong>、<strong>联调中</strong> 阶段计入全人力占用（100%）。</div>
          <div>2. 饱和度 = 阶段计划人天 / 20个月工作日。</div>
          <div>3. <strong>P0</strong> 需求始终优先排期，甘特图带醒目标识。</div>
          <div>4. 需求池：谁先完成粗评谁先进池，P0 优先消化。</div>
        </div>
      </div>

      {/* 全团队完成情况 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
            <CheckCircle2 className="h-4 w-4 text-slate-200" />
          </div>
          <div className="font-semibold text-white">已上线需求</div>
        </div>
        {(() => {
          const done = data.projects.filter((p) =>
            p.phases.some((ph) => ph.stage === "已上线" || ph.stage === "已集成")
          );
          return done.length === 0 ? (
            <EmptyState title="暂无已完成需求" description="需求进入「已集成」或「已上线」阶段后会在此显示。" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {done.slice(0, 6).map((p) => (
                <div key={p.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate text-sm font-medium text-white">{p.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span>{p.demandType}</span>
                    {p.version && <span>· {p.version} 版本</span>}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
