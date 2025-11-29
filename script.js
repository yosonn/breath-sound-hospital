// === script.js ===

document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. 假資料生成 (Mock Data) ===
    const names = ["林志豪", "陳美惠", "張雅婷", "王大明", "李建國", "吳淑芬", "劉柏翰", "黃怡君"];
    const diagnoses = ["慢性阻塞性肺病 (COPD)", "氣喘", "肺炎恢復期", "支氣管炎", "健康", "輕微感冒", "肺纖維化", "健康"];
    
    // 生成 8 位病患資料
    const patientsData = names.map((name, index) => {
        const id = `P-2025${(index + 1).toString().padStart(3, '0')}`;
        const age = Math.floor(Math.random() * 50) + 20; 
        const riskLevel = Math.random();
        let status = 'normal';
        if (riskLevel > 0.85) status = 'danger';
        else if (riskLevel > 0.6) status = 'warning';

        // 生成歷史紀錄
        const history = [];
        for(let i=0; i<10; i++) {
            history.push({
                date: `11/${29-i}`,
                wheeze: Math.floor(Math.random() * 30),
                crackles: Math.floor(Math.random() * 30),
                normal: Math.floor(Math.random() * 40 + 30)
            });
        }

        return {
            id: id,
            name: name,
            age: age,
            gender: Math.random() > 0.5 ? '男' : '女',
            lastCheck: `2025-11-29 ${Math.floor(Math.random()*12)+8}:${Math.floor(Math.random()*59).toString().padStart(2,'0')}`,
            status: status,
            diagnosis: diagnoses[index],
            history: history,
            // 每個部位的模擬數據 (Front, Back-L, Back-R)
            positions: {
                front: { normal: 85, wheeze: 10, crackles: 5, summary: "前胸聽診音正常，無明顯異常。" },
                "back-l": { normal: 60, wheeze: 30, crackles: 10, summary: "左背部偵測到輕微 Wheeze，建議持續追蹤。" },
                "back-r": { normal: 40, wheeze: 10, crackles: 50, summary: "⚠️ 右背部偵測到明顯 Crackles，請注意肺炎風險。" }
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
            if(targetId === 'patient-list') pageHeading.textContent = '病患資料庫';
            if(targetId === 'risk-monitor') pageHeading.textContent = '風險監測';
            if(targetId === 'analytics') pageHeading.textContent = '分析統計';
            
            switchView(targetId);
        });
    });

    function switchView(viewId) {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `view-${viewId}`) {
                section.classList.add('active');
            }
        });
        if(viewId === 'dashboard') {
            setTimeout(initDashboardCharts, 100); 
        }
    }

    window.switchView = function(viewName) {
        const nav = document.querySelector(`.nav-item[data-target="${viewName}"]`);
        if(nav) nav.click();
        else {
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`view-${viewName}`).classList.add('active');
            pageHeading.textContent = '病患個案詳細資料';
        }
    };

    // === 3. Dashboard Charts ===
    function initDashboardCharts() {
        // Trend Chart
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        if(window.dashTrendChart) window.dashTrendChart.destroy();
        window.dashTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: Array.from({length: 14}, (_, i) => `11/${15+i}`),
                datasets: [
                    { label: 'Wheeze', data: Array.from({length: 14}, () => Math.floor(Math.random() * 20)), borderColor: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)', fill: true, tension: 0.4 },
                    { label: 'Crackles', data: Array.from({length: 14}, () => Math.floor(Math.random() * 15)), borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Risk Bar Chart
        const ctxRisk = document.getElementById('riskDistChart').getContext('2d');
        if(window.dashRiskChart) window.dashRiskChart.destroy();
        window.dashRiskChart = new Chart(ctxRisk, {
            type: 'bar',
            data: {
                labels: ['低風險', '中風險', '高風險'],
                datasets: [{ data: [106, 15, 7], backgroundColor: ['#28a745', '#ffc107', '#dc3545'], borderRadius: 5 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Sound Pie Chart
        const ctxSound = document.getElementById('soundPieChart').getContext('2d');
        if(window.dashSoundChart) window.dashSoundChart.destroy();
        window.dashSoundChart = new Chart(ctxSound, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{ data: [75, 15, 10], backgroundColor: ['#28a745', '#ffc107', '#dc3545'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        renderAiFeed();
    }

    function renderAiFeed() {
        const feedList = document.getElementById('ai-feed-list');
        const msgs = [
            { t: '10:05', msg: '病患 #P-2025003 Wheeze 機率上升 22%', icon: 'fa-triangle-exclamation', color: '#ffc107' },
            { t: '09:42', msg: '病患 #P-2025007 檢測結果: 正常', icon: 'fa-circle-check', color: '#28a745' },
            { t: '09:15', msg: '病患 #P-2025001 Crackles 異常警示', icon: 'fa-circle-exclamation', color: '#dc3545' },
            { t: '08:50', msg: '病患 #P-2025005 正常', icon: 'fa-circle-check', color: '#28a745' },
            { t: '08:30', msg: '病患 #P-2025002 Wheeze 機率下降', icon: 'fa-arrow-trend-down', color: '#28a745' }
        ];
        feedList.innerHTML = msgs.map(m => `
            <div class="feed-item">
                <i class="fa-solid ${m.icon}" style="color: ${m.color}"></i>
                <div><div>${m.msg}</div><span class="feed-time">${m.t}</span></div>
            </div>
        `).join('');
    }

    // === 4. Render Patient List ===
    function renderPatientList() {
        const tbody = document.getElementById('patient-table-body');
        tbody.innerHTML = patientsData.map(p => {
            let badgeClass = 'badge-normal'; let statusText = '正常';
            if (p.status === 'warning') { badgeClass = 'badge-warning'; statusText = '警示'; }
            if (p.status === 'danger') { badgeClass = 'badge-danger'; statusText = '危險'; }
            return `
                <tr>
                    <td><strong>${p.id}</strong></td>
                    <td><div style="display:flex; align-items:center;"><div class="avatar" style="width:30px; height:30px; font-size:0.8rem; margin-right:10px;">${p.name[0]}</div>${p.name}</div></td>
                    <td>${p.age} 歲 / ${p.gender}</td>
                    <td>${p.lastCheck}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                    <td><button class="btn btn-outline btn-sm" onclick="openPatientDetail('${p.id}')">查看個案</button></td>
                </tr>
            `;
        }).join('');
    }

    // === 5. Detail Page Logic (NEW & IMPROVED) ===
    let currentPatient = null;
    let detailLineChart = null;

    window.openPatientDetail = function(id) {
        currentPatient = patientsData.find(p => p.id === id);
        if (!currentPatient) return;

        // 填入基本資料
        document.getElementById('p-name').textContent = currentPatient.name;
        document.getElementById('p-id').textContent = currentPatient.id;
        document.getElementById('p-age-gender').textContent = `${currentPatient.age} 歲 / ${currentPatient.gender}`;
        document.getElementById('p-history').textContent = currentPatient.diagnosis;
        document.getElementById('p-last-date').textContent = currentPatient.lastCheck;

        // 風險標籤
        const rBadge = document.getElementById('p-risk-badge');
        rBadge.className = 'badge';
        if(currentPatient.status === 'normal') { rBadge.classList.add('badge-success'); rBadge.textContent='低風險'; }
        else if(currentPatient.status === 'warning') { rBadge.classList.add('badge-warning'); rBadge.textContent='中度風險'; }
        else { rBadge.classList.add('badge-danger'); rBadge.textContent='高風險'; }

        // 歷史列表
        const miniList = document.getElementById('p-mini-history');
        miniList.innerHTML = currentPatient.history.slice(0, 5).map(h => `<li><span>${h.date}</span><span>W:${h.wheeze}% / C:${h.crackles}%</span></li>`).join('');

        // 繪製趨勢圖
        renderDetailTrend(currentPatient);

        // 初始化互動功能 (預設選中前胸)
        initDetailInteractions();
        updatePositionData('front'); 

        window.switchView('patient-detail');
    };

    function renderDetailTrend(patient) {
        const ctxLine = document.getElementById('patientTrendChart').getContext('2d');
        if(detailLineChart) detailLineChart.destroy();
        const historyRev = [...patient.history].reverse();
        detailLineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: historyRev.map(h => h.date),
                datasets: [
                    { label: 'Wheeze', data: historyRev.map(h => h.wheeze), borderColor: '#ffc107', tension: 0.3 },
                    { label: 'Crackles', data: historyRev.map(h => h.crackles), borderColor: '#dc3545', tension: 0.3 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // === 關鍵互動：部位切換與數據更新 ===
    function initDetailInteractions() {
        const posBtns = document.querySelectorAll('.pos-btn');
        posBtns.forEach(btn => {
            // 清除舊的監聽器 (防止重複綁定)
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // 重新綁定
        document.querySelectorAll('.pos-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 1. UI 切換
                document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // 2. 獲取部位 ID
                const pos = e.target.getAttribute('data-pos');
                
                // 3. 模擬音訊載入效果
                simulateAudioLoading();

                // 4. 更新數據
                setTimeout(() => {
                    updatePositionData(pos);
                }, 800); // 延遲 0.8秒模擬分析時間
            });
        });
    }

    function simulateAudioLoading() {
        const loader = document.getElementById('audio-loading');
        const player = document.getElementById('main-audio-player');
        
        loader.style.display = 'flex';
        player.pause();
        player.currentTime = 0;
        
        setTimeout(() => {
            loader.style.display = 'none';
        }, 800);
    }

    function updatePositionData(pos) {
        if(!currentPatient) return;

        // 根據部位獲取數據 (若該部位無資料則用預設值)
        const data = currentPatient.positions[pos] || { normal: 90, wheeze: 5, crackles: 5, summary: "此部位無異常。" };

        // 更新圓環圖 (Stroke Dasharray)
        updateCircleChart('stat-normal', data.normal);
        updateCircleChart('stat-wheeze', data.wheeze);
        updateCircleChart('stat-crackles', data.crackles);

        // 更新摘要文字
        const summaryBox = document.getElementById('p-ai-summary-box');
        const summaryText = document.getElementById('p-ai-summary');
        
        summaryText.textContent = data.summary;
        
        // 變更摘要框顏色
        summaryBox.style.borderLeftColor = '#28a745'; // 預設綠
        if (data.wheeze > 20) summaryBox.style.borderLeftColor = '#ffc107';
        if (data.crackles > 20) summaryBox.style.borderLeftColor = '#dc3545';
    }

    function updateCircleChart(elementId, percentage) {
        const el = document.getElementById(elementId);
        const circle = el.querySelector('.circle');
        const text = el.querySelector('.percentage');
        
        // SVG dasharray: value, 100
        circle.setAttribute('stroke-dasharray', `${percentage}, 100`);
        text.textContent = `${percentage}%`;
    }

    // === 6. Start ===
    initDashboardCharts();
    renderPatientList();
});
