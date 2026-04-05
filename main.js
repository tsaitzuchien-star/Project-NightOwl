// ⚠️ 請替換為您最新的 GAS 部署網址
const GOOGLE_APP_URL = "在此貼上您的_GAS_URL";

function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000); updateClock();

document.addEventListener('DOMContentLoaded', loadRemoteData);

function loadRemoteData() {
    const summaryDiv = document.getElementById("aiReportSummary");
    summaryDiv.innerHTML = "<ul><li>同步中...</li></ul>";

    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
            if(data.summary) summaryDiv.innerHTML = `<ul>${data.summary}</ul>`;
            if(data.completedTasks) {
                data.completedTasks.forEach(name => {
                    let li = document.getElementById("task_" + name);
                    if (li) {
                        li.classList.add("task-completed");
                        let check = li.querySelector(".checkbox-mark");
                        if(check) check.innerText = "[✅]";
                    }
                });
            }
        }).catch(err => summaryDiv.innerHTML = "<li>❌ 連線失敗</li>");
}

// 彈窗控制
const fullModal = document.getElementById("fullReportModal");
const summaryModal = document.getElementById("summaryModal");
const simpleModal = document.getElementById("simpleTaskModal");
let currentTaskName = "";

document.getElementById("openFormBtn").onclick = () => { fullModal.style.display = "flex"; };
window.openSummaryModal = () => { summaryModal.style.display = "flex"; };
window.closeFullModal = () => { fullModal.style.display = "none"; };
window.closeSummaryModal = () => { summaryModal.style.display = "none"; };
window.closeSimpleModal = () => { simpleModal.style.display = "none"; };

window.openSimpleTaskModal = (name) => {
    currentTaskName = name;
    document.getElementById("simpleTaskBadge").innerHTML = "📌 任務：" + name;
    simpleModal.style.display = "flex";
};

// 提交盤點數據
document.getElementById("fullAuditForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitFullBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = {
        area: document.getElementById("f_area").value,
        ac_kw: document.getElementById("f_ac_kw").value,
        light_kw: document.getElementById("f_light_kw").value,
        notes: document.getElementById("f_notes").value
    };
    sendData(payload, fullModal, btn, "傳送盤點數據 🚀");
};

// 提交手動摘要
window.submitManualSummary = function() {
    const content = document.getElementById("manual_summary_text").value;
    if(!content) return alert("請輸入內容！");
    const btn = event.target;
    btn.disabled = true; btn.innerText = "發布中...";
    sendData({ type: "manual_summary", content: content }, summaryModal, btn, "發布至戰情室 🚀");
};

// 提交任務回報
document.getElementById("simpleTaskForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitSimpleBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    sendData({ area: "任務回報", notes: `【${currentTaskName}】 ` + document.getElementById("t_notes").value }, simpleModal, btn, "送出回報 ⚡");
};

function sendData(payload, modal, btn, originalText) {
    fetch(GOOGLE_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) })
    .then(r => r.json())
    .then(data => {
        alert("✅ 操作成功！");
        modal.style.display = "none";
        loadRemoteData();
    })
    .catch(err => alert("⚠️ 傳送失敗"))
    .finally(() => { btn.disabled = false; btn.innerText = originalText; });
}
