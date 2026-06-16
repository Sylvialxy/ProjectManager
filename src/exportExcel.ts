import * as XLSX from "xlsx";
import type { AppData } from "@/types";
import { getCurrentStage, formatDayValue } from "@/utils";
import { WORKING_DAYS_PER_MONTH } from "@/constants";

export function exportToExcel(data: AppData): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: 需求列表 ──
  const reqRows = data.projects.map((p) => {
    // Collect all unique assigned member names across all phases
    const devSet = new Set<string>();
    p.phases.forEach((ph) =>
      ph.assignments.forEach((a) => {
        const m = data.members.find((m) => m.id === a.memberId);
        if (m) devSet.add(`${m.name}(${m.role})`);
      })
    );
    return {
      需求名称: p.name,
      Owner: p.owner ?? "",
      优先级: p.priority,
      类型: p.demandType,
      业务方向: p.businessDirection ?? "",
      当前阶段: getCurrentStage(p),
      开发成员: [...devSet].join("、"),
      开始日期: p.startDate ?? "",
      交付日期: p.deliveryDate,
      人力结束日期: p.workEndDate ?? "",
      估算工作量_天: p.workloadDays,
      版本: p.version,
      需求说明: p.description,
      备注: p.note,
      DDP: p.ddp,
      是否在需求池: p.inPool ? "是" : "否",
      入池时间: p.pooledAt ?? "",
      消化时间: p.consumedAt ?? "",
      消化负责人: p.consumedBy ?? "",
    };
  });
  const ws1 = XLSX.utils.json_to_sheet(reqRows);
  XLSX.utils.book_append_sheet(wb, ws1, "需求列表");

  // ── Sheet 2: 成员投入明细 ──
  const detailRows: object[] = [];
  data.projects.forEach((p) => {
    p.phases.forEach((phase) => {
      phase.assignments.forEach((a) => {
        const member = data.members.find((m) => m.id === a.memberId);
        detailRows.push({
          需求名称: p.name,
          优先级: p.priority,
          阶段名称: phase.name,
          阶段状态: phase.stage,
          阶段开始: phase.startDate,
          阶段结束: phase.endDate,
          成员姓名: member?.name ?? a.memberId,
          成员角色: member?.role ?? "",
          计划人天: a.plannedDays,
          实际人天: a.actualDays,
        });
      });
    });
  });
  const ws2 = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, ws2, "成员投入明细");

  // ── Sheet 3: 成员人力概况 ──
  const capacityRows = data.members.map((member) => {
    let plannedDays = 0;
    let actualDays = 0;
    let activeTaskCount = 0;
    const projectNames: string[] = [];

    data.projects.forEach((p) => {
      let memberInProject = false;
      p.phases.forEach((phase) => {
        const isActive = ["开发中", "联调中"].includes(phase.stage);
        phase.assignments
          .filter((a) => a.memberId === member.id)
          .forEach((a) => {
            plannedDays += a.plannedDays;
            actualDays += a.actualDays;
            if (isActive) activeTaskCount += 1;
            memberInProject = true;
          });
      });
      if (memberInProject) projectNames.push(p.name);
    });

    return {
      姓名: member.name,
      角色: member.role,
      计划人天: plannedDays,
      实际人天: actualDays,
      活跃任务数: activeTaskCount,
      饱和度: `${Math.round((plannedDays / WORKING_DAYS_PER_MONTH) * 100)}%`,
      是否超载: plannedDays > WORKING_DAYS_PER_MONTH ? "是" : "否",
      参与需求: projectNames.join("、"),
    };
  });
  const ws3 = XLSX.utils.json_to_sheet(capacityRows);
  XLSX.utils.book_append_sheet(wb, ws3, "成员人力概况");

  // 下载
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `需求管理导出_${dateStr}.xlsx`);
}
