// Simulation State
let state = {
    running: false,
    time: 0,
    solar: 60,
    wind: 40,
    grid: 0,
    load: 80,
    mode: 'optimal',
    operatingHours: 0,
    degradation: 0,
    alarms: [],
    // NEW: AI Features
    importedData: null,
    dataHistory: [],
    anomalyThreshold: 0.7
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

    // NEW: Data Import Handler
    document.getElementById('load-data-btn').addEventListener('click', handleDataUpload);

    
}

// Run Simulation
function runSimulation() {
    if (state.running) return;
    
    state.running = true;
    addLog('✅ Simulation STARTED');
    
    interval = setInterval(() => {
        state.time++;
        state.operatingHours = state.time / 3600;
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

    // NEW: Professional calculations
    
    // Water consumption
    const waterConsumption = calculateWaterConsumption(h2Production);
    document.getElementById('water-consumption').textContent = (waterConsumption / h2Production).toFixed(1) + ' L/kg';
    
    // Waste heat
    const wasteHeat = calculateWasteHeat(totalPower, h2Production / 1000); // Convert kg to tonnes
    document.getElementById('waste-heat').textContent = wasteHeat.toFixed(1) + ' MW';
    
    // LCOH
    const lcohData = calculateLCOH(totalPower, h2Production, efficiency);
    document.getElementById('lcoh').textContent = '₹' + lcohData.lcoh.toFixed(0) + '/kg';
    
    // LCOH Breakdown
    document.getElementById('elec-percent').textContent = lcohData.breakdown.electricity.toFixed(0) + '%';
    document.getElementById('water-percent').textContent = lcohData.breakdown.water.toFixed(0) + '%';
    document.getElementById('maint-percent').textContent = lcohData.breakdown.maintenance.toFixed(0) + '%';
    document.getElementById('labor-percent').textContent = lcohData.breakdown.labor.toFixed(0) + '%';
    
    // Equipment health
    const degradation = calculateDegradation(state.operatingHours);
    const health = 100 - degradation;
    document.getElementById('equipment-health').textContent = health.toFixed(1) + '%';
    
    let healthStatus = '(Excellent)';
    if (health < 90) healthStatus = '(Good)';
    if (health < 85) healthStatus = '(Fair)';
    if (health < 80) healthStatus = '(Poor)';
    document.getElementById('health-status').textContent = healthStatus;
    
    // Operating hours
    document.getElementById('op-hours').textContent = state.operatingHours.toFixed(1);
    
    // Safety alarms
    const purity = parseFloat(document.getElementById('carbon').textContent);
    const alarms = checkSafetyAlarms(temp, pressure, purity, efficiency);
    updateAlarmDisplay(alarms);
    
    // Status indicators
    updateStatusIndicators(temp, pressure, efficiency);

    // NEW: AI Features Integration
    
    // Get current values
    const currentTemp = parseFloat(document.getElementById('temp').textContent);
    const currentPressure = parseFloat(document.getElementById('stack-pressure').textContent);
    const currentFlow = parseFloat(document.getElementById('flow').textContent);
    const currentPurity = 99.97; // From display
    
    // Store data history (for anomaly detection)
    state.dataHistory.push({
        time: state.time,
        temp: currentTemp,
        pressure: currentPressure,
        efficiency: efficiency,
        flow: currentFlow
    });
    
    // Keep only last 50 data points
    if (state.dataHistory.length > 50) {
        state.dataHistory.shift();
    }
    
    // Run anomaly detection (only if simulation running)
    if (state.running) {
        const anomalyResult = detectAnomalies(
            currentTemp,
            currentPressure,
            efficiency,
            currentFlow,
            currentPurity
        );
        updateAnomalyDisplay(anomalyResult);
    }
    
    // Generate optimization recommendation (every 5 seconds)
    if (state.time % 5 === 0 && state.running) {
        const recommendation = generateOptimizationRecommendation({
            solar: state.solar,
            wind: state.wind,
            grid: state.grid,
            load: state.load,
            efficiency: efficiency,
            cost: cost,
            carbon: parseFloat(document.getElementById('carbon').textContent)
        });
        updateOptimizationDisplay(recommendation);
    }
}

// ========================================
// NEW PROFESSIONAL CALCULATIONS
// ========================================

function calculateWaterConsumption(h2Production) {
    // Stoichiometric: 9 kg water per kg H2
    // Real systems: 95% efficiency
    const theoretical = h2Production * 9;
    const actual = theoretical / 0.95;
    return actual; // L/hr (assuming 1 kg = 1 L for water)
}

function calculateWasteHeat(powerIn, h2Production) {
    // Energy balance: Power in - H2 energy out = Waste heat
    const h2Energy = h2Production * 33.3; // kWh/kg (LHV)
    const wasteHeat = powerIn - h2Energy;
    return Math.max(0, wasteHeat); // MW
}

function calculateLCOH(totalPower, h2Production, efficiency) {
    // Simplified LCOH calculation
    
    // CAPEX (one-time costs spread over lifetime)
    const electrolyzerCAPEX = 100 * 80000; // 100 MW × ₹80k/kW
    const bopCAPEX = electrolyzerCAPEX * 0.4;
    const totalCAPEX = electrolyzerCAPEX + bopCAPEX;
    
    // Annual costs
    const hoursPerYear = 8760;
    const electricityCost = totalPower * hoursPerYear * 4.5; // ₹4.5/kWh
    const waterCost = h2Production * 9.5 * 365 * 24 * 0.05; // ₹0.05/L
    const maintenanceCost = totalCAPEX * 0.03; // 3% of CAPEX
    const laborCost = 5 * 800000; // 5 operators
    
    const totalOPEX = electricityCost + waterCost + maintenanceCost + laborCost;
    
    // LCOH (simplified - 20 year lifetime, 8% discount rate)
    const annualProduction = h2Production * hoursPerYear;
    const annualizedCAPEX = totalCAPEX * 0.1; // Simplified
    const lcoh = (annualizedCAPEX + totalOPEX) / annualProduction;
    
    // Breakdown percentages
    const breakdown = {
        electricity: (electricityCost / totalOPEX) * 100,
        water: (waterCost / totalOPEX) * 100,
        maintenance: (maintenanceCost / totalOPEX) * 100,
        labor: (laborCost / totalOPEX) * 100
    };
    
    return { lcoh, breakdown };
}

function calculateDegradation(operatingHours) {
    // Stack degrades 0.5% per 1000 hours
    const degradationPercent = (operatingHours / 1000) * 0.5;
    return Math.min(degradationPercent, 10); // Cap at 10%
}

function checkSafetyAlarms(temp, pressure, purity, efficiency) {
    let alarms = [];
    
    // Temperature alarms
    if (temp > 90) {
        alarms.push({
            level: 'critical',
            message: '🔥 CRITICAL: Stack temperature exceeds 90°C - Immediate shutdown required',
            param: 'temperature'
        });
    } else if (temp > 85) {
        alarms.push({
            level: 'warning',
            message: '⚠️ WARNING: Stack temperature above 85°C - Reduce load',
            param: 'temperature'
        });
    }
    
    // Pressure alarms
    if (pressure > 40) {
        alarms.push({
            level: 'critical',
            message: '🔥 CRITICAL: Stack pressure exceeds safe limit',
            param: 'pressure'
        });
    } else if (pressure > 35) {
        alarms.push({
            level: 'warning',
            message: '⚠️ WARNING: Stack pressure approaching limit',
            param: 'pressure'
        });
    }
    
    // Purity alarms
    if (purity < 99.5) {
        alarms.push({
            level: 'critical',
            message: '🔥 CRITICAL: H₂ purity below specification',
            param: 'purity'
        });
    } else if (purity < 99.9) {
        alarms.push({
            level: 'warning',
            message: '⚠️ WARNING: H₂ purity trending low',
            param: 'purity'
        });
    }
    
    // Efficiency alarms
    if (efficiency < 60) {
        alarms.push({
            level: 'warning',
            message: '⚠️ WARNING: System efficiency below target',
            param: 'efficiency'
        });
    }
    
    return alarms;
}

function updateAlarmDisplay(alarms) {
    const alarmCount = document.getElementById('alarm-count');
    const alarmPanel = document.getElementById('alarm-panel');
    
    // Update count
    alarmCount.textContent = alarms.length;
    
    if (alarms.length > 0) {
        alarmCount.classList.add('has-alarms');
    } else {
        alarmCount.classList.remove('has-alarms');
    }
    
    // Update alarm list
    if (alarms.length === 0) {
        alarmPanel.innerHTML = '<div class="alarm-item alarm-info">✅ All systems normal</div>';
    } else {
        alarmPanel.innerHTML = alarms.map(alarm => 
            `<div class="alarm-item alarm-${alarm.level}">${alarm.message}</div>`
        ).join('');
    }
}

function updateStatusIndicators(temp, pressure, efficiency) {
    // Temperature status
    const tempStatus = document.getElementById('temp-status');
    if (temp > 85) {
        tempStatus.textContent = '● Critical';
        tempStatus.className = 'status-indicator status-critical';
    } else if (temp > 80) {
        tempStatus.textContent = '● Warning';
        tempStatus.className = 'status-indicator status-warning';
    } else {
        tempStatus.textContent = '● Normal';
        tempStatus.className = 'status-indicator status-normal';
    }
    
    // Pressure status
    const pressureStatus = document.getElementById('pressure-status');
    const pressureVal = parseFloat(document.getElementById('stack-pressure').textContent);
    if (pressureVal > 35) {
        pressureStatus.textContent = '● Warning';
        pressureStatus.className = 'status-indicator status-warning';
    } else {
        pressureStatus.textContent = '● Normal';
        pressureStatus.className = 'status-indicator status-normal';
    }
    
    // Efficiency status
    const effStatus = document.getElementById('eff-status');
    if (efficiency < 60) {
        effStatus.textContent = '● Poor';
        effStatus.className = 'status-indicator status-warning';
    } else if (efficiency > 68) {
        effStatus.textContent = '● Optimal';
        effStatus.className = 'status-indicator status-optimal';
    } else {
        effStatus.textContent = '● Normal';
        effStatus.className = 'status-indicator status-normal';
    }
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

// ========================================
// CSV DATA IMPORT
// ========================================

function handleDataUpload() {
    const fileInput = document.getElementById('csv-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        showDataStatus('Please select a CSV file', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const data = parseCSV(text);
            
            state.importedData = data;
            showDataStatus(`✅ Loaded ${data.length} data points`, 'success');
            addLog('CSV data imported successfully');
            
            // Analyze imported data
            analyzeImportedData(data);
            
        } catch (error) {
            showDataStatus('❌ Error parsing CSV: ' + error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = parseFloat(values[index]) || values[index];
        });
        
        data.push(row);
    }
    
    return data;
}

function showDataStatus(message, type) {
    const statusDiv = document.getElementById('data-status');
    statusDiv.textContent = message;
    statusDiv.className = 'data-status ' + type;
}

function analyzeImportedData(data) {
    if (data.length === 0) return;
    
    // Calculate statistics
    const temps = data.map(d => d.Temperature || d.Stack_Temp_C || 75);
    const avgTemp = temps.reduce((a,b) => a+b, 0) / temps.length;
    
    addLog(`Analyzed data: Avg Temperature = ${avgTemp.toFixed(1)}°C`);
}
// ========================================
// ANOMALY DETECTION SYSTEM
// ========================================

function detectAnomalies(temp, pressure, efficiency, flow, purity) {
    // Calculate anomaly score based on parameter deviations
    
    // Define normal ranges
    const normalRanges = {
        temp: { min: 65, max: 80, ideal: 72 },
        pressure: { min: 20, max: 32, ideal: 28 },
        efficiency: { min: 65, max: 75, ideal: 70 },
        flow: { min: 800, max: 2000, ideal: 1200 },
        purity: { min: 99.9, max: 100, ideal: 99.97 }
    };
    
    // Calculate deviation scores (0 = normal, 1 = extreme anomaly)
    const scores = {
        temp: calculateDeviation(temp, normalRanges.temp),
        pressure: calculateDeviation(pressure, normalRanges.pressure),
        efficiency: calculateDeviation(efficiency, normalRanges.efficiency),
        flow: calculateDeviation(flow, normalRanges.flow),
        purity: calculateDeviation(purity, normalRanges.purity)
    };
    
    // Overall anomaly score (weighted average)
    const overallScore = (
        scores.temp * 0.3 +
        scores.pressure * 0.25 +
        scores.efficiency * 0.2 +
        scores.flow * 0.15 +
        scores.purity * 0.1
    );
    
    // Identify which parameters are anomalous
    const anomalousParams = [];
    if (scores.temp > 0.5) anomalousParams.push({ name: 'Temperature', score: scores.temp, value: temp });
    if (scores.pressure > 0.5) anomalousParams.push({ name: 'Pressure', score: scores.pressure, value: pressure });
    if (scores.efficiency > 0.5) anomalousParams.push({ name: 'Efficiency', score: scores.efficiency, value: efficiency });
    if (scores.flow > 0.5) anomalousParams.push({ name: 'Flow Rate', score: scores.flow, value: flow });
    if (scores.purity > 0.5) anomalousParams.push({ name: 'Purity', score: scores.purity, value: purity });
    
    return {
        score: overallScore,
        isAnomaly: overallScore > state.anomalyThreshold,
        anomalousParams: anomalousParams,
        allScores: scores
    };
}

function calculateDeviation(value, range) {
    // Returns 0-1 score: 0 = within range, 1 = extreme deviation
    
    if (value >= range.min && value <= range.max) {
        // Within range - check how far from ideal
        const distanceFromIdeal = Math.abs(value - range.ideal);
        const rangeWidth = range.max - range.min;
        return Math.min((distanceFromIdeal / rangeWidth) * 0.5, 0.5);
    } else {
        // Outside range - calculate how far outside
        if (value < range.min) {
            const deviation = range.min - value;
            return Math.min(0.5 + (deviation / range.min) * 0.5, 1.0);
        } else {
            const deviation = value - range.max;
            return Math.min(0.5 + (deviation / range.max) * 0.5, 1.0);
        }
    }
}

function updateAnomalyDisplay(anomalyResult) {
    const indicator = document.getElementById('anomaly-indicator');
    const scoreDisplay = document.getElementById('anomaly-score');
    const scoreFill = document.getElementById('score-fill');
    const details = document.getElementById('anomaly-details');
    
    // Update score
    scoreDisplay.textContent = anomalyResult.score.toFixed(2);
    scoreFill.style.width = (anomalyResult.score * 100) + '%';
    
    // Update status
    if (anomalyResult.isAnomaly) {
        indicator.textContent = '⚠️ ANOMALY DETECTED';
        indicator.className = 'status-indicator-ai anomaly-detected';
        
        // Show details
        let detailsHTML = '<strong>Anomalous Parameters:</strong><br>';
        anomalyResult.anomalousParams.forEach(param => {
            detailsHTML += `• ${param.name}: ${param.value.toFixed(1)} (Score: ${param.score.toFixed(2)})<br>`;
        });
        
        if (anomalyResult.anomalousParams.length === 0) {
            detailsHTML += 'Multiple parameters showing unusual patterns';
        }
        
        details.innerHTML = detailsHTML;
        
        // Log anomaly
        addLog('🔍 Anomaly detected - Score: ' + anomalyResult.score.toFixed(2), 'warning');
        
    } else {
        indicator.textContent = '● NORMAL';
        indicator.className = 'status-indicator-ai';
        details.textContent = 'All parameters within normal range';
    }
}
// ========================================
// AI OPTIMIZATION ADVISOR
// ========================================

function generateOptimizationRecommendation(currentState) {
    const { solar, wind, grid, load, efficiency, cost, carbon } = currentState;
    
    const totalPower = solar + wind + grid;
    const renewablePercent = ((solar + wind) / totalPower) * 100;
    
    // Decision tree logic for optimization
    let recommendation = null;
    
    // Scenario 1: High grid usage - expensive
    if (grid > 30 && (solar + wind) > 50) {
        const suggestedLoad = Math.floor(load * 0.85);
        const expectedCost = cost * 0.88;
        const expectedCarbon = carbon * 0.75;
        
        recommendation = {
            action: `Reduce load to ${suggestedLoad}%`,
            reason: 'High grid cost detected. Abundant renewable available.',
            currentMetrics: { load, cost, carbon, renewablePercent },
            expectedMetrics: {
                load: suggestedLoad,
                cost: expectedCost,
                carbon: expectedCarbon,
                renewablePercent: 95
            },
            savings: {
                daily: 18500,
                annual: 67.5
            },
            type: 'cost-reduction'
        };
    }
    // Scenario 2: Low renewable, high load - efficiency issue
    else if (renewablePercent < 60 && load > 85) {
        const suggestedLoad = 75;
        const expectedEfficiency = efficiency + 1.5;
        const expectedCost = cost * 0.93;
        
        recommendation = {
            action: `Reduce load to ${suggestedLoad}%`,
            reason: 'Low renewable availability. Reduce load for better efficiency.',
            currentMetrics: { load, efficiency, cost, renewablePercent },
            expectedMetrics: {
                load: suggestedLoad,
                efficiency: expectedEfficiency,
                cost: expectedCost,
                renewablePercent: renewablePercent
            },
            savings: {
                daily: 12000,
                annual: 43.8
            },
            type: 'efficiency-optimization'
        };
    }
    // Scenario 3: Good renewable, low load - increase production
    else if (renewablePercent > 85 && load < 75 && (solar + wind) > 100) {
        const suggestedLoad = Math.min(load + 15, 95);
        const expectedProduction = 1600;
        const expectedCarbon = carbon * 0.9;
        
        recommendation = {
            action: `Increase load to ${suggestedLoad}%`,
            reason: 'Excellent renewable availability. Maximize green production.',
            currentMetrics: { load, carbon, renewablePercent },
            expectedMetrics: {
                load: suggestedLoad,
                production: expectedProduction,
                carbon: expectedCarbon,
                renewablePercent: renewablePercent
            },
            savings: {
                daily: -5000,
                annual: -18.3
            },
            benefit: 'Increased production: +250 kg/hr H₂',
            type: 'production-maximization'
        };
    }
    // Scenario 4: Optimal - maintain current
    else {
        recommendation = {
            action: 'Maintain current operation',
            reason: 'System operating optimally for current conditions.',
            currentMetrics: { load, efficiency, cost, carbon, renewablePercent },
            expectedMetrics: null,
            savings: null,
            type: 'optimal'
        };
    }
    
    return recommendation;
}

function updateOptimizationDisplay(recommendation) {
    const header = document.getElementById('rec-header');
    const content = document.getElementById('rec-content');
    const impact = document.getElementById('rec-impact');
    
    if (!recommendation) {
        header.textContent = '🤖 Analyzing...';
        content.textContent = 'Waiting for sufficient data';
        impact.innerHTML = '';
        return;
    }
    
    // Update header
    header.textContent = '💡 ' + recommendation.action;
    
    // Update content
    let contentHTML = `<strong>Reason:</strong> ${recommendation.reason}<br><br>`;
    
    if (recommendation.type !== 'optimal') {
        contentHTML += '<strong>Current:</strong> ';
        contentHTML += `Load ${recommendation.currentMetrics.load}% | `;
        contentHTML += `Cost ₹${recommendation.currentMetrics.cost.toFixed(0)}/kg | `;
        contentHTML += `Renewable ${recommendation.currentMetrics.renewablePercent.toFixed(0)}%`;
    } else {
        contentHTML += 'All metrics within optimal range. No changes recommended.';
    }
    
    content.innerHTML = contentHTML;
    
    // Update impact
    if (recommendation.expectedMetrics && recommendation.type !== 'optimal') {
        const costChange = ((recommendation.expectedMetrics.cost - recommendation.currentMetrics.cost) / recommendation.currentMetrics.cost * 100);
        const carbonChange = recommendation.expectedMetrics.carbon ? 
            ((recommendation.expectedMetrics.carbon - recommendation.currentMetrics.carbon) / recommendation.currentMetrics.carbon * 100) : 0;
        
        impact.innerHTML = `
            <div class="impact-item">
                <div class="impact-label">Cost Impact</div>
                <div class="impact-value">₹${recommendation.expectedMetrics.cost.toFixed(0)}/kg</div>
                <div class="impact-change ${costChange < 0 ? 'positive' : 'negative'}">
                    ${costChange > 0 ? '+' : ''}${costChange.toFixed(1)}%
                </div>
            </div>
            <div class="impact-item">
                <div class="impact-label">Daily Savings</div>
                <div class="impact-value">₹${Math.abs(recommendation.savings.daily).toLocaleString()}</div>
                <div class="impact-change ${recommendation.savings.daily > 0 ? 'positive' : 'negative'}">
                    Annual: ₹${Math.abs(recommendation.savings.annual).toFixed(1)}L
                </div>
            </div>
            <div class="impact-item">
                <div class="impact-label">Carbon Impact</div>
                <div class="impact-value">${recommendation.expectedMetrics.carbon ? recommendation.expectedMetrics.carbon.toFixed(2) : 'N/A'}</div>
                <div class="impact-change ${carbonChange < 0 ? 'positive' : 'negative'}">
                    ${carbonChange !== 0 ? (carbonChange > 0 ? '+' : '') + carbonChange.toFixed(1) + '%' : 'No change'}
                </div>
            </div>
        `;
    } else {
        impact.innerHTML = '';
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
