(function() {
    /**
     * Simulating basic cholera with daily scheduling
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

    const school = {x: canvas.width/2, y: canvas.height/2};

    const schoolWaterBody = {
        x: school.x,
        y: school.y+60,
        isContaminated: false           // track waterbody contamination state 
    }

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

    // initialise house array with predefined position
    const houses = housePosition.map((pos, index) => ({
        x: pos.x,
        y: pos.y,
        isInfected: false,
        id: index 
    }));

    // initialise housewater bodies array corresponding to each house (offset from each house)
    const houseWaterBodies = houses.map((house, index) => ({
        x: house.x > canvas.width / 2 ? house.x + 60 : house.x - 60,
        y: house.y,
        isContaminated: false,
        contaminatedTime: 0,
        houseId: index
    }));

    // initialise agent (one agent per house)
    const agents = houses.map((house, index) => ({
        x: house.x + 10,
        y: house.y + 10, 
        speed: 1.5,
        itinerary: ['school', 'schoolWater', 'school', 'house', 'houseWater', 'house'],
        stepIndex: 0,                           // current index in the itinerary
        isInfected: index === 1 || index === 2 ? true : false,                      // track agent infection state
        houseId: index,                         // associate agent to the house
        isActive: true                          // track if agent is still active in the simulation based on slider input
    }));    

    // Current number of active agents in the simulation
    let activeAgentCount = 5;                   // based on the initial value of the slider

    // declare beginning last timestamp for delta time calculation to calculate howlong the simulation has been running
    let lastTimestamp = 0;

    //track time since house waterbody got contaminated
    const houseInfectionDelay = 1500;                   // 1.5 second delay for house get infected after the waterbody got contaminated

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

    // declare agent movement update function
    function updateAgentMovement() {
        agents.forEach((agent, agentIndex) => {
            if (!agent.isActive) return;         // skip inactive agents

            // get agent current waypoint target
            const label = agent.itinerary[agent.stepIndex];         // store agent current itinerary based on `stepIndex`
            const target = resolveItinerary(label, agentIndex);                 // return with coordinate of the target itinerary by calling function "resolveItinerary"    

            // Calculate direction vector
            const dx = target.x - agent.x;
            const dy = target.y - agent.y;
            const distance = Math.hypot(dx, dy);

            // Check if the agent is close enough to the target
            if (distance < agent.speed) {
                agent.x = target.x;
                agent.y = target.y;

                // Check if agent reached contaminated school waterbody
                checkAgentInfection(label, agentIndex);

                // check if agent contaminate house waterbody
                checkHouseWaterContamination(label, agentIndex);

                // advance move to the next itinerary
                agent.stepIndex = (agent.stepIndex + 1) % agent.itinerary.length;           // add the stepIndex once agent get into the current target
                return;
            }

            // calculate agent step
            const stepX = (dx / distance) * agent.speed;
            const stepY = (dy / distance) * agent.speed;

            // make agent move closer to the step
            agent.x += stepX;
            agent.y += stepY;
        });
    }

    // decalre agent infection logic
    function checkAgentInfection(targetLocationInput, agentIndex) {
        if (targetLocationInput === 'schoolWater' && schoolWaterBody.isContaminated) {
            agents[agentIndex].isInfected = true;
        }
    }

    // declare house waterbody contamination logic
    function checkHouseWaterContamination(targetLocationInput, agentIndex) {
        if (targetLocationInput === 'houseWater' && agents[agentIndex].isInfected) {
            // contaminate the house waterbody
            houseWaterBodies[agentIndex].isContaminated = true;

            // start tracking contamination duration
            houseWaterBodies[agentIndex].contaminatedTime = 0;
        }
    }

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
     * Draw the simulation Environment
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

    // create object to store animation frame ID
    let animationId = null;

    // Declare Animation function
    function animate(timestamp) {
        // calculater delta Time
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // Update agent position based on movement logic
        updateAgentMovement();

        // uppdate house infection state
        updateHouseInfectionState(deltaTime);

        // Redraw the scene
        drawScene();

        // Request the next animation frame
        animationId = requestAnimationFrame(animate)
    }

    // track the slider label number of the current neighborhood number
    let neighborhoodNumber = document.getElementById('sim2-neighbour-number');
    let neighborhoodNumberLabel = document.getElementById('sim2-neighbour-label');
    
    // set initial slider value
    neighborhoodNumberLabel.textContent = neighborhoodNumber.value;
    activeAgentCount = parseInt(neighborhoodNumber.value);

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

    // track agent simulation state
    let isRunning = false;              // track simulation running state

    // connect with button on html
    const startButton = document.getElementById('start-button-sim2');
    const pauseButton = document.getElementById('pause-button-sim2');
    const resetButton = document.getElementById('reset-button-sim2');

    // add event listeners to buttons
    startButton.addEventListener('click', startSimulation);
    pauseButton.addEventListener('click', pauseSimulation);
    resetButton.addEventListener('click', resetSimulation);

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

        // reset agent position and infection state
        agents.forEach((agent, index) => {
            agent.x = houses[index].x + 10;
            agent.y = houses[index].y + 10;
            agent.stepIndex = 0;
            agent.isInfected = false;
        });

        // reset  waterbody contamination state
        schoolWaterBody.isContaminated = false;
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