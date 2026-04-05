function updateClock() {
    const now = new Date();
    const clockElement = document.getElementById('clock');
    if (clockElement) clockElement.innerText = now.toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000); 
updateClock();

const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxQCt01F5QWVtSN3n7ARKDXrEViCE8IdgCYnFo3Fu41ZvmAsf-eKYpcn-C0cU20L50Dhg/exec";

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
    } catch (e) { console.error("圖表錯誤:", e); }
});

window.loadRemoteData = function() {
    const summaryDiv = document.getElementById("aiReportSummary");
    if (!summaryDiv) return;
    summaryDiv.innerHTML = `<ul><li><span style="color:var(--accent-yellow)">⏳ 同步資料庫中...</span></li></ul>`;
    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
            if(data.summary) summaryDiv.innerHTML = `<h4 style="color:var(--accent-yellow);">⚡ AI 動態彙總</h4><ul>${data.summary}</ul>`;
            if(data.completedTasks) {
                data.completedTasks.forEach(taskName => {
                    let liElement = document.getElementById("task_" + taskName);
                    if (liElement) {
                        liElement.classList.add("task-completed");
                        let check = liElement.querySelector(".checkbox-mark");
                        if(check) check.innerText = "[✅]";
                        let btn = liElement.querySelector(".task-btn");
                        if(btn) btn.innerText = "✅ 已結案";
                    }
                });
            }
        }).catch(err => { summaryDiv.innerHTML = `<ul><li><span style="color:var(--accent-red)">❌ 同步失敗</span></li></ul>`; });
};

// 表單打開關閉邏輯
const fullModal = document.getElementById("fullReportModal");
const simpleModal = document.getElementById("simpleTaskModal");

document.getElementById("openFormBtn").onclick = () => { fullModal.style.display = "flex"; };
window.closeFullModal = () => { fullModal.style.display = "none"; };
window.closeSimpleModal = () => { simpleModal.style.display = "none"; };

window.openSimpleTaskModal = function(taskName) {
    document.getElementById("simpleTaskBadge").innerHTML = "📌 <b>回報任務：</b>" + taskName;
    simpleModal.style.display = "flex";
    currentTaskName = taskName;
};

// 提交邏輯省略，同之前版本，確保 GOOGLE_APP_URL 正確即可
