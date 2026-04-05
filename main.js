// 1. 時鐘
function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000); updateClock();

// 🚀 記得換成您最新發佈的 GAS 網址
const GOOGLE_APP_URL = "https://script.google.com/macros/s/您的ID/exec";

// 2. 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadRemoteData();
    const canvas = document.getElementById('doughnutChart');
    if (canvas) {
        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['動力', '空調', '插座', '照明'], datasets: [{ data: [55, 40, 22, 15], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } } }
        });
    }
});

// 3. 讀取資料 (僅執行任務打勾)
window.loadRemoteData = function() {
    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
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
        }).catch(err => console.log("同步延遲或失敗"));
};

// 4. 表單功能
const fullModal = document.getElementById("fullReportModal");
const simpleModal = document.getElementById("simpleTaskModal");
let currentTaskName = "";

document.getElementById("openFormBtn").onclick = () => { fullModal.style.display = "flex"; };
window.closeFullModal = () => { fullModal.style.display = "none"; };
window.closeSimpleModal = () => { simpleModal.style.display = "none"; };

window.openSimpleTaskModal = function(taskName) {
    currentTaskName = taskName;
    document.getElementById("simpleTaskBadge").innerHTML = "📌 <b>任務：</b>" + taskName;
    simpleModal.style.display = "flex";
};

document.getElementById("fullAuditForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitFullBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = {
        area: document.getElementById("f_area").value,
        notes: document.getElementById("f_notes").value
    };
    sendData(payload, fullModal, btn, "傳送數據 🚀");
};

document.getElementById("simpleTaskForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitSimpleBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = { area: "任務回報", notes: `【${currentTaskName}】 ` + document.getElementById("t_notes").value };
    sendData(payload, simpleModal, btn, "送出回報 ⚡");
};

function sendData(payload, modal, btn, originalText) {
    fetch(GOOGLE_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) })
    .then(r => r.json()).then(() => {
        alert("✅ 匯報成功！"); modal.style.display = "none"; loadRemoteData();
    }).catch(err => alert("⚠️ 傳送失敗")).finally(() => { btn.disabled = false; btn.innerText = originalText; });
}
