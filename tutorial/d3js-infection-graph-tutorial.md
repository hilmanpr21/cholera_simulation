# D3.js Infection Tracking Graph Tutorial

## Introduction

This tutorial will guide you through creating an interactive infection tracking graph using D3.js. You'll learn fundamental D3.js concepts including selections, data binding, scales, axes, and transitions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [What is D3.js?](#what-is-d3js)
3. [Step 1: Include D3.js Library](#step-1-include-d3js-library)
4. [Step 2: Create HTML Container](#step-2-create-html-container)
5. [Step 3: Add CSS Styling](#step-3-add-css-styling)
6. [Step 4: Configure Graph Parameters](#step-4-configure-graph-parameters)
7. [Step 5: Initialize Data Structure](#step-5-initialize-data-structure)
8. [Step 6: Set Up SVG Canvas](#step-6-set-up-svg-canvas)
9. [Step 7: Create Scales](#step-7-create-scales)
10. [Step 8: Create and Append Axes](#step-8-create-and-append-axes)
11. [Step 9: Add Axis Labels](#step-9-add-axis-labels)
12. [Step 10: Create Line and Dots Groups](#step-10-create-line-and-dots-groups)
13. [Step 11: Log Infection Data](#step-11-log-infection-data)
14. [Step 12: Draw the Graph](#step-12-draw-the-graph)
15. [Step 13: Add Interactivity (Tooltips)](#step-13-add-interactivity-tooltips)
16. [Step 14: Reset Functionality](#step-14-reset-functionality)
17. [Complete Code](#complete-code)

---

## Prerequisites

- Basic understanding of JavaScript
- Familiarity with HTML and CSS
- Understanding of SVG (Scalable Vector Graphics) is helpful but not required

---

## What is D3.js?

**D3.js** (Data-Driven Documents) is a JavaScript library for creating dynamic, interactive data visualizations in web browsers. It uses HTML, SVG, and CSS.

**Key Concepts:**
- **Data Binding**: Connect data to DOM elements
- **Selections**: Select and manipulate DOM elements
- **Scales**: Transform data values to visual coordinates
- **Axes**: Create axis components automatically
- **Transitions**: Animate changes smoothly

---

## Step 1: Include D3.js Library

First, add the D3.js library to your HTML file.

### Code:

```html
<head>
    <!-- Add D3.js library from CDN -->
    <script src="https://d3js.org/d3.v7.min.js"></script>
</head>
```

### Explanation:

- **`<script src="...">`**: Loads the D3.js library from a Content Delivery Network (CDN)
- **`d3.v7.min.js`**: Version 7 of D3.js (the latest stable version)
- **`.min.js`**: Minified version for faster loading

---

## Step 2: Create HTML Container

Create a container in your HTML where the D3.js graph will be rendered.

### Code:

```html
<div class="graph-section">
    <h4>Infection Tracking</h4>
    <div id="infection-graph-sim2"></div>
</div>
```

### Explanation:

- **`<div class="graph-section">`**: Wrapper container for styling
- **`<h4>Infection Tracking</h4>`**: Title for the graph
- **`<div id="infection-graph-sim2">`**: Container where D3.js will append the SVG element
  - The `id` is used to select this element in JavaScript

---

## Step 3: Add CSS Styling

Add basic CSS styling for the graph container and D3.js elements.

### Code:

```css
/* Graph section styling */
.graph-section {
    margin-top: 20px;
    width: 100%;
}

.graph-section h4 {
    margin-bottom: 10px;
    text-align: left;
}

/* D3 graph axis styling */
#infection-graph-sim2 .x-axis path,
#infection-graph-sim2 .y-axis path,
#infection-graph-sim2 .x-axis line,
#infection-graph-sim2 .y-axis line {
    stroke: #333;
    stroke-width: 2;
}

#infection-graph-sim2 .x-axis text,
#infection-graph-sim2 .y-axis text {
    font-family: monospace;
    font-size: 12px;
}
```

### Explanation:

**`.graph-section`**:
- `margin-top: 20px`: Adds space above the graph
- `width: 100%`: Makes the container full width

**Axis Styling**:
- `.x-axis path, .y-axis path`: Selects the axis lines
- `stroke: #333`: Dark gray color for axes
- `stroke-width: 2`: Thickness of axis lines
- `.x-axis text, .y-axis text`: Styles the tick labels
- `font-family: monospace`: Matches your site's font style

---

## Step 4: Configure Graph Parameters

Define configuration objects for easy customization.

### Code:

```javascript
/**
 * Graph configuration for infection tracking
 * @type {{maxDays: number, householdMultiplier: number}}
 */
const graphConfig = {
    maxDays: 5,              // Number of days to display on graph
    householdMultiplier: 3   // Each household represents 3 agents
};
```

### Explanation:

**Line by line:**

1. **`const graphConfig = { ... }`**: Creates a configuration object
2. **`maxDays: 5`**: X-axis will show 0 to 5 days
   - Easy to change (e.g., to 10 days)
3. **`householdMultiplier: 3`**: Each infected household adds 3 to the infection count
   - Makes changes more dramatic in the visualization

---

## Step 5: Initialize Data Structure

Create an array to store infection data over time.

### Code:

```javascript
/**
 * Infection tracking data structure
 * @type {Array<{day: number, infectedAgents: number, infectedHouseholds: number, totalInfected: number}>}
 */
let infectionData = [];
```

### Explanation:

- **`let infectionData = []`**: Initialize an empty array
  - `let` allows us to reassign the array (for resetting)
- **Data structure**: Each entry will be an object with:
  - `day`: Day number (0, 1, 2, ...)
  - `infectedAgents`: Count of infected agents
  - `infectedHouseholds`: Count of infected households
  - `totalInfected`: Combined count (agents + households × multiplier)

---

## Step 6: Set Up SVG Canvas

Create the SVG element and set up the coordinate system.

### Code:

```javascript
// 1. Select the container
const graphContainer = d3.select('#infection-graph-sim2');

// 2. Define margins and dimensions
const graphMargin = { top: 20, right: 30, bottom: 40, left: 50 };
const graphWidth = 600 - graphMargin.left - graphMargin.right;
const graphHeight = 200 - graphMargin.top - graphMargin.bottom;

// 3. Create SVG element
const svg = graphContainer
    .append('svg')
    .attr('width', 600)
    .attr('height', 200)
    .style('background-color', '#f9f9f9')
    .style('border', '1px solid #ccc');

// 4. Create main group for the graph
const graphGroup = svg
    .append('g')
    .attr('transform', `translate(${graphMargin.left}, ${graphMargin.top})`);
```

### Explanation Line by Line:

**1. Select the container:**
```javascript
const graphContainer = d3.select('#infection-graph-sim2');
```
- **`d3.select()`**: D3.js method to select a single DOM element
- **`'#infection-graph-sim2'`**: CSS selector (# means ID)
- Returns a D3 selection object

**2. Define margins:**
```javascript
const graphMargin = { top: 20, right: 30, bottom: 40, left: 50 };
```
- Creates space for axes and labels
- `left: 50`: Space for Y-axis labels
- `bottom: 40`: Space for X-axis labels

```javascript
const graphWidth = 600 - graphMargin.left - graphMargin.right;
const graphHeight = 200 - graphMargin.top - graphMargin.bottom;
```
- **`graphWidth`**: Actual plotting area width = 600 - 50 - 30 = 520px
- **`graphHeight`**: Actual plotting area height = 200 - 20 - 40 = 140px

**3. Create SVG:**
```javascript
const svg = graphContainer.append('svg')
```
- **`.append('svg')`**: Adds an `<svg>` element to the container

```javascript
    .attr('width', 600)
    .attr('height', 200)
```
- **`.attr()`**: Sets attributes on the SVG element
- Sets total width and height

```javascript
    .style('background-color', '#f9f9f9')
    .style('border', '1px solid #ccc');
```
- **`.style()`**: Sets CSS styles
- Light gray background and border

**4. Create group:**
```javascript
const graphGroup = svg.append('g')
```
- **`<g>`**: SVG group element (container for other elements)
- Used to apply transformations to multiple elements

```javascript
    .attr('transform', `translate(${graphMargin.left}, ${graphMargin.top})`);
```
- **`transform: translate()`**: Moves the coordinate system
- Shifts everything by left margin (50px) and top margin (20px)
- Creates space for axes

**Visual representation:**
```
┌─────────────────────────────────────┐
│ SVG (600 × 200)                     │
│  ┌──────────────────────────────┐   │
│  │ graphGroup (shifted)         │   │
│  │ This is where we draw        │   │
│  │ (graphWidth × graphHeight)   │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
   ↑50px          ↑20px
```

---

## Step 7: Create Scales

Scales map data values to pixel coordinates.

### Code:

```javascript
// Create X scale (days → horizontal position)
const xScale = d3.scaleLinear()
    .domain([0, graphConfig.maxDays])
    .range([0, graphWidth]);

// Create Y scale (infection count → vertical position)
const yScale = d3.scaleLinear()
    .range([graphHeight, 0]);
```

### Explanation Line by Line:

**X Scale:**
```javascript
const xScale = d3.scaleLinear()
```
- **`d3.scaleLinear()`**: Creates a linear scale (proportional mapping)
- Returns a scale function

```javascript
    .domain([0, graphConfig.maxDays])
```
- **`.domain()`**: Input range (data values)
- Days will range from 0 to 5

```javascript
    .range([0, graphWidth])
```
- **`.range()`**: Output range (pixel values)
- 0 to 520 pixels (left to right)

**Example:** If `graphConfig.maxDays = 5` and `graphWidth = 520`:
- Day 0 → 0px
- Day 2.5 → 260px
- Day 5 → 520px

**Y Scale:**
```javascript
const yScale = d3.scaleLinear()
    .range([graphHeight, 0]);
```
- **`.range([graphHeight, 0])`**: Note the reversed order!
  - SVG coordinate system: (0,0) is top-left
  - We want higher values at the top, so we reverse
  - 0 infections → bottom (140px)
  - Max infections → top (0px)

**Note:** Y scale domain is set later when we know the max infection count.

---

## Step 8: Create and Append Axes

D3.js can automatically generate axis components.

### Code:

```javascript
// Create X axis generator
const xAxis = d3.axisBottom(xScale)
    .ticks(graphConfig.maxDays)
    .tickFormat(d => d);

// Create Y axis generator
const yAxis = d3.axisLeft(yScale)
    .ticks(5);

// Append X axis to the graph
const xAxisGroup = graphGroup
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${graphHeight})`)
    .call(xAxis);

// Append Y axis to the graph
const yAxisGroup = graphGroup
    .append('g')
    .attr('class', 'y-axis')
    .call(yAxis);
```

### Explanation Line by Line:

**Create X axis generator:**
```javascript
const xAxis = d3.axisBottom(xScale)
```
- **`d3.axisBottom()`**: Creates a bottom-oriented axis
- Uses the `xScale` to position ticks

```javascript
    .ticks(graphConfig.maxDays)
```
- **`.ticks()`**: Suggests number of ticks (D3 may adjust)
- We want ticks at each day (0, 1, 2, 3, 4, 5)

```javascript
    .tickFormat(d => d)
```
- **`.tickFormat()`**: Custom formatting function
- `d => d`: Identity function (show the value as-is)
- Could be `d => "Day " + d` for "Day 0", "Day 1", etc.

**Create Y axis generator:**
```javascript
const yAxis = d3.axisLeft(yScale)
    .ticks(5);
```
- **`d3.axisLeft()`**: Creates a left-oriented axis
- **`.ticks(5)`**: Approximately 5 tick marks

**Append X axis:**
```javascript
const xAxisGroup = graphGroup.append('g')
```
- Create a group for the X axis

```javascript
    .attr('class', 'x-axis')
```
- Add class for CSS styling

```javascript
    .attr('transform', `translate(0, ${graphHeight})`)
```
- Move axis to the bottom of the graph
- Translate down by `graphHeight` (140px)

```javascript
    .call(xAxis);
```
- **`.call()`**: Invokes the `xAxis` function on this selection
- Generates all the axis elements (line, ticks, labels)

**Append Y axis:**
```javascript
const yAxisGroup = graphGroup.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);
```
- Similar to X axis, but no translation needed (already on left)

---

## Step 9: Add Axis Labels

Add text labels to describe what each axis represents.

### Code:

```javascript
// Add X axis label
svg.append('text')
    .attr('class', 'x-axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', graphMargin.left + graphWidth / 2)
    .attr('y', 200 - 10)
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text('Days');

// Add Y axis label (rotated)
svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(15, ${graphMargin.top + graphHeight / 2}) rotate(-90)`)
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text('Infected Count');
```

### Explanation Line by Line:

**X axis label:**
```javascript
svg.append('text')
```
- Add a `<text>` element to the SVG

```javascript
    .attr('text-anchor', 'middle')
```
- **`text-anchor`**: Alignment of text
- `'middle'`: Center the text on the x position

```javascript
    .attr('x', graphMargin.left + graphWidth / 2)
```
- Position at horizontal center of the graph
- `50 + 520/2 = 50 + 260 = 310px`

```javascript
    .attr('y', 200 - 10)
```
- Position near the bottom
- 10px from the bottom edge

```javascript
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text('Days');
```
- Style the text and set content

**Y axis label:**
```javascript
    .attr('transform', `translate(15, ${graphMargin.top + graphHeight / 2}) rotate(-90)`)
```
- **`translate(15, Y)`**: Move to left side
- **`rotate(-90)`**: Rotate 90 degrees counter-clockwise
- Text reads bottom-to-top on the left side

---

## Step 10: Create Line and Dots Groups

Pre-create groups for the line path and data point circles.

### Code:

```javascript
// Create grid lines group
const gridGroup = graphGroup.append('g').attr('class', 'grid');

// Create line path
const linePath = graphGroup
    .append('path')
    .attr('class', 'infection-line')
    .attr('fill', 'none')
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 3);

// Create dots group
const dotsGroup = graphGroup.append('g').attr('class', 'dots');
```

### Explanation Line by Line:

**Grid group:**
```javascript
const gridGroup = graphGroup.append('g').attr('class', 'grid');
```
- Container for horizontal grid lines
- Will be populated later

**Line path:**
```javascript
const linePath = graphGroup.append('path')
```
- **`<path>`**: SVG element for drawing complex shapes
- Used to draw the infection trend line

```javascript
    .attr('class', 'infection-line')
```
- Class for potential CSS styling

```javascript
    .attr('fill', 'none')
```
- No fill color (just a line, not a filled shape)

```javascript
    .attr('stroke', '#e74c3c')
```
- Red stroke color (`#e74c3c` is a red shade)

```javascript
    .attr('stroke-width', 3);
```
- 3 pixel thick line

**Dots group:**
```javascript
const dotsGroup = graphGroup.append('g').attr('class', 'dots');
```
- Container for data point circles
- Each data point will be a circle

---

## Step 11: Log Infection Data

Function to record infection counts for each day.

### Code:

```javascript
/**
 * Logs current infection state for the current day
 * Only logs once per day to avoid duplicate entries
 */
function logInfectionData() {
    const currentDay = getCurrentDay(timeManager);

    // Check if we already logged data for this day
    if (infectionData.length > 0 && infectionData[infectionData.length - 1].day === currentDay) {
        return; // Already logged for this day
    }

    // Count infected agents (only active ones)
    const infectedAgentCount = agents.filter(agent => agent.isActive && agent.isInfected).length;

    // Count infected households (only for active agents)
    const infectedHouseholdCount = houses.filter((house, index) => 
        agents[index].isActive && house.isInfected
    ).length;

    // Calculate total infected with household multiplier
    const totalInfected = infectedAgentCount + (infectedHouseholdCount * graphConfig.householdMultiplier);

    // Add to infection data
    infectionData.push({
        day: currentDay,
        infectedAgents: infectedAgentCount,
        infectedHouseholds: infectedHouseholdCount,
        totalInfected: totalInfected
    });

    // Update the graph
    drawInfectionGraph();
}
```

### Explanation Line by Line:

```javascript
const currentDay = getCurrentDay(timeManager);
```
- Get the current simulation day (0, 1, 2, ...)

```javascript
if (infectionData.length > 0 && infectionData[infectionData.length - 1].day === currentDay) {
    return;
}
```
- **Guard clause**: Prevent duplicate logging
- `infectionData.length > 0`: Check if array has data
- `infectionData[infectionData.length - 1]`: Last entry in array
- `.day === currentDay`: If last entry is for current day, exit

```javascript
const infectedAgentCount = agents.filter(agent => agent.isActive && agent.isInfected).length;
```
- **`.filter()`**: Returns array of agents matching condition
- **`agent.isActive && agent.isInfected`**: Both conditions must be true
- **`.length`**: Count how many match

```javascript
const infectedHouseholdCount = houses.filter((house, index) => 
    agents[index].isActive && house.isInfected
).length;
```
- Count infected houses, but only for active agents
- **`(house, index)`**: Filter receives element and index
- **`agents[index].isActive`**: Check corresponding agent

```javascript
const totalInfected = infectedAgentCount + (infectedHouseholdCount * graphConfig.householdMultiplier);
```
- Combine counts
- Each household represents 3 people, so multiply

```javascript
infectionData.push({
    day: currentDay,
    infectedAgents: infectedAgentCount,
    infectedHouseholds: infectedHouseholdCount,
    totalInfected: totalInfected
});
```
- **`.push()`**: Add new object to array
- Stores all relevant data for this day

```javascript
drawInfectionGraph();
```
- Redraw the graph with new data

---

## Step 12: Draw the Graph

The main function that renders the visualization.

### Code:

```javascript
/**
 * Draws the infection tracking graph using D3.js
 * Shows total infected count over time
 */
function drawInfectionGraph() {
    // 1. Calculate max possible infected
    const maxPossibleInfected = activeAgentCount + (activeAgentCount * graphConfig.householdMultiplier);

    // 2. Update Y scale domain
    yScale.domain([0, maxPossibleInfected]);

    // 3. Update Y axis with transition
    yAxisGroup
        .transition()
        .duration(500)
        .call(yAxis);

    // 4. Update grid lines
    const yTicks = yScale.ticks(5);
    const gridLines = gridGroup.selectAll('.grid-line')
        .data(yTicks);

    // Enter + Update
    gridLines.enter()
        .append('line')
        .attr('class', 'grid-line')
        .merge(gridLines)
        .attr('x1', 0)
        .attr('x2', graphWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);

    // Exit
    gridLines.exit().remove();

    // 5. Create line generator
    const lineGenerator = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.totalInfected))
        .curve(d3.curveMonotoneX);

    // 6. Update line path
    if (infectionData.length > 1) {
        linePath
            .datum(infectionData.filter(d => d.day <= graphConfig.maxDays))
            .transition()
            .duration(500)
            .attr('d', lineGenerator);
    } else {
        linePath.attr('d', null);
    }

    // 7. Update dots (data points)
    const dots = dotsGroup.selectAll('.dot')
        .data(infectionData.filter(d => d.day <= graphConfig.maxDays));

    // Enter
    const dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 0)
        .attr('fill', '#e74c3c')
        .attr('cx', d => xScale(d.day))
        .attr('cy', d => yScale(d.totalInfected));

    // Enter + Update
    dotsEnter.merge(dots)
        .transition()
        .duration(500)
        .attr('r', 4)
        .attr('cx', d => xScale(d.day))
        .attr('cy', d => yScale(d.totalInfected));

    // Exit
    dots.exit()
        .transition()
        .duration(300)
        .attr('r', 0)
        .remove();
}
```

### Explanation Line by Line:

**1. Calculate max infections:**
```javascript
const maxPossibleInfected = activeAgentCount + (activeAgentCount * graphConfig.householdMultiplier);
```
- Maximum possible: all agents + all households
- Used to set Y-axis scale

**2. Update Y scale:**
```javascript
yScale.domain([0, maxPossibleInfected]);
```
- Set Y scale input range (data values)
- From 0 to maximum possible infections

**3. Update Y axis:**
```javascript
yAxisGroup
    .transition()
    .duration(500)
    .call(yAxis);
```
- **`.transition()`**: Animate changes
- **`.duration(500)`**: 500 milliseconds animation
- **`.call(yAxis)`**: Regenerate axis with new scale

**4. Update grid lines:**
```javascript
const yTicks = yScale.ticks(5);
```
- Get the Y-axis tick values (5 values)

```javascript
const gridLines = gridGroup.selectAll('.grid-line')
    .data(yTicks);
```
- **`.selectAll('.grid-line')`**: Select all grid lines (may not exist yet)
- **`.data(yTicks)`**: Bind tick values to grid lines

**Enter-Update-Exit Pattern:**

This is a fundamental D3.js pattern for managing data-driven elements:

```javascript
// ENTER: Create new elements for new data
gridLines.enter()
    .append('line')
    .attr('class', 'grid-line')
```
- **`.enter()`**: Selection of data points without matching elements
- **`.append('line')`**: Create `<line>` for each new data point

```javascript
    .merge(gridLines)
```
- **`.merge()`**: Combine ENTER and UPDATE selections
- Following attributes apply to both new and existing lines

```javascript
    .attr('x1', 0)
    .attr('x2', graphWidth)
```
- Horizontal line from left (0) to right (graphWidth)

```javascript
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
```
- **`d => yScale(d)`**: Function receives data value `d`
- Convert data value to Y position using scale
- Same Y for both ends (horizontal line)

```javascript
    .attr('stroke', '#ddd')
    .attr('stroke-width', 1);
```
- Light gray, thin lines

```javascript
// EXIT: Remove elements without matching data
gridLines.exit().remove();
```
- **`.exit()`**: Selection of elements without matching data
- **`.remove()`**: Delete these elements from DOM

**5. Create line generator:**
```javascript
const lineGenerator = d3.line()
```
- **`d3.line()`**: Creates a line generator function
- Converts array of data into SVG path string

```javascript
    .x(d => xScale(d.day))
```
- **`.x()`**: Define how to get X coordinate
- `d.day`: Get day from data object
- `xScale()`: Convert to pixel position

```javascript
    .y(d => yScale(d.totalInfected))
```
- **`.y()`**: Define how to get Y coordinate
- Similar to X

```javascript
    .curve(d3.curveMonotoneX);
```
- **`.curve()`**: Interpolation method
- **`d3.curveMonotoneX`**: Smooth curve that preserves monotonicity
- Other options: `d3.curveLinear` (straight lines), `d3.curveBasis` (smoother)

**6. Update line path:**
```javascript
if (infectionData.length > 1) {
```
- Only draw line if we have at least 2 data points

```javascript
    linePath
        .datum(infectionData.filter(d => d.day <= graphConfig.maxDays))
```
- **`.datum()`**: Bind single data value (not array of elements)
- **`.filter()``: Only show data within maxDays range

```javascript
        .transition()
        .duration(500)
        .attr('d', lineGenerator);
```
- Animate the path update
- **`'d'`**: SVG path data attribute
- `lineGenerator`: Generates path string from data

```javascript
} else {
    linePath.attr('d', null);
}
```
- If only 1 point, clear the line

**7. Update dots:**

This uses the Enter-Update-Exit pattern for circles:

```javascript
const dots = dotsGroup.selectAll('.dot')
    .data(infectionData.filter(d => d.day <= graphConfig.maxDays));
```
- Select all dots and bind filtered data

```javascript
// ENTER
const dotsEnter = dots.enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('r', 0)
    .attr('fill', '#e74c3c')
    .attr('cx', d => xScale(d.day))
    .attr('cy', d => yScale(d.totalInfected));
```
- Create new circles with radius 0 (invisible)
- **`cx`**: Center X position
- **`cy`**: Center Y position

```javascript
// ENTER + UPDATE
dotsEnter.merge(dots)
    .transition()
    .duration(500)
    .attr('r', 4)
    .attr('cx', d => xScale(d.day))
    .attr('cy', d => yScale(d.totalInfected));
```
- Animate new and existing dots to radius 4
- Update positions

```javascript
// EXIT
dots.exit()
    .transition()
    .duration(300)
    .attr('r', 0)
    .remove();
```
- Shrink removed dots to 0, then delete

---

## Step 13: Add Interactivity (Tooltips)

Add hover effects and tooltips to data points.

### Code:

```javascript
// Add tooltips on hover (add this at the end of drawInfectionGraph function)
dotsGroup.selectAll('.dot')
    .on('mouseover', function(event, d) {
        // Enlarge the dot
        d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6);

        // Show tooltip
        const tooltip = graphGroup.append('g')
            .attr('class', 'tooltip')
            .attr('transform', `translate(${xScale(d.day)}, ${yScale(d.totalInfected) - 20})`);

        tooltip.append('rect')
            .attr('x', -40)
            .attr('y', -20)
            .attr('width', 80)
            .attr('height', 18)
            .attr('fill', 'white')
            .attr('stroke', '#333')
            .attr('rx', 3);

        tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -8)
            .style('font-size', '12px')
            .text(`Day ${d.day}: ${d.totalInfected}`);
    })
    .on('mouseout', function() {
        // Restore original size
        d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4);

        // Remove tooltip
        graphGroup.selectAll('.tooltip').remove();
    });
```

### Explanation Line by Line:

```javascript
dotsGroup.selectAll('.dot')
    .on('mouseover', function(event, d) {
```
- **`.on('mouseover', ...)`**: Attach event listener
- **`function(event, d)`**: Callback receives:
  - `event`: DOM event object
  - `d`: Data bound to this element

```javascript
        d3.select(this)
```
- **`this`**: The DOM element being hovered (the circle)
- **`d3.select(this)`**: Create D3 selection of current element

```javascript
            .transition()
            .duration(200)
            .attr('r', 6);
```
- Animate radius from 4 to 6 (enlarge dot)

```javascript
        const tooltip = graphGroup.append('g')
            .attr('class', 'tooltip')
            .attr('transform', `translate(${xScale(d.day)}, ${yScale(d.totalInfected) - 20})`);
```
- Create tooltip group
- Position 20px above the data point

```javascript
        tooltip.append('rect')
            .attr('x', -40)
            .attr('y', -20)
            .attr('width', 80)
            .attr('height', 18)
            .attr('fill', 'white')
            .attr('stroke', '#333')
            .attr('rx', 3);
```
- Create background rectangle
- **`x: -40, width: 80`**: Centered horizontally
- **`rx: 3`**: Rounded corners

```javascript
        tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -8)
            .style('font-size', '12px')
            .text(`Day ${d.day}: ${d.totalInfected}`);
```
- Add text showing day and infection count
- Template literal: `` `Day ${d.day}: ${d.totalInfected}` ``

```javascript
    .on('mouseout', function() {
```
- When mouse leaves the dot

```javascript
        d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4);
```
- Restore original size

```javascript
        graphGroup.selectAll('.tooltip').remove();
```
- Remove all tooltips

---

## Step 14: Reset Functionality

Function to clear the graph when simulation resets.

### Code:

```javascript
/**
 * Resets the infection graph to initial empty state
 */
function resetInfectionGraph() {
    infectionData = [];
    linePath.attr('d', null);
    dotsGroup.selectAll('.dot').remove();
    gridGroup.selectAll('.grid-line').remove();
}
```

### Explanation Line by Line:

```javascript
infectionData = [];
```
- Clear the data array

```javascript
linePath.attr('d', null);
```
- Remove the line path (set path data to null)

```javascript
dotsGroup.selectAll('.dot').remove();
```
- Select all dots and remove them from DOM

```javascript
gridGroup.selectAll('.grid-line').remove();
```
- Remove all grid lines

---

## Complete Code

Here's the complete D3.js implementation:

```javascript
/**
 * Graph configuration
 */
const graphConfig = {
    maxDays: 5,
    householdMultiplier: 3
};

/**
 * Data structure
 */
let infectionData = [];

/**
 * D3.js graph setup
 */
const graphContainer = d3.select('#infection-graph-sim2');
const graphMargin = { top: 20, right: 30, bottom: 40, left: 50 };
const graphWidth = 600 - graphMargin.left - graphMargin.right;
const graphHeight = 200 - graphMargin.top - graphMargin.bottom;

// Create SVG
const svg = graphContainer
    .append('svg')
    .attr('width', 600)
    .attr('height', 200)
    .style('background-color', '#f9f9f9')
    .style('border', '1px solid #ccc');

// Create graph group
const graphGroup = svg
    .append('g')
    .attr('transform', `translate(${graphMargin.left}, ${graphMargin.top})`);

// Create scales
const xScale = d3.scaleLinear()
    .domain([0, graphConfig.maxDays])
    .range([0, graphWidth]);

const yScale = d3.scaleLinear()
    .range([graphHeight, 0]);

// Create axes
const xAxis = d3.axisBottom(xScale)
    .ticks(graphConfig.maxDays)
    .tickFormat(d => d);

const yAxis = d3.axisLeft(yScale)
    .ticks(5);

// Append axes
const xAxisGroup = graphGroup
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${graphHeight})`)
    .call(xAxis);

const yAxisGroup = graphGroup
    .append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

// Add axis labels
svg.append('text')
    .attr('class', 'x-axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', graphMargin.left + graphWidth / 2)
    .attr('y', 200 - 10)
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text('Days');

svg.append('text')
    .attr('class', 'y-axis-label')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(15, ${graphMargin.top + graphHeight / 2}) rotate(-90)`)
    .style('font-weight', 'bold')
    .style('font-size', '14px')
    .text('Infected Count');

// Create line and dots groups
const gridGroup = graphGroup.append('g').attr('class', 'grid');

const linePath = graphGroup
    .append('path')
    .attr('class', 'infection-line')
    .attr('fill', 'none')
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 3);

const dotsGroup = graphGroup.append('g').attr('class', 'dots');

/**
 * Log infection data
 */
function logInfectionData() {
    const currentDay = getCurrentDay(timeManager);

    if (infectionData.length > 0 && infectionData[infectionData.length - 1].day === currentDay) {
        return;
    }

    const infectedAgentCount = agents.filter(agent => agent.isActive && agent.isInfected).length;
    const infectedHouseholdCount = houses.filter((house, index) => 
        agents[index].isActive && house.isInfected
    ).length;
    const totalInfected = infectedAgentCount + (infectedHouseholdCount * graphConfig.householdMultiplier);

    infectionData.push({
        day: currentDay,
        infectedAgents: infectedAgentCount,
        infectedHouseholds: infectedHouseholdCount,
        totalInfected: totalInfected
    });

    drawInfectionGraph();
}

/**
 * Draw the graph
 */
function drawInfectionGraph() {
    const maxPossibleInfected = activeAgentCount + (activeAgentCount * graphConfig.householdMultiplier);

    yScale.domain([0, maxPossibleInfected]);

    yAxisGroup
        .transition()
        .duration(500)
        .call(yAxis);

    // Grid lines
    const yTicks = yScale.ticks(5);
    const gridLines = gridGroup.selectAll('.grid-line')
        .data(yTicks);

    gridLines.enter()
        .append('line')
        .attr('class', 'grid-line')
        .merge(gridLines)
        .attr('x1', 0)
        .attr('x2', graphWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);

    gridLines.exit().remove();

    // Line
    const lineGenerator = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.totalInfected))
        .curve(d3.curveMonotoneX);

    if (infectionData.length > 1) {
        linePath
            .datum(infectionData.filter(d => d.day <= graphConfig.maxDays))
            .transition()
            .duration(500)
            .attr('d', lineGenerator);
    } else {
        linePath.attr('d', null);
    }

    // Dots
    const dots = dotsGroup.selectAll('.dot')
        .data(infectionData.filter(d => d.day <= graphConfig.maxDays));

    const dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 0)
        .attr('fill', '#e74c3c')
        .attr('cx', d => xScale(d.day))
        .attr('cy', d => yScale(d.totalInfected));

    dotsEnter.merge(dots)
        .transition()
        .duration(500)
        .attr('r', 4)
        .attr('cx', d => xScale(d.day))
        .attr('cy', d => yScale(d.totalInfected));

    dots.exit()
        .transition()
        .duration(300)
        .attr('r', 0)
        .remove();

    // Tooltips
    dotsGroup.selectAll('.dot')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 6);

            const tooltip = graphGroup.append('g')
                .attr('class', 'tooltip')
                .attr('transform', `translate(${xScale(d.day)}, ${yScale(d.totalInfected) - 20})`);

            tooltip.append('rect')
                .attr('x', -40)
                .attr('y', -20)
                .attr('width', 80)
                .attr('height', 18)
                .attr('fill', 'white')
                .attr('stroke', '#333')
                .attr('rx', 3);

            tooltip.append('text')
                .attr('text-anchor', 'middle')
                .attr('y', -8)
                .style('font-size', '12px')
                .text(`Day ${d.day}: ${d.totalInfected}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('r', 4);

            graphGroup.selectAll('.tooltip').remove();
        });
}

/**
 * Reset the graph
 */
function resetInfectionGraph() {
    infectionData = [];
    linePath.attr('d', null);
    dotsGroup.selectAll('.dot').remove();
    gridGroup.selectAll('.grid-line').remove();
}

// Call logInfectionData() when day changes in your simulation
// Call resetInfectionGraph() when simulation resets
```

---

## Summary

Congratulations! You've learned:

1. ✅ How to include D3.js in your project
2. ✅ Creating SVG elements with D3.js
3. ✅ Using scales to map data to visual coordinates
4. ✅ Creating and styling axes
5. ✅ The Enter-Update-Exit pattern for data binding
6. ✅ Drawing lines with line generators
7. ✅ Adding interactivity with event listeners
8. ✅ Creating smooth transitions and animations

## Next Steps

- Try changing `graphConfig.maxDays` to 10
- Experiment with different curve types (`d3.curveLinear`, `d3.curveBasis`)
- Add different colors for different infection levels
- Try creating a multi-line chart (agents vs households)
- Explore D3.js transitions and easing functions

## Resources

- [D3.js Official Documentation](https://d3js.org/)
- [D3.js Gallery](https://observablehq.com/@d3/gallery)
- [D3 in Depth](https://www.d3indepth.com/)
- [Interactive Data Visualization for the Web (Book)](https://alignedleft.com/work/d3-book)
