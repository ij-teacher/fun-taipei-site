const API_BASE = "https://chinese-learning-survey-api.ijchen.workers.dev";
const tokenInput = document.querySelector("#adminToken");
const errorBox = document.querySelector("#adminError");
const dashboard = document.querySelector("#dashboard");

async function authorizedFetch(path) {
  const token = tokenInput.value.trim();
  if (!token) throw new Error("請輸入教師密碼。");
  const response = await fetch(`${API_BASE}${path}`, {headers: {Authorization: `Bearer ${token}`}});
  if (response.status === 401) throw new Error("教師密碼不正確。");
  if (!response.ok) throw new Error("目前無法讀取結果，請稍後再試。");
  return response;
}

document.querySelector("#loadResults").addEventListener("click", async () => {
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
});

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
