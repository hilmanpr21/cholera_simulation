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
     * duration of infection in days
     * @type {number} - number of days an agent remains infected
     */
    const infectionDuration = 7;        // 7 days infection duration

    /** 
     * duration of recovery in days
     * @type {number} - number of days an agent remains recovered
     */
    const recoveryDuration = 200;        // 200 days recovery duration

    /**
     * set waterbody contamination threshold
     * number of infected agent visits required to contaminate waterbody
     * @type {number}
     */
    const contaminationThreshold = 3;   // 3 infected agent visits to contaminate waterbody 

    /**
     * number of current rapid test coverage
     * Rapid test coverage menaing how many percentage of the symptomic (infected) population is tested with rapid test everyday
     * @type {number}
     */
    let rapidTestCoverage = 50;              // initial rapid test coverage 0%

    /**
     * Rapid Tewst Sensitivity in percentage (0-100%)
     * @type {number}
     */
    const rapidTestSensitivity = 91;         // rapid test sensitivity i9s how accurate ther test is in detecting infected agent

    /**
     * Isolation duration in days
     * @type {number}
     */
    const isolationDuration = 3;            // 3 days isolation duration  

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
     * track if rapid test has been assigned for the day
     */
    let hasPerformedRapidTestToday = false;

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
        currentDay: 0,                  // initial simulation start at day 0                      
    }

    /** 
     * Get Current hour of the day (0-23 hours)
     * @param {Object} timeManager - the time manager object
     * @returns {number} - current hour in 24-hour format
     */
    function getCurrentHour(timeManager) {
        const totalHours = timeManager.currentSimulationTime;
        return Math.floor(totalHours + timeManager.scheduleStartTime) % 24;   // modulo 24 to wrap around after 23
    }

    /**
     * Get current day number 
     * @param {object} timeManager - the time manager object
     * @returns {number} - current day number
     */ 
    function getCurrentDay(timeManager) {
        const totalHours = timeManager.currentSimulationTime;
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
     *  Get the time scale multiplier based on the current hour of the day
     *  This creates a day/night cycle where nighttime (0:00-7:59) passes faster
     * @param {*} hour 
     * @returns 
     */
    function getTimeScale(hour) {
        if (hour >= 0 && hour < 8) {
            return 3;   // fast night
        }
        return 2;       // normal day
    }

    /**
     * Update Simulation time manager to update the currentSimulationTime (total hour simulation has been running) and currentDay (how many day simulation has been running) based on elapsed time
     * @param {object} timeManager - the time manager object
     * @param {number} deltaTime - time elapsed since last update in milliseconds
     * @returns {void}
     */
    function updateTimeManager(timeManager, deltaTime) {
        const currentHour = getCurrentHour(timeManager);

        // get current hour before update time manager
        const timeScale = getTimeScale(currentHour);
        
        // update current simulation time
        timeManager.currentSimulationTime += deltaTime / 1000 * timeScale;          // convert ms to seconds
        // update current day
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
     * schedule configuration for agent movement between home and other community
     * agent move to ther communitiwes beetween 8am - 5pm 
     */
    const scheduleConfig = {
        mobileStarthour: 8,   // agents become mobile at 8am
        mobileEndHour: 17    // agents go to their house at 5pm
    }

    /**
     * An array to store bathroom slot conigurations for agent at home and other community
     * objecct with two array properties: otherCommunity and house
     * @type {{otherCommunity: number[], house: number[]}}
     */
    const bathroomSlot = {
        otherCommunity: [12, 13, 14, 15, 16, 17] ,  // bathroom hours at other community (12pm - 5pm)
        house: [20, 21, 22, 23, 0]                 // bathroom hours at house (8pm - 12am)]
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
        isContaminated: false, // only first waterbody is contaminated at start
        infectedAgentVisits: 0,    // counter for infected agent visits
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
                speed: 2,
                targetCommunityId: (agentIndex+5) % communitiesPositions.length,       // no target community at start
                currentLocation: 'house',       // all agents start at house
                targetLocation: 'house',        // all agents target house at start
                isInfected: index === 0 && (agentIndex === 1 || agentIndex === 2) ? true : false,              // initally only agent 1 and 2 in community 0 are infected
                infectionStartDay:  index === 0 && (agentIndex === 1 || agentIndex === 2) ? 0 : null,          // timestamp when agent got infected, 
                isRecovered: false,              // all agents are not recovered at start
                recoveryStartDay: null,         // timestamp when agent got recovered
                isActive: true,                 // all agents are active/visible at start
                isMobile: false,                // all agents are stationary at start
                otherCommunityBathroomSlot: 0,  // initial bathroom slot when agent at other community (when agent visit other community)
                houseBathroomSlot: 0,           // initial bathroom slot when agent at house
                isTravelingToBathroom: false,   // track if agent is currently traveling to bathroom
                hasVisitedOtherCommunityBathroomToday: false, // track if agent has visited other community bathroom today
                hasVisitedHouseBathroomToday: false,          // track if agent has visited house bathroom today
                isTested: false,               // rapid test status initially not tested
                isIsolated: false,              // isolation status initially not isolated
                isolationStartDay: null,        // timestamp when agent started isolation
                isolationEndDay: null,          // timestamp when agent ended isolation
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
                agent.isMobile = (agent.communityId === 0);                                 // all agents are stationary on day 1 except community 0
            } if (currentDay >= 2) {
                // all agents active from day 2 onwards
                agent.isActive = true;
                agent.isMobile = true;                                 // all agents are mobile from day 2 onwards
            }
        });
    }

    /**
     * assign agent random bathroom slot for an agent regarding their location
     * @param {string} currentLocation - current location of the agent ('house' or 'otherCommunity')
     * @returns {number} - random hour number from available slots
     */
    function assignBathroomSlot(currentLocation) {
        // get available bathroom slots for the location, returns an array of the slot numbers, '[]' square bracket for dynamic identifier access
        const slots = bathroomSlot[currentLocation];                        

        // select a random slot from available slots
        const randomIndex = Math.floor(Math.random() * slots.length);
        return slots[randomIndex];  // return the selected slot hour
    }

    /** 
     * Assign bathroom slots to all active agents based on their current location
     * each agent get random bathroom slot at home and at school each day
     * @return {void}
     */
    function assignDailyBathroomSchedules() {
        agents.forEach((agent) => {
            if(!agent.isActive || agent.isIsolated) return;    // skip inactive or isolated agents

            // assign bathroom slot based on current location
            agent.otherCommunityBathroomSlot = assignBathroomSlot('otherCommunity');

            // assign bathroom slot at house
            agent.houseBathroomSlot = assignBathroomSlot('house');
        });
    }

    /** 
     * check if the agent should visit bathroom based on the current hour and location
     * @param {object} agent - the agent to check
     * @param {number} currentHour - current simulation hour (0-23)
     * @return {string|null} - 'otherCommunityWaterbody' or 'hopuseWaterbody' if agent should visit bathroom, null otherwise
     */
    function shouldVisitBathroom(agent, currentHour) {
        if (!agent.isActive || agent.isIsolated) return null;    // skip inactive or isolated agents

        // check if agent is at other community and current hour matches bathroom slot
        if (agent.currentLocation === 'visitOtherCommunity' && currentHour === agent.otherCommunityBathroomSlot) {
            return 'otherCommunityWaterbody';
        }

        //check if agent is at house and current hour matches bathroom slot
        if (agent.currentLocation === 'house' && currentHour === agent.houseBathroomSlot) {
            return 'houseWaterbody';
        }
        return null; // return null if no bathroom visit is needed
    }

    /**
     * mark that bathroom visit has been completed
     * @param {object} agent - the agent object
     * @param {string} bathroomLocation - location label of the bathroom visited
     * @returns {void}
     */
    function markBathroomVisitComplete(agent, bathroomLocation) {
        if (bathroomLocation === 'otherCommunityWaterbody') {
            agent.hasVisitedOtherCommunityBathroomToday = true;
        }
        else if (bathroomLocation === 'houseWaterbody') {
            agent.hasVisitedHouseBathroomToday = true
        }
    }

    /**
     * determine wghere the agent should be based on the time of the day
     * @param {number} currentHour - curent hour of the day (0-23)
     * @return {string} - location identifier ('targetCommunityID', 'house')
     */
    function getCurrentScheduleMode(agentInput, currentHour) {
        // check if agent is active and mobile
        if (!agentInput.isActive || !agentInput.isMobile) {
            return 'house';    // inactive or immobile agents stay at house
        }

        // check if agent is isolated to make agnet stay at house
        if (agentInput.isIsolated) {
            return 'house';    // isolated agents stay at house
        }
        
        if (currentHour >= scheduleConfig.mobileStarthour && currentHour < scheduleConfig.mobileEndHour) {
            return 'visitOtherCommunity';    // agent should visit other community during mobile hours
        }
        return 'house';                    // agent should be at house outside mobile hours
    }

    /**
     * declaree infection logic when agent visits contaminated waterbody 
     * check if agent got contaminated when visiting contaminated waterbody
     * @param {object} agemtLocationInput - target location label the agent just reached
     * @param {number} agentIndex - index of the agent being checked
     * @returns {void}
     */
    function checkAgentInfection(agent, bathroomLocation) {
        // skip if agent is not going to waterbody
        if (bathroomLocation !== 'otherCommunityWaterbody' && bathroomLocation !== 'houseWaterbody') {
            return;         // exit the function early
        }

        // skip if agent already infected or recovered
        if (agent.isInfected || agent.isRecovered) {
            return;         // exit the function early
        }

        // styore waterbody id based on bathroom location. if the waterbody is at other community, use targetCommunityId, otherwise use communityId
        const waterbodyId = bathroomLocation === 'otherCommunityWaterbody' ? agent.targetCommunityId : agent.communityId;

        // check if waterbodiy is contaminated
        if (waterbodies[waterbodyId].isContaminated) {
            // infect the agent
            agent.isInfected = true;
            // set infection start day to current day
            agent.infectionStartDay = timeManager.currentDay;
        }
    }

    /**
     * update infection and immunity status for all agents 
     * agent get into recovery stage after infection duration
     * agent become immune after infection duration over
     * @returns {void}
     */
    function updateAgentInfectionStatus() {
        // store current day
        const currentDay = timeManager.currentDay;

        // loop through all agents to update infection status  
        agents.forEach((agent) => {
            // check if agent in infected and infection duration has passed
            if (agent.isInfected && agent.infectionStartDay !== null) {
                // store how many days since infection it has been
                // so the infectionStartDay will not change, it will just be reduced
                const daysSinceInfection = currentDay - agent.infectionStartDay;

                if (daysSinceInfection >= infectionDuration) {
                    // infection duration has passed, agent recovers
                    agent.isInfected = false;               // set agent to not infected
                    agent.infectionStartDay = null;        // reset infection start day
                    agent.isRecovered = true;              // set agent to recovered
                    agent.recoveryStartDay = currentDay;   // set recovery start day to current day
                }
            }

            // check if agent is recovered and recovery duration has passed
            if (agent.isRecovered && agent.recoveryStartDay !== null) {
                // store how many days since recovery it has been
                // so the recoveryStartDay will not change, it will just be reduced
                const daysSinceRecovery = currentDay - agent.recoveryStartDay;

                if (daysSinceRecovery >= recoveryDuration) {
                    // recovery duration has passed, agent loses immunity
                    agent.isRecovered = false;            // set agent to not recovered
                    agent.recoveryStartDay = null;       // reset recovery start day
                }
            }
        });
    }

    /**
     * track infected agent visiting waterbodies and contaminate if threshold exceeded
     * implemented thresho9ld based contamination (require multiple infectiond agent visits to contaminate waterbody
     * @param {string} bathroomLocation - location label of the bathroom visited
     * @param {number} agent - the agent object
     * @returns {void}
     */
    function checkWaterbodyContamination(agent, bathroomLocation) {
        // skip if agent is not going to waterbody
        if (bathroomLocation !== 'otherCommunityWaterbody' && bathroomLocation !== 'houseWaterbody') {
            return;
        }

        // skip if agent is not infected
        if (!agent.isInfected) {
            return;
        }

        // store waterbody id based on bathroom location. if the waterbody is at other community, use targetCommunityId, otherwise use communityId
        const waterbodyId = bathroomLocation === 'otherCommunityWaterbody' ? agent.targetCommunityId : agent.communityId;

        // increment infected agent visit counter for the waterbody
        waterbodies[waterbodyId].infectedAgentVisits += 1;  

        // check if infected agent visits exceed contamination threshold
        if (waterbodies[waterbodyId].infectedAgentVisits >= contaminationThreshold) {
            // contaminate the waterbody
            waterbodies[waterbodyId].isContaminated = true;
        }    
    }

    /**
     * Assign rapid test to agent based on the rapid test coverage percentage from the slider
     * only test infeced agent (with the assumption of their symptomatic presentation) that is not in isolation
     * this function change the property of agnet's aray
     * @returns {void}
     */
    function assignRapidTest() {
        // get all infected but non isolated agents
        // use '.filter' method then store it in a new array but the element inside the new array are reference to the original array
        const eligibleAgents = agents.filter(agent => agent.isActive && agent.isInfected && !agent.isIsolated);

        // calculate number of agent has to be tested based on rapid test coverage percentage and eligible agents
        // return integer number
        const numberToTest = Math.round(eligibleAgents.length * (rapidTestCoverage / 100));

        // if no agent to test return early
        if (numberToTest === 0) return;

        // shuffle eligible agents array to randomly pick agents to test
        const shuffled = eligibleAgents.sort(() => Math.random() - 0.5);
        // select agents to test based on calculated number
        for (let i = 0; i < numberToTest; i++) {
            // test the agent on the shuffled order
            // change agent property "isTested" to true to indicate the agent has been tested
            shuffled[i].isTested = true;

            // determine whether the test result is positive based on rapid test sensitivity
            const randomNumber = Math.random(); // generate random number between 0-1

            // check if infected agent get tested positive
            if (randomNumber < (rapidTestSensitivity / 100)) {
                // agent tested positive, set isolation status to true`
                shuffled[i].isIsolated = true;
                // set isolationstart day to the current day
                shuffled[i].isolationStartDay = timeManager.currentDay;
                // set isolation end day
                shuffled[i].isolationEndDay = timeManager.currentDay + isolationDuration;
            }
        }

        //flag that rapid test has been performed today
        hasPerformedRapidTestToday = true;

        console.log(`Rapid Test: Tested ${numberToTest} agents, Isolated ${eligibleAgents.filter(agent => agent.isIsolated).length} agents.`);

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
                // If target community is same as home community, stay at house
                if (agent.targetCommunityId === agent.communityId) {
                    // if target community is same as home community, stay at house
                    return { x: agent.houseX, y: agent.houseY };
                } else {
                    // move to target community position
                    const radiusOffset = 50; // offset radius to avoid overlapping with waterbody
                    dx = communitiesPositions[agent.targetCommunityId].x - agent.houseX;
                    dy = communitiesPositions[agent.targetCommunityId].y - agent.houseY;
                    const distance = Math.hypot(dx, dy);
                    const offsetX = (dx / distance) * radiusOffset;
                    const offsetY = (dy / distance) * radiusOffset;
                    return { x: communitiesPositions[agent.targetCommunityId].x - offsetX, y: communitiesPositions[agent.targetCommunityId].y - offsetY };
                };
            case 'otherCommunityWaterbody' :
                // return target community waterbody position
                return { x: waterbodies[agent.targetCommunityId].x, y: waterbodies[agent.targetCommunityId].y };
            case 'houseWaterbody' :
                // return agent house waterbody position
                return { x: waterbodies[agent.communityId].x, y: waterbodies[agent.communityId].y };
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

            // determine agent cureent target based on the time of the day
            const currentHour = getCurrentHour(timeManager);

            // check if it is bathroom visit time
            const isItBathroomTimeTarget = shouldVisitBathroom(agent, currentHour);         //return 'otherCommunityWaterbody' or 'hopuseWaterbody' if agent should visit bathroom, null otherwise

            // if shouldVisityBathroom not return null, set target location to bathroom waterbody agent agent is not currently travelng to watrbody
            if (isItBathroomTimeTarget && !agent.isTravelingToBathroom) {
                // change agetn target location to bathroom waterbody
                const bathroomTargetLocation = isItBathroomTimeTarget;
                agent.targetLocation = bathroomTargetLocation;
                
                // set traveling to bathroom flag to true
                agent.isTravelingToBathroom = true;
            }

            // if agent is not traveling to bathroom, update target location based on current schedule
            // with =out this if condition, agent target location will be never updated back to house or other community after bathroom visit
            if (!agent.isTravelingToBathroom) {
                // update agent target location based on schedule
                const scheduledTarget = getCurrentScheduleMode(agent, currentHour);     // store the agent scheduled target location
                
                // Change agent target location if different from scheduled target
                if (agent.targetLocation !== scheduledTarget) {
                    agent.targetLocation = scheduledTarget;
                }
            }

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

                // store agent previous location before changing
                const previousLocation = agent.currentLocation;

                // update current location to target location
                // change the initially target location become current location
                agent.currentLocation = agent.targetLocation;

                // Handle if bathroom visit completion
                if (agent.isTravelingToBathroom) {
                    // trigger infection check when agent visits contaminated waterbody
                    checkAgentInfection(agent, agent.targetLocation)

                    // check waterbody contamination from infected agent visit
                    checkWaterbodyContamination(agent, agent.targetLocation);

                    // mark bathroom visit as complete for specific bathroom location
                    markBathroomVisitComplete(agent, agent.targetLocation);

                    // return to previous location afterbathroom visit
                    agent.targetLocation = previousLocation;
                    agent.isTravelingToBathroom = false; // reset traveling to bathroom flag
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
     * count the number of currently infected agents 
     * @param {Array} agentsArray - array of agent objects
     */
    function countInfectedAgents() {
        return agents.filter(agent => agent.isActive && agent.isInfected).length;
    }

    /**
     * Update the infected count display element with the current number of infected agents
     */
    function updateInfectedCountDisplay() {
        // store the length of infected agents in a variable
        const infectedCount = countInfectedAgents() ;
        
        // update the infected count display element
        const infectedCountElement = document.getElementById('sim5-infected-count');
        infectedCountElement.textContent = infectedCount;
    }

    /**
     * function to stop the simulaton when all agent got infected
     */
    function allAgentsGotInfected() {
        const healthyAgent = agents.filter(agent => agent.isActive && !agent.isInfected).length

        if (healthyAgent === 0) {
            setTimeout(() => {
                // change the state to stol the simullation from running
                isRunning = false;    

                // show game over overlay
                showGameOverOverlay();

                // disable the start, pause, reset buttons
                
            }, 1000)
        }
    }

    /**
     * Show game over overlay with day count when all agents are infected
     */
    function showGameOverOverlay() {
        const overlay = document.getElementById('sim5-game-over-overlay');
        const dayCountElement = document.getElementById('sim5-game-over-day-count');
        const canvas = document.getElementById('choleraSim5');

        // get position and dimensions of the canvas
        const canvasRect = canvas.getBoundingClientRect();

        // set the day count text
        dayCountElement.textContent = timeManager.currentDay;

        // set the the position the overlay over the canvas
        overlay.style.top = canvasRect.top + 'px';
        overlay.style.left = canvasRect.left + 'px';
        overlay.style.width = canvasRect.width + 'px';
        overlay.style.height = canvasRect.height + 'px';

        // show the overlay by adding the 'show' class
        overlay.classList.add('show');

        // set the overlay state in local storage into true
        window.storeOverlayState('sim5-game-over-overlay');

        startButton.disabled = true;
        pauseButton.disabled = true;
        resetButton.disabled = true;
    }

     /**
     * Hide the game over overlay
     */
    function hideGameOverOverlay() {
        const overlay = document.getElementById('sim5-game-over-overlay');
        
        if (overlay) {
            overlay.classList.remove('show');

            // clear the overlay state in local storage by calling the global function
            window.clearOverlayState('sim5-game-over-overlay');

            // Clear inline styles to fully reset the overlay
            overlay.style.top = '';
            overlay.style.left = '';
            overlay.style.width = '';
            overlay.style.height = '';
        }
    }

    /**
     * Update overlay postion on windows reset to match with the canvas position
     */
    window.addEventListener('resize', function() {
        const overlay = document.getElementById('sim5-game-over-overlay');
        const canvas = document.getElementById('choleraSim5');
        // get position and dimensions of the canvas
        const canvasRect = canvas.getBoundingClientRect();

        if (overlay && overlay.classList.contains('show')) {
            // set the the position the overlay over the canvas
            overlay.style.top = canvasRect.top + 'px';
            overlay.style.left = canvasRect.left + 'px';
            overlay.style.width = canvasRect.width + 'px';
            overlay.style.height = canvasRect.height + 'px';
        }
    });


    // Image loading management
    let imagesLoaded = 0;
    const totalImages = 2;

    function onImageLoad() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            // All images loaded, draw initial scene
            drawScene();
        }
    }

    const contaminatedWaterImage = new Image();
    contaminatedWaterImage.onload = onImageLoad;
    contaminatedWaterImage.src = 'assets/contaminated_water.PNG';

    const cleanWaterImage = new Image();
    cleanWaterImage.onload = onImageLoad;
    cleanWaterImage.src = 'assets/clean_water.PNG';


    /**
     * DrawWater function
     */
    function drawWaterbody() {
        const waterWidth = 40;

        // draw waterbody for each community
        waterbodies.forEach((waterbody) => {
            // draw cleanwater
            ctx.drawImage(
                cleanWaterImage,
                waterbody.x - waterWidth/2, 
                waterbody.y - waterWidth/2,
                waterWidth,
                waterWidth
            );

            //draw contaminated water overlay if waterbody is contaminated
            if (waterbody.infectedAgentVisits > 0) {
                // calculate contamination ratio
                const contaminationRatio = waterbody.infectedAgentVisits / contaminationThreshold;

                // calculate the heigh contaminated portion
                const contaminatedHeight = waterWidth  * contaminationRatio;

                // start cropping from this Y position
                const sourceY = contaminatedWaterImage.height * (1 - contaminationRatio);  
                
                // height to crop from the image
                const sourceHeight = contaminatedWaterImage.height * contaminationRatio;    

                // draw contaminated portion
                ctx.drawImage(
                    contaminatedWaterImage,
                    0,                          // source X start cropping the image (start from left of image)
                    sourceY,                    // source Y start cropping the image (crop from this Y position)
                    contaminatedWaterImage.width,           // source width, how much to crop (full width of image)
                    sourceHeight,               // source height, how much to crop (only contamianted portion)
                    waterbody.x - waterWidth/2,    // destination X (where to place on canvas)
                    waterbody.y - waterWidth/2 + waterWidth - contaminatedHeight, // destination Y (where to place on canvas) (align to the bottom of the waterbody)
                    waterWidth,           // destination width
                    contaminatedHeight          // destination height
                )
            }
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
        
        });     
    }

     /** 
     * Draw isolation boxes around isolated agents
     * @returns {void}
     */
    function drawIsolationBoxes() {
        agents.forEach((agent) => {
            // check if agent is inacactive or not isolated
            if (!agent.isActive || !agent.isIsolated) return;

            // draw isolation box
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--isolation-color');
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]); // dashed line
            ctx.strokeRect(agent.x-10, agent.y-17, 20, 30);
            ctx.setLineDash([]); // reset to solid line
        });
    }

    /** 
     * draw the entire simulation frame
     */
    function drawScene() {
        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw scene elements
        drawIsolationBoxes();
        drawWaterbody();
        drawAgent();

    }

    /** 
     * Get CSS color variable value from root
     * @param {string} variableName - CSS variable name (e.g., '--canvas-day-color')
     * @returns {string} - color value as string
     */
    function getCSSColor(variableName) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(variableName)
            .trim();
    }

    /**
     * Convert hex color to RGB object
     * @param {string} hex - Hex color string (e.g., '#ffefc1')
     * @returns {object} - RGB object {r, g, b}
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Parse CSS color string to RGB object
     * Handles both hex and rgb() formats
     * @param {string} colorString - Color string from CSS
     * @returns {object} - RGB object {r, g, b}
     */
    function parseColorToRgb(colorString) {
        if (colorString.startsWith('#')) {
            return hexToRgb(colorString);
        }
        
        // Parse rgb() or rgba() format
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }
        
        // Default fallback to day color
        return { r: 255, g: 239, b: 193 };
    }

    /**
     * Interpolate between two colors
     * @param {object} color1 - First color {r, g, b}
     * @param {object} color2 - Second color {r, g, b}
     * @param {number} progress - Progress between colors (0-1)
     * @returns {string} - RGB color string
     */
    function interpolateColor(color1, color2, progress) {
        const r = Math.round(color1.r + (color2.r - color1.r) * progress);
        const g = Math.round(color1.g + (color2.g - color1.g) * progress);
        const b = Math.round(color1.b + (color2.b - color1.b) * progress);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Get background color based on time of day
     * Smoothly interpolates between day and night colors from CSS variables
     * @param {number} hour - current hour (0-23)
     * @returns {string} - RGB color string
     */
    function getBackgroundColorByTime(hour) {
        // Get colors from CSS variables
        const dayColorString = getCSSColor('--canvas-day-color');
        const nightColorString = getCSSColor('--canvas-night-color');
        
        // Parse to RGB objects
        const dayColor = parseColorToRgb(dayColorString);
        const nightColor = parseColorToRgb(nightColorString);
        
        // Sunset transition (18:00-20:00): gradually darken
        if (hour >= 18 && hour < 20) {
            const progress = (hour - 18) / 2; // 0 to 1 over 2 hours
            return interpolateColor(dayColor, nightColor, progress);
        }
        
        // Night time (20:00-04:00): dark
        if (hour >= 20 || hour < 4) {
            return `rgb(${nightColor.r}, ${nightColor.g}, ${nightColor.b})`;
        }
        
        // Sunrise transition (04:00-06:00): gradually brighten
        if (hour >= 4 && hour < 6) {
            const progress = (hour - 4) / 2; // 0 to 1 over 2 hours
            return interpolateColor(nightColor, dayColor, progress);
        }
        
        // Day time (06:00-18:00): light
        return `rgb(${dayColor.r}, ${dayColor.g}, ${dayColor.b})`;
    }

    /**
     * Update canvas background color based on time
     * @param {number} hour - current hour (0-23)
     * @returns {void}
     */
    function updateCanvasBackgroundByTime(hour) {
        canvas.style.backgroundColor = getBackgroundColorByTime(hour);
    }
    
    /**
     * Animation frame request ID
     * Used to control and cancel the animation loop
     * @type {number | null}
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

        // Get current hour
        const currentHour = getCurrentHour(timeManager);
        
        // Update canvas background color based on time
        updateCanvasBackgroundByTime(currentHour);

        // check if the day changed
        const currentDay = getCurrentDay(timeManager);
        if (currentDay !== previousDay) {
            // store current day as previous day for next check
            previousDay = currentDay;

            // activate agents for the new day
            activateAgentsForDay();

            // assign bathroom slots for all active agents
            assignDailyBathroomSchedules();

            // reset agent's test performaed flag for the new day
            // and check if isolation period is over
            agents.forEach((agent) => {
                agent.isTested = false;        // reset test performed flag
                // check if agent isolation period is over
                if (agent.isIsolated && currentDay >= agent.isolationEndDay) {
                    agent.isIsolated = false;    // end isolation
                    agent.isolationStartDay = null;
                    agent.isolationEndDay = null;
                }
            });

            // Reset rapid test completion flag for the day
            hasPerformedRapidTestToday = false;
        }

        // pertform rapid test daily at 7 am if not yet performed today
        if (currentHour === 8 && !hasPerformedRapidTestToday) {
            // assign rapid test to agents
            assignRapidTest();

            //flag that rapid test has been performed today 
            hasPerformedRapidTestToday = true;
        }

        // update agent infection and immunity status
        updateAgentInfectionStatus();

        // Update agent position based on movement logic
        updateAgentMovement();

        // stop simulation when all agent got infected
        allAgentsGotInfected()
        
        // update infected count display
        updateInfectedCountDisplay();

        // draw entire screen
        drawScene();

        // Request the next animation frame only if simulation is still running
        if (isRunning) {
            animationId = requestAnimationFrame(animate)
        }
    }

    /**
     * Defines the initial number of infected agents at simulation start
     */
    let initialInfectedAgentCount = 2; 

    /**
     * Slider input element for controlling number of active agents
     * @type {HTMLInputElement}
     */
    // track the slider label number of the current neighborhood number
    let neighborhoodNumber = document.getElementById('sim5-neighbour-number');
    
    /**
     * Label element displaying current slider value
     * @type {HTMLSpanElement}
     */
    let neighborhoodNumberLabel = document.getElementById('sim5-neighbour-label');

    /**
     * Change the neighborhood number label and active agent count based on slider value
     */
    neighborhoodNumberLabel.textContent = neighborhoodNumber.value;
    initialInfectedAgentCount = parseInt(neighborhoodNumber.value);              // change the number into the integer

    /**
     * Updates which agents are active based on slider value
     * Agents with index less than count are made active, others inactive
     * @param {number} count - Number of agents to activate
     * @returns {void}
     */
    //  declare function to update active agent based on slider value
    function updateInitialInfectedAgent(count) {
        // update the initial infected agent count based on the slider value
        initialInfectedAgentCount = count;

        // infect agent based on the initial infected agent count
        agents.forEach((agent, agentIndex) => {
            agent.isInfected = agent.communityId === 0 && agentIndex < initialInfectedAgentCount ? true : false;
            agent.infectionStartDay = agent.communityId === 0 && agentIndex < initialInfectedAgentCount ? 1 : null;  // set infection start day to day 1 for initially infected agents
        });

        // redraw the scene to reflect changes imidiately when the slider is moved
        drawScene();
    }

    // update slider initial value and add event listener
    neighborhoodNumber.addEventListener('input', function() {
        neighborhoodNumberLabel.textContent = this.value;

        // update active agents based on the slider value
        updateInitialInfectedAgent(parseInt(this.value));

        // update infected agent count display
        updateInfectedCountDisplay();
    });

    /**
     * Initially calling to set infected agents based on initial slider value
     */
    updateInitialInfectedAgent(initialInfectedAgentCount);

    /**
     * Update infected agent count display initially before the simulation starts
     */
    updateInfectedCountDisplay();

    
    /**
     * Slider input Element for controlling rapid test coverage
     * @type {HTMLInputElement}
     */
    let rapidTestSlider = document.getElementById('sim5-rapid-test-slider');

    /**
     * Label element displaying current rapid test coverage
     */
    let rapidTestLabel = document.getElementById('sim5-rapid-test-label');

    /**
     * set initial rapid test slider value and display label 
     */
    rapidTestCoverage = parseInt(rapidTestSlider.value);        // initial change the rapidTestCoverage value based on slider value
    rapidTestLabel.textContent = rapidTestSlider.value;         // initial change the rapid test text based on slider value

    // update rapid test slider event listener
    rapidTestSlider.addEventListener('input', (event) => {
        // update rapid test label and coverage value
        rapidTestLabel.textContent = event.target.value;

        // update rapid test coverage label in simulation
        rapidTestCoverage = parseInt(event.target.value);
    });

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
    const tryAgainButton = document.getElementById('sim5-try-again-button');

    // add event listeners to buttons
    startButton.addEventListener('click', startSimulation);
    pauseButton.addEventListener('click', pauseSimulation);
    resetButton.addEventListener('click', resetSimulation);
    tryAgainButton.addEventListener('click', tryAgainSimulation);

    /**
     * Handles "Try Again" button click from game over overlay
     * Hides overlay and resets the simulation
     * @returns {void}
     */
    function tryAgainSimulation() {
        hideGameOverOverlay();
        resetSimulation();
    }


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

        // disable the neighborhood number slider while simulation is running to avoid confusion
        neighborhoodNumber.disabled = true;

        // disable the rapid test slider while simulation is running
        rapidTestSlider.disabled = true;

        // initialise agent assignment based on current day 
        activateAgentsForDay();

        // assign bathroom slots for all active agents when simulation starts
        assignDailyBathroomSchedules();

        // record the initial timestamp when simulation starts
        lastTimestamp = performance.now();

        // start the animation
        animationId = requestAnimationFrame(animate);

        console.log(agents);
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

        //disable the neighborhood slider
        neighborhoodNumber.disabled = true;

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

        // Stop the animation frame
        cancelAnimationFrame(animationId);

        // reset time manager 
        resetTimeManager(timeManager);

        // change helper button mode
        startButton.disabled = false;
        pauseButton.disabled = true;
        resetButton.disabled = true;
    
        // enable the neighborhood slider
        neighborhoodNumber.disabled = false;
        
        // disable the rapid test slider while simulation is running
        rapidTestSlider.disabled = false;

        // reset all agents to initial state
        agents.forEach((agent) => {
            agent.x = agent.houseX;
            agent.y = agent.houseY;
            agent.currentLocation = 'house';
            agent.targetLocation = 'house';
            agent.isInfected = false;
            agent.infectionStartDay = null;
            agent.isRecovered = false;
            agent.recoveryStartDay = null;
            agent.isActive = true;
            agent.isMobile = false;
            agent.otherCommunityBathroomSlot = 0;
            agent.houseBathroomSlot = 0;
            agent.isTravelingToBathroom = false;
            agent.hasVisitedOtherCommunityBathroomToday = false;
            agent.hasVisitedHouseBathroomToday = false;
            agent.isTested = false;
            agent.isIsolated = false;
            agent.isolationStartDay = null;
            agent.isolationEndDay = null;
        });


        // reset waterbodies to initial state
        waterbodies.forEach((waterbody) => {
            waterbody.isContaminated = false; // only first waterbody is contaminated at start
            waterbody.infectedAgentVisits = 0;    // reset infected agent visits counter
        });

        // reset timestamp
        lastTimestamp = 0;
    
        // reset time indicator bar
        updateTimeIndicator();

        // reset rapid test performed flag for the new day
        hasPerformedRapidTestToday = false; // reset rapid test performed flag for the new day

        // reset assignment bathroom slots for all active agents
        assignDailyBathroomSchedules();

        // reset initial infected agents based on slider value
        updateInitialInfectedAgent(initialInfectedAgentCount);

        // update infected agent count display
        updateInfectedCountDisplay();

        // redraw the initial scene
        drawScene();
    }

    
    // initial UI state and render with disabled pause button
    pauseButton.disabled = true;            // cannot pause until the simulation is running
    resetButton.disabled = true;             // cannot reset until the simulation is running

    // initial draw
    drawScene();

     /**
     * Make simulations namespace if not already present
     */
    if (!window.simulations) {
        window.simulations = {};
    }

    /**
     * make global access to main agent position and status to change the visual anchor
     */
    window.simulations.sim5 = {
        canvasId: 'choleraSim5',
        showGameOverOverlay: showGameOverOverlay,  // expose the showGameOverOverlay function
        hideGameOverOverlay: hideGameOverOverlay   // expose the hideGameOverOverlay function

    };

}) ();
