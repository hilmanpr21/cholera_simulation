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

const school = {x: canvas.width/2, y: canvas.height/2};

const house = {x: 150, y: 150}

const agent = {
    x: house.x+40,          // Agent initial x position
    y: house.y+40,          // Agent initial y position
    speed: 2,                // Agent movement speed
    target: 'school'         // Agent target location
}

const houseWaterBody = {
    x: house.x-60,
    y: house.y
}

const schoolWaterBody = {
    x: school.x,
    y: school.y+60
}

function updateAgentMovement() {
    // simple movement towards target
    const target = agent.target === 'house' ? house : school;

    // Calculate direction vector
    const dx = target.x - agent.x;
    const dy = target.y - agent.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
}

function drawWaterbody() {
    // draw house waterbody
    ctx.beginPath();
    ctx.arc(houseWaterBody.x, houseWaterBody.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
    roughCanvas.circle(houseWaterBody.x, houseWaterBody.y, 30, {
        fill: 'lightblue',
        fillStyle: 'hachure',
        hachureAngle: 60,
        hachureGap: 2
    })

    // draw house waterbody
    ctx.beginPath();
    ctx.arc(schoolWaterBody.x, schoolWaterBody.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
    roughCanvas.circle(schoolWaterBody.x, schoolWaterBody.y, 30, {
        fill: 'lightblue',
        fillStyle: 'hachure',
        hachureAngle: 60,
        hachureGap: 2
    })

}

function drawSchool() {
    // draw rectangle
    roughCanvas.rectangle(school.x - 10, school.y - 10, 20, 20, {
        stroke: 'black',
        fill: 'lightblue',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureAngle: 60,
        hachureGap: 2
    })

    // draw second rectangle 
     roughCanvas.rectangle(school.x + 10, school.y - 10, 22, 20, {
        stroke: 'black',
        fill: 'lightblue',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureAngle: 60,
        hachureGap: 2
    })

    // draw roof
    ctx.beginPath();
    ctx.moveTo(school.x-10, school.y-10);
    ctx.lineTo(school.x+10, school.y-10);
    ctx.lineTo(school.x, school.y-20);
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // draw back roof
    roughCanvas.polygon([[school.x+10, school.y-10], [school.x+30, school.y-10], [school.x+22, school.y-20], [school.x, school.y-20]], {
        stroke: 'black',
        fill: 'lightblue',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureAngle: 60,
        hachureGap: 2
    })
}  

function drawHouse() {
    // draw rectangle
    roughCanvas.rectangle(house.x - 10, house.y - 10, 20, 20, {
        stroke: 'black',
        fill: 'lightblue',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureAngle: 60,
        hachureGap: 2
    })
    ctx.rect(house.x - 10, house.y - 10, 20, 20);
    ctx.fillStyle = 'lightblue';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // draw roof
    ctx.beginPath();
    ctx.moveTo(house.x-10, house.y-10);
    ctx.lineTo(house.x+10, house.y-10);
    ctx.lineTo(house.x, house.y-20);
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

}

function drawAgent() {
    ctx.strokeStyle = 'black';
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
    drawAgent();
    drawWaterbody();
}

// create object to store animation frame ID
let animationId = null;

// Declare Animation function
function animate() {
    // Update agent movement
    updateAgentMovement();

    // Redraw the scene
    drawScene();

    // Request the next animation frame
    animationId = requestAnimationFrame(animate)
}


// Start the animation
animationId = requestAnimationFrame(animate)


drawScene();