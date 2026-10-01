const API_BASE = "https://chinese-learning-survey-api.ijchen.workers.dev";
const DRAFT_KEY = "chinese-learning-survey-draft-v1";

const sections = [
  {
    number: "01",
    title: "網站使用經驗",
    english: "Website Experience",
    questions: [
      "網站上的文字和按鈕很清楚，很容易看懂。",
      "我可以很快找到學習的內容。",
      "網站設計很清楚，我知道怎麼用。",
      "用手機或平板看網站，畫面都很正常。",
      "網站的顏色和字體大小，讓我看得很舒服。",
      "網站的影片、聲音播放很順暢，不會卡住。"
    ]
  },
  {
    number: "02",
    title: "學習效果",
    english: "Learning Help",
    questions: [
      "網站可以幫助我練習生詞和句型。",
      "寫完練習後，我可以知道自己哪裡寫錯了。",
      "我寫錯的時候，網站有清楚的答案說明。",
      "網站的練習很有趣，讓我上課不無聊。",
      "我覺得網站可以取代紙本講義，學習沒問題。"
    ]
  },
  {
    number: "03",
    title: "未來意願",
    english: "Future Use",
    questions: [
      "以後如果有機會，我還想繼續使用網站。",
      "我願意把網站推薦給其他學華語的朋友。"
    ]
  }
];

const container = document.querySelector("#questionSections");
let questionIndex = 1;
for (const section of sections) {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `<div class="section-heading"><span>${section.number}</span><div><h2>${section.title}</h2><p>${section.english} · 請選 1–5。</p></div></div>`;
  section.questions.forEach(question => {
    const q = questionIndex++;
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";
    fieldset.innerHTML = `
      <legend>${q}. ${question}</legend>
      <div class="scale-labels"><span>非常不同意</span><span>非常同意</span></div>
      <div class="scale">
        ${[1,2,3,4,5].map(value => `<label><input type="radio" name="q${q}" value="${value}" required><span>${value}</span></label>`).join("")}
      </div>`;
    panel.appendChild(fieldset);
  });
  container.appendChild(panel);
}

const form = document.querySelector("#surveyForm");
const errorBox = document.querySelector("#formError");
const submitButton = form.querySelector(".submit-button");

function getDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); }
  catch { return {}; }
}

function restoreDraft() {
  const draft = getDraft();
  Object.entries(draft).forEach(([name, values]) => {
    const selected = Array.isArray(values) ? values : [values];
    selected.forEach(value => {
      const input = form.querySelector(`[name="${name}"][value="${CSS.escape(String(value))}"]`);
      if (input) input.checked = true;
    });
  });
}

function saveDraft() {
  const data = {};
  new FormData(form).forEach((value, key) => {
    if (key === "website") return;
    if (key === "improvements") (data[key] ||= []).push(value);
    else data[key] = value;
  });
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function updateProgress() {
  const data = new FormData(form);
  let done = 0;
  for (let i = 1; i <= 13; i++) if (data.get(`q${i}`)) done++;
  if (data.getAll("improvements").length) done++;
  document.querySelector("#progressText").textContent = `${done} / 14`;
  document.querySelector("#progressBar").style.width = `${done / 14 * 100}%`;
}

form.addEventListener("change", event => {
  if (event.target.name === "improvements") {
    const boxes = [...form.querySelectorAll('[name="improvements"]')];
    if (event.target.value === "none" && event.target.checked) boxes.filter(box => box.value !== "none").forEach(box => box.checked = false);
    if (event.target.value !== "none" && event.target.checked) boxes.find(box => box.value === "none").checked = false;
  }
  saveDraft();
  updateProgress();
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  errorBox.textContent = "";
  if (!form.reportValidity()) {
    errorBox.textContent = "請完成所有 1–5 分的題目。";
    form.querySelector(":invalid")?.scrollIntoView({behavior: "smooth", block: "center"});
    return;
  }
  const data = new FormData(form);
  if (!data.getAll("improvements").length) {
    errorBox.textContent = "請完成第 14 題；如果都不需要改善，請選擇「以上都不需要改善」。";
    document.querySelector("#improvement-heading").scrollIntoView({behavior: "smooth", block: "center"});
    return;
  }
  const payload = {
    submissionId: crypto.randomUUID(),
    site: "general",
    answers: Array.from({length: 13}, (_, i) => Number(data.get(`q${i + 1}`))),
    improvements: data.getAll("improvements").filter(value => value !== "none"),
    website: data.get("website")
  };
  submitButton.disabled = true;
  submitButton.textContent = "正在送出…";
  try {
    const response = await fetch(`${API_BASE}/responses`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("submit failed");
    localStorage.removeItem(DRAFT_KEY);
    form.hidden = true;
    document.querySelector(".progress-wrap").hidden = true;
    document.querySelector("#success").hidden = false;
    window.scrollTo({top: 0, behavior: "smooth"});
  } catch {
    errorBox.textContent = "目前無法送出，請檢查網路後再試一次。你的答案仍保留在這台裝置上。";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "送出問卷";
  }
});

document.querySelector("#newResponse").addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  document.querySelector(".progress-wrap").hidden = false;
  document.querySelector("#success").hidden = true;
  updateProgress();
  window.scrollTo({top: 0, behavior: "smooth"});
});

restoreDraft();
updateProgress();
