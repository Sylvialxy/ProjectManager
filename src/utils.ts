import type {
  Project,
  TimelineBar,
  UtilizationRow,
  Member,
  MemberCapacity,
  MemberAssignmentDetail,
  MemberPendingProject,
  StageType,
  ProjectPriority,
  AppData,
} from "@/types";
import { ACTIVE_STAGES, DAY_CELL_WIDTH, WORKING_DAYS_PER_MONTH } from "@/constants";

// ---- ID 生成 ----

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---- 日期工具 ----

export function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const date = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = toDate(dateStr);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function getMonthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export function shiftMonth(dateText: string, delta: number) {
  const date = toDate(dateText);
  return getMonthRange(new Date(date.getFullYear(), date.getMonth() + delta, 1));
}

export function enumerateDays(startDate: string, endDate: string): string[] {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const days: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    days.push(toIsoDate(cursor));
  }
  return days;
}

export function dayDiffInclusive(startDate: string, endDate: string): number {
  const start = toDate(startDate).getTime();
  const end = toDate(endDate).getTime();
  return Math.max(0, Math.round((end - start) / 86400000) + 1);
}

export function isOverdue(project: Project): boolean {
  if (isDone(project)) return false;
  return toDate(project.deliveryDate) < new Date();
}

// 异常：已超过交付日期但还没到达「测试中」或更晚阶段
export function isAnomalous(project: Project): boolean {
  const stage = getCurrentStage(project);
  const done = new Set<StageType>(["测试中", "已集成", "已上线"]);
  if (done.has(stage)) return false;
  return toDate(project.deliveryDate) < new Date();
}

// 获取下一个流转阶段（找不到返回 null）
export function getNextStage(stage: StageType): StageType | null {
  const ORDER: StageType[] = [
    "需求粗评", "需求方案制定", "开发中", "联调中", "测试中", "已集成", "已上线",
  ];
  const idx = ORDER.indexOf(stage);
  return idx !== -1 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
}

// 进入「开发中」后缺少日期的后续阶段列表
export function getMissingPhaseDates(project: Project): StageType[] {
  const required: StageType[] = ["开发中", "联调中", "测试中", "已上线"];
  const stage = getCurrentStage(project);
  const ORDER: StageType[] = [
    "需求粗评", "需求方案制定", "开发中", "联调中", "测试中", "已集成", "已上线",
  ];
  if (ORDER.indexOf(stage) < ORDER.indexOf("开发中")) return [];
  return required.filter((s) => !project.phases.some((ph) => ph.stage === s));
}

export function isDueSoon(project: Project, withinDays = 3): boolean {
  if (isDone(project)) return false;
  const now = new Date();
  const delivery = toDate(project.deliveryDate);
  const threshold = new Date(now.getTime() + withinDays * 86400000);
  return delivery >= now && delivery <= threshold;
}

export function isDone(project: Project): boolean {
  return project.phases.some(
    (p) => p.stage === "已上线" || p.stage === "已集成"
  );
}

// ---- 格式化 ----

export function formatDate(value: string): string {
  const date = toDate(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatRangeLabel(startDate: string, endDate: string): string {
  const start = toDate(startDate);
  return `${start.getFullYear()}年${start.getMonth() + 1}月 ${formatDate(startDate)} — ${formatDate(endDate)}`;
}

export function getWeekdayLabel(value: string): string {
  return ["日", "一", "二", "三", "四", "五", "六"][toDate(value).getDay()];
}

export function formatDayValue(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

// ---- 样式 tone ----

export function getPriorityTone(priority: ProjectPriority): string {
  return priority === "P0"
    ? "border-rose-500/70 bg-rose-500/30 text-rose-100 font-semibold"
    : "border-slate-500/30 bg-slate-500/15 text-slate-200";
}

export function getStageTone(stage: StageType): string {
  switch (stage) {
    case "开发中":      return "bg-emerald-500/90 text-emerald-50 border-emerald-300/30";
    case "联调中":      return "bg-sky-500/90 text-sky-50 border-sky-300/30";
    case "测试中":      return "bg-amber-500/90 text-amber-50 border-amber-300/30";
    case "需求粗评":    return "bg-violet-500/90 text-violet-50 border-violet-300/30";
    case "需求方案制定": return "bg-fuchsia-500/90 text-fuchsia-50 border-fuchsia-300/30";
    case "已集成":      return "bg-slate-500/90 text-slate-50 border-slate-300/30";
    case "已上线":      return "bg-zinc-600/90 text-zinc-100 border-zinc-300/20";
    default:           return "bg-slate-500/90 text-slate-50 border-slate-300/30";
  }
}

export function getSaturationTone(saturation: number): string {
  if (saturation > 100) return "text-rose-300 bg-rose-500/15 border-rose-500/30";
  if (saturation >= 80)  return "text-amber-200 bg-amber-500/15 border-amber-500/30";
  return "text-emerald-200 bg-emerald-500/15 border-emerald-500/30";
}

// ---- 排序 ----

export function getPriorityWeight(priority: ProjectPriority): number {
  return priority === "P0" ? 0 : 1;
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const gap = getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
    if (gap !== 0) return gap;
    return toDate(a.deliveryDate).getTime() - toDate(b.deliveryDate).getTime();
  });
}

// ---- 甘特图计算 ----

export function getOverlapRange(
  startA: string, endA: string,
  startB: string, endB: string
): { startDate: string; endDate: string } | null {
  const start = toDate(startA) > toDate(startB) ? startA : startB;
  const end = toDate(endA) < toDate(endB) ? endA : endB;
  return toDate(start) > toDate(end) ? null : { startDate: start, endDate: end };
}

export function assignLanes(items: Omit<TimelineBar, "lane">[]): TimelineBar[] {
  const sorted = [...items].sort(
    (a, b) => toDate(a.displayStart).getTime() - toDate(b.displayStart).getTime()
  );
  const laneEnds: string[] = [];
  return sorted.map((item) => {
    let laneIndex = laneEnds.findIndex((end) => toDate(item.displayStart) > toDate(end));
    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(item.displayEnd);
    } else {
      laneEnds[laneIndex] = item.displayEnd;
    }
    return { ...item, lane: laneIndex };
  });
}

export function buildMemberRows(
  members: Member[],
  sortedProjects: Project[],
  rangeStart: string,
  rangeEnd: string,
  rangeDayCount: number
): UtilizationRow[] {
  return members.map((member) => {
    const rawBars: Omit<TimelineBar, "lane">[] = [];
    let loadDays = 0;

    sortedProjects.forEach((project) => {
      project.phases.forEach((phase) => {
        const overlap = getOverlapRange(phase.startDate, phase.endDate, rangeStart, rangeEnd);
        if (!overlap) return;

        phase.assignments
          .filter((a) => a.memberId === member.id)
          .forEach((assignment) => {
            const overlapDays = dayDiffInclusive(overlap.startDate, overlap.endDate);
            const active = ACTIVE_STAGES.has(phase.stage);
            if (active) loadDays += overlapDays;
            rawBars.push({
              id: assignment.id,
              projectId: project.id,
              label: `${project.priority} · ${project.name}`,
              detail: `${phase.name} · ${active ? "全人力投入" : "仅展示排期"}`,
              projectName: project.name,
              stage: phase.stage,
              priority: project.priority,
              startDate: phase.startDate,
              endDate: phase.endDate,
              displayStart: overlap.startDate,
              displayEnd: overlap.endDate,
              active,
            });
          });
      });
    });

    const bars = assignLanes(rawBars);
    return {
      id: member.id,
      name: member.name,
      subtitle: member.role,
      loadDays,
      saturation: (loadDays / rangeDayCount) * 100,
      activeCount: bars.filter((b) => b.active).length,
      bars,
    };
  });
}

export function buildDirectionRows(
  directions: string[],
  members: Member[],
  sortedProjects: Project[],
  rangeStart: string,
  rangeEnd: string,
  rangeDayCount: number
): UtilizationRow[] {
  const groups = [...directions, "技术需求"];
  return groups.map((group) => {
    const rawBars: Omit<TimelineBar, "lane">[] = [];
    let loadDays = 0;
    let activeCount = 0;

    sortedProjects
      .filter((p) => {
        if (p.demandType === "技术需求") return group === "技术需求";
        return (p.businessDirection ?? "未分配方向") === group;
      })
      .forEach((project) => {
        project.phases.forEach((phase) => {
          const overlap = getOverlapRange(phase.startDate, phase.endDate, rangeStart, rangeEnd);
          if (!overlap) return;

          phase.assignments.forEach((assignment) => {
            const member = members.find((m) => m.id === assignment.memberId);
            const overlapDays = dayDiffInclusive(overlap.startDate, overlap.endDate);
            const active = ACTIVE_STAGES.has(phase.stage);
            if (active) {
              loadDays += overlapDays;
              activeCount += 1;
            }
            rawBars.push({
              id: assignment.id,
              projectId: project.id,
              label: `${project.priority} · ${project.name}`,
              detail: `${member?.name ?? "未分配成员"} · ${phase.name}`,
              projectName: project.name,
              stage: phase.stage,
              priority: project.priority,
              startDate: phase.startDate,
              endDate: phase.endDate,
              displayStart: overlap.startDate,
              displayEnd: overlap.endDate,
              active,
            });
          });
        });
      });

    const teamCapacity = Math.max(1, members.length * rangeDayCount);
    return {
      id: group,
      name: group,
      subtitle: group === "技术需求" ? "技术需求池人力占用" : "业务方向人力占用",
      loadDays,
      saturation: (loadDays / teamCapacity) * 100,
      activeCount,
      bars: assignLanes(rawBars),
    };
  });
}

// ---- 人力分析 ----

export function buildMemberCapacity(
  members: Member[],
  projects: Project[],
  _workingDays = WORKING_DAYS_PER_MONTH
): MemberCapacity[] {
  const today = todayIso();
  const windowEnd = addDays(today, 19); // 20-day window inclusive

  return members.map((member) => {
    let plannedDays = 0;
    let actualDays = 0;
    let activeTaskCount = 0;
    const projectNameSet = new Set<string>();
    const details: MemberAssignmentDetail[] = [];
    const pendingProjects: MemberPendingProject[] = [];
    let next20PlannedDays = 0;

    // Only "开发中" and "联调中" count as active resource investment for the 20-day window
    const CAPACITY_STAGES = new Set<StageType>(["开发中", "联调中"]);
    // Stages before 开发中 — member is named but work hasn't started
    const PRE_DEV_STAGES = new Set<StageType>(["需求粗评", "需求方案制定"]);

    projects.forEach((project) => {
      project.phases.forEach((phase) => {
        const isActive = ACTIVE_STAGES.has(phase.stage);
        const isCapacityStage = CAPACITY_STAGES.has(phase.stage);
        const overlapsNext20 = isCapacityStage &&
          !!getOverlapRange(phase.startDate, phase.endDate, today, windowEnd);
        phase.assignments
          .filter((a) => a.memberId === member.id)
          .forEach((a) => {
            plannedDays += a.plannedDays;
            actualDays += a.actualDays;
            if (isActive) activeTaskCount += 1;
            projectNameSet.add(project.name);
            if (overlapsNext20) {
              next20PlannedDays += a.plannedDays;
              details.push({
                projectId: project.id,
                projectName: project.name,
                priority: project.priority,
                phaseName: phase.name,
                stage: phase.stage,
                plannedDays: a.plannedDays,
                actualDays: a.actualDays,
              });
            }
          });
      });

      // Pending: member has assignments but project not yet in 开发中
      const projectStage = getCurrentStage(project);
      if (PRE_DEV_STAGES.has(projectStage)) {
        const memberPlanned = project.phases
          .flatMap((ph) => ph.assignments)
          .filter((a) => a.memberId === member.id)
          .reduce((sum, a) => sum + a.plannedDays, 0);
        if (memberPlanned > 0) {
          pendingProjects.push({
            projectId: project.id,
            projectName: project.name,
            priority: project.priority,
            currentStage: projectStage,
            totalPlannedDays: memberPlanned,
          });
        }
      }
    });

    return {
      member,
      plannedDays,
      actualDays,
      windowPlannedDays: next20PlannedDays,
      activeTaskCount,
      saturation: Math.round((next20PlannedDays / 20) * 100),
      isOverloaded: next20PlannedDays > 20,
      projectNames: [...projectNameSet],
      details,
      pendingProjects,
    };
  }).sort((a, b) => b.saturation - a.saturation);
}

// ---- Dashboard 统计 ----

export function buildDashboardStats(data: AppData) {
  const { projects, members } = data;
  const today = todayIso();

  const activeProjects = projects.filter(
    (p) => !p.phases.some((ph) => ph.stage === "已上线")
  );
  const overdueProjects = projects.filter(
    (p) => p.deliveryDate < today && !p.phases.some((ph) => ph.stage === "已上线")
  );
  const p0Projects = projects.filter(
    (p) => p.priority === "P0" && !p.phases.some((ph) => ph.stage === "已上线")
  );
  const poolProjects = projects.filter((p) => p.inPool && !p.consumedAt);
  const soonProjects = projects.filter(
    (p) =>
      p.deliveryDate >= today &&
      p.deliveryDate <= addDays(today, 3) &&
      !p.phases.some((ph) => ph.stage === "已上线")
  );

  // 各状态需求数（取每个项目的当前主阶段）
  const stageCount: Record<string, number> = {};
  projects.forEach((p) => {
    const stage = getCurrentStage(p);
    stageCount[stage] = (stageCount[stage] ?? 0) + 1;
  });

  // 全人力总投入（所有活跃阶段的 plannedDays 之和）
  let totalActivePlannedDays = 0;
  projects.forEach((p) => {
    p.phases.forEach((ph) => {
      if (ACTIVE_STAGES.has(ph.stage)) {
        totalActivePlannedDays += ph.assignments.reduce((s, a) => s + a.plannedDays, 0);
      }
    });
  });

  // 成员饱和度
  const capacityList = buildMemberCapacity(members, projects);
  const overloadedCount = capacityList.filter((c) => c.isOverloaded).length;
  const avgSaturation =
    capacityList.length > 0
      ? Math.round(capacityList.reduce((s, c) => s + c.saturation, 0) / capacityList.length)
      : 0;

  return {
    totalProjects: projects.length,
    activeCount: activeProjects.length,
    overdueProjects,
    p0Projects,
    poolCount: poolProjects.length,
    soonProjects,
    stageCount,
    totalActivePlannedDays,
    overloadedCount,
    avgSaturation,
  };
}

// 获取项目当前主阶段（取最后一个非"已上线"阶段，或"已上线"）
export function getCurrentStage(project: Project): StageType {
  if (!project.phases.length) return "需求粗评";
  // 查找最后活跃或最后阶段
  const onlinePhase = project.phases.find((p) => p.stage === "已上线");
  if (onlinePhase) return "已上线";
  const integratedPhase = project.phases.find((p) => p.stage === "已集成");
  if (integratedPhase) return "已集成";

  // 按 STAGES 顺序找最靠后的阶段
  const stageOrder: StageType[] = [
    "需求粗评", "需求方案制定", "开发中", "联调中", "测试中", "已集成", "已上线"
  ];
  let maxIdx = -1;
  let maxStage: StageType = "需求粗评";
  project.phases.forEach((p) => {
    const idx = stageOrder.indexOf(p.stage);
    if (idx > maxIdx) {
      maxIdx = idx;
      maxStage = p.stage;
    }
  });
  return maxStage;
}

// ---- 交付统计 ----

export function buildConsumptionStats(projects: Project[]) {
  const thisYear = new Date().getFullYear();
  const months = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

  const DONE_STAGES = new Set<string>(["已上线", "已集成"]);
  const delivered = projects.filter(
    (p) => p.phases.some((ph) => DONE_STAGES.has(ph.stage))
  );

  const monthlyStats = months.map((label, idx) => ({
    month: label,
    idx,
    count: 0,
    workload: 0,
    p0Count: 0,
    p1Count: 0,
    totalPlanned: 0,
    projects: [] as Project[],
    directionBreakdown: {} as Record<string, number>,
  }));

  const versionMap = new Map<string, {
    count: number;
    p0Count: number;
    p1Count: number;
    workload: number;
    totalPlanned: number;
    projects: Project[];
  }>();

  delivered.forEach((p) => {
    const d = toDate(p.deliveryDate);
    if (d.getFullYear() === thisYear) {
      const idx = d.getMonth();
      monthlyStats[idx].count += 1;
      monthlyStats[idx].workload += p.workloadDays;
      monthlyStats[idx].projects.push(p);
      if (p.priority === "P0") monthlyStats[idx].p0Count += 1;
      else monthlyStats[idx].p1Count += 1;
      // 实际分配人天；无分配则用估算工作量兜底
      const assignPlanned = p.phases
        .flatMap((ph) => ph.assignments)
        .reduce((s, a) => s + a.plannedDays, 0);
      monthlyStats[idx].totalPlanned += assignPlanned > 0 ? assignPlanned : p.workloadDays;
      const dir = p.businessDirection ?? "技术需求";
      monthlyStats[idx].directionBreakdown[dir] =
        (monthlyStats[idx].directionBreakdown[dir] ?? 0) + p.workloadDays;

      // 版本维度聚合
      const version = p.version.trim() || "未指定版本";
      if (!versionMap.has(version)) {
        versionMap.set(version, { count: 0, p0Count: 0, p1Count: 0, workload: 0, totalPlanned: 0, projects: [] });
      }
      const v = versionMap.get(version)!;
      v.count += 1;
      if (p.priority === "P0") v.p0Count += 1;
      else v.p1Count += 1;
      v.workload += p.workloadDays;
      v.totalPlanned += assignPlanned > 0 ? assignPlanned : p.workloadDays;
      v.projects.push(p);
    }
  });

  const versionStats = [...versionMap.entries()]
    .map(([version, vd]) => ({
      version,
      count: vd.count,
      p0Count: vd.p0Count,
      p1Count: vd.p1Count,
      workload: vd.workload,
      avgPlanned: vd.count > 0 ? vd.totalPlanned / vd.count : 0,
      projects: vd.projects,
    }))
    .sort((a, b) => a.version.localeCompare(b.version));

  const totalDelivered = delivered.length;
  const totalWorkload = delivered.reduce((s, p) => s + p.workloadDays, 0);
  const p0Delivered = delivered.filter((p) => p.priority === "P0").length;
  const maxMonthCount = Math.max(1, ...monthlyStats.map((m) => m.count));

  return {
    monthlyStats: monthlyStats.map((m) => ({
      ...m,
      avgPlanned: m.count > 0 ? m.totalPlanned / m.count : 0,
    })),
    versionStats,
    totalDelivered,
    totalWorkload,
    p0Delivered,
    maxMonthCount,
    delivered,
  };
}

// ---- 甘特图尺寸 ----

export function timelineWidth(dayCount: number): number {
  return Math.max(720, dayCount * DAY_CELL_WIDTH);
}
