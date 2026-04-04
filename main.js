function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('zh-TW', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

document.addEventListener('DOMContentLoaded', function() {
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
            plugins: { 
                legend: { position: 'right', labels: { color: '#f8fafc', font: { size: 12 } } } 
            }
        }
    });
});
