// 1. 更新時鐘
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// 2. 繪製圖表
document.addEventListener('DOMContentLoaded', function() {
    // 圓餅圖：四大分類 (對比色：粉紅/藍/綠/橘)
    const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
    new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
            labels: ['動力', '空調', '插座', '照明'],
            datasets: [{
                data: [55, 40, 22, 15], 
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } }
        }
    });

    // 長條圖：異常耗電 Top 4
    const ctxBar = document.getElementById('barChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['美時製藥(B3)', '奧鋼聯(B1)', '綠能所(A3)', '飲水機群(全)'],
            datasets: [{
                label: 'kW',
                data: [14.5, 12.5, 7.1, 6.8],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { color: '#f8fafc' } }
            }
        }
    });
});