(function() {
    /**
     * Simulating cholera spread with multiple agents and configurable neighborhoods
     * Features include:
     * - Multiple agents (configurable via slider)
     * - Predefined house positions
     * - Threshold-based water contamination
     * - Time-delayed house infection
     * - time based scheduling system for realistic daily cycles
     */

    /**
     * Initialise the canvas context
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('choleraSim2');
    const roughCanvas = rough.canvas(canvas);        // rough.js context
    const ctx = canvas.getContext('2d');            // 2D canvas context

    // set canvas internal resolution
    canvas.width = 600;   // Internal resolution
    canvas.height = 400;  // Internal resolution

    /**
     * School location at the center of the canvas
     * @type {{x: number, y: number}}
     */
    const school = {x: canvas.width/2, y: canvas.height/2};

    /**
     * School water body with threshold-based contamination
     * @type {{x: number, y: number, isContaminated: boolean, infectedVisitCount: number, contaminationThreshold: number}}
     * @property {number} x - X coordinate
     * @property {number} y - Y coordinate
     * @property {boolean} isContaminated - Contamination state
     * @property {number} infectedVisitCount - Number of infected agent visits
     * @property {number} contaminationThreshold - Required visits to contaminate
     */
    const schoolWaterBody = {
        x: school.x,
        y: school.y+60,
        isContaminated: false,           // track waterbody contamination state
        infectedVisitCount: 0,           // track number of infected agent visit to the waterbody
        contaminationThreshold:2        // threshold of infected visit to contaminate the waterbody
    }

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
        return Math.floor(totalHours + timeManager.scheduleStartTime) % 24;
    }

    /**
     * Get current day number 
     * @param {object} timeManager - the time manager object
     * @returns {number} - current day number
     */ 
    function getCurrentDay(timeManager) {
        const totalHours = timeManager.currentSimulationTime * timeManager.timeScale;
        return Math.floor((totalHours + timeManager.scheduleStartTime) / 24);
    }

    /**
     * Update Simulation time manager to update the currentSimulationTime (total hour simulation has been running) and currentDay (how many day simulation has been running) based on elapsed time
     * @param {object} timeManager - the time manager object
     * @param {number} deltaTime - time elapsed since last update in milliseconds
     * @returns {void}
     */
    function updateTimeManager(timeManager, deltaTime) {
        timeManager.currentSimulationTime += deltaTime / 1000;          // convert ms to seconds
        timeManager.currentDay = getCurrentDay(timeManager);
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
     * get Formatted time string (HH:MM) for display
     * @param {object} timeManager - the time manager object
     * @returns {string} - formatted time string
     */
    function getTimeString(timeManager) {
        const hour = getCurrentHour(timeManager);
        return `${hour.toString().padStart(2, '0')}:00`
    }

    /** 
     * Schedule configuration for agent activities based on time of day
     * @type {{schoolStart: number, schoolEnd: number}}
     */
    const scheduleConfig = {
        schoolStart: 8,    // School starts at 8:00 AM
        schoolEnd: 17      // School ends at 5:00 PM
    };  

    /**
     * determines where agent should be based on current hour
     * @param {number}  currentHour - hour of the day (0-23)
     * @returns {string} - location identifier ('school' or 'house')
     */
    function getCurrentScheduleMode(currentHour) {
        if (currentHour >= scheduleConfig.schoolStart && currentHour < scheduleConfig.schoolEnd){
            return 'school';
        }
        return 'house';

    }

    /** 
     * Determine agent's target location based on current schedule mode
     * @ param {object} agentInput - The agent to check 
     * @ returns {string} - Target Location label
     */
    function getAgentTargetLocation(agentInput) {
        // check if agent is inactive
        if (!agentInput.isActive) return 'house';

        // get current hour
        const currentHour = getCurrentHour(timeManager);        // get current hour by calling the function getCurrentHour

        // determine current schedule mode 
        const targetLocation = getCurrentScheduleMode(currentHour);

        agentInput.isAtSchool = (targetLocation === 'school');    // update agent's isAtSchool property, the value is boolean, true when targetLocation is 'school', false otherwise
        return targetLocation;
    }

    /**     * Predefined house positions distributed evenly around the canvas
     * Supports up to 10 houses/agents in the simulation
     * @type {Array<{x: number, y: number}>}
     * @constant
     */
    // predefined house position distributed around the school
    const housePosition = [
        {x: 150, y: 100},               //position 1
        {x: 450, y: 300},               //position 2
        {x: 450, y: 100},               //position 3
        {x: 150, y: 300},               //position 4
        {x: 500, y: 200},               //position 5
        {x: 100, y: 200},               //position 6
        {x: 375, y: 40},               //position 7
        {x: 225, y: 360},               //position 8
        {x: 375, y: 360},               //position 9
        {x: 225, y: 40}                //position 10
    ];

    /**
     * Array of house objects with predefined positions
     * @type {Array<{x: number, y: number, isInfected: boolean, id: number}>}
     * @property {number} x - X coordinate
     * @property {number} y - Y coordinate
     * @property {boolean} isInfected - Infection state
     * @property {number} id - House identifier
     */
    // initialise house array with predefined position
    const houses = housePosition.map((pos, index) => ({
        x: pos.x,
        y: pos.y,
        isInfected: false,
        id: index 
    }));

    /**
     * Array of house water bodies, positioned relative to each house
     * Water bodies are offset to the left or right based on house position
     * @type {Array<{x: number, y: number, isContaminated: boolean, contaminatedTime: number, houseId: number}>}
     * @property {number} x - X coordinate (offset from house)
     * @property {number} y - Y coordinate (same as house)
     * @property {boolean} isContaminated - Contamination state
     * @property {number} contaminatedTime - Duration of contamination in milliseconds
     * @property {number} houseId - Associated house identifier
     */
    // initialise housewater bodies array corresponding to each house (offset from each house)
    const houseWaterBodies = houses.map((house, index) => ({
        x: house.x > canvas.width / 2 ? house.x + 60 : house.x - 60,
        y: house.y,
        isContaminated: false,
        contaminatedTime: 0,
        houseId: index
    }));

    /**
     * Array of agent objects, one per house
     * Agents 1 and 2 start infected for simulation purposes
     * @type {Array<{x: number, y: number, speed: number, itinerary: string[], stepIndex: number, isInfected: boolean, houseId: number, isActive: boolean}>}
     * @property {number} x - Current X position
     * @property {number} y - Current Y position
     * @property {number} speed - Movement speed in pixels per frame
     * @property {string} currentLocation - Current location label
     * @property {string} targetLocation - Next target location based on schedule
     * @property {boolean} isInfected - Infection state
     * @property {number} houseId - Associated house identifier
     * @property {boolean} isActive - Whether agent is visible/active (controlled by slider)
     * @property {boolean} isAtSchool - Whether agent is currently at school (vs at home)
     */
    // initialise agent (one agent per house)
    const agents = houses.map((house, index) => ({
        x: house.x + 10,
        y: house.y + 10, 
        speed: 1.5,
        currentLocation: 'house',               // initial location set to 'house'
        targetLocation: 'house',                // initial target location is staying at 'house'
        isInfected: index === 1 || index === 2 ? true : false,                      // track agent infection state
        houseId: index,                         // associate agent to the house
        isActive: true,                          // track if agent is still active in the simulation based on slider input
        isAtSchool: false                       // track if agent currently at school or not
    }));    

    /**
     * Current number of active agents in the simulation
     * Controlled by the neighborhood slider
     * @type {number}
     */
    // Current number of active agents in the simulation
    let activeAgentCount = 5;                   // based on the initial value of the slider

    /**
     * Timestamp of the last animation frame (in milliseconds)
     * Used for calculating delta time between frames
     * @type {number}
     */
    // declare beginning last timestamp for delta time calculation to calculate howlong the simulation has been running
    let lastTimestamp = 0;

    /**
     * Delay in milliseconds before a house becomes infected after waterbody contamination
     * @type {number}
     * @constant
     */
    //track time since house waterbody got contaminated
    const houseInfectionDelay = 1500;                   // 1.5 second delay for house get infected after the waterbody got contaminated

    /**
     * Resolves a location label to actual canvas coordinates for a specific agent
     * @param {string} labelInput - Location label ('school', 'schoolWater', 'house', 'houseWater')
     * @param {number} agentIndex - Index of the agent in the agents array
     * @returns {{x: number, y: number}} Coordinates of the requested location
     */
    // resolve agent's itinerary lalbels to actual coordinates
    function resolveItinerary(labelInput, agentIndex) {
        switch(labelInput) {
            case 'school': return {x: school.x, y: school.y};
            case 'schoolWater': return {x: schoolWaterBody.x, y: schoolWaterBody.y};
            case 'house': return {x: houses[agentIndex].x, y: houses[agentIndex].y};
            case 'houseWater': return {x: houseWaterBodies[agentIndex].x, y: houseWaterBodies[agentIndex].y};
            default: return {x: school.x, y: school.y}
        }
    }

    /**
     * Updates position of all active agents by moving them towards their next waypoint
     * Handles movement logic, infection checks, contamination, and itinerary progression
     * @returns {void}
     */
    // declare agent movement update function
    function updateAgentMovement() {
        agents.forEach((agent, agentIndex) => {
            if (!agent.isActive) return;         // skip inactive agents

            // determine where agent should be based on current time
            const scheduledTarget = getAgentTargetLocation(agent);

            // update target if it change based on schedule
            if (agent.targetLocation !== scheduledTarget) {
                agent.targetLocation = scheduledTarget;
            }

            // get coordinates to the current target
            const target = resolveItinerary(agent.targetLocation, agentIndex);                 // return with coordinate of the target location by calling function "resolveItinerary"    

            // Calculate direction vector
            const dx = target.x - agent.x;
            const dy = target.y - agent.y;
            const distance = Math.hypot(dx, dy);

            // Check if the agent is close enough to the target
            if (distance < agent.speed) {
                agent.x = target.x;
                agent.y = target.y;
                agent.currentLocation = agent.targetLocation;              // update current location to the target location

                // Check if agent reached contaminated school waterbody
                // checkAgentInfection(label, agentIndex);

                // check if agent contaminate house waterbody
                // checkHouseWaterContamination(label, agentIndex);
                
                // check if infected agent visit school waterbody to contaminate it
                // contaminateSchoolWaterbody(label, agentIndex);

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
     * Checks if an agent becomes infected when visiting contaminated school water
     * @param {string} targetLocationInput - The location label the agent just reached
     * @param {number} agentIndex - Index of the agent being checked
     * @returns {void}
     */
    // decalre agent infection logic
    function checkAgentInfection(targetLocationInput, agentIndex) {
        if (targetLocationInput === 'schoolWater' && schoolWaterBody.isContaminated) {
            agents[agentIndex].isInfected = true;
        }
    }

    /**
     * Checks if an infected agent contaminates their house water body
     * Starts tracking contamination time when contamination occurs
     * @param {string} targetLocationInput - The location label the agent just reached
     * @param {number} agentIndex - Index of the agent being checked
     * @returns {void}
     */
    // declare house waterbody contamination logic
    function checkHouseWaterContamination(targetLocationInput, agentIndex) {
        // Check if agent is visiting their house waterbody and is infected
        if (targetLocationInput === 'houseWater' && agents[agentIndex].isInfected) {
            // contaminate the house waterbody
            houseWaterBodies[agentIndex].isContaminated = true;

            // start tracking contamination duration
            houseWaterBodies[agentIndex].contaminatedTime = 0;
        }
    }

    /**
     * Tracks infected agent visits to school waterbody and contaminates it after threshold is reached
     * Implements threshold-based contamination (requires multiple infected visits)
     * @param {string} targetLocationInput - The location label the agent just reached
     * @param {number} agentIndex - Index of the agent being checked
     * @returns {void}
     */
    // declare funstion to contaminate school waterbody based on infected agent visit count
    function contaminateSchoolWaterbody(targetLocationInput, agentIndex) {
        // check if infected agent visit count exceed the thresholds
        if  (targetLocationInput === 'schoolWater' && agents[agentIndex].isInfected && !schoolWaterBody.isContaminated) {
            // incerement infected visit count
            schoolWaterBody.infectedVisitCount += 1;

            //check if threshold is reached
            if (schoolWaterBody.infectedVisitCount >= schoolWaterBody.contaminationThreshold) {
                schoolWaterBody.isContaminated = true;
            }
        }
    }

    /**
     * Updates house infection state based on water body contamination duration
     * Houses become infected after their waterbody exceeds contamination threshold time
     * Only processes houses belonging to active agents
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     * @returns {void}
     */
    // update house infection state based on waterbody contamination duration
    function updateHouseInfectionState(deltaTime) {
        houseWaterBodies.forEach((houseWaterBody, agentIndex) => {
            // check if agent active or not
            if (!agents[agentIndex].isActive) return;         // skip inactive agents' houses

            //check if the house waterbody is contaminated and the house is not yet infected
            if (houseWaterBody.isContaminated && !houses[agentIndex].isInfected) {
                // calculate the contamination duration
                houseWaterBody.contaminatedTime += deltaTime;

                // check if contaminated duration exceed the threshold
                if (houseWaterBody.contaminatedTime >= houseInfectionDelay) {
                    houses[agentIndex].isInfected = true;
                }
            }
        });
    }

    /**
     * Draws all water bodies (house and school) on the canvas
     * Only draws water bodies for active agents
     * Color changes based on contamination state (lightblue = clean, darkblue = contaminated)
     * @returns {void}
     */
    function drawWaterbody() {
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round'; 

        // draw house waterbody (only for active agents)
        houseWaterBodies.forEach((houseWaterBody, agentIndex) => {
            if (!agents[agentIndex].isActive) return;         // skip inactive agents' houses
            
            // if the agent active, draw the house waterbody
            ctx.beginPath();
            ctx.arc(houseWaterBody.x, houseWaterBody.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = houseWaterBody.isContaminated ? 'darkblue' : 'lightblue';
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
        });
       
        // draw school waterbody
        ctx.beginPath();
        ctx.arc(schoolWaterBody.x, schoolWaterBody.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = schoolWaterBody.isContaminated ? 'darkblue' : 'lightblue';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    /**
     * Draws the school building with a 3D-like appearance (front and back sections with roofs)
     * @returns {void}
     */
    function drawSchool() {
        // set the stroke style
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // draw rectangle
        ctx.beginPath();
        ctx.rect(school.x - 10, school.y - 10, 20, 20);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // draw back rectangle
        ctx.beginPath();
        ctx.rect(school.x + 10, school.y - 10, 22, 20);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

        // draw roof
        ctx.beginPath();
        ctx.moveTo(school.x-10, school.y-10);
        ctx.lineTo(school.x+10, school.y-10);
        ctx.lineTo(school.x, school.y-20);
        ctx.closePath();
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // draw back roof 
        ctx.beginPath();
        ctx.moveTo(school.x+10, school.y-10);
        ctx.lineTo(school.x+32, school.y-10);
        ctx.lineTo(school.x+22, school.y-20);
        ctx.lineTo(school.x, school.y-20);
        ctx.closePath();
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }  

    /**
     * Draws all house buildings
     * Only draws houses for active agents
     * Outline color changes to red when house is infected
     * @returns {void}
     */
    function drawHouse() {
        houses.forEach((house, agentIndex) => {
            // check if agent active or not
            if (!agents[agentIndex].isActive) return;         // skip inactive agents' houses

            const houseStrokeColor = house.isInfected ? 'red' : 'black';

            ctx.strokeStyle = houseStrokeColor;
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            // draw rectangle
            ctx.beginPath();
            ctx.rect(house.x - 10, house.y - 10, 20, 20);
            ctx.fillStyle = 'yellow';
            ctx.fill();
            ctx.strokeStyle = houseStrokeColor;
            ctx.stroke();

            // draw roof
            ctx.beginPath();
            ctx.moveTo(house.x-10, house.y-10);
            ctx.lineTo(house.x+10, house.y-10);
            ctx.lineTo(house.x, house.y-20);
            ctx.closePath();
            ctx.fillStyle = 'yellow';
            ctx.fill();
            ctx.strokeStyle = houseStrokeColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
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
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round'; 

            // draw head
            ctx.beginPath();
            ctx.arc(agent.x, agent.y-12, 6, 0, Math.PI * 2);
            ctx.stroke();


            //draw body
            ctx.beginPath();
            ctx.moveTo(agent.x, agent.y-6);
            ctx.lineTo(agent.x, agent.y+6);
            ctx.stroke();
            
            //draw arms
            ctx.beginPath();
            ctx.moveTo(agent.x-8, agent.y);
            ctx.lineTo(agent.x, agent.y-6);
            ctx.lineTo(agent.x+8, agent.y);
            ctx.stroke();

            //draw legs
            ctx.beginPath();
            ctx.moveTo(agent.x-6, agent.y+16);
            ctx.lineTo(agent.x, agent.y+6);
            ctx.lineTo(agent.x+6, agent.y+16);
            ctx.stroke();
        });     
    }

    /**
     * Draw the simulation environment
     * Clears canvas and redraws all elements in correct layering order
     * @returns {void}
     */
    function drawScene() {

        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw scene elements
        drawSchool();    
        drawHouse();
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
    // Declare Animation function
    function animate(timestamp) {
        // calculater delta Time
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // update time manager
        updateTimeManager(timeManager, deltaTime);

        // Update agent position based on movement logic
        updateAgentMovement();

        // uppdate house infection state
        updateHouseInfectionState(deltaTime);

        // Redraw the scene
        drawScene();

        // Request the next animation frame
        animationId = requestAnimationFrame(animate)
    }

    /**
     * Slider input element for controlling number of active agents
     * @type {HTMLInputElement}
     */
    // track the slider label number of the current neighborhood number
    let neighborhoodNumber = document.getElementById('sim2-neighbour-number');
    
    /**
     * Label element displaying current slider value
     * @type {HTMLSpanElement}
     */
    let neighborhoodNumberLabel = document.getElementById('sim2-neighbour-label');
    
    // set initial slider value
    neighborhoodNumberLabel.textContent = neighborhoodNumber.value;
    activeAgentCount = parseInt(neighborhoodNumber.value);

    /**
     * Updates which agents are active based on slider value
     * Agents with index less than count are made active, others inactive
     * @param {number} count - Number of agents to activate
     * @returns {void}
     */
    //  declare function to update active agent based on slider value
    function updateActiveAgents(count) {
        // update agent active state based on the slider value
        activeAgentCount = count;

        // update isActive flag for each agent
        agents.forEach((agent, agentIndex) => {
            agent.isActive = agentIndex < activeAgentCount;
        });

        // redraw the scene to reflect changes
        drawScene();
    }

    // update slider initial value and add event listener
    neighborhoodNumber.addEventListener('input', function() {
        neighborhoodNumberLabel.textContent = this.value;

        // update active agents based on the slider value
        updateActiveAgents(parseInt(this.value));
    });

    // initialise active agents based on the initital slider value
    updateActiveAgents(activeAgentCount);

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
    const startButton = document.getElementById('start-button-sim2');
    const pauseButton = document.getElementById('pause-button-sim2');
    const resetButton = document.getElementById('reset-button-sim2');

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

        // disable the neighborhood slider while simulation is running
        neighborhoodNumber.disabled = true;

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
        if (!isRunning) return;

        // change the state
        isRunning = false;

        // change helper button mode
        startButton.disabled = false;
        pauseButton.disabled = true;
        resetButton.disabled = false;

        //disable the neighborhood slider
        neighborhoodNumber.disabled = false;

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
    // Control helpers to reset the animation
    function resetSimulation() {
        // change the state
        isRunning = false;

        // change helper button mode
        startButton.disabled = false;
        pauseButton.disabled = true;
        resetButton.disabled = true;

        // enable the neighborhood slider
        neighborhoodNumber.disabled = false;


        // Stop the animation frame
        cancelAnimationFrame(animationId);

        // reset time manager 
        resetTimeManager(timeManager);

        // reset agent position and infection state
        agents.forEach((agent, index) => {
            agent.x = houses[index].x + 10;
            agent.y = houses[index].y + 10;
            agent.currentLocation = 'house';
            agent.targetLocation = 'house';
            agent.isInfected = index === 1 || index === 2 ? true : false;
            agent.isAtSchool = false;
        });

        // reset  waterbody contamination state
        schoolWaterBody.isContaminated = false;
        schoolWaterBody.infectedVisitCount = 0;
        houseWaterBodies.forEach(waterBody => {
            waterBody.isContaminated = false;
            waterBody.contaminatedTime = 0;
        });

        // reset house infection state
        houses.forEach(house => {
            house.isInfected = false;
        });

        // reset timestamp
        lastTimestamp = 0;

        // redraw the initial scene
        drawScene();
    }

    // initial UI state and render with disabled pause button
    pauseButton.disabled = true;            // cannot pause until the simulation is running
    resetButton.disabled = true;             // cannot reset until the simulation is running

    drawScene();
})();