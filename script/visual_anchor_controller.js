const visualAnchor = document.getElementById('anchor-image');

/**
 * Change visual anchor position to viewport coordinates
 * returns nothing, but change the visual anchor style left and top properties 
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
/*
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
*/

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
 * Create AnchorController, global object to manage visual anchor
 * @property {boolean} active - whether the anchor controller is active
 * @property {string} canvasId - ID of the canvas element to follow
 * @property {function} getAgentPosition - function to get agent position
 * @property {function} getAgentStatus - function to get agent status   
 */
window.AnchorController = {
    active: false,              // whether the anchor controller is active
    canvasId: null,             // ID of the canvas element to follow
    getAgentPosition: null,     // function to get agent position
    getAgentStatus: null,       // function to get agent status
}

/**
 * Function to sync visual anchor position with main agent position
 */
function syncVisualAnchor() {
    const AnchorController = window.AnchorController;   // get global AnchorController object and all the properties

    if (!AnchorController.active) return;     // exit if not active

    // if active, get agent position from the provided function
    const positions = AnchorController.getAgentPosition();

    // convert canvas position to viewport position, will return object with x and y properties
    const viewportPosition = canvasToViewport(AnchorController.canvasId, positions.x, positions.y);

    // move visual anchor to the calculated viewport position
    moveAnchorToViewport(viewportPosition.x, viewportPosition.y);

    // update visual anchor appearance based on agent status
    updateVisualAnchorVisual();
}

/** 
 * Update visual anchor status
 */
function updateVisualAnchorVisual() {
    const status = window.AnchorController.getAgentStatus?.();
    if (!status) return;

    if (status.infected && !status.vaccinated) {
        visualAnchor.src = 'assets/rafi_infected.PNG';
    } else if (!status.infected && status.vaccinated) {
        visualAnchor.src = 'assets/rafi_vaccinated.PNG';
    } else if (status.infected && status.vaccinated) {
        visualAnchor.src = 'assets/rafi_infected_vaccinated.PNG';
    } else {
        visualAnchor.src = 'assets/rafi_normal.PNG';
    }

    console.log('Anchor status updated:', status);
}

/**
 * Animation loop to continuously sync visual anchor position
 */
function anchorLoop() {
    window.syncVisualAnchor();   // call sync visual anchor function
    requestAnimationFrame(anchorLoop);   // request next animation frame
}
anchorLoop();   // start the anchor loop

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

// set initial visual anchor mode to slide
setAnchorModeSlide();

// initially show visual anchor
// showVisualAnchor();


// define API to be used in other scripts
window.syncVisualAnchor = syncVisualAnchor;         // function to sync visual anchor position
window.setAnchorModeSlide = setAnchorModeSlide;     // function to set visual anchor to slide mode
window.setAnchorModeFollow = setAnchorModeFollow;   // function to set visual anchor to follow mode