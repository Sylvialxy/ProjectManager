/**
 * 数据迁移脚本
 *
 * 使用方法：
 * 1. 在运行 dev server 的浏览器中，打开控制台（F12）
 * 2. 粘贴以下代码并回车
 * 3. 会下载一个 shared-data.json 文件
 * 4. 把这个文件放到 ~/Desktop/DevManage/ProjectManager/shared-data.json
 * 5. 重启 data-server.js（node data-server.js）即可
 */

// 在浏览器控制台运行以下代码：
const STORAGE_KEY = "pm-staffing-v1";
const data = localStorage.getItem(STORAGE_KEY);
if (!data) {
  console.log("❌ 未找到 localStorage 数据，可能数据还没有录入");
} else {
  const parsed = JSON.parse(data);
  const exportData = {
    directions: parsed.data?.directions || parsed.directions || [],
    members: parsed.data?.members || parsed.members || [],
    projects: parsed.data?.projects || parsed.projects || [],
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shared-data.json';
  a.click();
  URL.revokeObjectURL(url);
  console.log("✅ 数据已导出，请下载 shared-data.json");
}
