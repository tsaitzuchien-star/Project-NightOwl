// 1. 時鐘功能
function updateClock() {
    const now = new Date();
    const clockElement = document.getElementById('clock');
    if (clockElement) clockElement.innerText = now.toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000); 
updateClock();

// 這是您的 API URL
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxQCt01F5QWVtSN3n7ARKDXrEViCE8IdgCYnFo3Fu41ZvmAsf-eKYpcn-C0cU20L50Dhg/exec";

// ==========================================
// 核心啟動區 (調整執行順序與防呆機制)
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    // 【任務一】優先執行：一打開網頁，就去抓 AI 摘要跟任務狀態！
    loadRemoteData();
    
    // 【任務二】次要執行：畫圓餅圖 (加上 try-catch 防護網，就算失敗也不會當機)
    try {
        const canvas = document.getElementById('doughnutChart');
        // 檢查畫布跟 Chart 套件是否存在
        if (canvas && typeof Chart !== 'undefined') {
            new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: { labels: ['動力', '空調', '插座', '照明'], datasets: [{ data: [55, 40, 22, 15], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } } }
            });
        }
    } catch (e) {
        console.error("圓餅圖載入失敗，但不影響 AI 運作:", e);
    }
});

// ==========================================
// 同步遠端資料庫 (更新摘要 + 自動打勾)
// ==========================================
window.loadRemoteData = function() {
    const summaryDiv = document.getElementById("aiReportSummary");
    if (!summaryDiv) return;

    // 看到這個黃色文字，代表 JS 有成功執行！
    summaryDiv.innerHTML = `<ul><li><span style="color:var(--accent-yellow)">⏳ 正在與 Google 資料庫連線，由 AI 彙總最新戰情中...</span></li></ul>`;

    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
            // 1. 更新 AI 戰情摘要
            if(data.summary) {
                summaryDiv.innerHTML = `<h4 style="color:var(--accent-yellow);">⚡ 依據最新盤點紀錄自動產出</h4><ul>${data.summary}</ul>`;
            }

            // 2. 自動將已完成的任務打勾
            if(data.completedTasks && data.completedTasks.length > 0) {
                data.completedTasks.forEach(taskName => {
                    let liElement = document.getElementById("task_" + taskName);
                    if (liElement) {
                        liElement.classList.add("task-completed");
                        let checkboxSpan = liElement.querySelector(".checkbox-mark");
                        if(checkboxSpan) checkboxSpan.innerText = "[✅]";
                        let btn = liElement.querySelector(".task-btn");
                        if(btn) btn.innerText = "✅ 已結案";
                    }
                });
            }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            summaryDiv.innerHTML = `<ul><li><span style="color:var(--accent-red)">❌ 資料同步失敗，請稍後點擊右上角 🔄 重新整理。</span></li></ul>`;
        });
}

// ==========================================
// 表單傳送邏輯
// ==========================================
const fullModal = document.getElementById("fullReportModal");
const fullForm = document.getElementById("fullAuditForm");
const submitFullBtn = document.getElementById("submitFullBtn");

if (document.getElementById("openFormBtn")) {
    document.getElementById("openFormBtn").onclick = () => { fullModal.style.display = "flex"; };
}
window.closeFullModal = () => { fullModal.style.display = "none"; fullForm.reset(); };

if (fullForm) {
    fullForm.addEventListener("submit", function(e) {
        e.preventDefault(); submitFullBtn.innerText = "⏳ 傳送中..."; submitFullBtn.disabled = true;
        const payload = {
            area: document.getElementById("f_area").value,
            ac_id: document.getElementById("f_ac_id").value, ac_kw: document.getElementById("f_ac_kw").value,
            light_id: document.getElementById("f_light_id").value, light_kw: document.getElementById("f_light_kw").value,
            plug_id: document.getElementById("f_plug_id").value, plug_kw: document.getElementById("f_plug_kw").value,
            power_id: document.getElementById("f_power_id").value, power_kw: document.getElementById("f_power_kw").value,
            notes: document.getElementById("f_notes").value
        };
        sendToGoogle(payload, fullModal, fullForm, submitFullBtn, "傳送盤點數據 🚀");
    });
}

const simpleModal = document.getElementById("simpleTaskModal");
const simpleForm = document.getElementById("simpleTaskForm");
const submitSimpleBtn = document.getElementById("submitSimpleBtn");
const simpleTaskBadge = document.getElementById("simpleTaskBadge");
let currentTaskName = "";

window.openSimpleTaskModal = function(taskName) {
    currentTaskName = taskName;
    if (simpleTaskBadge) simpleTaskBadge.innerHTML = "📌 <b>目前處理交辦任務：</b><br>" + taskName;
    if (simpleModal) simpleModal.style.display = "flex";
    setTimeout(() => { if(document.getElementById("t_notes")) document.getElementById("t_notes").focus(); }, 100);
};

window.closeSimpleModal = () => { if(simpleModal) simpleModal.style.display = "none"; if(simpleForm) simpleForm.reset(); currentTaskName = ""; };

if (simpleForm) {
    simpleForm.addEventListener("submit", function(e) {
        e.preventDefault(); submitSimpleBtn.innerText = "⏳ 傳送中..."; submitSimpleBtn.disabled = true;
        const notesValue = `【任務回報：${currentTaskName}】 ` + document.getElementById("t_notes").value.trim();
        const payload = {
            area: "跨單位任務", ac_id: "", ac_kw: "", light_id: "", light_kw: "", plug_id: "", plug_kw: "", power_id: "", power_kw: "",
            notes: notesValue
        };
        sendToGoogle(payload, simpleModal, simpleForm, submitSimpleBtn, "送出任務回報 ⚡");
    });
}

window.onclick = function(event) { 
    if (event.target == fullModal) closeFullModal();
    if (event.target == simpleModal) closeSimpleModal();
}

function sendToGoogle(payload, modalElement, formElement, btnElement, originalBtnText) {
    fetch(GOOGLE_APP_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        if(data.status === "success") { 
            alert("✅ 匯報成功！"); 
            if(modalElement) modalElement.style.display = "none"; 
            if(formElement) formElement.reset(); 
            setTimeout(loadRemoteData, 2000); 
        } else { alert("❌ 錯誤：" + data.message); }
    })
    .catch(error => {
        console.error("傳送失敗:", error);
        alert("⚠️ 網路錯誤，請重試！");
    })
    .finally(() => { 
        if(btnElement) { btnElement.innerText = originalBtnText; btnElement.disabled = false; } 
    });
}
