/** 
 * setting a global AgentCharacterController object
 * This object will hold the state and data for managing agent characters in the simulation 
 */
window.AgentCharacterController = {
    active: false,
    canvasId: null,
    simKey: null,
    characters: new Map()   // make a new map to store character data by agent ID
};

/**
 * Function to get agent image source name based on infection and isolation status
 * @param {boolean} agentId - agent ID
 * @param {object} status - infection and vaccination status
 * @returns {string} - image source name
 */
function getAgentImageSource(agentId, status) {
    const index = agentId + 1;

    const lang = window.currentLanguage || 'english';

    // Define image folder paths for each language
    const imagePaths = {
        english: 'assets/english_figure_set',
        bangla: 'assets/bangla_figure_set',
        french: 'assets/french_figure_set'
    };

    let statusSuffix = 'normal';
    if (status.infected && status.isolated) {
        statusSuffix = 'infected_isolated';
    } else if (status.infected) {
        statusSuffix = 'infected';
    } else if (status.isolated) {
        statusSuffix = 'isolated';
    }

    return `${imagePaths[lang]}/figure_${index}_${statusSuffix}.PNG`;
}

/**
 * Set to create agent character image per agent ID
 * @param {number} agentId - agent ID
 * @returns {HTMLElement} - created image element
 */
function createAgentCharacter (agentId) {
    // create image element for the agent character
    const img = document.createElement('img');

    // set image attributes and styles
    img.className = 'agent-character';
    img.style.position = 'fixed'; // fixed to stay fix in the viewport
    img.style.width = '45px';
    img.style.pointers = 'none';
    img.style.transform = 'translate(-50%, -50%)'; // center the image on the position
    //img.style.transition = 'transform 0.6s ease, width 1s ease-in-out, left 0.6s ease, top 0.6s ease'; // smooth movement
    img.style.display = 'none'; // hide initially
    img.style.zIndex = '10'; // on top of other elements

    // appened the created image element to the body
    document.body.appendChild(img);
    
    // return the created image element
    return img;
}

/**
 * function to update agent character positions
 */
function syncAgentCharacter() {
    // store global controller object in a variable
    // will contain properties like active status, canvas ID, simulation key, and characters map
    const ctrl = window.AgentCharacterController;

    // check if simulation is inactive
    if (!ctrl.active) return;

    // get simulation object from the global simulations using the simKey
    // The simKey is set on the scroll_controller.js, it maps the current slide to the corresponding simulation. The value is a string representing the simulation key
    const sim = window.simulations?.[ctrl.simKey];
    if (!sim) return; // exit if simulation not found

    // get all agents from the simulation, will return array of agent objects
    const agents = sim.getAgents(); // each agent object contains properties like position (x, y), infection status, isolation status, etc.

    // get canvas ID from the controller
    const canvasId = ctrl.canvasId;

    // loop through each agent
    agents.forEach ((agent, index) => {
        if (index === 0) return; // skip main agent with ID 0 as it has been handled by the visual Anchor

        // Get existing character or create new one (will be reused across slides) so the character image elements are not recreated every frame
        // check if character image already exists in the window.AgentCharacterController.characters map
        let img = ctrl.characters.get(index);

        // if character image does not exist, create a new one and store it in the map
        if (!img) {
            img = createAgentCharacter(index); // create character image element
            ctrl.characters.set(index, img); // store in the map (key: agentId, value: <img>)
        }

        const pos = canvasToViewport(canvasId, agent.x, agent.y);  // convert canvas position to viewport position
        img.style.left = `${pos.x}px`;    // set left position
        img.style.top = `${pos.y}px`;     // set top position

        // set image source based on agent status. If the agent `isIsolated` or `isInfected` it will store jst the status (`infected`, `isolated`, or `infected` and `isolated`). This will be used to contact the correct image source 
        img.src = getAgentImageSource(index, {
            infected: agent.isInfected,     // get infection status, if 'agent.isInfected' is true, the agent is infected
            isolated: agent.isIsolated      // get isolation status, if 'agent.isIsolated' is true, the agent is isolated 
        });

        img.style.display = 'block'; // make sure the image is visible

        if (!agent.isActive) {
            // if agent is not active, hide the character image if it exists
            img.style.display = 'none';
            return; // skip to next agent
        }
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
        console.log('Hiding characters on slide');
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