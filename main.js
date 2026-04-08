// 1. 時鐘
function updateClock() {
    const el = document.getElementById('clock');
    if (el) {
        const now = new Date();
        const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        el.innerText = `${now.toLocaleDateString('zh-TW', dateOptions)} ${now.toLocaleTimeString('zh-TW', timeOptions)}`;
    }
}
setInterval(updateClock, 1000); updateClock();

// API 網址
const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbwnQFPdzmCsn-8S2zHqPHTsojOrWd9h2buYqWhvycVrl8gQI4wzR6wnUC2e00wNP26ugA/exec";

// 全域變數儲存圓餅圖實例，方便後續動態更新
window.powerChart = null;

document.addEventListener('DOMContentLoaded', function() {
    loadRemoteData();
    try {
        const canvas = document.getElementById('doughnutChart');
        if (canvas && typeof Chart !== 'undefined') {
            window.powerChart = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                // 初始數值設為 0，等資料回來後動態填入
                data: { labels: ['動力', '空調', '插座', '照明'], datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'], borderWidth: 0 }] },
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
                let groups = {};
                data.tasks.forEach(t => {
                    if(!groups[t.category]) groups[t.category] = [];
                    groups[t.category].push(t);
                });

                for(let cat in groups) {
                    html += `<div class="action-group" style="flex: 1; min-width: 300px;"><div class="action-header">📌 ${cat}</div><ul class="interactive-list">`;
                    groups[cat].forEach(task => {
                        let isDone = (task.status === '已結案');
                        let liClass = isDone ? "task-completed" : "";
                        let checkMark = isDone ? "[✅]" : "[ ]";
                        html += `<li class="${liClass}">
                                    <div class="task-info">
                                        <div class="task-title-row"><span class="checkbox-mark">${checkMark}</span> <strong>${task.name}</strong></div>
                                        ${isDone && task.reply ? `<div class="task-reply">💬 同仁回報：${task.reply}</div>` : ''}
                                    </div>
                                    ${!isDone ? `<button class="task-btn" onclick="openSimpleTaskModal('${task.name}')">⚡ 處理</button>` : ''}
                                 </li>`;
                    });
                    html += `</ul></div>`;
                }
                container.innerHTML = html || "<div style='color:var(--accent-green);'>✅ 目前無待辦任務</div>";
            }

            // --- B. 處理矩陣數據 & 動態卡片計算 ---
            if(data.matrixData) {
                let grandTotalKw = 0;
                
                // 用來統計動態進度與總和
                let sums = { ac: 0, light: 0, plug: 0, power: 0 };
                let counts = { ac: 0, light: 0, plug: 0, power: 0 };
                const TOTAL_ZONES = 19; // 總共 19 個區域 (A=6, B=8, C=3, 地下室=2)

                document.querySelectorAll("tr[data-area]").forEach(tr => {
                    let areaName = tr.getAttribute("data-area");
                    let dbData = data.matrixData[areaName]; 

                    if(dbData) {
                        let ac_val = parseFloat(dbData.ac_kw);
                        let light_val = parseFloat(dbData.light_kw);
                        let plug_val = parseFloat(dbData.plug_kw);
                        let power_val = parseFloat(dbData.power_kw);
                        
                        let subtotal = 0;
                        
                        // 計算有效盤點次數與加總
                        if(!isNaN(ac_val) && ac_val >= 0) { sums.ac += ac_val; counts.ac++; subtotal += ac_val; }
                        if(!isNaN(light_val) && light_val >= 0) { sums.light += light_val; counts.light++; subtotal += light_val; }
                        if(!isNaN(plug_val) && plug_val >= 0) { sums.plug += plug_val; counts.plug++; subtotal += plug_val; }
                        if(!isNaN(power_val) && power_val >= 0) { sums.power += power_val; counts.power++; subtotal += power_val; }

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

                // 更新左上角大字體總數
                let finalTotalEl = document.querySelector('.total-value');
                let grandDisplayEl = document.getElementById('grand-total-display');
                if(finalTotalEl) finalTotalEl.innerText = grandTotalKw.toFixed(2);
                if(grandDisplayEl) grandDisplayEl.innerText = grandTotalKw.toFixed(1);

                // --- 👇 更新四個小卡片的動態數據與進度 % ---
                document.getElementById('sum-power').innerText = sums.power.toFixed(1);
                document.getElementById('sum-ac').innerText = sums.ac.toFixed(1);
                document.getElementById('sum-plug').innerText = sums.plug.toFixed(1);
                document.getElementById('sum-light').innerText = sums.light.toFixed(1);

                document.getElementById('prog-power').innerText = '盤點進度 ' + Math.round((counts.power / TOTAL_ZONES) * 100) + '%';
                document.getElementById('prog-ac').innerText = '盤點進度 ' + Math.round((counts.ac / TOTAL_ZONES) * 100) + '%';
                document.getElementById('prog-plug').innerText = '盤點進度 ' + Math.round((counts.plug / TOTAL_ZONES) * 100) + '%';
                document.getElementById('prog-light').innerText = '盤點進度 ' + Math.round((counts.light / TOTAL_ZONES) * 100) + '%';

                // --- 👇 動態更新圓餅圖 ---
                if (window.powerChart) {
                    window.powerChart.data.datasets[0].data = [sums.power, sums.ac, sums.plug, sums.light];
                    window.powerChart.update();
                }
            }
        }).catch(err => console.log("同步失敗", err));
};

function updateCellUI(td, id, kw) {
    if(!td) return;
    let val = parseFloat(kw);
    if(kw !== "" && kw !== null && kw !== undefined && !isNaN(val) && val >= 0) {
        if (val > 20) {
            td.innerHTML = `⚠️<div class="panel-tag warning" style="color:var(--accent-yellow); border:1px solid var(--accent-yellow); background:rgba(245, 158, 11, 0.1);">盤號: ${id || '未填'}</div><div style="font-weight:bold; margin-top:2px; color:var(--accent-yellow);">${val.toFixed(2)} kW</div>`;
        } else {
            td.innerHTML = `✅<div class="panel-tag fill">盤號: ${id || '未填'}</div><div style="font-weight:bold; margin-top:2px;">${val.toFixed(2)} kW</div>`;
        }
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

document.getElementById("fullAuditForm").onsubmit = function(e) {
    e.preventDefault();
    const btn = document.getElementById("submitFullBtn");
    btn.disabled = true; btn.innerText = "傳送中...";
    const payload = {
        action: "report", area: document.getElementById("f_area").value,
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
    const payload = { action: "task_update", taskName: currentTaskName, notes: document.getElementById("t_notes").value };
    sendData(payload, simpleModal, btn, "送出結案回報 ⚡");
};

function sendData(payload, modal, btn, originalText) {
    fetch(GOOGLE_APP_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) })
    .then(r => r.json()).then(() => {
        alert("✅ 匯報成功！"); modal.style.display = "none"; loadRemoteData();
        if(payload.action === "task_update") document.getElementById("t_notes").value = "";
    }).catch(err => alert("⚠️ 傳送失敗")).finally(() => { btn.disabled = false; btn.innerText = originalText; });
}
