import type { StageType, MemberRole, ProjectPriority } from "@/types";

export const STORAGE_KEY = "pm-staffing-v1";

export const STAGES: StageType[] = [
  "需求粗评",
  "需求方案制定",
  "开发中",
  "联调中",
  "测试中",
  "已集成",
  "已上线",
];

// 计入全人力占用的阶段
export const ACTIVE_STAGES = new Set<StageType>(["开发中", "联调中"]);

// 算作已完成的阶段
export const DONE_STAGES = new Set<StageType>(["已集成", "已上线"]);

export const DEFAULT_DIRECTIONS = ["增长", "安全", "公共模块", "技术需求"];

export const MEMBER_ROLES: MemberRole[] = ["iOS", "Android"];

export const PRIORITIES: ProjectPriority[] = ["P0", "P1"];

export const DAY_CELL_WIDTH = 44;

// 月工作日天数（用于饱和度计算）
export const WORKING_DAYS_PER_MONTH = 20;
