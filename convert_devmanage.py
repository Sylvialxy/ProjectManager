"""
DevManage → ProjectManager 数据转换脚本
将 ~/Documents/ 中的 DevManage 数据转换为 ProjectManager 的 AppData 格式
输出: public/devmanage-import.json
"""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

# ---- 路径配置 ----
DOCS = Path.home() / "Documents"
MEMBERS_FILE       = DOCS / "members.json"
REQUIREMENTS_FILE  = DOCS / "requirements.json"
DIRECTIONS_FILE    = DOCS / "custom_directions.json"
OUTPUT_FILE        = Path(__file__).parent / "public" / "devmanage-import.json"


# ---- 工具函数 ----

def ts_to_iso(ts):
    """Unix 时间戳（秒）→ ISO 日期字符串 YYYY-MM-DD"""
    if ts is None:
        return None
    try:
        return datetime.fromtimestamp(float(ts), tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return None

def map_priority(p: str) -> str:
    return p.upper()  # p0 → P0, p1 → P1

def map_demand_type(t: str) -> str:
    return "业务需求" if t == "business" else "技术需求"

STATUS_ORDER = [
    "roughEstimate", "planning", "developing",
    "integration", "testing", "integrated", "online",
]

STAGE_MAP = {
    "roughEstimate": "需求粗评",
    "planning":      "需求方案制定",
    "developing":    "开发中",
    "integration":   "联调中",
    "testing":       "测试中",
    "integrated":    "已集成",
    "online":        "已上线",
}

def status_idx(status: str) -> int:
    try:
        return STATUS_ORDER.index(status)
    except ValueError:
        return 0


def build_phases(req: dict) -> list:
    """
    根据 DevManage 的 status / assignments / 日期构建 phases 列表。
    规则：
    - 每个阶段的起止日期用项目的整体日期近似
    - devWorkload assignments → 开发中阶段
    - integrationWorkload assignments → 联调中阶段
    """
    status   = req.get("status", "roughEstimate")
    idx      = status_idx(status)
    req_id   = req.get("id", str(uuid.uuid4()))

    start    = ts_to_iso(req.get("startDate"))  or "2026-01-01"
    delivery = ts_to_iso(req.get("deliveryDate")) or start
    work_end = ts_to_iso(req.get("workEndDate"))  or delivery

    # 整理成员投入
    dev_assigns = []
    int_assigns = []
    seen_ids = set()

    for a in req.get("assignments", []):
        mid = a.get("memberId", "")
        dev = float(a.get("devWorkload", 0) or 0)
        itn = float(a.get("integrationWorkload", 0) or 0)

        if dev > 0:
            aid = a.get("id", str(uuid.uuid4()))
            if aid not in seen_ids:
                seen_ids.add(aid)
                dev_assigns.append({
                    "id":          aid,
                    "memberId":    mid,
                    "plannedDays": dev,
                    "actualDays":  0,
                })

        if itn > 0:
            aid_int = a.get("id", str(uuid.uuid4())) + "-int"
            int_assigns.append({
                "id":          aid_int,
                "memberId":    mid,
                "plannedDays": itn,
                "actualDays":  0,
            })

    phases = []

    def add_phase(name, stage, s_date, e_date, assignments=None):
        phases.append({
            "id":          f"{req_id}-{stage}",
            "name":        name,
            "stage":       stage,
            "startDate":   s_date,
            "endDate":     e_date,
            "assignments": assignments or [],
        })

    # 始终有需求粗评阶段
    add_phase("需求粗评", "需求粗评", start, start)

    if idx >= 1:  # planning+
        add_phase("需求方案制定", "需求方案制定", start, start)

    if idx >= 2:  # developing+
        add_phase("开发", "开发中", start, work_end, dev_assigns)

    if idx >= 3:  # integration+
        add_phase("联调", "联调中", work_end, work_end, int_assigns)

    if idx >= 4:  # testing+
        add_phase("测试", "测试中", work_end, delivery)

    if idx >= 5:  # integrated+
        add_phase("已集成", "已集成", delivery, delivery)

    if idx >= 6:  # online
        add_phase("上线", "已上线", delivery, delivery)

    return phases


# ---- 主转换逻辑 ----

def convert():
    # 1. 读取 DevManage 数据
    members_raw   = json.loads(MEMBERS_FILE.read_text(encoding="utf-8"))
    reqs_raw      = json.loads(REQUIREMENTS_FILE.read_text(encoding="utf-8"))
    directions_raw = json.loads(DIRECTIONS_FILE.read_text(encoding="utf-8")) if DIRECTIONS_FILE.exists() else []

    print(f"读取完成: {len(members_raw)} 成员, {len(reqs_raw)} 需求, {len(directions_raw)} 自定义方向")

    # 2. 转换成员
    members = []
    for m in members_raw:
        members.append({
            "id":   m["id"],
            "name": m["name"],
            "role": m.get("engineerType", "iOS"),   # iOS / Android
        })

    # 3. 内置方向 + 自定义方向合并
    builtin_directions = ["增长", "安全", "公共模块"]
    extra_directions   = [d for d in directions_raw if d not in builtin_directions]
    directions         = builtin_directions + extra_directions

    # 需求里出现但未在方向列表中的方向也加进来
    for req in reqs_raw:
        d = req.get("businessDirection")
        if d and d not in directions:
            directions.append(d)

    # 4. 转换需求 → 项目
    projects = []
    skip_count = 0
    for req in reqs_raw:
        name = (req.get("name") or "").strip()
        if not name:
            skip_count += 1
            continue

        req_id   = req.get("id", str(uuid.uuid4()))
        start    = ts_to_iso(req.get("startDate"))  or "2026-01-01"
        delivery = ts_to_iso(req.get("deliveryDate")) or start
        work_end = ts_to_iso(req.get("workEndDate"))

        dev_workload = float(req.get("devWorkload", 0) or 0)
        int_workload = float(req.get("integrationWorkload", 0) or 0)
        total_workload = dev_workload + int_workload or 1.0

        pooled_at   = ts_to_iso(req.get("pooledAt"))
        consumed_at = ts_to_iso(req.get("consumedAt"))

        project = {
            "id":               req_id,
            "name":             name,
            "demandType":       map_demand_type(req.get("type", "business")),
            "priority":         map_priority(req.get("priority", "p1")),
            "businessDirection": req.get("businessDirection") or None,
            "startDate":        start,
            "deliveryDate":     delivery,
            "workloadDate":     pooled_at or start,
            "workEndDate":      work_end,
            "workloadDays":     total_workload,
            "description":      "",
            "note":             req.get("note") or "",
            "version":          req.get("version") or "",
            "ddp":              req.get("ddp") or "",
            "phases":           build_phases(req),
            "inPool":           bool(req.get("inPool", False)),
            "pooledAt":         pooled_at,
            "consumedAt":       consumed_at,
            "consumedBy":       req.get("consumedBy") or None,
        }

        # 技术需求不需要业务方向
        if project["demandType"] == "技术需求":
            project["businessDirection"] = None

        projects.append(project)

    print(f"转换完成: {len(projects)} 个项目（跳过 {skip_count} 条空名称）")

    # 5. 输出
    app_data = {
        "directions": directions,
        "members":    members,
        "projects":   projects,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(app_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"已写出到: {OUTPUT_FILE}")

    # 6. 统计
    by_status = {}
    for req in reqs_raw:
        s = req.get("status", "?")
        by_status[s] = by_status.get(s, 0) + 1
    print("状态分布:", by_status)
    print(f"方向列表: {directions}")

    return app_data


if __name__ == "__main__":
    convert()
