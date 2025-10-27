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

let agent = {
    x: house.x+10,          // Agent initial x position
    y: house.y+10,          // Agent initial y position
    speed: 1.5,                // Agent movement speed
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
    const target = agent.target === 'school'
    ? {x: school.x, y: school.y} 
    : {x: house.x, y: house.y};

    // Calculate direction vector
    const dx = target.x - agent.x;
    const dy = target.y - agent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if the agent is close enough to the target
    if (distance < agent.speed) {
        // switch target
        agent.target = agent.target === 'school' ? 'house' : 'school';
        return;
    }

    // calculate agent step
    const stepX = (dx / distance) * agent.speed;
    const stepY = (dy / distance) * agent.speed;

    // make agent move closer to the step
    agent.x += stepX;
    agent.y += stepY;
}

function drawWaterbody() {
    
ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round'; 

    // draw house waterbody
    ctx.beginPath();
    ctx.arc(houseWaterBody.x, houseWaterBody.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'lightblue';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // draw school waterbody
    ctx.beginPath();
    ctx.arc(schoolWaterBody.x, schoolWaterBody.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'lightblue';
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
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // draw rectangle
    ctx.beginPath();
    ctx.rect(house.x - 10, house.y - 10, 20, 20);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // draw roof
    ctx.beginPath();
    ctx.moveTo(house.x-10, house.y-10);
    ctx.lineTo(house.x+10, house.y-10);
    ctx.lineTo(house.x, house.y-20);
    ctx.closePath();
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    //
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
    // Update agent position based on movement logic
    updateAgentMovement();

    // Redraw the scene
    drawScene();

    // Request the next animation frame
    animationId = requestAnimationFrame(animate)
}

// track agent simulation state
let isRunning = false;              // track simulation running state

// connect with button on html
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');

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


    // Stop the animation frame
    cancelAnimationFrame(animationId);

    // reset agent position
    agent.x = house.x+10;
    agent.y = house.y+10;
    agent.target = 'school';

    // redraw the initial scene
    drawScene();


}

// initial UI state and render with disabled pause button
pauseButton.disabled = true;            // cannot pause until the simulation is running
resetButton.disabled = true;             // cannot reset until the simulation is running

drawScene();