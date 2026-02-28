// ============================================
// GREEN HYDROGEN DIGITAL TWIN - SIMULATION ENGINE
// ============================================

// Simulation State
let simulationState = {
    isRunning: false,
    time: 0,
    powerInput: 100, // MW
    loadFactor: 100, // %
    targetPressure: 50, // bar
    mode: 'steady',
    
    // Current values
    h2Production: 1000, // kg/h
    temperature: 75.2, // °C
    powerConsumption: 52.3, // MW
    purity: 99.97, // %
    efficiency: 68.5, // %
    flowRate: 950, // kg/h
    cost: 285, // ₹/kg
    storageLevel: 75, // %
    storageAmount: 3750, // kg
    pressure: 50, // bar
    
    // Historical data for charts
    history: {
        time: [],
        power: [],
        production: [],
        efficiency: [],
        cost: []
    }
};

// Constants
const MAX_STORAGE = 5000; // kg
const ELECTROLYZER_EFFICIENCY = 0.65; // kWh/kg H2
const ENERGY_PER_KG = 55; // kWh/kg H2 (theoretical)

// DOM Elements
const powerInput = document.getElementById('power-input');
const loadFactor = document.getElementById('load-factor');
const targetPressure = document.getElementById('target-pressure');
const operatingMode = document.getElementById('operating-mode');

const powerValue = document.getElementById('power-value');
const loadValue = document.getElementById('load-value');
const pressureValue = document.getElementById('pressure-value');

const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

const simulationTime = document.getElementById('simulation-time');
const eventLog = document.getElementById('event-log-content');

// Simulation timer
let simulationInterval;

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    initializeCharts();
    updateDisplay();
    logEvent('System initialized - Ready for operation', 'info');
});

// ============================================
// CONTROL HANDLERS
// ============================================

function initializeControls() {
    // Power Input
    powerInput.addEventListener('input', (e) => {
        simulationState.powerInput = parseFloat(e.target.value);
        powerValue.textContent = e.target.value;
        if (simulationState.isRunning) {
            calculatePlantState();
            updateDisplay();
        }
    });
    
    // Load Factor
    loadFactor.addEventListener('input', (e) => {
        simulationState.loadFactor = parseFloat(e.target.value);
        loadValue.textContent = e.target.value;
        if (simulationState.isRunning) {
            calculatePlantState();
            updateDisplay();
        }
    });
    
    // Target Pressure
    targetPressure.addEventListener('input', (e) => {
        simulationState.targetPressure = parseFloat(e.target.value);
        pressureValue.textContent = e.target.value;
        if (simulationState.isRunning) {
            calculatePlantState();
            updateDisplay();
        }
    });
    
    // Operating Mode
    operatingMode.addEventListener('change', (e) => {
        simulationState.mode = e.target.value;
        logEvent(`Operating mode changed to: ${e.target.value.toUpperCase()}`, 'info');
        if (simulationState.isRunning) {
            calculatePlantState();
            updateDisplay();
        }
    });
    
    // Buttons
    startBtn.addEventListener('click', startSimulation);
    pauseBtn.addEventListener('click', pauseSimulation);
    resetBtn.addEventListener('click', resetSimulation);
}

// ============================================
// SIMULATION ENGINE
// ============================================

function startSimulation() {
    if (!simulationState.isRunning) {
        simulationState.isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        logEvent('Simulation STARTED', 'success');
        
        simulationInterval = setInterval(() => {
            simulationState.time += 1;
            
            // Add some realistic variability
            addVariability();
            
            // Calculate plant state
            calculatePlantState();
            
            // Update displays
            updateDisplay();
            updateTimeDisplay();
            
            // Update charts every 5 seconds
            if (simulationState.time % 5 === 0) {
                updateChartData();
            }
            
            // Check for alerts
            checkAlerts();
            
        }, 1000); // Update every second
    }
}

function pauseSimulation() {
    if (simulationState.isRunning) {
        simulationState.isRunning = false;
        clearInterval(simulationInterval);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        
        logEvent('Simulation PAUSED', 'warning');
    }
}

function resetSimulation() {
    pauseSimulation();
    
    // Reset state
    simulationState.time = 0;
    simulationState.powerInput = 100;
    simulationState.loadFactor = 100;
    simulationState.targetPressure = 50;
    simulationState.storageLevel = 75;
    simulationState.storageAmount = 3750;
    
    // Reset controls
    powerInput.value = 100;
    loadFactor.value = 100;
    targetPressure.value = 50;
    operatingMode.value = 'steady';
    
    powerValue.textContent = '100';
    loadValue.textContent = '100';
    pressureValue.textContent = '50';
    
    // Reset history
    simulationState.history = {
        time: [],
        power: [],
        production: [],
        efficiency: [],
        cost: []
    };
    
    // Clear event log
    eventLog.innerHTML = '<div class="log-entry log-info"><span class="log-time">00:00:00</span><span class="log-message">System RESET - Ready for operation</span></div>';
    
    // Reset charts
    productionChart.data.labels = [];
    productionChart.data.datasets[0].data = [];
    productionChart.data.datasets[1].data = [];
    productionChart.update();
    
    efficiencyChart.data.labels = [];
    efficiencyChart.data.datasets[0].data = [];
    efficiencyChart.data.datasets[1].data = [];
    efficiencyChart.update();
    
    // Recalculate and update
    calculatePlantState();
    updateDisplay();
    
    logEvent('System RESET - Ready for operation', 'info');
}

function calculatePlantState() {
    const power = simulationState.powerInput;
    const load = simulationState.loadFactor / 100;
    
    // H2 Production (simplified model)
    // ~10 kg/h per MW at 100% efficiency, adjusted for actual efficiency
    const baseProduction = power * load * 10;
    simulationState.h2Production = baseProduction * simulationState.efficiency / 100;
    
    // Power consumption (MW)
    simulationState.powerConsumption = power * load * 0.95; // 95% power conversion
    
    // Temperature (increases with load)
    const baseTemp = 65;
    simulationState.temperature = baseTemp + (load * 15) + (Math.random() * 2);
    
    // Efficiency (decreases slightly with higher load)
    const baseEfficiency = 70;
    simulationState.efficiency = baseEfficiency - (load * 5) + (Math.random() * 2);
    
    // Purity (very stable in real systems)
    simulationState.purity = 99.95 + (Math.random() * 0.04);
    
    // Flow rate (slightly less than production due to system dynamics)
    simulationState.flowRate = simulationState.h2Production * 0.95;
    
    // Cost (increases with lower efficiency and higher pressure)
    const baseCost = 250;
    const efficiencyFactor = (70 / simulationState.efficiency);
    const pressureFactor = 1 + (simulationState.targetPressure - 30) / 100;
    simulationState.cost = baseCost * efficiencyFactor * pressureFactor;
    
    // Storage (accumulation)
    const productionRate = simulationState.h2Production / 3600; // kg/s
    const storageIncrease = productionRate * 1; // per second
    simulationState.storageAmount = Math.min(
        simulationState.storageAmount + storageIncrease,
        MAX_STORAGE
    );
    simulationState.storageLevel = (simulationState.storageAmount / MAX_STORAGE) * 100;
    
    // Pressure tracking
    simulationState.pressure = simulationState.targetPressure + (Math.random() * 2 - 1);
}

function addVariability() {
    // Add realistic noise based on operating mode
    switch (simulationState.mode) {
        case 'variable':
            // More variability in variable load mode
            const variance = 10;
            simulationState.powerInput += (Math.random() * variance * 2 - variance);
            simulationState.powerInput = Math.max(20, Math.min(200, simulationState.powerInput));
            powerInput.value = Math.round(simulationState.powerInput);
            powerValue.textContent = Math.round(simulationState.powerInput);
            break;
            
        case 'optimized':
            // Optimize for cost - reduce power during expensive periods
            if (simulationState.time % 60 === 0) {
                const random = Math.random();
                if (random > 0.7) {
                    simulationState.powerInput *= 0.8;
                    powerInput.value = Math.round(simulationState.powerInput);
                    powerValue.textContent = Math.round(simulationState.powerInput);
                }
            }
            break;
            
        case 'carbon':
            // Maximize renewable usage
            if (simulationState.time % 60 === 0) {
                const random = Math.random();
                if (random > 0.5) {
                    simulationState.powerInput = Math.min(200, simulationState.powerInput * 1.1);
                    powerInput.value = Math.round(simulationState.powerInput);
                    powerValue.textContent = Math.round(simulationState.powerInput);
                }
            }
            break;
    }
}

function checkAlerts() {
    // Temperature alert
    if (simulationState.temperature > 85) {
        logEvent(`⚠️ High temperature detected: ${simulationState.temperature.toFixed(1)}°C`, 'warning');
        document.querySelector('#temp-value').parentElement.querySelector('.sensor-status').className = 'sensor-status status-warning';
        document.querySelector('#temp-value').parentElement.querySelector('.sensor-status').textContent = 'WARNING';
    } else {
        document.querySelector('#temp-value').parentElement.querySelector('.sensor-status').className = 'sensor-status status-normal';
        document.querySelector('#temp-value').parentElement.querySelector('.sensor-status').textContent = 'NORMAL';
    }
    
    // Storage full alert
    if (simulationState.storageLevel > 95) {
        logEvent(`⚠️ Storage nearly full: ${simulationState.storageLevel.toFixed(1)}%`, 'warning');
    }
    
    // Efficiency alert
    if (simulationState.efficiency < 60) {
        logEvent(`⚠️ Low efficiency: ${simulationState.efficiency.toFixed(1)}%`, 'warning');
    }
}

// ============================================
// DISPLAY UPDATES
// ============================================

function updateDisplay() {
    // Update SVG displays
    document.getElementById('power-input-display').textContent = `${simulationState.powerInput.toFixed(0)} MW`;
    document.getElementById('h2-production-display').textContent = `${simulationState.h2Production.toFixed(0)} kg/h`;
    document.getElementById('pressure-display').textContent = `${simulationState.pressure.toFixed(0)} bar`;
    document.getElementById('storage-level-display').textContent = `Level: ${simulationState.storageLevel.toFixed(0)}%`;
    document.getElementById('storage-amount-display').textContent = `${simulationState.storageAmount.toFixed(0)} kg`;
    
    // Update storage bar
    const storageBar = document.getElementById('storage-bar');
    storageBar.setAttribute('width', (70 * simulationState.storageLevel / 100).toString());
    
    // Update sensor cards
    document.getElementById('temp-value').textContent = `${simulationState.temperature.toFixed(1)}°C`;
    document.getElementById('power-consumption').textContent = `${simulationState.powerConsumption.toFixed(1)} MW`;
    document.getElementById('purity-value').textContent = `${simulationState.purity.toFixed(2)}%`;
    document.getElementById('efficiency-value').textContent = `${simulationState.efficiency.toFixed(1)}%`;
    document.getElementById('flow-value').textContent = `${simulationState.flowRate.toFixed(0)} kg/h`;
    document.getElementById('cost-value').textContent = `₹${simulationState.cost.toFixed(0)}/kg`;
}

function updateTimeDisplay() {
    const hours = Math.floor(simulationState.time / 3600);
    const minutes = Math.floor((simulationState.time % 3600) / 60);
    const seconds = simulationState.time % 60;
    
    simulationTime.textContent = `Time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function logEvent(message, type = 'info') {
    const hours = Math.floor(simulationState.time / 3600);
    const minutes = Math.floor((simulationState.time % 3600) / 60);
    const seconds = simulationState.time % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `
        <span class="log-time">${timeStr}</span>
        <span class="log-message">${message}</span>
    `;
    
    eventLog.insertBefore(logEntry, eventLog.firstChild);
    
    // Keep only last 50 entries
    while (eventLog.children.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
    }
}

// ============================================
// CHARTS
// ============================================

let productionChart;
let efficiencyChart;

function initializeCharts() {
    // Production Chart
    const ctxProduction = document.getElementById('production-chart').getContext('2d');
    productionChart = new Chart(ctxProduction, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Power Input (MW)',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'H₂ Production (kg/h)',
                    data: [],
                    borderColor: '#0891B2',
                    backgroundColor: 'rgba(8, 145, 178, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Power (MW)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Production (kg/h)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            }
        }
    });
    
    // Efficiency Chart
    const ctxEfficiency = document.getElementById('efficiency-chart').getContext('2d');
    efficiencyChart = new Chart(ctxEfficiency, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Efficiency (%)',
                    data: [],
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cost (₹/kg)',
                    data: [],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Efficiency (%)'
                    },
                    min: 50,
                    max: 80
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cost (₹/kg)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            }
        }
    });
}

function updateChartData() {
    const timeLabel = `${Math.floor(simulationState.time / 60)}m`;
    
    // Add data
    simulationState.history.time.push(timeLabel);
    simulationState.history.power.push(simulationState.powerInput.toFixed(1));
    simulationState.history.production.push(simulationState.h2Production.toFixed(0));
    simulationState.history.efficiency.push(simulationState.efficiency.toFixed(1));
    simulationState.history.cost.push(simulationState.cost.toFixed(0));
    
    // Keep only last 20 data points
    if (simulationState.history.time.length > 20) {
        simulationState.history.time.shift();
        simulationState.history.power.shift();
        simulationState.history.production.shift();
        simulationState.history.efficiency.shift();
        simulationState.history.cost.shift();
    }
    
    // Update production chart
    productionChart.data.labels = simulationState.history.time;
    productionChart.data.datasets[0].data = simulationState.history.power;
    productionChart.data.datasets[1].data = simulationState.history.production;
    productionChart.update('none'); // No animation for better performance
    
    // Update efficiency chart
    efficiencyChart.data.labels = simulationState.history.time;
    efficiencyChart.data.datasets[0].data = simulationState.history.efficiency;
    efficiencyChart.data.datasets[1].data = simulationState.history.cost;
    efficiencyChart.update('none');
}

// ============================================
// TEST SCENARIOS
// ============================================

function loadScenario(scenarioName) {
    logEvent(`Loading scenario: ${scenarioName.toUpperCase().replace('-', ' ')}`, 'info');
    
    switch (scenarioName) {
        case 'renewable-drop':
            // Simulate sudden renewable power drop
            simulationState.powerInput = 40;
            powerInput.value = 40;
            powerValue.textContent = '40';
            logEvent('⚡ Renewable power dropped to 40 MW - Testing response', 'warning');
            break;
            
        case 'peak-demand':
            // Simulate peak demand scenario
            simulationState.powerInput = 180;
            powerInput.value = 180;
            powerValue.textContent = '180';
            simulationState.loadFactor = 100;
            loadFactor.value = 100;
            loadValue.textContent = '100';
            logEvent('📈 Peak demand scenario - Maximum production mode', 'info');
            break;
            
        case 'emergency':
            // Simulate emergency shutdown
            pauseSimulation();
            simulationState.powerInput = 0;
            powerInput.value = 0;
            powerValue.textContent = '0';
            simulationState.loadFactor = 0;
            loadFactor.value = 0;
            loadValue.textContent = '0';
            logEvent('🚨 EMERGENCY SHUTDOWN initiated - All systems offline', 'error');
            break;
    }
    
    if (simulationState.isRunning) {
        calculatePlantState();
        updateDisplay();
    }
}
