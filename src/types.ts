export type StageType =
  | "需求粗评"
  | "需求方案制定"
  | "开发中"
  | "联调中"
  | "测试中"
  | "已集成"
  | "已上线";

export type MemberRole = "iOS" | "Android";
export type ProjectPriority = "P0" | "P1";
export type DemandType = "业务需求" | "技术需求";

export type SectionKey =
  | "dashboard"
  | "overview"
  | "requirementsList"
  | "projects"
  | "demandPool"
  | "consumptionReport"
  | "capacity"
  | "members";

export type Member = {
  id: string;
  name: string;
  role: MemberRole;
};

export type Assignment = {
  id: string;
  memberId: string;
  plannedDays: number;
  actualDays: number;
};

export type ProjectPhase = {
  id: string;
  name: string;
  stage: StageType;
  startDate: string;
  endDate: string;
  assignments: Assignment[];
};

export type Project = {
  id: string;
  name: string;
  demandType: DemandType;
  priority: ProjectPriority;
  businessDirection: string | null;
  // 时间字段
  startDate: string | null;  // 项目开始日期（进入开发后填写）
  deliveryDate: string;      // 交付日期（上线目标）
  workloadDate: string;      // 入队/入池时间（用于需求池排序）
  workEndDate: string | null; // 人力投入结束日期（进测试后）
  // 工作量
  workloadDays: number;      // 总估算工作量（天）
  // 元信息
  description: string;       // 需求说明
  note: string;              // 备注（内部沟通记录）
  version: string;           // 发版版本号，如 "0506"
  ddp: string;               // DDP / 设计文档链接
  // 阶段
  owner?: string | null; // 需求负责人 Owner（选填，老数据兼容）
  phases: ProjectPhase[];
  // 需求池
  inPool: boolean;
  pooledAt: string | null;
  consumedAt: string | null;
  consumedBy: string | null;
};

export type AppData = {
  directions: string[];
  members: Member[];
  projects: Project[];
};

// ---- 派生/计算类型 ----

export type TimelineBar = {
  id: string;
  projectId: string;
  label: string;
  detail: string;
  projectName: string;
  stage: StageType;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  displayStart: string;
  displayEnd: string;
  active: boolean;
  lane: number;
};

export type UtilizationRow = {
  id: string;
  name: string;
  subtitle: string;
  loadDays: number;
  saturation: number;
  activeCount: number;
  bars: TimelineBar[];
};

export type MemberAssignmentDetail = {
  projectId: string;
  projectName: string;
  priority: ProjectPriority;
  phaseName: string;
  stage: StageType;
  plannedDays: number;
  actualDays: number;
};

export type MemberPendingProject = {
  projectId: string;
  projectName: string;
  priority: ProjectPriority;
  currentStage: StageType;
  totalPlannedDays: number;
};

export type MemberCapacity = {
  member: Member;
  plannedDays: number;
  actualDays: number;
  windowPlannedDays: number; // 未来20天内（开发中/联调中）计划人天
  activeTaskCount: number;
  saturation: number;
  isOverloaded: boolean;
  projectNames: string[];
  details: MemberAssignmentDetail[];
  pendingProjects: MemberPendingProject[]; // 已排期但未进入开发中的需求
};
