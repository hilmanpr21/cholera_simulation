(function () {
    /**
     * Initialise the canvas context
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('choleraSim5');
    const ctx = canvas.getContext('2d');            // 2D canvas context

    // set canvas internal resolution
    canvas.width = 600;   // Internal resolution
    canvas.height = 400;  // Internal resolution

    /**
     * Timestamp of the last animation frame (in milliseconds)
     * Used for calculating delta time between frames
     * @type {number}
     */
    // declare beginning last timestamp for delta time calculation to calculate howlong the simulation has been running
    let lastTimestamp = 0;

    /**
     * Tracks current day to detect day changes
     * @type {number}
     */
    let previousDay = 0;

    /**
     * Time system for simulation scheduling with configurable granularity
     * Tracks simulation time in abstract units that map to hours and days
     * @type {{scheduleStartTime: number, currentSimulationTime: number, timeScale: number, currentDay: number}}
     * @property {number} scheduleStartTime - Hour to start the day (8am)
     * @property {number} currentSimulationTime - Elapsed time in real seconds
     * @property {number} timeScale - How many simulated hours pass per real second
     * @property {number} currentDay - Current day counter
     */
    const timeManager = {
        scheduleStartTime: 8,           // Start at 8:00 AM
        currentSimulationTime: 0,       // Elapsed time in seconds when  the simulation start running
        timeScale: 2,                   // 2 simulated hours per real second (adjustable)
        currentDay: 0,                  // initial simulation start at day 0                      
    }

    /** 
     * Get Current hour of the day (0-23 hours)
     * @param {Object} timeManager - the time manager object
     * @returns {number} - current hour in 24-hour format
     */
    function getCurrentHour(timeManager) {
        const totalHours = timeManager.currentSimulationTime * timeManager.timeScale;
        return Math.floor(totalHours + timeManager.scheduleStartTime) % 24;   // modulo 24 to wrap around after 23
    }

    /**
     * Get current day number 
     * @param {object} timeManager - the time manager object
     * @returns {number} - current day number
     */ 
    function getCurrentDay(timeManager) {
        const totalHours = timeManager.currentSimulationTime * timeManager.timeScale;
        return Math.ceil((totalHours + timeManager.scheduleStartTime) / 24);        // calculate day number based on total hours
    }

    /** 
     * get Formatted time string (HH:MM) for display
     * @param {object} timeManager - the time manager object
     * @returns {string} - formatted time string
     */
    function getTimeString(timeManager) {
        const hour = getCurrentHour(timeManager);
        return `${hour.toString().padStart(2, '0')}:00`
    }

    /**
     * update time indicators bar position based on current simulation time
     * make the bar head running following the time scalling
     * @returns {void}
     */
    function updateTimeIndicator() {
        const currentHour = getCurrentHour(timeManager);      // get current hour by calling the function getCurrentHour and timeManager object

        // calculate percentage position (0-100%) of the time indicator based on current hour (0-23)
        const percentage = (currentHour / 24) * 100;

        // update indicator position
        const indicatorHour = document.getElementById('sim5-time-indicator');
        if (indicatorHour) {
            indicatorHour.style.left = `${percentage}%`;            // set left position based on percentage
        }

        // update time display
        const timeDisplay = document.getElementById('sim5-current-time');
        if (timeDisplay) {
            timeDisplay.textContent = getTimeString(timeManager);
        }

        // update DAY display
        const dayDisplay = document.getElementById('sim5-current-day');
        if (dayDisplay) {
            dayDisplay.textContent = getCurrentDay(timeManager);
        }
    }

    /**
     * Update Simulation time manager to update the currentSimulationTime (total hour simulation has been running) and currentDay (how many day simulation has been running) based on elapsed time
     * @param {object} timeManager - the time manager object
     * @param {number} deltaTime - time elapsed since last update in milliseconds
     * @returns {void}
     */
    function updateTimeManager(timeManager, deltaTime) {
        timeManager.currentSimulationTime += deltaTime / 1000;          // convert ms to seconds
        timeManager.currentDay = getCurrentDay(timeManager);            // update the property for current day
    }

    /** 
     * reset the time manager to initial state
     * @param {object} timeManager - the time manager object
     * @returns {void}
     */
    function resetTimeManager(timeManager) {
        timeManager.currentSimulationTime = 0;
        timeManager.currentDay = 0;
    }


    /**
     * Number of agents per community
     */
    const AGENTS_PER_COMMUNITY = 10  // number of agent per community

    /**
     * Define community positions
     * @type {Array<{x: number, y: number, id: number}>}
     */
    const communitiesPositions = [
        {x:  canvas.width * 2 / 4, y: canvas.height * 3 / 6},               //position 1
        {x:  canvas.width * 3 / 8, y: canvas.height * 1 / 6},               //position 2
        {x:  canvas.width * 5 / 8, y: canvas.height * 1 / 6},               //position 3
        {x:  canvas.width * 1 / 8, y: canvas.height * 3 / 6},               //position 4
        {x:  canvas.width * 7 / 8, y: canvas.height * 3 / 6},               //position 5
        {x:  canvas.width * 1 / 4, y: canvas.height * 5 / 6},               //position 6
        {x:  canvas.width * 3 / 4, y: canvas.height * 5 / 6},               //position 7
    ]

    /**
     * Create one waaterbody percommunity
     * creating multiple communtiies with their own waterbody
     * @type {Array<{x: number, y: number, communityId: number, isContaminated: boolean, contaminationThreshold: number}>}  
     */
    const waterbodies = communitiesPositions.map((pos, index) => ({
        x: pos.x,
        y: pos.y,
        communityId: index,
        isContaminated: index === 0 ? true : false, // only first waterbody is contaminated at start
        contaminationThreshold: 3, // threshold to consider waterbody contaminated
    }));

    /** 
     * Generate agent position around each waterbody in circle
     * @returns {Array<{x: number, y: number}>} Array of agent positions
     */
    function generateAgentPositions(centerX, centerY, radius, count) {
        const positions = [];
        const angleStep = (2 * Math.PI) / count;    // calculate angle step based on count, to space out agent between angle. the output is in radian

        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;          // calculate angle for current agent
            positions.push({
                x: centerX + radius * Math.cos(angle), // calculate x position
                y: centerY + radius * Math.sin(angle), // calculate y position
            });
        }
        return positions;       // return array of positions
    }

    /** 
     * Create all agent for all communities
     * Each agent belong to a specific community and waterbody
     * `agents` array holds all agents from all communities
     * @type {Array<{x: number, y: number, communityId: number, isInfected:boolean, isActive: boolean}>}}
     */
    const agents = [];              // initialise an empty (global)array to hold all agents
    const communityRadius = 35;     // radius around waterbody to place agents, distance from waterbody

    // loop through each community position to generate 10 agents around 
    /**
     * For each community amke loop to generate agent position
     * for each agent position generate agent object and push to (global) agents array
     */
    communitiesPositions.forEach((community, index) => {
        // generate positions for agents around the (single) community waterbody
        // output: array of positions
        const agentPositions = generateAgentPositions(community.x, community.y, communityRadius, AGENTS_PER_COMMUNITY);

        // generate agents for the community based on each agent position from the agentPositions array
        agentPositions.forEach((pos, agentIndex) => {
            //push agent to the (global) agents array
            agents.push({
                x: pos.x,               // agent starting x position
                y: pos.y,               // agent starting y position
                houseX: pos.x,          // agent house x position (initially same as starting position)
                houseY: pos.y,          // agent house y position (initially same as starting position)
                communityId: index,   // community identifier based on the community index
                agentId: agentIndex,                 // agent index within community
                speed: 1.5,
                targetCommunityId: agentIndex % communitiesPositions.length,       // no target community at start
                currentLocation: 'house',       // all agents start at house
                targetLocation: 'house',        // all agents target house at start
                isInfected: false,              // all agents start uninfected
                isActive: true,                 // all agents are active/visible at start
                isMobile: false,                // all agents are stationary at start
            });
        });
    });
    
    /**
     * Activate agents for specific communities based on simulation day
     * day 1: only community 0 agent active
     * day 2+: all communities active 
     * @param {number} currentDay - current simulation day
     * @returns {void}
     */
    function activateAgentsForDay() {
        // get current day
        const currentDay = getCurrentDay(timeManager);

        // loop through all agents to set active state based on current day
        agents.forEach((agent) => {
            if (currentDay === 1) {
                // only community 0 agents are active on day 1
                agent.isActive = true;               // set active state only for community 0 on the first day
                agent.isMobile = (agent.communityId === 0);                                 // all agents are stationary on day 1
            } if (currentDay >= 2) {
                // all agents active from day 2 onwards
                agent.isActive = true;
                agent.isMobile = true;                                 // all agents are mobile from day 2 onwards
            }
        });
    }

    /**
     *  Resolve a location label (currentLocation) to actual x, y coordinates
     * @param {string} locationLabelInput - locationLabel home or visit community
     * @param {object} agent - agent object
     * @returns {{x: number, y: number}} - x,y coordinates of the location
     */
    function resolveLocation(locationLabelInput, agent) {
        switch(locationLabelInput) {
            case 'house' : 
                return { x: agent.houseX, y: agent.houseY };
            case 'visitOtherCommunity' :
                return { x: communitiesPositions[agent.targetCommunityId].x, y: communitiesPositions[agent.targetCommunityId].y };
            default :
                return { x: agent.houseX, y: agent.houseY }; // default to agent's home community 
        }
    }

    /** 
     * Updater agent position to move towards the target location
     * @return (void)
    */
    function updateAgentMovement() {
        // updqate each agent position
        agents.forEach ((agent) => {
            // skip inactive or immobile agents
            if (!agent.isActive || !agent.isMobile) return;

            // Get target coordinates based on a target location label
            // return x,y coordinates
            const target =  resolveLocation(agent.targetLocation, agent);

            // calculate direction vector to target
            const dx = target.x - agent.x;
            const dy = target.y - agent.y;
            const distance = Math.hypot(dx, dy);    // calculate distance to target with Pythagorean theorem

            // check if agent is close enough to target
            if (distance < agent.speed) {
                // snap to target position move agent directly to target
                agent.x = target.x;
                agent.y = target.y;

                // update current location to target location
                // change the initially target location become current location
                agent.currentLocation = agent.targetLocation;

                // Switching the target location
                if (agent.currentLocation === 'house') {
                    agent.targetLocation = 'visitOtherCommunity'
                } else {
                    // when arrive at other community, set target back to house
                    agent.targetLocation = 'house';
                }

                return; // Exit early if reached the target so agent not move further this frame (avoid overshooting and agent vibrating at the target)
            }

            // calculate agent step
            const stepX = (dx / distance) * agent.speed;
            const stepY = (dy / distance) * agent.speed;

            // make agent move closer to the step
            agent.x += stepX;
            agent.y += stepY;
        });
    }

    /**
     * DrawWater function
     */
    function drawWaterbody() {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round'; 

        // draw waterbody for each community
        waterbodies.forEach((waterbody) => {
            ctx.beginPath();
            ctx.arc(waterbody.x, waterbody.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = waterbody.isContaminated ? 'darkblue' : 'lightblue';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
        })
    }

    /**
     * Draws all agents as stick figures
     * Only draws active agents
     * Outline color changes to red when agent is infected
     * @returns {void}
     */
    function drawAgent() {
        agents.forEach((agent) => {
            // check if agent active or not
            if (!agent.isActive) return;         // skip inactive agents

            ctx.strokeStyle = agent.isInfected ? 'red' : 'black';
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round'; 

            // draw head
            ctx.beginPath();
            ctx.arc(agent.x, agent.y-10, 4, 0, Math.PI * 2);
            ctx.stroke();

            // draw test indicator if agent is tested
            if (agent.isTested) {
                ctx.beginPath();
                ctx.arc(agent.x, agent.y-12, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'orange';
                ctx.fill();
            }


            //draw body
            ctx.beginPath();
            ctx.moveTo(agent.x, agent.y-6);
            ctx.lineTo(agent.x, agent.y+4);
            ctx.stroke();
            
            //draw arms
            // ctx.beginPath();
            ctx.moveTo(agent.x-8, agent.y);
            ctx.lineTo(agent.x, agent.y-6);
            ctx.lineTo(agent.x+8, agent.y);
            ctx.stroke();

            //draw legs
            ctx.beginPath();
            ctx.moveTo(agent.x-6, agent.y+12);
            ctx.lineTo(agent.x, agent.y+4);
            ctx.lineTo(agent.x+6, agent.y+12);
            ctx.stroke();

            // draw vaccination ring if agent is vaccinated
            if (agent.isVaccinated) {
                ctx.beginPath();
                ctx.arc(agent.x, agent.y-12, 10, 0, Math.PI * 2);
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });     
    }

    /** 
     * draw the entire simulation frame
     */
    function drawScene() {
        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw scene elements
        drawWaterbody();
        drawAgent();

    }
    
    /**
     * Animation frame request ID
     * Used to control and cancel the animation loop
     * @type {number|null}
     */
    // create object to store animation frame ID
    let animationId = null;

    /**
     * Main animation loop function
     * Updates agent movement, infection states, and redraws the scene
     * @param {DOMHighResTimeStamp} timestamp - Current time provided by requestAnimationFrame
     * @returns {void}
     */
    function animate(timestamp) {
        // calculate delta time since the last frame (in milliseconds)
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp; // update last timestamp for next frame calculation

        // update time manager with elapsed time
        updateTimeManager(timeManager, deltaTime);

        // update time indicator position
        updateTimeIndicator();

        // check if the day changed
        const currentDay = getCurrentDay(timeManager);
        if (currentDay !== previousDay) {
            // store current day as previous day for next check
            previousDay = currentDay;

            // activate agents for the new day
            activateAgentsForDay();
        }

        // Update agent position based on movement logic
        updateAgentMovement();

        // draw entire screen
        drawScene();

        // request next animation frame to continue the animation loop
        animationId = requestAnimationFrame(animate);
    }

     /**
     * Tracks whether the simulation is currently running
     * @type {boolean}
     */
    // track agent simulation state
    let isRunning = false;              // track simulation running state

    /**
     * Control buttons for simulation
     * @type {HTMLButtonElement}
     */
    // connect with button on html
    const startButton = document.getElementById('start-button-sim5');
    const pauseButton = document.getElementById('pause-button-sim5');
    const resetButton = document.getElementById('reset-button-sim5');

    // add event listeners to buttons
    startButton.addEventListener('click', startSimulation);
    pauseButton.addEventListener('click', pauseSimulation);
    resetButton.addEventListener('click', resetSimulation);

    /**
     * Starts the simulation animation
     * Disables start button and slider, enables pause/reset buttons
     * Begins the animation loop
     * @returns {void}
     */
    // Control helpers to start the animation
    function startSimulation() {
        if (isRunning) return;

        // change the state 
        isRunning = true;
        
        // change helper button mode
        startButton.disabled = true;
        pauseButton.disabled = false;
        resetButton.disabled = false;

        // initialise agent assignment based on current day 
        activateAgentsForDay();

        // record the initial timestamp when simulation starts
        lastTimestamp = performance.now();

        // start the animation
        animationId = requestAnimationFrame(animate);
    }

    
    /**
     * Pauses the simulation animation
     * Enables start button and slider, disables pause button
     * Stops the animation loop
     * @returns {void}
     */
    // Control helpers to pause the animation
    function pauseSimulation() {
        // check if simulation is running
        if (!isRunning) return;

        // change the state
        isRunning = false;

        // change helper button mode
        startButton.disabled = false;
        pauseButton.disabled = true;
        resetButton.disabled = false;

        // cancel the animation frame
        cancelAnimationFrame(animationId);              // stop the animation
    }


    /**
     * Resets the simulation to initial state
     * Resets all agent positions, infection states, contamination states
     * Re-infects agents 1 and 2 for simulation purposes
     * Enables start button and slider, disables pause/reset buttons
     * Stops animation and redraws initial scene
     * @returns {void}
     */
    function resetSimulation() {
        // change the state
        isRunning = false;

        // change helper button mode
        startButton.disabled = false;
        pauseButton.disabled = true;
        resetButton.disabled = true;

        // reset all agents to initial state
        agents.forEach((agent) => {
            agent.x = agent.houseX;
            agent.y = agent.houseY;
            agent.currentLocation = 'house';
            agent.targetLocation = 'house';
            agent.isInfected = false;
            agent.isActive = true;
            agent.isMobile = false;
        });

        // reset timestamp
        lastTimestamp = 0;
        
        // Stop the animation frame
        cancelAnimationFrame(animationId);

        // reset time manager 
        resetTimeManager(timeManager);

        // reset time indicator bar
        updateTimeIndicator();

        // redraw the initial scene
        drawScene();
    }

    
    // initial UI state and render with disabled pause button
    pauseButton.disabled = true;            // cannot pause until the simulation is running
    resetButton.disabled = true;             // cannot reset until the simulation is running

    // initial draw
    drawScene();



}) ();
