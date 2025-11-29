// === script.js ===

document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. 假資料與資源 ===
    // 1秒的靜音 WAV Base64，讓 Audio 元素可以運作
    const DUMMY_AUDIO_SRC = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAABACQB8AgAEAf//AAALZGF0YQAAAAA=";

    const names = ["王小明", "李建國", "陳美惠", "張雅婷", "林志豪", "吳淑芬", "劉柏翰", "黃怡君"];
    const diagnoses = ["慢性支氣管炎", "肺炎觀察中", "氣喘", "COPD", "健康檢查", "上呼吸道感染", "肺纖維化", "健康"];
    
    // 生成病患資料
    const patientsData = names.map((name, index) => {
        const id = `P-2025${(index + 1).toString().padStart(3, '0')}`;
        const riskLevel = Math.random();
        let status = 'normal';
        if (riskLevel > 0.8) status = 'danger';
        else if (riskLevel > 0.5) status = 'warning';

        // 歷史資料
        const history = [];
        for(let i=0; i<10; i++) {
            history.push({
                date: `11/${29-i}`,
                wheeze: Math.floor(Math.random() * 20),
                crackles: Math.floor(Math.random() * 20),
                status: Math.random() > 0.7 ? 'warning' : 'normal'
            });
        }

        return {
            id: id,
            name: name,
            gender: Math.random() > 0.5 ? '男' : '女',
            age: Math.floor(Math.random() * 40) + 30,
            lastCheck: `2025-11-29`,
            diagnosis: diagnoses[index],
            status: status,
            history: history,
            current: {
                normal: status === 'normal' ? 85 : 40,
                wheeze: status === 'warning' ? 55 : 10,
                crackles: status === 'danger' ? 60 : 5
            }
        };
    });

    // === 2. 視圖切換邏輯 ===
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.view-section');
    const pageHeading = document.getElementById('page-heading');

    window.switchView = function(viewName) {
        // 更新標題
        if(viewName === 'dashboard') pageHeading.textContent = '總覽儀表板';
        if(viewName === 'patient-list') pageHeading.textContent = '病患資料庫';
        if(viewName === 'patient-detail') pageHeading.textContent = '病患個案詳細資料';
        if(viewName === 'risk-monitor') pageHeading.textContent = '風險監測';
        if(viewName === 'analytics') pageHeading.textContent = '分析統計';

        // 切換區塊
        sections.forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`view-${viewName}`);
        if(target) target.classList.add('active');

        // 更新 Sidebar 樣式
        navItems.forEach(n => {
            n.classList.remove('active');
            if(n.getAttribute('data-target') === viewName) n.classList.add('active');
        });

        // 若切回 Dashboard，重繪圖表
        if(viewName === 'dashboard') setTimeout(initDashboardCharts, 100);
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            window.switchView(target);
        });
    });

    // === 3. Dashboard 圖表初始化 ===
    function initDashboardCharts() {
        const commonOptions = { responsive: true, maintainAspectRatio: false };
        
        // 趨勢圖
        if(window.dashTrendChart) window.dashTrendChart.destroy();
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        window.dashTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: Array.from({length: 14}, (_, i) => `11/${15+i}`),
                datasets: [
                    { label: 'Wheeze', data: Array(14).fill(0).map(()=>Math.random()*20), borderColor: '#ffc107', tension: 0.4 },
                    { label: 'Crackles', data: Array(14).fill(0).map(()=>Math.random()*15), borderColor: '#dc3545', tension: 0.4 }
                ]
            },
            options: commonOptions
        });

        // 風險分佈
        if(window.dashRiskChart) window.dashRiskChart.destroy();
        const ctxRisk = document.getElementById('riskDistChart').getContext('2d');
        window.dashRiskChart = new Chart(ctxRisk, {
            type: 'bar',
            data: {
                labels: ['低風險', '中風險', '高風險'],
                datasets: [{
                    label: '人數', data: [98, 22, 8],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: { ...commonOptions, plugins: { legend: { display: false } } }
        });

        // 圓餅圖
        if(window.dashSoundChart) window.dashSoundChart.destroy();
        const ctxPie = document.getElementById('soundPieChart').getContext('2d');
        window.dashSoundChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{
                    data: [70, 20, 10], backgroundColor: ['#28a745', '#ffc107', '#dc3545'], borderWidth: 0
                }]
            },
            options: commonOptions
        });

        renderAiFeed();
    }

    function renderAiFeed() {
        const feedList = document.getElementById('ai-feed-list');
        feedList.innerHTML = `
            <div class="feed-item"><i class="fa-solid fa-triangle-exclamation" style="color:#ffc107"></i><div><div>病患 #P-2025003 Wheeze 上升</div><span class="feed-time">10:05</span></div></div>
            <div class="feed-item"><i class="fa-solid fa-circle-check" style="color:#28a745"></i><div><div>病患 #P-2025007 檢測正常</div><span class="feed-time">09:42</span></div></div>
            <div class="feed-item"><i class="fa-solid fa-circle-exclamation" style="color:#dc3545"></i><div><div>病患 #P-2025001 Crackles 警示</div><span class="feed-time">09:15</span></div></div>
        `;
    }

    // === 4. 病患列表與詳細頁邏輯 ===
    function renderPatientList() {
        const tbody = document.getElementById('patient-table-body');
        tbody.innerHTML = patientsData.map(p => `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.name}</td>
                <td>${p.age} / ${p.gender}</td>
                <td>${p.lastCheck}</td>
                <td><span class="badge badge-${p.status}">${p.status.toUpperCase()}</span></td>
                <td><button class="btn btn-outline btn-sm" onclick="openPatientDetail('${p.id}')">查看</button></td>
            </tr>
        `).join('');
    }

    // 開啟詳細頁
    window.openPatientDetail = function(id) {
        const p = patientsData.find(d => d.id === id);
        if(!p) return;

        // 填入基本資料
        document.getElementById('p-name').textContent = p.name;
        document.getElementById('p-id').textContent = `ID: ${p.id}`;
        document.getElementById('p-avatar').textContent = p.name[0];
        document.getElementById('p-gender').textContent = p.gender;
        document.getElementById('p-age').textContent = p.age;
        document.getElementById('p-history').textContent = p.diagnosis;
        document.getElementById('p-last-date').textContent = p.lastCheck;

        // 狀態 Badge
        const badge = document.getElementById('p-detail-status-badge');
        const statusText = document.getElementById('p-detail-status-text');
        badge.className = `badge badge-${p.status}`;
        badge.textContent = p.status.toUpperCase();
        
        let aiSummary = '';
        if(p.status === 'normal') {
            statusText.textContent = '狀況穩定';
            aiSummary = '本週呼吸音監測顯示數據平穩，未發現顯著異常音。建議維持目前的治療計畫，並持續定期追蹤。';
        } else if(p.status === 'warning') {
            statusText.textContent = '需注意';
            aiSummary = `系統偵測到 Wheeze (喘鳴音) 機率略為上升至 ${p.current.wheeze}%。波形顯示在呼氣期有高頻特徵，建議關注氣道狀況。`;
        } else {
            statusText.textContent = '高風險';
            aiSummary = `警示！偵測到明顯的 Crackles (爆裂音) 特徵，佔比達 ${p.current.crackles}%。此特徵強烈暗示肺部可能有積液或感染，請立即安排進一步檢查。`;
        }
        document.getElementById('p-ai-summary').textContent = aiSummary;

        // 填入歷史列表
        const histList = document.getElementById('p-mini-history');
        histList.innerHTML = p.history.slice(0, 5).map(h => `
            <li class="${h.status === 'warning' ? 'warning' : ''}">
                <span class="t-date">${h.date}</span>
                <span class="t-res">W:${h.wheeze}% / C:${h.crackles}%</span>
            </li>
        `).join('');

        // 初始化圖表與波形
        setTimeout(() => {
            renderDetailCharts(p);
            setupAudioPlayer(p.id);
        }, 100);

        window.switchView('patient-detail');
    };

    // 詳細頁圖表
    let detailBarChart, detailLineChart;
    function renderDetailCharts(p) {
        // 機率圖
        const ctxBar = document.getElementById('singleAnalysisChart').getContext('2d');
        if(detailBarChart) detailBarChart.destroy();
        detailBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{
                    data: [p.current.normal, p.current.wheeze, p.current.crackles],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // 趨勢圖
        const ctxLine = document.getElementById('patientTrendChart').getContext('2d');
        if(detailLineChart) detailLineChart.destroy();
        const histRev = [...p.history].reverse();
        detailLineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: histRev.map(h => h.date),
                datasets: [
                    { label: 'Wheeze', data: histRev.map(h => h.wheeze), borderColor: '#ffc107' },
                    { label: 'Crackles', data: histRev.map(h => h.crackles), borderColor: '#dc3545' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // === 5. 音訊與波形互動 (關鍵修復) ===
    function setupAudioPlayer(pid) {
        const audio = document.getElementById('mainAudioPlayer');
        const playBtn = document.getElementById('playIcon');
        const posBtns = document.querySelectorAll('.pos-btn');
        const fileNameDisplay = document.getElementById('currentFileName');
        
        // 設定假音訊源，讓播放器能動
        audio.src = DUMMY_AUDIO_SRC;

        // 播放按鈕事件
        playBtn.onclick = () => {
            if(audio.paused) {
                audio.play();
                playBtn.className = 'fa-solid fa-circle-pause';
            } else {
                audio.pause();
                playBtn.className = 'fa-solid fa-circle-play';
            }
        };

        // 聽診位置切換事件
        posBtns.forEach(btn => {
            btn.onclick = (e) => {
                // 1. UI 狀態更新
                posBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 2. 模擬切換檔案
                const posName = e.target.getAttribute('data-pos').toUpperCase();
                const posText = e.target.textContent;
                fileNameDisplay.textContent = `Record_20251129_${pid}_${posName}.wav`;
                
                // 3. 重置播放器
                audio.pause();
                audio.currentTime = 0;
                playBtn.className = 'fa-solid fa-circle-play';
                
                // 4. 重繪隨機波形 (模擬不同位置的聲音特徵)
                drawWaveform();
            };
        });

        // 初次繪製波形
        drawWaveform();
    }

    // Canvas 繪製假波形動畫
    function drawWaveform() {
        const canvas = document.getElementById('audioWaveform');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#1a1a1a'; // 黑底
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff00'; // 綠色波形
        ctx.beginPath();

        const sliceWidth = width * 1.0 / 100;
        let x = 0;

        // 產生隨機波形
        for(let i = 0; i < 100; i++) {
            const v = Math.random() * (height / 2); // 振幅
            const y = (height / 2) + Math.sin(i * 0.5) * v * (Math.random() > 0.5 ? 1 : -1);

            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height/2);
        ctx.stroke();
    }

    // 初始化
    renderPatientList();
    initDashboardCharts();
});
