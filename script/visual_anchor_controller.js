const visualAnchor = document.getElementById('anchor-image');

/**
 * Change visual anchor position to viewport coordinates
 * retunrns nothing, but change the visual anchor style left and top properties 
 * @param {rtu} x 
 * @param {*} y 
 */
function moveAnchorToViewport(x, y) {
    // Update the position of the visual anchor
    visualAnchor.style.left = `${x}px`;
    visualAnchor.style.top = `${y}px`;
}

/**
 * Function to move visual anchor to canvas coordinates
 * convert canvas position to viewport position
 * @param {string} canvasId - ID of the canvas element
 * @param {number} offsetX - x offset in canvas space
 * @param {number} offsetY - y offset in canvas space
 */
function moveAnchorToCanvas(canvasId, offsetX=0, offsetY=0) {
    const canvas = document.getElementById(canvasId);
    
    // get canvas position and size
    const rect = canvas.getBoundingClientRect();

    // calculate center of the canvas
    const x = rect.left + offsetX;
    const y = rect.top + rect.height / 2 + offsetY;

    // move visual anchor to the calculated viewport position
    // calling moveAnchorToViewport function
    moveAnchorToViewport(x, y);
}

/**
 * Hide the visual anchor before slide 2
 */
function hideVisualAnchor() {
    // Add hidden class to the visual anchor
    visualAnchor.classList.add('hidden');
}

/**
 * Show the visual anchor at its current position
 */
function showVisualAnchor() {
    // Remove hidden class from the visual anchor
    visualAnchor.classList.remove('hidden');
}

/** 
 * Responsizeve scalling to move canvas coordiante position to viewport position
 * convet canvas x,y coordiantes to viewport x,y
 * @param {string} canvasID - ID of the canvas element
 * @param {number} x - x coordinate in canvas space
 * @param {number} y - y coordinate in canvas space
 * @returns {object} - object with x and y properties in viewport space
 */
function canvasToViewport(canvasID, x, y) {
    // get canvas element by ID
    const canvas = document.getElementById(canvasID);

    // get canvas element rectangle size and position
    // return with values: top, left, right, bottom, width, height
    const rect = canvas.getBoundingClientRect();

    // Calculate scale factor between canvas and viewport
    // rect.width = canvas displayed width in viewport
    // canvas.width = canvas internal drawing width
    // rectangle size and canvas size may differ due to responsive scaling of the canvas element
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    return {
        // return x and ya scaled position in viewport coordinates
        x: rect.left + x * scaleX,
        y: rect.top + y * scaleY
    }
}



/**
 * function to update visual anchor position to follow simulation 1
 */
function syncVisualanchorWithSimulation1() {
    if (!window.followSimulation1) return;     // exit if not following simulation 1

    const positions = window.sim1Agent.getAgentPosition(); // getting agent (visual anchor) position in the simulation
    const viewportPos = canvasToViewport('choleraSim1', positions.x, positions.y-12);

    // move visual anchor to the calculated viewport position
    moveAnchorToViewport(viewportPos.x, viewportPos.y);

    // update visual anchor appearance based on agent status
    updateVisualAnchorVisual();
}

/** 
 * Update visual anchor status
 */
function updateVisualAnchorVisual() {
    if (window.sim1Agent.isInfected()) {
        visualAnchor.src = 'assets/rafi_infected.PNG';
    } else {
        visualAnchor.src = 'assets/rafi_normal.PNG';
    }
}

/**
 * 
 */
function setAnchorModeSlide() {
    visualAnchor.classList.remove('mode-follow');
    visualAnchor.classList.add('mode-slide');
}

function setAnchorModeFollow() {
    visualAnchor.classList.remove('mode-slide');
    visualAnchor.classList.add('mode-follow');
}

setAnchorModeSlide();

showVisualAnchor();

// define API to be used in other scripts
window.syncVisualanchorWithSimulation1 = syncVisualanchorWithSimulation1;     // function to sync visual anchor position with simulation 1
window.followSimulation1 = false; // global variable to control whether to follow simulation 1
window.setAnchorModeSlide = setAnchorModeSlide;     // function to set visual anchor to slide mode
window.setAnchorModeFollow = setAnchorModeFollow;  // function to set visual anchor to follow mode