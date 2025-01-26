// Utility functions
function displayProcedureStep(stepNumber, description, equation, result) {
    const procedureSteps = document.getElementById('procedureSteps');
    if (!procedureSteps) {
        console.error("Procedure steps element not found");
        return;
    }

    const step = document.createElement('div');
    step.className = 'procedure-step';
    
    step.innerHTML = `
        <div class="step-number">Step ${stepNumber}</div>
        <div class="step-description">${description}</div>
        ${equation ? `<div class="step-equation">${equation}</div>` : ''}
        ${result ? `<div class="step-result">${result}</div>` : ''}
    `;
    
    procedureSteps.appendChild(step);
}

function getInputUnit(inputId) {
    const units = {
        'flowRate': 'cfs',
        'bottomWidth': 'ft',
        'leftSlope': 'H:1V',
        'rightSlope': 'H:1V',
        'channelSlope': 'ft/ft'
    };
    return units[inputId] || '';
}

function handleInput(e) {
    const input = e.target;
    
    // Update value indicator
    const wrapper = input.closest('.input-wrapper');
    let indicator = wrapper.querySelector('.value-indicator');
    
    if (input.value) {
        const unit = getInputUnit(input.id);
        indicator.textContent = `${input.value} ${unit}`;
    } else {
        indicator.textContent = '';
    }
    
    // Update progress
    updateProgress();
}

function updateProgress() {
    const inputs = ['flowRate', 'bottomWidth', 'leftSlope', 'rightSlope', 'channelSlope'];
    const filledInputs = inputs.filter(id => 
        document.getElementById(id).value !== ''
    ).length;
    
    const progress = (filledInputs / inputs.length) * 100;
    document.getElementById('progress').style.width = `${progress}%`;
}

function validateInput(input) {
    const value = parseFloat(input.value);
    let isValid = true;
    let message = '';
    
    switch(input.id) {
        case 'flowRate':
            if (value <= 0) {
                isValid = false;
                message = 'Flow rate must be greater than 0';
            } else if (value > 1000) {
                isValid = false;
                message = 'Flow rate must be less than 1000 cfs';
            }
            break;
        case 'bottomWidth':
            if (value < 0) {
                isValid = false;
                message = 'Bottom width cannot be negative';
            } else if (value > 30) {
                isValid = false;
                message = 'Bottom width must be less than 30 ft';
            }
            break;
        case 'leftSlope':
        case 'rightSlope':
            if (value < 2) {
                isValid = false;
                message = 'Side slope should be at least 2:1';
            } else if (value > 6) {
                isValid = false;
                message = 'Side slope should not exceed 6:1';
            }
            break;
        case 'channelSlope':
            if (value < 0.001) {
                isValid = false;
                message = 'Channel slope should be at least 0.001';
            } else if (value > 0.1) {
                isValid = false;
                message = 'Channel slope should not exceed 0.1';
            }
            break;
    }

    if (!isValid) {
        input.classList.add('invalid');
        showStatus(message, 'error');
        setTimeout(() => input.classList.remove('invalid'), 500);
    } else {
        input.classList.remove('invalid');
    }
    
    return isValid;
}

function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.className = `status ${type}`;
    status.textContent = message;
    status.style.display = 'block';
    
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

// Button click handlers
function calculate() {
    try {
        console.log("Starting calculation function");
        
        // Clear previous results
        document.getElementById('resultsBody').innerHTML = '';
        document.getElementById('procedureSteps').innerHTML = '';
        
        // Get and validate inputs
        const inputs = ['flowRate', 'bottomWidth', 'leftSlope', 'rightSlope', 'channelSlope'];
        console.log("Checking inputs:", inputs);
        
        // Check if elements exist
        const allElementsExist = inputs.every(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element with id '${id}' not found`);
                return false;
            }
            return true;
        });

        if (!allElementsExist) {
            showStatus('Error: Some input elements are missing', 'error');
            return;
        }

        // Validate inputs
        const allValid = inputs.every(id => validateInput(document.getElementById(id)));
        
        if (!allValid) {
            showStatus('Please check input values', 'error');
            return;
        }

        // Get input values and check for NaN
        const Q = parseFloat(document.getElementById('flowRate').value);
        const b = parseFloat(document.getElementById('bottomWidth').value);
        const zL = parseFloat(document.getElementById('leftSlope').value);
        const zR = parseFloat(document.getElementById('rightSlope').value);
        const S = parseFloat(document.getElementById('channelSlope').value);

        console.log("Input values:", { Q, b, zL, zR, S });

        if (isNaN(Q) || isNaN(b) || isNaN(zL) || isNaN(zR) || isNaN(S)) {
            showStatus('Invalid input values detected', 'error');
            console.error("NaN values detected in inputs");
            return;
        }

        showStatus('Calculating...', 'success');

        // Constants
        const GRAVITY = 32.2;
        const WATER_UNIT_WEIGHT = 62.4;

        console.log("Starting iteration process");

        // Show initial parameters
        try {
            displayProcedureStep(
                1,
                'Initial Parameters',
                'Given:\n' +
                `Q = ${Q.toFixed(2)} cfs\n` +
                `b = ${b.toFixed(2)} ft\n` +
                `Left Slope = ${zL.toFixed(1)}` +
                `Right Slope = ${zR.toFixed(1)}` +
                `S = ${S.toFixed(4)} ft/ft\n`,
                'Begin iterative solution for normal depth'
            );
        } catch (error) {
            console.error("Error displaying initial step:", error);
            showStatus('Error displaying calculation steps', 'error');
            return;
        }

        // Iterative solution for normal depth
        let depth = 0.01; // Initial guess
        let iterations = 0;
        const maxIterations = 2000;
        const tolerance = 1;
        let converged = false;

        console.log("Starting with initial depth:", depth);

        while (iterations < maxIterations) {
            try {
                // Calculate geometric properties
                const area = (b * depth) + (zL * depth * depth / 2) + (zR * depth * depth / 2);
                const wettedPerimeter = b + depth * (Math.sqrt(1 + zL * zL) + Math.sqrt(1 + zR * zR));
                const hydraulicRadius = area / wettedPerimeter;
                const MANNINGS_N = Math.pow(hydraulicRadius,1/6) / (30.2 + 19.97*Math.log10(Math.pow(hydraulicRadius,1.4) * Math.pow(S,0.4)))
                // Manning's equation
                const computedFlow = (1.486 / MANNINGS_N) * area * Math.pow(hydraulicRadius, 2/3) * Math.sqrt(S);

                console.log(`Iteration ${iterations}:`, {
                    depth,
                    area,
                    wettedPerimeter,
                    hydraulicRadius,
                    computedFlow,
                    MANNINGS_N
                });

                if (iterations % 100 === 0) {
                    displayProcedureStep(
                        2,
                        `Trial ${iterations + 1}`,
                        'Manning\'s Equation:\n' +
                        `Q = (1.486/n)AR^(2/3)S^(1/2)\n` +
                        `A = ${area.toFixed(3)} ft²\n` +
                        `P = ${wettedPerimeter.toFixed(3)} ft\n` +
                        `R = ${hydraulicRadius.toFixed(3)} ft`,
                        `Computed Q = ${computedFlow.toFixed(3)} cfs\n` +
                        `Target Q = ${Q.toFixed(3)} cfs\n` +
                        `n = ${MANNINGS_N.toFixed(4)}` +
                        `Depth = ${depth.toFixed(3)} ft`
                    );
                }

                if (Math.abs(computedFlow - Q) <= tolerance) {
                    converged = true;
                    console.log("Solution converged!");
                    
                    // Calculate final parameters
                    const velocity = Q / area;
                    const topWidth = b + depth * (zL + zR);
                    const hydraulicDepth = area / topWidth;
                    const froudeNumber = velocity / Math.sqrt(GRAVITY * hydraulicDepth);
                    const shearStress = WATER_UNIT_WEIGHT * depth * S;

                    console.log("Final parameters:", {
                        velocity,
                        topWidth,
                        hydraulicDepth,
                        froudeNumber,
                        shearStress
                    });
                    
                    displayProcedureStep(
                        3,
                        'Final Results',
                        'V = Q/A\n' +
                        'Fr = V/√(gy)\n' +
                        'τ = γyS',
                        `Normal Depth = ${depth.toFixed(2)} ft\n` +
                        `Area = ${area.toFixed(2)} ft²\n` +
                        `Velocity = ${velocity.toFixed(2)} ft/s\n` +
                        `Froude Number = ${froudeNumber.toFixed(2)}\n` +
                        `Shear Stress = ${shearStress.toFixed(2)} lb/ft²`
                    );

                    // Display final results in table
                    const results = [
                        ['Normal Depth', depth.toFixed(2), 'ft'],
                        ['Flow Area', area.toFixed(2), 'ft²'],
                        ['n', MANNINGS_N.toFixed(4)],
                        ['Wetted Perimeter', wettedPerimeter.toFixed(2), 'ft'],
                        ['Hydraulic Radius', hydraulicRadius.toFixed(2), 'ft'],
                        ['Velocity', velocity.toFixed(2), 'ft/s'],
                        ['Froude Number', froudeNumber.toFixed(2), '-'],
                        ['Flow Regime', froudeNumber > 1 ? 'Supercritical' : 'Subcritical', '-'],
                        ['Shear Stress', shearStress.toFixed(2), 'lb/ft²']
                    ];

                    const resultsBody = document.getElementById('resultsBody');
                    if (!resultsBody) {
                        throw new Error("Results table body not found");
                    }

                    results.forEach((row, index) => {
                        const tr = document.createElement('tr');
                        tr.style.animationDelay = `${index * 0.1}s`;
                        tr.innerHTML = `
                            <td>${row[0]}</td>
                            <td>${row[1]}</td>
                            <td>${row[2]}</td>
                        `;
                        resultsBody.appendChild(tr);
                    });

                    break;
                }

                // Adjust depth based on comparison
                depth = depth + 0.01;
                iterations++;

            } catch (error) {
                console.error("Error in iteration:", error);
                showStatus('Error during calculations', 'error');
                return;
            }
        }

        if (!converged) {
            console.error("Failed to converge after", maxIterations, "iterations");
            showStatus('Solution did not converge. Please check inputs.', 'error');
        }

    } catch (error) {
        console.error("Calculation error:", error);
        showStatus('An error occurred during calculation', 'error');
    }
}

function clearAll() {
    // Clear inputs
    document.querySelectorAll('input').forEach(input => {
        input.value = '';
        input.classList.remove('invalid');
        const indicator = input.parentElement.querySelector('.value-indicator');
        if (indicator) indicator.textContent = '';
    });
    
    // Clear results
    document.getElementById('resultsBody').innerHTML = '';
    
    // Clear status
    const status = document.getElementById('status');
    status.style.display = 'none';
    
    // Reset progress bar
    document.getElementById('progress').style.width = '0%';
    
    // Focus first input
    document.getElementById('flowRate').focus();
}

function printResults() {
    // Add timestamp
    const timestamp = new Date().toLocaleString();
    const dateDiv = document.createElement('div');
    dateDiv.style.marginBottom = '20px';
    dateDiv.innerHTML = `Generated: ${timestamp}`;
    document.getElementById('results').prepend(dateDiv);

    // Print
    window.print();

    // Remove timestamp
    dateDiv.remove();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add input handlers
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', handleInput);
        input.addEventListener('change', () => validateInput(input));
    });

    // Initialize progress
    updateProgress();
});