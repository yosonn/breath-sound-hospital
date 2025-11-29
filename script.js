// === script.js ===

document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. 假資料與資源 ===
    // 產生一個極短的靜音/噪音 Base64，確保 Audio 標籤有內容可以操作 (這是 1 秒鐘的空白 wav)
    const mockAudioSrc = "data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; 
    
    const names = ["林志豪", "陳美惠", "張雅婷", "王大明", "李建國", "吳淑芬", "劉柏翰", "黃怡君"];
    const patientsData = names.map((name, index) => {
        const id = `P-2025${(index + 1).toString().padStart(3, '0')}`;
        const riskLevel = Math.random();
        let status = 'normal';
        if (riskLevel > 0.85) status = 'danger'; else if (riskLevel > 0.6) status = 'warning';

        const history = [];
        for(let i=0; i<10; i++) {
            history.push({
                date: `11/${29-i}`,
                wheeze: Math.floor(Math.random() * 30),
                crackles: Math.floor(Math.random() * 30)
            });
        }

        return {
            id: id, name: name, age: Math.floor(Math.random() * 50) + 20, gender: Math.random()>0.5?'男':'女',
            lastCheck: '2025-11-29 09:30', status: status, diagnosis: "慢性支氣管炎",
            history: history,
            current: {
                wheeze: status==='normal'?5:(status==='warning'?45:15),
                crackles: status==='danger'?60:10,
                normal: status==='normal'?85:30
            }
        };
    });

    // === 2. 導航切換邏輯 ===
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.view-section');
    const pageHeading = document.getElementById('page-heading');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            if(targetId === 'dashboard') pageHeading.textContent = '總覽儀表板 (Dashboard)';
            else if(targetId === 'patient-list') pageHeading.textContent = '病患資料庫';
            else pageHeading.textContent = item.querySelector('span').textContent;
            
            switchView(targetId);
        });
    });

    window.switchView = function(viewId) {
        sections.forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`view-${viewId}`);
        if(target) target.classList.add('active');
        
        if(viewId === 'dashboard') setTimeout(initDashboardCharts, 100);
    };

    // === 3. Dashboard 初始化 ===
    function initDashboardCharts() {
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        if(window.dashTrendChart) window.dashTrendChart.destroy();
        window.dashTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: Array.from({length: 14}, (_, i) => `11/${15+i}`),
                datasets: [
                    { label: 'Wheeze', data: Array.from({length:14},()=>Math.random()*20), borderColor:'#ffc107', fill:true, tension:0.4 },
                    { label: 'Crackles', data: Array.from({length:14},()=>Math.random()*15), borderColor:'#dc3545', fill:true, tension:0.4 }
                ]
            }, options: { responsive: true, maintainAspectRatio: false }
        });

        const ctxRisk = document.getElementById('riskDistChart').getContext('2d');
        if(window.dashRiskChart) window.dashRiskChart.destroy();
        window.dashRiskChart = new Chart(ctxRisk, {
            type: 'bar',
            data: { labels: ['低風險', '中風險', '高風險'], datasets: [{ label: '人數', data: [106, 15, 7], backgroundColor: ['#28a745', '#ffc107', '#dc3545'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}} }
        });

        const ctxSound = document.getElementById('soundPieChart').getContext('2d');
        if(window.dashSoundChart) window.dashSoundChart.destroy();
        window.dashSoundChart = new Chart(ctxSound, {
            type: 'doughnut',
            data: { labels: ['Normal', 'Wheeze', 'Crackles'], datasets: [{ data: [75, 15, 10], backgroundColor: ['#28a745', '#ffc107', '#dc3545'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        // 填充假通知
        document.getElementById('ai-feed-list').innerHTML = `
            <div class="feed-item"><i class="fa-solid fa-triangle-exclamation" style="color:#ffc107"></i><div><div>病患 #P-2025003 Wheeze 上升</div><span class="feed-time">10:05</span></div></div>
            <div class="feed-item"><i class="fa-solid fa-circle-check" style="color:#28a745"></i><div><div>病患 #P-2025007 檢測正常</div><span class="feed-time">09:42</span></div></div>
            <div class="feed-item"><i class="fa-solid fa-circle-exclamation" style="color:#dc3545"></i><div><div>病患 #P-2025001 Crackles 警示</div><span class="feed-time">09:15</span></div></div>
        `;
    }

    // === 4. 病患列表 ===
    function renderPatientList() {
        const tbody = document.getElementById('patient-table-body');
        tbody.innerHTML = patientsData.map(p => {
            let badge = p.status==='danger' ? 'badge-danger' : (p.status==='warning' ? 'badge-warning' : 'badge-normal');
            let txt = p.status==='danger' ? '危險' : (p.status==='warning' ? '警示' : '正常');
            return `<tr>
                <td><strong>${p.id}</strong></td>
                <td><div style="display:flex;align-items:center;"><div class="avatar" style="width:30px;height:30px;font-size:0.8rem;">${p.name[0]}</div>${p.name}</div></td>
                <td>${p.age} 歲 / ${p.gender}</td>
                <td>${p.lastCheck}</td>
                <td><span class="badge ${badge}">${txt}</span></td>
                <td><button class="btn btn-outline btn-sm" onclick="openPatientDetail('${p.id}')">查看個案</button></td>
            </tr>`;
        }).join('');
    }

    // === 5. 個案詳細頁 (核心修改) ===
    let detailBarChart, detailLineChart;
    let visualizerInterval;

    window.openPatientDetail = function(id) {
        const patient = patientsData.find(p => p.id === id);
        if(!patient) return;

        // 填入基本資料
        document.getElementById('p-name').textContent = patient.name;
        document.getElementById('p-id').textContent = `ID: ${patient.id}`;
        document.getElementById('p-avatar').textContent = patient.name[0];
        document.getElementById('p-age').textContent = patient.age;
        document.getElementById('p-mini-history').innerHTML = patient.history.slice(0, 5).map(h => `<li><span>${h.date}</span><span>W:${h.wheeze}%</span></li>`).join('');

        // 風險標示
        const resultTitle = document.getElementById('ai-main-result');
        const summary = document.getElementById('p-ai-summary');
        const scoreContainer = document.getElementById('ai-score-container');
        
        if(patient.status === 'normal') {
            resultTitle.textContent = "Low Risk (正常)";
            resultTitle.className = "text-success";
            summary.textContent = "呼吸音平穩，未偵測到明顯異常特徵。";
            scoreContainer.style.borderLeft = "5px solid #28a745";
        } else if(patient.status === 'warning') {
            resultTitle.textContent = "Medium Risk (警示)";
            resultTitle.className = "text-warning";
            summary.textContent = `偵測到 Wheeze 喘鳴音 (機率 ${patient.current.wheeze}%)。`;
            scoreContainer.style.borderLeft = "5px solid #ffc107";
        } else {
            resultTitle.textContent = "High Risk (危險)";
            resultTitle.className = "text-danger";
            summary.textContent = `偵測到強烈 Crackles 爆裂音 (${patient.current.crackles}%)，建議立即檢查。`;
            scoreContainer.style.borderLeft = "5px solid #dc3545";
        }

        // 初始化圖表
        initDetailCharts(patient);
        
        // 重置播放器
        const audio = document.getElementById('mainAudioPlayer');
        audio.src = mockAudioSrc; // 載入假音訊確保可以播放
        
        // 切換視圖
        window.switchView('patient-detail');
        // 初始化視覺化
        initVisualizer(audio);
    };

    // 位置按鈕切換邏輯
    window.selectPosition = function(btn, pos) {
        // 移除所有 active
        document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
        // 加入當前 active
        btn.classList.add('active');
        
        // 模擬切換音訊 (重新載入)
        const audio = document.getElementById('mainAudioPlayer');
        audio.pause();
        audio.currentTime = 0;
        // 實際應用時這裡會換 src: audio.src = `api/audio/${patientId}/${pos}`;
        console.log(`Switched to position: ${pos}`);
    };

    function initDetailCharts(patient) {
        // AI Score Doughnut
        const ctxBar = document.getElementById('singleAnalysisChart').getContext('2d');
        if(detailBarChart) detailBarChart.destroy();
        detailBarChart = new Chart(ctxBar, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{ data: [patient.current.normal, patient.current.wheeze, patient.current.crackles], backgroundColor: ['#28a745', '#ffc107', '#dc3545'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
        });

        // Trend Line
        const ctxLine = document.getElementById('patientTrendChart').getContext('2d');
        if(detailLineChart) detailLineChart.destroy();
        const revHistory = [...patient.history].reverse();
        detailLineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: revHistory.map(h => h.date),
                datasets: [
                    { label: 'Wheeze', data: revHistory.map(h => h.wheeze), borderColor: '#ffc107', tension: 0.3 },
                    { label: 'Crackles', data: revHistory.map(h => h.crackles), borderColor: '#dc3545', tension: 0.3 }
                ]
            }, options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // === Fake Audio Visualizer (模擬波形跳動) ===
    function initVisualizer(audioElement) {
        const canvas = document.getElementById('audioVisualizer');
        const ctx = canvas.getContext('2d');
        let isPlaying = false;

        // 設定畫布尺寸
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;

        audioElement.onplay = () => { isPlaying = true; animate(); };
        audioElement.onpause = () => { isPlaying = false; drawIdle(); };
        audioElement.onended = () => { isPlaying = false; drawIdle(); };

        function drawIdle() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#003355'; // 深藍背景
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        function animate() {
            if (!isPlaying) return;
            
            ctx.fillStyle = 'rgba(0, 20, 40, 0.2)'; // 拖影效果
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const bars = 50;
            const barWidth = canvas.width / bars;
            
            for (let i = 0; i < bars; i++) {
                const height = Math.random() * canvas.height * 0.8;
                const x = i * barWidth;
                const y = (canvas.height - height) / 2;
                
                // 漸層色
                const gradient = ctx.createLinearGradient(0, y, 0, y + height);
                gradient.addColorStop(0, '#00c6ff');
                gradient.addColorStop(1, '#0072ff');

                ctx.fillStyle = gradient;
                ctx.fillRect(x + 2, y, barWidth - 2, height);
            }
            requestAnimationFrame(animate);
        }

        drawIdle(); // 初始狀態
    }

    // 啟動
    initDashboardCharts();
    renderPatientList();
});
