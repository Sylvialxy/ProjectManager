import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BriefcaseBusiness, CalendarDays } from "lucide-react";
import { useDataStore } from "@/store";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import MetricCard from "@/components/shared/MetricCard";
import { cn } from "@/lib/utils";
import {
  buildMemberRows,
  buildDirectionRows,
  enumerateDays,
  getMonthRange,
  shiftMonth,
  formatRangeLabel,
  formatDayValue,
  getStageTone,
  getSaturationTone,
  dayDiffInclusive,
  timelineWidth,
  sortProjects,
} from "@/utils";
import { STAGES, ACTIVE_STAGES, DAY_CELL_WIDTH } from "@/constants";

const LEFT_COL = 220; // px — fixed left column width
const LANE_H = 48;   // px per gantt lane (bar ~36px + 12px gap prevents overlap)

export default function Overview() {
  const data = useDataStore((s) => s.data);
  const sortedProjects = useMemo(() => sortProjects(data.projects), [data.projects]);

  const monthRange = getMonthRange();
  const [viewMode, setViewMode] = useState<"member" | "direction">("member");
  const [rangeStart, setRangeStart] = useState(monthRange.startDate);
  const [rangeEnd, setRangeEnd] = useState(monthRange.endDate);
  const [search, setSearch] = useState("");
  const [modalId, setModalId] = useState<string | null>(null);
  const modalProject = useMemo(
    () => (modalId ? data.projects.find((p) => p.id === modalId) ?? null : null),
    [modalId, data.projects]
  );

  const timelineDays = useMemo(() => enumerateDays(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const rangeDayCount = Math.max(1, timelineDays.length);
  const tlWidth = timelineWidth(timelineDays.length);

  const memberRows = useMemo(
    () => buildMemberRows(data.members, sortedProjects, rangeStart, rangeEnd, rangeDayCount),
    [data.members, sortedProjects, rangeStart, rangeEnd, rangeDayCount]
  );
  const directionRows = useMemo(
    () => buildDirectionRows(data.directions, data.members, sortedProjects, rangeStart, rangeEnd, rangeDayCount),
    [data.directions, data.members, sortedProjects, rangeStart, rangeEnd, rangeDayCount]
  );

  const allRows = viewMode === "member" ? memberRows : directionRows;
  const currentRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) =>
      r.name.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q)
    );
  }, [allRows, search]);

  // Pre-compute row heights so both columns share exact same height
  const rowHeights = useMemo(() => {
    const h: Record<string, number> = {};
    currentRows.forEach((row) => {
      h[row.id] = Math.max(80, row.bars.reduce((m, b) => Math.max(m, (b.lane + 1) * LANE_H + 16), 0));
    });
    return h;
  }, [currentRows]);

  const summary = useMemo(() => {
    const totalLoad = currentRows.reduce((s, r) => s + r.loadDays, 0);
    const avg = currentRows.length > 0
      ? currentRows.reduce((s, r) => s + r.saturation, 0) / currentRows.length : 0;
    const overloaded = currentRows.filter((r) => r.saturation > 100).length;
    return { totalLoad, avgSaturation: avg, overloadedCount: overloaded };
  }, [currentRows]);

  function getWeekdayLabel(value: string) {
    return ["日", "一", "二", "三", "四", "五", "六"][new Date(`${value}T00:00:00`).getDay()];
  }

  const HEADER_H = 56; // date header row height in px

  return (
    <section className="space-y-6">
      {modalProject && (
        <ProjectDetailModal project={modalProject} onClose={() => setModalId(null)} />
      )}
      {/* 指标卡片 */}
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard icon={<CalendarDays className="h-4 w-4" />}
          label="统计范围" value={formatRangeLabel(rangeStart, rangeEnd)}
          helper="按天展开时间轴，可前后切换整月" />
        <MetricCard icon={<BriefcaseBusiness className="h-4 w-4" />}
          label="总人力占用" value={`${formatDayValue(summary.totalLoad)} 人天`}
          helper="仅统计开发中 / 联调中的全人力投入" />
        <MetricCard icon={<BarChart3 className="h-4 w-4" />}
          label="平均饱和度" value={`${Math.round(summary.avgSaturation)}%`}
          helper={viewMode === "member" ? "成员平均负荷" : "方向占团队总产能比例"} />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />}
          label="超载对象" value={`${summary.overloadedCount} 个`}
          helper="超过 100% 表示同时存在并行开发冲突"
          accent={summary.overloadedCount > 0 ? "rose" : "default"} />
      </div>

      {/* 甘特图主体 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur">

        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
            {(["member", "direction"] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)}
                className={cn("rounded-xl px-4 py-2 text-sm transition",
                  viewMode === mode ? "bg-sky-500 text-white" : "text-slate-300 hover:text-white")}>
                {mode === "member" ? "个人维度" : "业务方向"}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button type="button" onClick={() => { const r = shiftMonth(rangeStart, -1); setRangeStart(r.startDate); setRangeEnd(r.endDate); }}
              className="rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:text-white">上个月</button>
            <button type="button" onClick={() => { const r = getMonthRange(); setRangeStart(r.startDate); setRangeEnd(r.endDate); }}
              className="rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:text-white">当月</button>
            <button type="button" onClick={() => { const r = shiftMonth(rangeStart, 1); setRangeStart(r.startDate); setRangeEnd(r.endDate); }}
              className="rounded-xl px-4 py-2 text-sm text-slate-300 transition hover:text-white">下个月</button>
          </div>

          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={viewMode === "member" ? "搜索成员" : "搜索业务方向"}
            className="min-w-[180px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40" />
        </div>

        {/* ── 甘特主体：左固定列 + 右滚动时间轴 ── */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <div className="flex">

            {/* ── 左侧固定列（成员名 / 方向名） ── */}
            <div className="shrink-0 border-r border-white/10" style={{ width: LEFT_COL }}>
              {/* 列头 */}
              <div className="flex items-center border-b border-white/10 bg-slate-900/80 px-4"
                style={{ height: HEADER_H }}>
                <span className="text-xs font-medium text-slate-400">
                  {viewMode === "member" ? "成员" : "业务方向"}
                </span>
              </div>

              {/* 行 */}
              {currentRows.map((row) => (
                <div key={row.id}
                  className="flex flex-col justify-center border-b border-white/5 bg-slate-950/80 px-4 py-2"
                  style={{ height: rowHeights[row.id] }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{row.name}</div>
                      <div className="truncate text-xs text-slate-400">{row.subtitle}</div>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold",
                      getSaturationTone(row.saturation)
                    )}>
                      {Math.round(row.saturation)}%
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDayValue(row.loadDays)} 人天 · {row.activeCount} 活跃
                  </div>
                </div>
              ))}

              {currentRows.length === 0 && (
                <div className="flex items-center justify-center px-4 py-8 text-sm text-slate-500">
                  无匹配结果
                </div>
              )}
            </div>

            {/* ── 右侧可横向滚动时间轴 ── */}
            <div className="flex-1 overflow-x-auto">
              <div style={{ minWidth: tlWidth }}>

                {/* 日期表头 */}
                <div className="flex border-b border-white/10 bg-slate-900/80"
                  style={{ height: HEADER_H }}>
                  {timelineDays.map((day) => (
                    <div key={day} className="shrink-0 border-r border-white/5 px-1 py-2 text-center"
                      style={{ width: DAY_CELL_WIDTH }}>
                      <div className="text-xs text-slate-400">{getWeekdayLabel(day)}</div>
                      <div className="mt-0.5 text-sm font-medium text-white">
                        {new Date(`${day}T00:00:00`).getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 甘特行 */}
                {currentRows.map((row) => (
                  <div key={row.id}
                    className="relative border-b border-white/5"
                    style={{ height: rowHeights[row.id] }}>
                    {/* 纵向网格线 */}
                    <div className="pointer-events-none absolute inset-0 flex">
                      {timelineDays.map((day) => (
                        <div key={day} className="shrink-0 border-r border-white/5"
                          style={{ width: DAY_CELL_WIDTH }} />
                      ))}
                    </div>

                    {/* 任务条 */}
                    {row.bars.map((bar) => {
                      const left = dayDiffInclusive(rangeStart, bar.displayStart) - 1;
                      const width = dayDiffInclusive(bar.displayStart, bar.displayEnd);
                      return (
                        <button
                          key={bar.id}
                          type="button"
                          onClick={() => setModalId(bar.projectId)}
                          className={cn(
                            "absolute overflow-hidden rounded-xl border px-2.5 py-1.5 text-xs shadow-lg shadow-slate-950/20 text-left transition hover:brightness-125 hover:z-10",
                            bar.active ? getStageTone(bar.stage) : "border-white/10 bg-white/5 text-slate-300",
                            bar.priority === "P0" && "ring-1 ring-rose-400/60"
                          )}
                          style={{
                            left: left * DAY_CELL_WIDTH + 3,
                            top: bar.lane * LANE_H + 8,
                            height: LANE_H - 12,
                            width: Math.max(60, width * DAY_CELL_WIDTH - 6),
                          }}
                          title={`${bar.projectName}｜${bar.stage}（点击查看详情）`}>
                          <div className="truncate font-medium leading-tight">{bar.label}</div>
                          <div className="truncate text-[10px] opacity-80">{bar.detail}</div>
                        </button>
                      );
                    })}
                  </div>
                ))}

                {currentRows.length === 0 && (
                  <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                    暂无数据
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <span key={stage}
              className={cn("rounded-full border px-3 py-1 text-xs",
                ACTIVE_STAGES.has(stage) ? getStageTone(stage) : "border-white/10 bg-white/5 text-slate-300")}>
              {stage}
            </span>
          ))}
          <span className="rounded-full border border-rose-400/40 bg-white/5 px-3 py-1 text-xs text-rose-300">
            ∙ P0 红色描边
          </span>
        </div>
      </div>
    </section>
  );
}
