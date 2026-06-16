import { create } from "zustand";
import type {
  AppData,
  Project,
  Member,
  ProjectPhase,
  Assignment,
  MemberRole,
  DemandType,
  StageType,
} from "@/types";
import {
  createId,
  toIsoDate,
  sortProjects,
  getCurrentStage,
} from "@/utils";
import { DEFAULT_DIRECTIONS } from "@/constants";

// 数据 API 地址：本地开发走 Vite 代理，远程访问走 bore URL
// ---- 数据 API 地址计算 ----
// 优先级：1. URL 参数 (?api=xxx)  >  2. 环境变量  >  3. 本地代理
function getApiBase(): string {
  // 1. URL 参数（远程分享时注入）
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get("api");
  if (urlParam) {
    return `${urlParam}/api`;
  }
  // 2. 构建时注入的环境变量
  const envUrl = (import.meta.env.VITE_DATA_SERVER_URL as string) || "";
  if (envUrl) {
    return `${envUrl}/api`;
  }
  // 3. 本地开发：走 Vite 代理
  return "/api";
}
const API_BASE = getApiBase();
const STORAGE_KEY = "pm-staffing-v1";
const SYNC_DEBOUNCE_MS = 500;

// ---- 本地存储读写 ----

function loadFromLocal(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocal(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ---- 同步到服务端（防抖） ----

let _syncTimer: ReturnType<typeof setTimeout> | null = null;

function syncToServer(data: AppData) {
  if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
  _syncTimer = setTimeout(async () => {
    try {
      await fetch(`${API_BASE}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch { /* ignore */ }
  }, SYNC_DEBOUNCE_MS);
}

// ---- 更新数据（统一入口） ----

function updateData(
  set: (partial: Partial<{ data: AppData; isLoading: boolean; isServerConnected: boolean }>) => void,
  get: () => { data: AppData; isLoading: boolean; isServerConnected: boolean },
  newData: AppData,
) {
  saveToLocal(newData);
  set({ data: newData });
  if (get().isServerConnected) {
    syncToServer(newData);
  }
}

// ---- 种子数据 ----

function makeSeedData(): AppData {
  const mA = createId("member");
  const mB = createId("member");
  const mC = createId("member");
  const mD = createId("member");

  return {
    directions: ["增长", "安全", "公共模块"],
    members: [
      { id: mA, name: "陈浩", role: "iOS" },
      { id: mB, name: "林岚", role: "Android" },
      { id: mC, name: "周宁", role: "iOS" },
      { id: mD, name: "宋远", role: "Android" },
    ],
    projects: sortProjects([
      {
        id: createId("project"),
        name: "拉美新客首屏改版",
        demandType: "业务需求",
        priority: "P0",
        businessDirection: "增长",
        startDate: "2026-05-02",
        deliveryDate: "2026-05-28",
        workloadDate: "2026-04-15",
        workEndDate: "2026-05-23",
        workloadDays: 18,
        description: "国际化乘客端首屏增长活动改版，优先保障拉美投放。",
        note: "",
        version: "0528",
        ddp: "",
        phases: [
          {
            id: createId("phase"),
            name: "需求方案",
            stage: "需求方案制定",
            startDate: "2026-05-02",
            endDate: "2026-05-05",
            assignments: [{ id: createId("assign"), memberId: mA, plannedDays: 1, actualDays: 1 }],
          },
          {
            id: createId("phase"),
            name: "iOS / Android 开发",
            stage: "开发中",
            startDate: "2026-05-06",
            endDate: "2026-05-18",
            assignments: [
              { id: createId("assign"), memberId: mA, plannedDays: 6.5, actualDays: 4 },
              { id: createId("assign"), memberId: mB, plannedDays: 7, actualDays: 3.5 },
            ],
          },
          {
            id: createId("phase"),
            name: "联调验收",
            stage: "联调中",
            startDate: "2026-05-19",
            endDate: "2026-05-23",
            assignments: [
              { id: createId("assign"), memberId: mA, plannedDays: 2, actualDays: 0 },
              { id: createId("assign"), memberId: mB, plannedDays: 2, actualDays: 0 },
            ],
          },
        ],
        owner: null,
        inPool: false,
        pooledAt: null,
        consumedAt: "2026-04-20",
        consumedBy: "陈浩",
      },
      {
        id: createId("project"),
        name: "登录安全风控升级",
        demandType: "业务需求",
        priority: "P0",
        businessDirection: "安全",
        startDate: "2026-05-01",
        deliveryDate: "2026-05-24",
        workloadDate: "2026-04-10",
        workEndDate: "2026-05-20",
        workloadDays: 14.5,
        description: "乘客端登录风控校验、设备封禁与安全提示优化。",
        note: "",
        version: "0524",
        ddp: "",
        phases: [
          {
            id: createId("phase"),
            name: "安全粗评",
            stage: "需求粗评",
            startDate: "2026-05-01",
            endDate: "2026-05-02",
            assignments: [{ id: createId("assign"), memberId: mC, plannedDays: 0.5, actualDays: 0.5 }],
          },
          {
            id: createId("phase"),
            name: "客户端开发",
            stage: "开发中",
            startDate: "2026-05-05",
            endDate: "2026-05-16",
            assignments: [
              { id: createId("assign"), memberId: mC, plannedDays: 6, actualDays: 2.5 },
              { id: createId("assign"), memberId: mD, plannedDays: 5.5, actualDays: 2 },
            ],
          },
          {
            id: createId("phase"),
            name: "安全联调",
            stage: "联调中",
            startDate: "2026-05-17",
            endDate: "2026-05-20",
            assignments: [{ id: createId("assign"), memberId: mD, plannedDays: 1.5, actualDays: 0 }],
          },
        ],
        owner: null,
        inPool: false,
        pooledAt: null,
        consumedAt: "2026-04-18",
        consumedBy: "周宁",
      },
      {
        id: createId("project"),
        name: "国际化埋点框架统一",
        demandType: "技术需求",
        priority: "P1",
        businessDirection: null,
        startDate: "2026-05-10",
        deliveryDate: "2026-05-30",
        workloadDate: "2026-04-20",
        workEndDate: null,
        workloadDays: 10,
        description: "统一 iOS / Android 事件埋点、实验参数与灰度通道。",
        note: "",
        version: "0530",
        ddp: "",
        phases: [
          {
            id: createId("phase"),
            name: "基础设施开发",
            stage: "开发中",
            startDate: "2026-05-10",
            endDate: "2026-05-22",
            assignments: [
              { id: createId("assign"), memberId: mA, plannedDays: 4.5, actualDays: 1.5 },
              { id: createId("assign"), memberId: mD, plannedDays: 4, actualDays: 1 },
            ],
          },
          {
            id: createId("phase"),
            name: "公共组件集成",
            stage: "已集成",
            startDate: "2026-05-23",
            endDate: "2026-05-26",
            assignments: [{ id: createId("assign"), memberId: mB, plannedDays: 1, actualDays: 0 }],
          },
        ],
        owner: null,
        inPool: false,
        pooledAt: null,
        consumedAt: "2026-04-25",
        consumedBy: "陈浩",
      },
      {
        id: createId("project"),
        name: "用户行程页改版",
        demandType: "业务需求",
        priority: "P0",
        businessDirection: "增长",
        startDate: "2026-04-28",
        deliveryDate: "2026-06-15",
        workloadDate: "2026-04-28",
        workEndDate: null,
        workloadDays: 12,
        description: "行程页交互优化，提升用户行程确认效率。",
        note: "",
        version: "",
        ddp: "",
        owner: null,
        phases: [],
        inPool: true,
        pooledAt: "2026-04-28",
        consumedAt: null,
        consumedBy: null,
      },
      {
        id: createId("project"),
        name: "支付失败重试优化",
        demandType: "业务需求",
        priority: "P0",
        businessDirection: "增长",
        startDate: "2026-05-01",
        deliveryDate: "2026-06-10",
        workloadDate: "2026-05-01",
        workEndDate: null,
        workloadDays: 8,
        description: "支付失败场景增加智能重试和优惠券激励。",
        note: "",
        version: "",
        ddp: "",
        owner: null,
        phases: [],
        inPool: true,
        pooledAt: "2026-05-01",
        consumedAt: null,
        consumedBy: null,
      },
    ]),
  };
}

// ---- 只读模式 ----
// 通过 URL 参数 ?readonly=1 开启只读模式
function isReadOnlyMode(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("readonly") === "1";
  } catch {
    return false;
  }
}

const READ_ONLY = isReadOnlyMode();

// ---- Store 类型 ----

interface DataStore {
  data: AppData;
  isLoading: boolean;
  isServerConnected: boolean;
  readOnly: boolean;

  addProject: (demandType: DemandType) => string;
  updateProject: (projectId: string, updater: (p: Project) => Project) => void;
  deleteProject: (projectId: string) => void;

  addPhase: (projectId: string) => string;
  updatePhase: (projectId: string, phaseId: string, updater: (ph: ProjectPhase) => ProjectPhase) => void;
  deletePhase: (projectId: string, phaseId: string) => void;

  addAssignment: (projectId: string, phaseId: string, memberId?: string) => void;
  updateAssignment: (
    projectId: string,
    phaseId: string,
    assignmentId: string,
    updater: (a: Assignment) => Assignment,
  ) => void;
  deleteAssignment: (projectId: string, phaseId: string, assignmentId: string) => void;

  addMember: (name: string, role: MemberRole) => void;
  deleteMember: (memberId: string) => void;

  addDirection: (name: string) => void;
  deleteDirection: (name: string) => void;

  addToPool: (projectId: string) => void;
  removeFromPool: (projectId: string) => void;
  consumeProject: (projectId: string, memberName: string) => void;

  getSortedProjects: () => Project[];
  advanceStage: (projectId: string) => void;
  importData: (incoming: AppData) => void;
  init: () => Promise<void>;
}

// ---- Store 实现 ----

export const useDataStore = create<DataStore>()((set, get) => ({
  data: makeSeedData(),
  isLoading: true,
  isServerConnected: false,
  readOnly: READ_ONLY,

  init: async () => {
    // 优先级：服务端(共享JSON) > localStorage兜底 > 种子数据
    // 1. 先尝试服务端（真实共享数据）
    try {
      const res = await fetch(`${API_BASE}/data`);
      if (res.ok) {
        const serverData: AppData = await res.json();
        set({ data: serverData, isServerConnected: true, isLoading: false });
        saveToLocal(serverData); // 回填 localStorage 保持一致
        return;
      }
    } catch {
      // 服务端不可用，继续尝试 localStorage
    }

    // 2. 尝试 localStorage 兜底
    const local = loadFromLocal();
    if (local) {
      set({ data: local, isServerConnected: false, isLoading: false });
      return;
    }

    // 3. 兜底：种子数据（全新用户）
    set({ isServerConnected: false, isLoading: false });
  },

  addProject(demandType) {
    if (get().readOnly) return;
    const id = createId("project");
    const today = toIsoDate(new Date());
    // 新建需求默认无 owner 且无版本号，直接进需求池
    const newProject: Project = {
      id,
      name: demandType === "业务需求" ? "新业务需求" : "新技术需求",
      demandType,
      priority: "P1",
      businessDirection: demandType === "业务需求"
        ? get().data.directions[0] ?? DEFAULT_DIRECTIONS[0]
        : null,
      startDate: null,
      deliveryDate: today,
      workloadDate: today,
      workEndDate: null,
      workloadDays: 1,
      description: "",
      note: "",
      version: "",
      ddp: "",
      phases: [{ id: createId("phase"), name: "需求粗评", stage: "需求粗评", startDate: today, endDate: today, assignments: [] }],
      owner: null,
      inPool: true,
      pooledAt: today,
      consumedAt: null,
      consumedBy: null,
    };
    const newData = { ...get().data, projects: [newProject, ...get().data.projects] };
    updateData(set, get, newData);
    return id;
  },

  updateProject(projectId, updater) {
    if (get().readOnly) return;
    const newData = {
      ...get().data,
      projects: get().data.projects.map((p) => (p.id === projectId ? updater(p) : p)),
    };
    updateData(set, get, newData);
  },

  deleteProject(projectId) {
    if (get().readOnly) return;
    const newData = { ...get().data, projects: get().data.projects.filter((p) => p.id !== projectId) };
    updateData(set, get, newData);
  },

  addPhase(projectId) {
    if (get().readOnly) return;
    const id = createId("phase");
    const today = toIsoDate(new Date());
    const phase: ProjectPhase = { id, name: "新阶段", stage: "需求粗评", startDate: today, endDate: today, assignments: [] };
    get().updateProject(projectId, (p) => ({ ...p, phases: [...p.phases, phase] }));
    return id;
  },

  updatePhase(projectId, phaseId, updater) {
    if (get().readOnly) return;
    get().updateProject(projectId, (p) => ({
      ...p,
      phases: p.phases.map((ph) => (ph.id === phaseId ? updater(ph) : ph)),
    }));
  },

  deletePhase(projectId, phaseId) {
    if (get().readOnly) return;
    get().updateProject(projectId, (p) => ({
      ...p,
      phases: p.phases.filter((ph) => ph.id !== phaseId),
    }));
  },

  addAssignment(projectId, phaseId, memberId) {
    if (get().readOnly) return;
    const defaultId = memberId ?? get().data.members[0]?.id;
    if (!defaultId) return;
    const assignment: Assignment = { id: createId("assign"), memberId: defaultId, plannedDays: 0.5, actualDays: 0 };
    get().updatePhase(projectId, phaseId, (ph) => ({ ...ph, assignments: [...ph.assignments, assignment] }));
  },

  updateAssignment(projectId, phaseId, assignmentId, updater) {
    if (get().readOnly) return;
    get().updatePhase(projectId, phaseId, (ph) => ({
      ...ph,
      assignments: ph.assignments.map((a) => (a.id === assignmentId ? updater(a) : a)),
    }));
  },

  deleteAssignment(projectId, phaseId, assignmentId) {
    if (get().readOnly) return;
    get().updatePhase(projectId, phaseId, (ph) => ({
      ...ph,
      assignments: ph.assignments.filter((a) => a.id !== assignmentId),
    }));
  },

  addMember(name, role) {
    if (get().readOnly) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const member: Member = { id: createId("member"), name: trimmed, role };
    const newData = { ...get().data, members: [...get().data.members, member] };
    updateData(set, get, newData);
  },

  deleteMember(memberId) {
    if (get().readOnly) return;
    const newData = {
      ...get().data,
      members: get().data.members.filter((m) => m.id !== memberId),
      projects: get().data.projects.map((p) => ({
        ...p,
        phases: p.phases.map((ph) => ({
          ...ph,
          assignments: ph.assignments.filter((a) => a.memberId !== memberId),
        })),
      })),
    };
    updateData(set, get, newData);
  },

  addDirection(name) {
    if (get().readOnly) return;
    const trimmed = name.trim();
    if (!trimmed || get().data.directions.includes(trimmed)) return;
    const newData = { ...get().data, directions: [...get().data.directions, trimmed] };
    updateData(set, get, newData);
  },

  deleteDirection(name) {
    if (get().readOnly) return;
    const inUse = get().data.projects.some(
      (p) => p.demandType === "业务需求" && p.businessDirection === name,
    );
    if (inUse) return;
    const newData = { ...get().data, directions: get().data.directions.filter((d) => d !== name) };
    updateData(set, get, newData);
  },

  addToPool(projectId) {
    if (get().readOnly) return;
    get().updateProject(projectId, (p) => ({
      ...p,
      inPool: true,
      pooledAt: toIsoDate(new Date()),
    }));
  },

  removeFromPool(projectId) {
    if (get().readOnly) return;
    get().updateProject(projectId, (p) => ({ ...p, inPool: false, pooledAt: null }));
  },

  consumeProject(projectId, memberName) {
    if (get().readOnly) return;
    const today = toIsoDate(new Date());
    get().updateProject(projectId, (p) => ({
      ...p,
      inPool: false,
      pooledAt: null,
      consumedAt: today,
      consumedBy: memberName,
      phases: p.phases.length
        ? p.phases
        : [{ id: createId("phase"), name: "需求粗评", stage: "需求粗评", startDate: today, endDate: today, assignments: [] }],
    }));
  },

  getSortedProjects() {
    return sortProjects(get().data.projects);
  },

  advanceStage(projectId) {
    if (get().readOnly) return;
    const project = get().data.projects.find((p) => p.id === projectId);
    if (!project) return;
    const stageOrder: StageType[] = ["需求粗评", "需求方案制定", "开发中", "联调中", "测试中", "已集成", "已上线"];
    const current = getCurrentStage(project);
    const idx = stageOrder.indexOf(current);
    if (idx === -1 || idx >= stageOrder.length - 1) return;
    const nextStage = stageOrder[idx + 1];
    const today = toIsoDate(new Date());
    get().updateProject(projectId, (p) => ({
      ...p,
      phases: [
        ...p.phases,
        { id: createId("phase"), name: nextStage, stage: nextStage, startDate: today, endDate: p.deliveryDate, assignments: [] },
      ],
    }));
  },

  importData(incoming) {
    if (get().readOnly) return;
    const newData = { ...incoming, projects: sortProjects(incoming.projects) };
    updateData(set, get, newData);
  },
}));
