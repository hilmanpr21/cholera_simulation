const visualAnchor = document.getElementById('anchor-image');

function moveAnchorToViewport(x, y) {
    // Update the position of the visual anchor
    visualAnchor.style.left = `${x}px`;
    visualAnchor.style.top = `${y}px`;
}

/**
 * Function to move visual anchor to canvas coordinates
 * convert canvas position to viewport position
 */
function moveAnchorToCanvas(canvasId, offsetX=0, offsetY=0) {
    const canvas = document.getElementById(canvasId);
    
    // get canvas position and size
    const rect = canvas.getBoundingClientRect();

    // calculate center of the canvas
    const x = rect.left + offsetX;
    const y = rect.top + rect.height / 2 + offsetY;

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