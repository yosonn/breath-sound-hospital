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
            current: {
                wheeze: status === 'normal' ? 5 : (status === 'warning' ? 45 : 15),
                crackles: status === 'danger' ? 60 : 10,
                normal: status === 'normal' ? 85 : 30
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
            
            // 更新 Sidebar 狀態
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 處理標題
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
        
        // 如果切換回 Dashboard，重新渲染圖表以確保尺寸正確
        if(viewId === 'dashboard') {
            setTimeout(initDashboardCharts, 100); 
        }
    }

    // 將 switchView 暴露給全域
    window.switchView = function(viewName) {
        const nav = document.querySelector(`.nav-item[data-target="${viewName}"]`);
        if(nav) nav.click();
        else {
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`view-${viewName}`).classList.add('active');
            pageHeading.textContent = '病患個案詳細資料';
        }
    };

    // === 3. Dashboard 初始化與圖表 ===
    function initDashboardCharts() {
        // 趨勢圖 (Trend Chart)
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        if(window.dashTrendChart) window.dashTrendChart.destroy();
        
        window.dashTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: Array.from({length: 14}, (_, i) => `11/${15+i}`),
                datasets: [
                    {
                        label: 'Wheeze (喘鳴)',
                        data: Array.from({length: 14}, () => Math.floor(Math.random() * 20)),
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Crackles (爆裂)',
                        data: Array.from({length: 14}, () => Math.floor(Math.random() * 15)),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, // 關鍵：允許隨容器調整
            }
        });

        // 風險分佈 (Risk Bar Chart)
        const ctxRisk = document.getElementById('riskDistChart').getContext('2d');
        if(window.dashRiskChart) window.dashRiskChart.destroy();

        window.dashRiskChart = new Chart(ctxRisk, {
            type: 'bar',
            data: {
                labels: ['低風險', '中風險', '高風險'],
                datasets: [{
                    label: '人數',
                    data: [106, 15, 7],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // 呼吸音分類 (Pie Chart)
        const ctxSound = document.getElementById('soundPieChart').getContext('2d');
        if(window.dashSoundChart) window.dashSoundChart.destroy();

        window.dashSoundChart = new Chart(ctxSound, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{
                    data: [75, 15, 10],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false 
            }
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
                <div>
                    <div>${m.msg}</div>
                    <span class="feed-time">${m.t}</span>
                </div>
            </div>
        `).join('');
    }

    // === 4. 病患列表渲染 ===
    function renderPatientList() {
        const tbody = document.getElementById('patient-table-body');
        tbody.innerHTML = patientsData.map(p => {
            let badgeClass = 'badge-normal';
            let statusText = '正常';
            if (p.status === 'warning') { badgeClass = 'badge-warning'; statusText = '警示'; }
            if (p.status === 'danger') { badgeClass = 'badge-danger'; statusText = '危險'; }

            return `
                <tr>
                    <td><strong>${p.id}</strong></td>
                    <td>
                        <div style="display:flex; align-items:center;">
                            <div class="avatar" style="width:30px; height:30px; font-size:0.8rem; margin-right:10px;">${p.name[0]}</div>
                            ${p.name}
                        </div>
                    </td>
                    <td>${p.age} 歲 / ${p.gender}</td>
                    <td>${p.lastCheck}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick="openPatientDetail('${p.id}')">
                            查看個案
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // === 5. 單一病患詳細頁邏輯 ===
    window.openPatientDetail = function(id) {
        const patient = patientsData.find(p => p.id === id);
        if (!patient) return;

        document.getElementById('p-name').textContent = patient.name;
        document.getElementById('p-id').textContent = `ID: ${patient.id}`;
        document.getElementById('p-avatar').textContent = patient.name[0];
        document.getElementById('p-age').textContent = patient.age;
        document.getElementById('p-history').textContent = patient.diagnosis;
        document.getElementById('p-last-date').textContent = patient.lastCheck;

        const miniList = document.getElementById('p-mini-history');
        miniList.innerHTML = patient.history.slice(0, 5).map(h => `
            <li>
                <span>${h.date}</span>
                <span>W:${h.wheeze}% / C:${h.crackles}%</span>
            </li>
        `).join('');

        const riskBadge = document.getElementById('p-risk-badge');
        const summaryText = document.getElementById('p-ai-summary');
        
        riskBadge.className = 'badge'; 
        if(patient.status === 'normal') {
            riskBadge.classList.add('badge-success');
            riskBadge.textContent = '正常';
            summaryText.textContent = '系統分析顯示呼吸音特徵平穩，未偵測到明顯異常。建議維持目前治療方案。';
        } else if(patient.status === 'warning') {
            riskBadge.classList.add('badge-warning');
            riskBadge.textContent = '需注意';
            summaryText.textContent = `偵測到 Wheeze (喘鳴) 機率偏高 (${patient.current.wheeze}%)，可能與氣道收縮有關。建議追蹤觀察。`;
        } else {
            riskBadge.classList.add('badge-danger');
            riskBadge.textContent = '高風險';
            summaryText.textContent = `偵測到 Crackles (爆裂音) 強度異常 (${patient.current.crackles}%)，建議立即進行影像學檢查以排除肺炎可能。`;
        }

        renderDetailCharts(patient);
        window.switchView('patient-detail');
    };

    let detailBarChart = null;
    let detailLineChart = null;

    function renderDetailCharts(patient) {
        // 1. 單次分析長條圖
        const ctxBar = document.getElementById('singleAnalysisChart').getContext('2d');
        if(detailBarChart) detailBarChart.destroy();

        detailBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{
                    label: '機率 (%)',
                    data: [patient.current.normal, patient.current.wheeze, patient.current.crackles],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false, // 關鍵
                plugins: { legend: { display: false } },
                scales: { x: { max: 100 } }
            }
        });

        // 2. 歷史趨勢折線圖
        const ctxLine = document.getElementById('patientTrendChart').getContext('2d');
        if(detailLineChart) detailLineChart.destroy();

        const historyRev = [...patient.history].reverse();

        detailLineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: historyRev.map(h => h.date),
                datasets: [
                    {
                        label: 'Wheeze',
                        data: historyRev.map(h => h.wheeze),
                        borderColor: '#ffc107',
                        tension: 0.3
                    },
                    {
                        label: 'Crackles',
                        data: historyRev.map(h => h.crackles),
                        borderColor: '#dc3545',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false // 關鍵
            }
        });

        const avgW = Math.round(patient.history.reduce((a, b) => a + b.wheeze, 0) / patient.history.length);
        document.getElementById('avg-wheeze').textContent = avgW + '%';
    }

    // === 6. 初始化執行 ===
    initDashboardCharts();
    renderPatientList();
});