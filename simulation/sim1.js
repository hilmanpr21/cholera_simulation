(function (){
    /**
     * Simulating basic cholera with daily scheduling
     */

    /**
     * Initialise the canvas context
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById('choleraSim1');
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
     * House object representing a single household
     * @type {{x: number, y: number, isInfected: boolean}}
     * @property {number} x - X coordinate of the house
     * @property {number} y - Y coordinate of the house
     * @property {boolean} isInfected - Infection state of the house
     */
    const house = {
        x: 100, 
        y: 100,
        isInfected: false
    }

    /**
     * Agent object representing a person moving between locations
     * @type {{x: number, y: number, speed: number, itinerary: string[], stepIndex: number, isInfected: boolean}}
     * @property {number} x - Current X position
     * @property {number} y - Current Y position
     * @property {number} speed - Movement speed in pixels per frame
     * @property {string[]} itinerary - Array of location labels to visit in sequence
     * @property {number} stepIndex - Current position in the itinerary
     * @property {boolean} isInfected - Whether the agent is infected with cholera
     */
    let agent = {
        x: house.x+10,          // Agent initial x position
        y: house.y+10,          // Agent initial y position
        speed: 1.5,                // Agent movement speed
        itinerary: ['school', 'schoolWater', 'school', 'house', 'houseWater', 'house'],         // Agent array of locations to visit
        stepIndex: 0,              // current index in the itinerary
        isInfected: false,         // track agent infection state
    }

    /**
     * House water body near the house
     * @type {{x: number, y: number, isContaminated: boolean, contaminatedTime: number}}
     * @property {number} x - X coordinate
     * @property {number} y - Y coordinate
     * @property {boolean} isContaminated - Contamination state
     * @property {number} contaminatedTime - Duration of contamination in milliseconds
     */
    const houseWaterBody = {
        x: house.x-60,
        y: house.y,
        isContaminated: false,           // track waterbody contamination state 
        contaminatedTime: 0             // how long the waterbody has been contaminated, for house contamination logic
    }

    /**
     * School water body near the school
     * @type {{x: number, y: number, isContaminated: boolean}}
     * @property {number} x - X coordinate
     * @property {number} y - Y coordinate
     * @property {boolean} isContaminated - Contamination state
     */
    const schoolWaterBody = {
        x: school.x,
        y: school.y+60,
        isContaminated: false           // track waterbody contamination state 
    }

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
     * Resolves a location label to actual canvas coordinates
     * @param {string} labelInput - Location label ('school', 'schoolWater', 'house', 'houseWater')
     * @returns {{x: number, y: number}} Coordinates of the requested location
     */
    // resolve agent's itinerary lalbels to actual coordinates
    function resolveItinerary(labelInput) {
        switch(labelInput) {
            case 'school': return {x: school.x, y: school.y};
            case 'schoolWater': return {x: schoolWaterBody.x, y: schoolWaterBody.y};
            case 'house': return {x: house.x, y: house.y}
            case 'houseWater': return {x: houseWaterBody.x, y: houseWaterBody.y}
            default: return {x: school.x, y: school.y}
        }
    }

    /**
     * Updates agent position by moving towards the next waypoint in the itinerary
     * Handles movement logic, infection checks, and itinerary progression
     * @returns {void}
     */
    // declare agent movement update function
    function updateAgentMovement() {
        // get agent current waypoint target
        const label = agent.itinerary[agent.stepIndex];         // store agent current itinerary based on `stepIndex`
        const target = resolveItinerary(label);                 // return with coordinate of the target itinerary by calling function "resolveItinerary"    

        // Calculate direction vector
        const dx = target.x - agent.x;
        const dy = target.y - agent.y;
        const distance = Math.hypot(dx, dy);

        // Check if the agent is close enough to the target
        if (distance < agent.speed) {
            agent.x = target.x;
            agent.y = target.y;

            // Check if agent reached contaminated school waterbody
            checkAgentInfection(label);

            // check if agent contaminate house waterbody
            checkHouseWaterContamination(label);

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
    }

    /**
     * Checks if the agent becomes infected when visiting a contaminated water source
     * @param {string} targetLocationInput - The location label the agent just reached
     * @returns {void}
     */
    // decalre agent infection logic
    function checkAgentInfection(targetLocationInput) {
        if (targetLocationInput === 'schoolWater' && schoolWaterBody.isContaminated) {
            agent.isInfected = true;
        }
    }

    /**
     * Checks if an infected agent contaminates the house water body
     * Starts tracking contamination time when contamination occurs
     * @param {string} targetLocationInput - The location label the agent just reached
     * @returns {void}
     */
    // declare house waterbody contamination logic
    function checkHouseWaterContamination(targetLocationInput) {
        if (targetLocationInput === 'houseWater' && agent.isInfected) {
            houseWaterBody.isContaminated = true;

            // start tracking contamination duration
            houseWaterBody.contaminatedTime = 0;
        }
    }

    /**
     * Updates house infection state based on water body contamination duration
     * House becomes infected after contaminated water body exceeds threshold time
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     * @returns {void}
     */
    // update house infection state based on waterbody contamination duration
    function updateHouseInfectionState(deltaTime) {
        if (houseWaterBody.isContaminated && !house.isInfected) {
            // calculate the contamination duration
            houseWaterBody.contaminatedTime += deltaTime;

            // check if contaminated duration exceed the threshold
            if (houseWaterBody.contaminatedTime >= houseInfectionDelay) {
                house.isInfected = true;
            }
        }
    }

    /**
     * Draws all water bodies (house and school) on the canvas
     * Color changes based on contamination state (lightblue = clean, darkblue = contaminated)
     * @returns {void}
     */
    function drawWaterbody() {
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round'; 

        // draw house waterbody
        ctx.beginPath();
        ctx.arc(houseWaterBody.x, houseWaterBody.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = houseWaterBody.isContaminated ? 'darkblue' : 'lightblue';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();

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
        ctx.lineWidth = 2.5;
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
        ctx.lineWidth = 2.5;
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
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }  

    /**
     * Draws the house building with a simple roof
     * Outline color changes to red when house is infected
     * @returns {void}
     */
    function drawHouse() {
        const houseStrokeColor = house.isInfected ? 'red' : 'black';

        ctx.strokeStyle = houseStrokeColor;
        ctx.lineWidth = 2.5;
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
        ctx.lineWidth = 2.5;
        ctx.stroke();

        //
    }

    /**
     * Draws the agent as a stick figure
     * Outline color changes to red when agent is infected
     * @returns {void}
     */
    function drawAgent() {
        ctx.strokeStyle = agent.isInfected ? 'red' : 'black';
        ctx.lineWidth = 2.5;
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
    }

    /**
     * Draw the simulation Environment
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
     * Button element for contaminating the school water body
     * @type {HTMLButtonElement}
     */
    // connect with contamination button on html
    const contaminateButton = document.getElementById('contaminate-water-button');

    // add event listener to contaminate school waterbody
    contaminateButton.addEventListener('click', contaminateSchoolWaterbody);

    /**
     * Toggles contamination state of school water body
     * Updates button appearance and text based on state
     * @returns {void}
     */
    // control helper to contaminate school waterbody
    function contaminateSchoolWaterbody() {
        //toggle contamination state
        schoolWaterBody.isContaminated = !schoolWaterBody.isContaminated;

        // update button appearance based on contamination state
        if (schoolWaterBody.isContaminated) {
            contaminateButton.classList.add('active');
            contaminateButton.textContent = 'Decontaminate School Waterbody';
        }else {
            contaminateButton.classList.remove('active');
            contaminateButton.textContent = 'Contaminate Water';
        }
        
        // redraw the scene to reflect contamination state 
        drawScene();                                    
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
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const resetButton = document.getElementById('reset-button');

    // add event listeners to buttons
    startButton.addEventListener('click', startSimulation);
    pauseButton.addEventListener('click', pauseSimulation);
    resetButton.addEventListener('click', resetSimulation);

    /**
     * Starts the simulation animation
     * Disables start button, enables pause/reset buttons
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

        // record the initial timestamp when simulation starts
        lastTimestamp = performance.now();

        // start the animation
        animationId = requestAnimationFrame(animate);
    }

    /**
     * Pauses the simulation animation
     * Enables start button, disables pause button
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

        // cancel the animation frame
        cancelAnimationFrame(animationId);              // stop the animation
    }

    /**
     * Resets the simulation to initial state
     * Resets agent position, infection states, contamination states
     * Enables start button, disables pause/reset buttons
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


        // Stop the animation frame
        cancelAnimationFrame(animationId);

        // reset agent position
        agent.x = house.x+10;
        agent.y = house.y+10;
        agent.stepIndex = 0;

        //reste agent infection state
        agent.isInfected = false;

        // reset  waterbody contamination state
        schoolWaterBody.isContaminated = false;
        houseWaterBody.isContaminated = false;
        houseWaterBody.contaminationTime = 0;

        // reset contaminate button appearance
        contaminateButton.classList.remove('active');
        contaminateButton.textContent = 'Contaminate Water';

        // reset house infection state
        house.isInfected = false;

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