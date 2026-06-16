import { useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Download,
  FolderKanban,
  Gauge,
  Inbox,
  List,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useDataStore } from "@/store";
import SectionButton from "@/components/shared/SectionButton";
import { exportToExcel } from "@/exportExcel";
import Dashboard from "@/components/sections/Dashboard";
import Overview from "@/components/sections/Overview";
import RequirementsList from "@/components/sections/RequirementsList";
import Projects from "@/components/sections/Projects";
import DemandPool from "@/components/sections/DemandPool";
import Consumption from "@/components/sections/Consumption";
import Capacity from "@/components/sections/Capacity";
import Members from "@/components/sections/Members";
import ProjectDetailModal from "@/components/shared/ProjectDetailModal";
import type { SectionKey } from "@/types";

const NAV_ITEMS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "人力大盘", icon: <Gauge className="h-4 w-4" /> },
  { key: "overview", label: "总览与甘特图", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "requirementsList", label: "需求列表", icon: <List className="h-4 w-4" /> },
  { key: "projects", label: "需求录入", icon: <FolderKanban className="h-4 w-4" /> },
  { key: "demandPool", label: "需求池", icon: <Inbox className="h-4 w-4" /> },
  { key: "consumptionReport", label: "需求统计", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "capacity", label: "人力分析", icon: <Target className="h-4 w-4" /> },
  { key: "members", label: "成员与方向", icon: <Users className="h-4 w-4" /> },
];

export default function Home() {
  const [section, setSection] = useState<SectionKey>("dashboard");
  const [quickAddModalId, setQuickAddModalId] = useState<string | null>(null);
  const data = useDataStore((s) => s.data);
  const isLoading = useDataStore((s) => s.isLoading);
  const readOnly = useDataStore((s) => s.readOnly);
  const addProject = useDataStore((s) => s.addProject);
  const deleteProject = useDataStore((s) => s.deleteProject);

  const quickAddProject = useMemo(
    () => (quickAddModalId ? data.projects.find((p) => p.id === quickAddModalId) ?? null : null),
    [quickAddModalId, data.projects]
  );

  const poolCount = useMemo(
    () => data?.projects?.filter((p) => p.inPool && !p.consumedAt).length ?? 0,
    [data?.projects]
  );

  if (isLoading || !data) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mx-auto" />
          <p>正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-6 py-6">
        {/* 侧边栏 */}
        <aside className="w-[260px] shrink-0 space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
          {/* Logo 区 */}
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/15 p-2.5 text-sky-200">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold leading-tight text-white">国际化乘客端</div>
                <div className="text-xs text-slate-400">开发人力管理</div>
              </div>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              iOS / Android 双端 · 自动保存至浏览器
            </p>
          </div>

          {/* 导航 */}
          <nav className="space-y-2">
            {NAV_ITEMS.map(({ key, label, icon }) => (
              <SectionButton
                key={key}
                active={section === key}
                icon={icon}
                label={label}
                badge={key === "demandPool" ? poolCount : undefined}
                onClick={() => setSection(key)}
              />
            ))}
          </nav>

          {/* 快捷新增 */}
          {!readOnly && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="text-xs font-medium text-slate-500">快速新增</div>
            <button
              type="button"
              onClick={() => { const id = addProject("业务需求"); setQuickAddModalId(id); }}
              className="flex w-full items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-200 transition hover:bg-sky-500/20"
            >
              <Plus className="h-4 w-4" /> 业务需求
            </button>
            <button
              type="button"
              onClick={() => { const id = addProject("技术需求"); setQuickAddModalId(id); }}
              className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
            >
              <Plus className="h-4 w-4" /> 技术需求
            </button>
          </div>
          )}

          {/* 业务方向概览 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 text-xs font-medium text-slate-400">业务方向</div>
            <div className="flex flex-wrap gap-1.5">
              {data.directions.map((d) => (
                <span key={d} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">{d}</span>
              ))}
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">技术需求</span>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        {quickAddProject && (
          <ProjectDetailModal
            project={quickAddProject}
            onClose={() => setQuickAddModalId(null)}
            onDiscard={() => { deleteProject(quickAddProject.id); setQuickAddModalId(null); }}
            initialEditing
          />
        )}
        <main className="min-w-0 flex-1 space-y-6">
          {/* 只读模式提示 */}
          {readOnly && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
              👁 只读模式 · 无法编辑数据
            </div>
          )}

          {/* 页头 */}
          <header className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-sky-400">
                  {NAV_ITEMS.find((n) => n.key === section)?.label}
                </div>
                <h1 className="mt-1 text-2xl font-semibold text-white">国际化乘客端开发人力管理</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-3 text-xs text-slate-400">
                  <span>{data.members.length} 名成员</span>
                  <span>·</span>
                  <span>{data.projects.length} 个需求</span>
                  <span>·</span>
                  <span>数据自动保存</span>
                </div>
                <button
                  type="button"
                  onClick={() => exportToExcel(data)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
                >
                  <Download className="h-3.5 w-3.5" />
                  导出 Excel
                </button>
              </div>
            </div>
          </header>

          {/* 各 section */}
          {section === "dashboard" && <Dashboard />}
          {section === "overview" && <Overview />}
          {section === "requirementsList" && <RequirementsList />}
          {section === "projects" && <Projects />}
          {section === "demandPool" && <DemandPool />}
          {section === "consumptionReport" && <Consumption />}
          {section === "capacity" && <Capacity />}
          {section === "members" && <Members />}
        </main>
      </div>
    </div>
  );
}
