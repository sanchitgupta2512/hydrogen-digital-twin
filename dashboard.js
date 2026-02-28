// Simulation State
let state = {
    running: false,
    time: 0,
    solar: 60,
    wind: 40,
    grid: 0,
    load: 80,
    mode: 'optimal'
};

let interval;
let chart1, chart2;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupControls();
    setupCharts();
    updateDisplay();
});

// Setup Controls
function setupControls() {
    // Sliders
    document.getElementById('solar').addEventListener('input', (e) => {
        state.solar = parseInt(e.target.value);
        document.getElementById('solar-val').textContent = e.target.value;
        updateDisplay();
    });
    
    document.getElementById('wind').addEventListener('input', (e) => {
        state.wind = parseInt(e.target.value);
        document.getElementById('wind-val').textContent = e.target.value;
        updateDisplay();
    });
    
    document.getElementById('grid').addEventListener('input', (e) => {
        state.grid = parseInt(e.target.value);
        document.getElementById('grid-val').textContent = e.target.value;
        updateDisplay();
    });
    
    document.getElementById('load').addEventListener('input', (e) => {
        state.load = parseInt(e.target.value);
        document.getElementById('load-val').textContent = e.target.value;
        updateDisplay();
    });
    
    document.getElementById('mode').addEventListener('change', (e) => {
        state.mode = e.target.value;
        addLog(`Mode changed to: ${e.target.value}`);
        updateDisplay();
    });
    
    // Buttons
    document.getElementById('run-btn').addEventListener('click', runSimulation);
    document.getElementById('reset-btn').addEventListener('click', resetSimulation);
    document.getElementById('emergency-btn').addEventListener('click', emergencyStop);
}

// Run Simulation
function runSimulation() {
    if (state.running) return;
    
    state.running = true;
    addLog('✅ Simulation STARTED');
    
    interval = setInterval(() => {
        state.time++;
        updateTimer();
        
        // Add variability
        if (Math.random() > 0.9) {
            state.solar = Math.max(0, state.solar + (Math.random() * 20 - 10));
            document.getElementById('solar').value = state.solar;
            document.getElementById('solar-val').textContent = Math.round(state.solar);
        }
        
        updateDisplay();
        
        // Update charts every 5 seconds
        if (state.time % 5 === 0) {
            updateCharts();
        }
    }, 1000);
}

// Reset Simulation
function resetSimulation() {
    if (interval) clearInterval(interval);
    state.running = false;
    state.time = 0;
    state.solar = 60;
    state.wind = 40;
    state.grid = 0;
    state.load = 80;
    
    document.getElementById('solar').value = 60;
    document.getElementById('solar-val').textContent = '60';
    document.getElementById('wind').value = 40;
    document.getElementById('wind-val').textContent = '40';
    document.getElementById('grid').value = 0;
    document.getElementById('grid-val').textContent = '0';
    document.getElementById('load').value = 80;
    document.getElementById('load-val').textContent = '80';
    
    updateTimer();
    updateDisplay();
    addLog('🔄 System RESET');
}

// Emergency Stop
function emergencyStop() {
    if (interval) clearInterval(interval);
    state.running = false;
    state.solar = 0;
    state.wind = 0;
    state.grid = 0;
    state.load = 0;
    
    document.getElementById('solar').value = 0;
    document.getElementById('solar-val').textContent = '0';
    document.getElementById('wind').value = 0;
    document.getElementById('wind-val').textContent = '0';
    document.getElementById('grid').value = 0;
    document.getElementById('grid-val').textContent = '0';
    document.getElementById('load').value = 0;
    document.getElementById('load-val').textContent = '0';
    
    updateDisplay();
    addLog('🚨 EMERGENCY SHUTDOWN');
}

// Update Display
function updateDisplay() {
    const totalPower = state.solar + state.wind + state.grid;
    const powerCond = totalPower * 0.98;
    const h2Production = (powerCond * (state.load / 100) * 16).toFixed(0);
    const storage = Math.min(95, 65 + (state.time / 100));
    const storageKg = (storage * 32).toFixed(0);
    
    document.getElementById('power-cond').textContent = powerCond.toFixed(0) + ' MW';
    document.getElementById('h2-prod').textContent = h2Production + ' kg/hr';
    document.getElementById('storage').textContent = storage.toFixed(0) + '%';
    document.getElementById('storage-kg').textContent = storageKg + ' kg';
    
    // Metrics
    const temp = (70 + state.load * 0.15 + Math.random() * 2).toFixed(1);
    const pressure = (25 + state.load * 0.08 + Math.random()).toFixed(1);
    const flow = h2Production;
    const efficiency = (70 - state.load * 0.02).toFixed(1);
    const specific = (54 - efficiency * 0.1).toFixed(1);
    const carbon = (state.grid / totalPower * 0.5).toFixed(1);
    
    document.getElementById('temp').textContent = temp + ' °C';
    document.getElementById('stack-pressure').textContent = pressure + ' bar';
    document.getElementById('flow').textContent = flow + ' kg/hr';
    document.getElementById('efficiency').textContent = efficiency + ' %';
    document.getElementById('specific').textContent = specific + ' kWh/kg';
    document.getElementById('carbon').textContent = carbon + ' kgCO₂/kg';
    
    // KPIs
    const production = (h2Production * state.time / 3600).toFixed(1);
    const capacity = (state.load * 0.9 + Math.random() * 5).toFixed(1);
    const cost = (350 - efficiency * 2).toFixed(2);
    
    document.getElementById('prod').textContent = production + ' tonnes';
    document.getElementById('capacity').textContent = capacity + '%';
    document.getElementById('cost').textContent = '₹' + cost + '/kg';
}

// Update Timer
function updateTimer() {
    const hours = Math.floor(state.time / 3600);
    const minutes = Math.floor((state.time % 3600) / 60);
    const seconds = state.time % 60;
    
    const timeStr = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    
    document.getElementById('timer').textContent = timeStr;
}

// Add Log Entry
function addLog(message) {
    const log = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const time = new Date().toLocaleTimeString();
    entry.textContent = time + ' ' + message;
    
    log.insertBefore(entry, log.firstChild);
    
    // Keep only last 20 entries
    while (log.children.length > 20) {
        log.removeChild(log.lastChild);
    }
}

// Setup Charts
function setupCharts() {
    const ctx1 = document.getElementById('chart1').getContext('2d');
    chart1 = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Power Input (MW)',
                    data: [],
                    borderColor: '#10B981',
                    tension: 0.4
                },
                {
                    label: 'H₂ Production (kg/hr)',
                    data: [],
                    borderColor: '#0891B2',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    const ctx2 = document.getElementById('chart2').getContext('2d');
    chart2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Efficiency (%)',
                    data: [],
                    borderColor: '#8B5CF6',
                    tension: 0.4
                },
                {
                    label: 'Cost (₹/kg)',
                    data: [],
                    borderColor: '#F59E0B',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 50,
                    max: 75
                },
                y1: {
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Update Charts
function updateCharts() {
    const totalPower = state.solar + state.wind + state.grid;
    const h2Prod = (totalPower * 0.98 * (state.load / 100) * 16).toFixed(0);
    const efficiency = (70 - state.load * 0.02).toFixed(1);
    const cost = (350 - efficiency * 2).toFixed(0);
    
    const label = Math.floor(state.time / 60) + 'm';
    
    chart1.data.labels.push(label);
    chart1.data.datasets[0].data.push(totalPower);
    chart1.data.datasets[1].data.push(h2Prod);
    
    chart2.data.labels.push(label);
    chart2.data.datasets[0].data.push(efficiency);
    chart2.data.datasets[1].data.push(cost);
    
    // Keep only last 20 points
    if (chart1.data.labels.length > 20) {
        chart1.data.labels.shift();
        chart1.data.datasets[0].data.shift();
        chart1.data.datasets[1].data.shift();
        
        chart2.data.labels.shift();
        chart2.data.datasets[0].data.shift();
        chart2.data.datasets[1].data.shift();
    }
    
    chart1.update('none');
    chart2.update('none');
}
