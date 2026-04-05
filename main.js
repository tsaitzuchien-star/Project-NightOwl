// 1. 時鐘
function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000); updateClock();

// API 網址
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxQCt01F5QWVtSN3n7ARKDXrEViCE8IdgCYnFo3Fu41ZvmAsf-eKYpcn-C0cU20L50Dhg/exec";

// 2. 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadRemoteData();
    try {
        const canvas = document.getElementById('doughnutChart');
        if (canvas && typeof Chart !== 'undefined') {
            new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['動力', '空調', '插座', '照明'], datasets: [{ data: [55, 40, 22, 15], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } } }
            });
        }
    } catch (e) { console.error("Chart Error:", e); }
});

// 3. 讀取 Google 資料 (AI 摘要 + 任務檢查)
window.loadRemoteData = function() {
    const summaryDiv = document.getElementById("aiReportSummary");
    if (summaryDiv) summaryDiv.innerHTML = `<ul><li><span style="color:var(--accent-yellow)">⏳ 同步資料庫中...</span></li></ul>`;

    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
            if(data.summary && summaryDiv) summaryDiv.innerHTML = `<h4 style="color:var(--accent-yellow);">⚡ AI 動態彙總</h4><ul>${data.summary}</ul>`;
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
        }).catch(err => { if(summaryDiv) summaryDiv.innerHTML = `<ul><li><span style="color:var(--accent-red)">❌ 同步失敗</span></li></ul>`; });
};

// 4. 表單控制
const fullModal = document.getElementById("fullReportModal");
const simpleModal = document.getElementById("simpleTaskModal");
let currentTaskName = "";

document.getElementById("openFormBtn").onclick = () => { fullModal.style.display = "flex"; };
window.closeFullModal = () => { fullModal.style.display = "none"; };
window.closeSimpleModal = () => { simpleModal.style.display = "none"; };

window.openSimpleTaskModal = function(taskName) {
    currentTaskName = taskName;
    document.getElementById("simpleTaskBadge").innerHTML = "📌 <b>回報任務：</b>" + taskName;
    simpleModal.style.display = "flex";
};

// 提交處理 (省略細節，確保邏輯正確)
document.getElementById("fullAuditForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitFullBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = {
        area: document.getElementById("f_area").value,
        ac_id: document.getElementById("f_ac_id").value, ac_kw: document.getElementById("f_ac_kw").value,
        light_id: document.getElementById("f_light_id").value, light_kw: document.getElementById("f_light_kw").value,
        plug_id: document.getElementById("f_plug_id").value, plug_kw: document.getElementById("f_plug_kw").value,
        power_id: document.getElementById("f_power_id").value, power_kw: document.getElementById("f_power_kw").value,
        notes: document.getElementById("f_notes").value
    };
    sendData(payload, fullModal, btn, "傳送盤點數據 🚀");
};

document.getElementById("simpleTaskForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitSimpleBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = { area: "任務回報", notes: `【${currentTaskName}】 ` + document.getElementById("t_notes").value };
    sendData(payload, simpleModal, btn, "送出任務回報 ⚡");
};

function sendData(payload, modal, btn, originalText) {
    fetch(GOOGLE_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) })
    .then(r => r.json()).then(data => {
        alert("✅ 成功！"); modal.style.display = "none"; loadRemoteData();
    }).finally(() => { btn.disabled = false; btn.innerText = originalText; });
}
