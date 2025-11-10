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


    const AGENTS_PER_COMMUNITY = 8 // number of agent per community

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
    communitiesPositions.forEach((community) => {
        // generate positions for agents around the (single) community waterbody
        // output: array of positions
        const agentPositions = generateAgentPositions(community.x, community.y, communityRadius, AGENTS_PER_COMMUNITY);

        // generate agents for the community based on each agent position from the agentPositions array
        agentPositions.forEach((pos, index) => {
            //push agent to the (global) agents array
            agents.push({
                x: pos.x,
                y: pos.y,
                communityId: community.id,   // community identifier based on the community index
                agentId: index,               // agent index within community
                isInfected: false,            // all agents start uninfected
                isActive: true,               // all agents are active/visible at start
                speed: 1.5
            });
        });
    });

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
        drawAgent();
        drawWaterbody();
    }

    drawScene();


}) ();
