const API_BASE = "https://chinese-learning-survey-api.ijchen.workers.dev";
const errorBox = document.querySelector("#adminError");
const dashboard = document.querySelector("#dashboard");
const fragmentKey = new URLSearchParams(window.location.hash.slice(1)).get("key") || "";
if (fragmentKey) sessionStorage.setItem("survey-admin-key", fragmentKey);
const accessKey = fragmentKey || sessionStorage.getItem("survey-admin-key") || "";
if (fragmentKey) history.replaceState(null, "", window.location.pathname + window.location.search);

async function authorizedFetch(path) {
  if (!accessKey) throw new Error("請使用教師專用結果連結開啟此頁。");
  const response = await fetch(`${API_BASE}${path}`, {headers: {Authorization: `Bearer ${accessKey}`}});
  if (response.status === 401) throw new Error("教師專用結果連結無效。");
  if (!response.ok) throw new Error("目前無法讀取結果，請稍後再試。");
  return response;
}

async function loadResults() {
  errorBox.textContent = "";
  try {
    const response = await authorizedFetch("/summary");
    const summary = await response.json();
    document.querySelector("#responseCount").textContent = summary.count;
    document.querySelector("#latestDate").textContent = summary.latest ? new Date(summary.latest).toLocaleDateString("zh-TW") : "尚無資料";
    dashboard.hidden = false;
  } catch (error) {
    dashboard.hidden = true;
    errorBox.textContent = error.message;
  }
}

document.querySelector("#downloadCsv").addEventListener("click", async () => {
  errorBox.textContent = "";
  try {
    const response = await authorizedFetch("/export.csv");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `華語教學網站問卷結果-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    errorBox.textContent = error.message;
  }
});

loadResults();
