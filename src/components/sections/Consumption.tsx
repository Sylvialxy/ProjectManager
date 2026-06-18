import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Inbox, TrendingUp } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import { cn } from "@/lib/utils";
import { buildConsumptionStats, formatDayValue, getCurrentStage, getPriorityTone, getStageTone } from "@/utils";

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
  const [dim, setDim] = useState<"month" | "version">("month");

  const stats = useMemo(() => buildConsumptionStats(data.projects), [data.projects]);
  const poolCount = data.projects.filter((p) => p.inPool && !p.consumedAt).length;

  const barData = useMemo(() => {
    if (dim === "month") {
      return stats.monthlyStats.map((m) => ({
        label: m.month,
        count: m.count,
        p0Count: m.p0Count,
        p1Count: m.p1Count,
        avgPlanned: m.avgPlanned,
      }));
    }
    return stats.versionStats.map((v) => ({
      label: v.version,
      count: v.count,
      p0Count: v.p0Count,
      p1Count: v.p1Count,
      avgPlanned: v.avgPlanned,
    }));
  }, [dim, stats]);

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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
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

        {/* ── 柱状图区块 ── */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-white">交付趋势</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-400/80" />
                  <span className="text-xs text-slate-400">P0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-sky-400/80" />
                  <span className="text-xs text-slate-400">P1</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setDim("month")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  dim === "month" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                月维度
              </button>
              <button
                type="button"
                onClick={() => setDim("version")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  dim === "version" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
                )}
              >
                版本维度
              </button>
            </div>
          </div>
          <DeliveryBarChart data={barData} />
        </div>

        {/* ── 分月 / 分版本明细卡片 ── */}
        <div className="mt-5">
          <div className="mb-3 text-sm font-medium text-white">
            {dim === "month" ? "分月明细" : "分版本明细"}
          </div>
          {dim === "month" ? (
            stats.monthlyStats.every((m) => m.count === 0) ? (
              <EmptyState title="暂无已完成需求" description="需求进入「已集成」或「已上线」后会在此显示。" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stats.monthlyStats.filter((m) => m.count > 0).map((stat) => (
                  <div key={stat.month} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-medium text-white">{stat.month}</div>
                      <div className="flex gap-1">
                        {stat.p0Count > 0 && (
                          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-300">
                            P0×{stat.p0Count}
                          </span>
                        )}
                        {stat.p1Count > 0 && (
                          <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-1.5 py-0.5 text-xs text-slate-300">
                            P1×{stat.p1Count}
                          </span>
                        )}
                      </div>
                    </div>
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
                    <div className="mt-2 text-xs text-slate-500">
                      均投入 <span className="font-medium text-amber-300">{formatDayValue(stat.avgPlanned)}</span> 人天 / 需求
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                        style={{ width: `${(stat.count / stats.maxMonthCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            stats.versionStats.length === 0 ? (
              <EmptyState title="暂无版本数据" description="为完成的需求填写版本号后会在此显示。" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {stats.versionStats.map((v) => (
                  <div key={v.version} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-200">
                        {v.version}
                      </span>
                      <div className="flex gap-1">
                        {v.p0Count > 0 && (
                          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-300">
                            P0×{v.p0Count}
                          </span>
                        )}
                        {v.p1Count > 0 && (
                          <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-1.5 py-0.5 text-xs text-slate-300">
                            P1×{v.p1Count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end gap-4">
                      <div>
                        <div className="text-xs text-slate-400">需求数</div>
                        <div className="text-2xl font-semibold text-emerald-400">{v.count}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">工作量</div>
                        <div className="text-lg font-semibold text-sky-400">{formatDayValue(v.workload)} 天</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      均投入 <span className="font-medium text-amber-300">{formatDayValue(v.avgPlanned)}</span> 人天 / 需求
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* 各月方向占比 */}
        {allDirections.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 text-sm font-medium text-white">各月方向人力占比</div>
            <div className="mb-3 flex flex-wrap gap-3">
              {allDirections.map((dir) => (
                <div key={dir} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-2.5 rounded-full", getDirectionColor(allDirections, dir))} />
                  <span className="text-xs text-slate-300">{dir}</span>
                </div>
              ))}
            </div>
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

// ── 柱状图组件 ──────────────────────────────────────────────────────────────────

interface BarDatum {
  label: string;
  count: number;
  p0Count: number;
  p1Count: number;
  avgPlanned: number;
}

function DeliveryBarChart({ data }: { data: BarDatum[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const step = Math.max(1, Math.ceil(maxCount / 4));
  const niceMax = step * 4;

  // SVG logical dimensions
  const PL = 44, PR = 12, PT = 24, PB = 36;
  const VW = 900, VH = 240;
  const cW = VW - PL - PR;
  const cH = VH - PT - PB;

  const n = data.length;
  const slotW = cW / n;
  const barW = Math.min(slotW * 0.6, 52);
  const bx = (i: number) => PL + i * slotW + (slotW - barW) / 2;
  const yFor = (count: number) => PT + cH - (count / niceMax) * cH;
  const yTicks = [0, step, step * 2, step * 3, step * 4];

  return (
    <div className="relative" onMouseLeave={() => setHoveredIdx(null)}>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: "200px" }}>
        <defs>
          {data.map((d, i) =>
            d.count > 0 ? (
              <clipPath key={i} id={`bclip-${i}`}>
                <rect x={bx(i)} y={yFor(d.count)} width={barW} height={(d.count / niceMax) * cH} rx={4} />
              </clipPath>
            ) : null
          )}
        </defs>

        {/* Y 轴网格线 + 刻度 */}
        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
              <text x={PL - 7} y={y + 4} textAnchor="end" fontSize={10} fill="rgba(255,255,255,0.35)">{tick}</text>
            </g>
          );
        })}

        {/* 基线 */}
        <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* 柱子 */}
        {data.map((d, i) => {
          const totalH = (d.count / niceMax) * cH;
          const p0H = (d.p0Count / niceMax) * cH;
          const p1H = totalH - p0H;
          const x = bx(i);
          const isHov = hoveredIdx === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)}>
              {/* 悬停高亮背景 */}
              {isHov && (
                <rect x={x - 4} y={PT} width={barW + 8} height={cH} fill="rgba(255,255,255,0.04)" rx={4} />
              )}

              {d.count > 0 && (
                <g clipPath={`url(#bclip-${i})`}>
                  {/* P1（底部，蓝色） */}
                  {p1H > 0 && (
                    <rect x={x} y={PT + cH - p1H} width={barW} height={p1H}
                      fill="#38bdf8" fillOpacity={isHov ? 0.85 : 0.65} />
                  )}
                  {/* P0（顶部，红色） */}
                  {p0H > 0 && (
                    <rect x={x} y={PT + cH - totalH} width={barW} height={p0H}
                      fill="#fb7185" fillOpacity={isHov ? 0.9 : 0.75} />
                  )}
                </g>
              )}

              {/* 无数据时显示底部细线 */}
              {d.count === 0 && (
                <rect x={x} y={PT + cH - 2} width={barW} height={2} fill="rgba(255,255,255,0.06)" rx={1} />
              )}

              {/* 柱顶数量标签 */}
              {d.count > 0 && (
                <text x={x + barW / 2} y={yFor(d.count) - 5} textAnchor="middle"
                  fontSize={11} fontWeight="600"
                  fill={isHov ? "white" : "rgba(255,255,255,0.6)"}>{d.count}</text>
              )}

              {/* X 轴标签 */}
              <text x={x + barW / 2} y={PT + cH + 20} textAnchor="middle" fontSize={10}
                fill={d.count > 0 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}>{d.label}</text>
            </g>
          );
        })}
      </svg>

      {/* 浮动 Tooltip */}
      {hoveredIdx !== null && (data[hoveredIdx]?.count ?? 0) > 0 && (() => {
        const d = data[hoveredIdx];
        const leftPct = ((bx(hoveredIdx) + barW / 2) / VW) * 100;
        return (
          <div
            className="pointer-events-none absolute top-2 z-20 min-w-[140px] rounded-xl border border-white/10 bg-slate-800/95 p-3 shadow-xl backdrop-blur"
            style={{ left: `clamp(0px, calc(${leftPct}% - 70px), calc(100% - 150px))` }}
          >
            <div className="mb-1.5 text-xs font-semibold text-white">{d.label}</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">合计</span>
                <span className="font-medium text-white">{d.count} 个</span>
              </div>
              {d.p0Count > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span className="text-slate-400">P0</span>
                  </div>
                  <span className="text-rose-300">{d.p0Count} 个</span>
                </div>
              )}
              {d.p1Count > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span className="text-slate-400">P1</span>
                  </div>
                  <span className="text-sky-300">{d.p1Count} 个</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1">
                <span className="text-slate-400">均投入</span>
                <span className="text-amber-300">{formatDayValue(d.avgPlanned)} 人天</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
