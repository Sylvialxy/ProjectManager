import { useState } from "react";
import { BriefcaseBusiness, Download, UserRound, Users } from "lucide-react";
import { useDataStore } from "@/store";
import EmptyState from "@/components/shared/EmptyState";
import { MEMBER_ROLES } from "@/constants";
import type { AppData, MemberRole } from "@/types";

export default function Members() {
  const data = useDataStore((s) => s.data);
  const readOnly = useDataStore((s) => s.readOnly);
  const { addMember, deleteMember, addDirection, deleteDirection, importData } = useDataStore();

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/devmanage-import.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AppData = await res.json();
      importData(json);
      setImportMsg({ ok: true, text: `导入成功：${json.members.length} 名成员，${json.projects.length} 个需求` });
    } catch (e) {
      setImportMsg({ ok: false, text: `导入失败：${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setImporting(false);
    }
  }

  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<MemberRole>("iOS");
  const [newDirection, setNewDirection] = useState("");

  function handleAddMember() {
    if (!newName.trim()) return;
    addMember(newName, newRole);
    setNewName("");
    setNewRole("iOS");
  }

  function handleAddDirection() {
    if (!newDirection.trim()) return;
    addDirection(newDirection);
    setNewDirection("");
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      {/* 成员管理 */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Users className="h-5 w-5 text-slate-200" />
          </div>
          <div>
            <div className="text-lg font-semibold text-white">成员管理</div>
            <div className="text-sm text-slate-400">iOS 与 Android 开发工程师</div>
          </div>
        </div>

        {!readOnly && (
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            placeholder="成员姓名"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as MemberRole)}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-sky-500/40"
          >
            {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            type="button"
            onClick={handleAddMember}
            className="rounded-2xl border border-sky-500/40 bg-sky-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-400"
          >
            添加
          </button>
        </div>
        )}

        <div className="space-y-3">
          {data.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900 p-2">
                  <UserRound className="h-4 w-4 text-slate-200" />
                </div>
                <div>
                  <div className="font-medium text-white">{member.name}</div>
                  <div className="text-sm text-slate-400">{member.role} 开发工程师</div>
                </div>
              </div>
              {!readOnly && (
              <button
                type="button"
                onClick={() => deleteMember(member.id)}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
              >
                删除
              </button>
              )}
            </div>
          ))}
          {!data.members.length && <EmptyState title="暂无成员" description="添加 iOS 或 Android 开发工程师。" />}
        </div>
      </div>

      {/* 业务方向管理 */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 backdrop-blur">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <BriefcaseBusiness className="h-5 w-5 text-slate-200" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">业务方向</div>
              <div className="text-sm text-slate-400">仅用于业务需求，技术需求独立展示</div>
            </div>
          </div>

          {!readOnly && (
          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={newDirection}
              onChange={(e) => setNewDirection(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDirection()}
              placeholder="新增业务方向名称"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-500/40"
            />
            <button
              type="button"
              onClick={handleAddDirection}
              className="rounded-2xl border border-sky-500/40 bg-sky-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-400"
            >
              添加
            </button>
          </div>
          )}

          <div className="space-y-3">
            {data.directions.map((direction) => {
              const inUse = data.projects.some(
                (p) => p.demandType === "业务需求" && p.businessDirection === direction
              );
              return (
                <div key={direction} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="font-medium text-white">{direction}</div>
                    <div className="text-sm text-slate-400">
                      {inUse ? "业务需求使用中，不可删除" : "当前未被使用"}
                    </div>
                  </div>
                  {!readOnly && (
                  <button
                    type="button"
                    onClick={() => deleteDirection(direction)}
                    disabled={inUse}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    删除
                  </button>
                  )}
                </div>
              );
            })}
            {!data.directions.length && <EmptyState title="暂无业务方向" description="添加后可在业务需求中关联。" />}
          </div>
        </div>

        {/* DevManage 数据导入 */}
        {!readOnly && (
        <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
          <div className="mb-3 flex items-center gap-2 font-semibold text-sky-100">
            <Download className="h-4 w-4" />
            导入 DevManage 数据
          </div>
          <p className="mb-4 text-sm text-sky-50/75">
            将 <code className="rounded bg-white/10 px-1">public/devmanage-import.json</code> 中的历史数据加载到当前应用，<strong>会覆盖现有所有数据</strong>。
          </p>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="rounded-2xl border border-sky-500/40 bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:opacity-60"
          >
            {importing ? "导入中…" : "一键导入"}
          </button>
          {importMsg && (
            <p className={`mt-3 text-sm ${importMsg.ok ? "text-emerald-300" : "text-rose-300"}`}>
              {importMsg.text}
            </p>
          )}
        </div>
        )}

        {/* 口径说明 */}
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="mb-3 font-semibold text-emerald-100">口径说明</div>
          <div className="space-y-1.5 text-sm leading-6 text-emerald-50/85">
            <div>1. 团队成员仅维护 iOS 和 Android 两类。</div>
            <div>2. 删除成员会同步移除其在所有需求中的投入记录。</div>
            <div>3. 被业务需求引用的方向无法直接删除。</div>
            <div>4. 技术需求不关联业务方向，独立展示在甘特图中。</div>
          </div>
        </div>
      </div>
    </section>
  );
}
