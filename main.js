function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.innerText = new Date().toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000); updateClock();

// API 網址
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbwnQFPdzmCsn-8S2zHqPHTsojOrWd9h2buYqWhvycVrl8gQI4wzR6wnUC2e00wNP26ugA/exec";

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

window.loadRemoteData = function() {
    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
            // --- A. 動態渲染任務清單 ---
            if(data.tasks) {
                const container = document.getElementById('dynamicTaskContainer');
                let html = "";
                
                // 將任務依分類分組
                let groups = {};
                data.tasks.forEach(t => {
                    if(!groups[t.category]) groups[t.category] = [];
                    groups[t.category].push(t);
                });

                for(let cat in groups) {
                    html += `<div class="action-group" style="flex: 1; min-width: 300px;">
                                <div class="action-header">📌 ${cat}</div>
                                <ul class="interactive-list">`;
                    
                    groups[cat].forEach(task => {
                        let isDone = (task.status === '已結案');
                        let liClass = isDone ? "task-completed" : "";
                        let checkMark = isDone ? "[✅]" : "[ ]";
                        
                        html += `<li class="${liClass}">
                                    <div class="task-info">
                                        <div class="task-title-row">
                                            <span class="checkbox-mark">${checkMark}</span> 
                                            <strong>${task.name}</strong>
                                        </div>
                                        ${isDone && task.reply ? `<div class="task-reply">💬 同仁回報：${task.reply}</div>` : ''}
                                    </div>
                                    ${!isDone ? `<button class="task-btn" onclick="openSimpleTaskModal('${task.name}')">⚡ 處理</button>` : ''}
                                 </li>`;
                    });
                    html += `</ul></div>`;
                }
                container.innerHTML = html || "<div style='color:var(--accent-green);'>✅ 目前無待辦任務</div>";
            }

            // --- B. 處理矩陣數據 ---
            if(data.matrixData) {
                let grandTotalKw = 0;
                document.querySelectorAll("tr[data-area]").forEach(tr => {
                    let areaName = tr.getAttribute("data-area");
                    let dbData = data.matrixData[areaName]; 

                    if(dbData) {
                        let ac_val = parseFloat(dbData.ac_kw) || 0;
                        let light_val = parseFloat(dbData.light_kw) || 0;
                        let plug_val = parseFloat(dbData.plug_kw) || 0;
                        let power_val = parseFloat(dbData.power_kw) || 0;
                        let subtotal = ac_val + light_val + plug_val + power_val;
                        grandTotalKw += subtotal;

                        updateCellUI(tr.querySelector('.col-ac'), dbData.ac_id, dbData.ac_kw);
                        updateCellUI(tr.querySelector('.col-light'), dbData.light_id, dbData.light_kw);
                        updateCellUI(tr.querySelector('.col-plug'), dbData.plug_id, dbData.plug_kw);
                        updateCellUI(tr.querySelector('.col-power'), dbData.power_id, dbData.power_kw);

                        let totalTd = tr.querySelector('.kw-total');
                        if(totalTd) totalTd.innerText = subtotal > 0 ? subtotal.toFixed(2) : '0.00';
                    } else {
                        updateCellUI(tr.querySelector('.col-ac'), "", "");
                        updateCellUI(tr.querySelector('.col-light'), "", "");
                        updateCellUI(tr.querySelector('.col-plug'), "", "");
                        updateCellUI(tr.querySelector('.col-power'), "", "");
                    }
                });
                let finalTotalEl = document.querySelector('.total-value');
                if(finalTotalEl) finalTotalEl.innerText = grandTotalKw.toFixed(2);
            }
        }).catch(err => console.log("同步失敗", err));
};

function updateCellUI(td, id, kw) {
    if(!td) return;
    if(kw !== "" && kw !== null && kw !== undefined && !isNaN(parseFloat(kw)) && parseFloat(kw) >= 0) {
        td.innerHTML = `✅<div class="panel-tag fill">盤號: ${id || '未填'}</div><div style="font-weight:bold; margin-top:2px;">${parseFloat(kw).toFixed(2)} kW</div>`;
    } else {
        td.innerHTML = `❌<div class="panel-tag empty">盤號: ❌</div>`;
    }
}

// 4. 表單功能
const fullModal = document.getElementById("fullReportModal");
const simpleModal = document.getElementById("simpleTaskModal");
let currentTaskName = "";

document.getElementById("openFormBtn").onclick = () => { fullModal.style.display = "flex"; };
window.closeFullModal = () => { fullModal.style.display = "none"; };
window.closeSimpleModal = () => { simpleModal.style.display = "none"; };

window.openSimpleTaskModal = function(taskName) {
    currentTaskName = taskName;
    document.getElementById("simpleTaskBadge").innerHTML = "📌 <b>結案回報：</b>" + taskName;
    simpleModal.style.display = "flex";
};

// 傳送例行盤點 (action: report)
document.getElementById("fullAuditForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitFullBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = {
        action: "report",
        area: document.getElementById("f_area").value,
        ac_id: document.getElementById("f_ac_id").value, ac_kw: document.getElementById("f_ac_kw").value,
        light_id: document.getElementById("f_light_id").value, light_kw: document.getElementById("f_light_kw").value,
        plug_id: document.getElementById("f_plug_id").value, plug_kw: document.getElementById("f_plug_kw").value,
        power_id: document.getElementById("f_power_id").value, power_kw: document.getElementById("f_power_kw").value,
        notes: document.getElementById("f_notes").value
    };
    sendData(payload, fullModal, btn, "傳送盤點數據 🚀");
};

// 傳送任務結案 (action: task_update)
document.getElementById("simpleTaskForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitSimpleBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = { 
        action: "task_update", 
        taskName: currentTaskName, 
        notes: document.getElementById("t_notes").value 
    };
    sendData(payload, simpleModal, btn, "送出結案回報 ⚡");
};

function sendData(payload, modal, btn, originalText) {
    fetch(GOOGLE_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) })
    .then(r => r.json()).then(() => {
        alert("✅ 匯報成功！"); modal.style.display = "none"; loadRemoteData();
        if(payload.action === "task_update") document.getElementById("t_notes").value = "";
    }).catch(err => alert("⚠️ 傳送失敗")).finally(() => { btn.disabled = false; btn.innerText = originalText; });
}
