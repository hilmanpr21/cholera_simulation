/**
 * Function to get get agent image source name based on infection and vaccination statu
 * @param {boolean} agentId - agent ID
 * @param {object} status - infection and vaccination status
 * @returns {string} - image source name
 */
function getAgentImageSource(agentId, status) {
    const index = agentId + 1;

    if (status.infected && status.vaccinated) {
        return `assets/figure_${index}_infected-vaccinated.PNG`;
    } else if (status.infected) {
        return `assets/figure_${index}_infected.PNG`;
    } else if (status.vaccinated) {
        return `assets/figure_${index}_vaccinated.PNG`;
    } else {
        return `assets/figure_${index}_normal.PNG`;
    }
}

/** 
 * setting a global AgentCharacterController object
 * 
 */
window.AgentCharacterController = {
    active: false,
    canvasId: null,
    simKey: null,
    characters: new Map()   // make a new map to store character data by agent ID
};

/**
 * Set to create character once
 */
function createAgentCharacter (agentId) {
    // create image element for the agent character
    const img = document.createElement('img');

    // set image attributes and styles
    img.className = 'agent-character';
    img.style.position = 'fixed'; // fixed to stay fix in the viewport
    img.style.width = '40px';
    img.style.pointers = 'none';
    img.style.transform = 'translate(-50%, -50%)'; // center the image on the position
    img.style.transition = 'transform 0.6s ease, width 1s ease-in-out, left 0.6s ease, top 0.6s ease'; // smooth movement
    img.style.display = 'none'; // hide initially

    // appened the crreated image element to the body
    document.body.appendChild(img);
    
    // return the created image element
    return img;
}

/**
 * function to update agent character positions
 */
function syncAgentCharacter() {
    // store global controller object in a variable
    const ctrl = window.AgentCharacterController;

    if (!ctrl.active) return; // exit if not active

    const sim = window.simulations?.[ctrl.simKey];
    if (!sim) return; // exit if simulation not found

    // get all agents from the simulation, will return array of agent objects
    const agents = sim.getAgents(); 
    const canvasId = ctrl.canvasId;

    // loop through each agent
    agents.forEach ((agent, index) => {
        if (index === 0) return; // skip main agent with ID 0 as it has been handled by the visual Anchor

        if (!agent.isActive) return; // skip inactive agents

        // Get existing character or create new one (will be reused across slides)
        let img = ctrl.characters.get(index);

        if (!img) {
            img = createAgentCharacter(index); // create character image element
            ctrl.characters.set(index, img); // store in the map
        }

        const pos = canvasToViewport(canvasId, agent.x, agent.y);  // convert canvas position to viewport position
        img.style.left = `${pos.x}px`;    // set left position
        img.style.top = `${pos.y}px`;     // set top position

        // set image source based on agent status. If the agent `isVaccinated` or `isInfected` it will store jst the status (`infected`, `vaccinated`, or `infected` and `vaccinated`). This will be used to contact the correct image source 
        img.src = getAgentImageSource(index, {
            infected: agent.isInfected,
            vaccinated: agent.isVaccinated
        });

        img.style.display = 'block'; // make sure the image is visible
    });
}

/**
 * function to setup character controller to follow simulation without animation transition
 */
function setCharacterModeFollow() {
    window.AgentCharacterController.characters.forEach(img => {
        img.classList.remove('mode-follow');
        img.classList.add('mode-slide');
    })
}

/**
 * function to set character to slide mode (smooth transition between slides)
 */
function setCharacterModeSlide() {
    window.AgentCharacterController.characters.forEach(img => {
        img.classList.remove('mode-follow');
        img.classList.add('mode-slide');
    });
}

/**
 * function to hide all agent characters
 */
function hideAllAgentCharacters() {
    window.AgentCharacterController.characters.forEach(img => {
        img.style.display = 'none';
    });
}

/**
 * function to show all agent characters
 */
function showAllAgentCharacters() {
    window.AgentCharacterController.characters.forEach(img => {
        img.style.display = 'block';
    });
}

/**
 * Animation loop to sync visual anchor and agent characters
 */
function agentCharacterLoop() {
    syncAgentCharacter();
    requestAnimationFrame(agentCharacterLoop);
}

/**
 * Start the agent character animation loop
 */
agentCharacterLoop();

window.setCharacterModeFollow = setCharacterModeFollow;
window.setCharacterModeSlide = setCharacterModeSlide;
window.hideAllAgentCharacters = hideAllAgentCharacters;
window.showAllAgentCharacters = showAllAgentCharacters;