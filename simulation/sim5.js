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
     * initial vaccination coverage percentage (0-100%) 
     */
    let vaccinationCoverage = 50;    // 30% initial vaccination coverage

    /**
     * vaccination effectiveness in percentage (0-100%)
     */
    const vaccinationEffectiveness = 69;  // 75% effective

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
        isContaminated: index === 0 ? true : false, // only first waterbody is contaminated at start
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
                targetCommunityId: agentIndex % communitiesPositions.length,       // no target community at start
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
                isVaccinated: false,            // vaccination status initially not vaccinated
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
                agent.isMobile = (agent.communityId === 0);                                 // all agents are stationary on day 1
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
            if(!agent.isActive) return;    // skip inactive agents

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
        if (!agent.isActive) return null;    // skip inactive agents

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
     * Assign vactionation status to non infected agent based on coverage percentage
     * create an array of non-infected by filterring the agents array
     * then randomly select agents to vaccinate ('shuffled' array) based on coverage percentage
     */
    function assignVaccination() {
        // filter non-infected agents
        // create an array of non-infected agents 'suscep[tibleAgents' by filtering the global agents array
        // '.filter' method creates a new array with all elements in side the new array are referenced to the original array that pass the test implemented by the provided function
        // output: array of non-infected agents
        const susceptibleAgents = agents.filter(agent => agent.isActive && !agent.isInfected);

        // calculate number of vsaccinations based on coverage percentage
        const numberOfVaccinations = Math.floor((susceptibleAgents.length * vaccinationCoverage) / 100);

        // shuffle the susceptibleAgents array to randomly pick vaccinated agents
        // `.sort` method odifies the order of original array (susceptibleAgents) but not copying or creating a new array
        // `shuffle` is also pointing at the referwences to the same object of the original array (`agents` array) so it can change the propewrty of the agent object in the original array
        const shuffled = susceptibleAgents.sort(() => Math.random() - 0.5);

        // select agents to vaccinate based on calculated number
        for (let i = 0; i < numberOfVaccinations; i++) {
            shuffled[i].isVaccinated = true;
        }
    }

    /**
     * reset vaccination status for all agents
     * @param {number} coverage - new vaccination coverage percentage (0-100%)
     * @returns {void}
     */
    function updateVaccinationCoverage(coverage) {
        // reset vaccinationCoverage object property
        vaccinationCoverage = coverage;

        // reset vaccination status for all agents
        agents.forEach((agent) => {
            agent.isVaccinated = false;
        });

        // re-assign vaccination based on new coverage
        assignVaccination();

        // re-draw scnene to reflect vaccination changes
        drawScene();
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
                ctx.arc(agent.x, agent.y-10, 9, 0, Math.PI * 2);
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
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
            ctx.strokeStyle = 'grey';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // dashed line
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
        const currentHour = getCurrentHour(timeManager);
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

        // draw entire screen
        drawScene();

        // request next animation frame to continue the animation loop
        animationId = requestAnimationFrame(animate);
    }

    /**
     * Slider input element for controlling vaccination coverage
     * @type {HTMLInputElement}
     */
    let vaccinationSlider = document.getElementById('sim5-vaccination-slider');

    /**
     * Label element displaying current vaccination coverage
     * @type {HTMLSpanElement}
     */
    let vaccinationLabel = document.getElementById('sim5-vaccination-label');

    // set initial slider and label values
    vaccinationCoverage = parseInt(vaccinationSlider.value);
    vaccinationLabel.textContent = vaccinationSlider.value;

    

    // update vaccination slider event listener
    vaccinationSlider.addEventListener('input', (event) => {
        // update vaccination label and coverage value
        vaccinationLabel.textContent = event.target.value;

        // update vaccination coverage in simulation
        updateVaccinationCoverage(parseInt(event.target.value));
    });

    /**
     * initialilse vaccination coverage when the simulation starts
     */
    updateVaccinationCoverage(vaccinationCoverage);

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

        // disable the vaccination slider while simulation is running
        vaccinationSlider.disabled = true;

        // disable the rapid test slider while simulation is running
        rapidTestSlider.disabled = true;

        // initialise agent assignment based on current day 
        activateAgentsForDay();

        // assign bathroom slots for all active agents when simulation starts
        assignDailyBathroomSchedules();

        // assign vaccination status to agents at start
        assignVaccination();

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
        
        // disable the vaccination slider while simulation is running
        vaccinationSlider.disabled = false;

        // disable the rapid test slider while simulation is running
        rapidTestSlider.disabled = false;

        // reset all agents to initial state
        agents.forEach((agent) => {
            agent.x = agent.houseX;
            agent.y = agent.houseY;
            agent.currentLocation = 'house';
            agent.targetLocation = 'house';
            agent.isInfected = agent.communityId === 0 && (agent.agentId === 1 || agent.agentId === 2) ? true : false;;
            agent.infectionStartDay = agent.communityId === 0 && (agent.agentId === 1 || agent.agentId === 2) ? 0 : null;
            agent.isRecovered = false;
            agent.recoveryStartDay = null;
            agent.isActive = true;
            agent.isMobile = false;
            agent.otherCommunityBathroomSlot = 0;
            agent.houseBathroomSlot = 0;
            agent.isTravelingToBathroom = false;
            agent.hasVisitedOtherCommunityBathroomToday = false;
            agent.hasVisitedHouseBathroomToday = false;
            agent.isVaccinated = false;
            agent.isTested = false;
            agent.isIsolated = false;
            agent.isolationStartDay = null;
            agent.isolationEndDay = null;
        });


        // reset waterbodies to initial state
        waterbodies.forEach((waterbody) => {
            waterbody.isContaminated = waterbody.communityId === 0 ? true : false; // only first waterbody is contaminated at start
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

        // reset vaccination assignment
        assignVaccination();

        // redraw the initial scene
        drawScene();
    }

    
    // initial UI state and render with disabled pause button
    pauseButton.disabled = true;            // cannot pause until the simulation is running
    resetButton.disabled = true;             // cannot reset until the simulation is running

    // initial draw
    drawScene();

}) ();
