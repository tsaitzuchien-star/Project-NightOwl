// 3. 讀取資料 (包含任務打勾與動態矩陣更新)
window.loadRemoteData = function() {
    fetch(GOOGLE_APP_URL)
        .then(r => r.json())
        .then(data => {
            // --- A. 處理任務打勾 ---
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

            // --- B. 處理矩陣數據自動填入 ---
            if(data.matrixData) {
                let grandTotalKw = 0;
                
                // 尋找畫面上所有帶有 data-area 的列 (Row)
                document.querySelectorAll("tr[data-area]").forEach(tr => {
                    let areaName = tr.getAttribute("data-area");
                    let dbData = data.matrixData[areaName]; // 從資料庫撈出該區資料

                    if(dbData) {
                        // 如果該區域有資料，進行數值加總
                        let ac_val = parseFloat(dbData.ac_kw) || 0;
                        let light_val = parseFloat(dbData.light_kw) || 0;
                        let plug_val = parseFloat(dbData.plug_kw) || 0;
                        let power_val = parseFloat(dbData.power_kw) || 0;
                        
                        let subtotal = ac_val + light_val + plug_val + power_val;
                        grandTotalKw += subtotal;

                        // 更新畫面上的四個欄位 (空調、照明、插座、動力)
                        updateCellUI(tr.querySelector('.col-ac'), dbData.ac_id, dbData.ac_kw);
                        updateCellUI(tr.querySelector('.col-light'), dbData.light_id, dbData.light_kw);
                        updateCellUI(tr.querySelector('.col-plug'), dbData.plug_id, dbData.plug_kw);
                        updateCellUI(tr.querySelector('.col-power'), dbData.power_id, dbData.power_kw);

                        // 更新該樓層的加總小計
                        let totalTd = tr.querySelector('.kw-total');
                        if(totalTd) {
                            totalTd.innerText = subtotal > 0 ? subtotal.toFixed(2) : '--';
                        }
                    } else {
                        // 若資料庫目前無此區資料，顯示未填寫狀態
                        updateCellUI(tr.querySelector('.col-ac'), "", "");
                        updateCellUI(tr.querySelector('.col-light'), "", "");
                        updateCellUI(tr.querySelector('.col-plug'), "", "");
                        updateCellUI(tr.querySelector('.col-power'), "", "");
                    }
                });

                // 更新整棟大樓的最底下總計數值
                let finalTotalEl = document.querySelector('.total-value');
                if(finalTotalEl) finalTotalEl.innerText = grandTotalKw.toFixed(2);
            }
        }).catch(err => console.log("同步延遲或失敗", err));
};

// 輔助函數：負責依據有無數值，畫出 ✅ 或 ❌ 的標籤
function updateCellUI(td, id, kw) {
    if(!td) return;
    if(kw !== "" && kw !== null && kw !== undefined && parseFloat(kw) > 0) {
        td.innerHTML = `✅<div class="panel-tag fill">盤號: ${id || '未填'}</div><div style="font-weight:bold; margin-top:2px;">${parseFloat(kw).toFixed(2)} kW</div>`;
    } else {
        td.innerHTML = `❌<div class="panel-tag empty">盤號: ❌</div>`;
    }
}
