// GLOBALS
var vCells = 50,    //number of vertical cells
    hCells = 50,   // number of horizontal cells
    cellSize = 10, // size of a cell (in pixels)
    matrix = [], //the matrix
    fps = 5,            //number of frames to display per second
    lastStepTime = Date.now(), //to remember when was called the last animation frame
    painting = false, //if we're painting
    paintLiving = true, //if painting living cells (true) or dead cells (false)
    pause = true, //if the game is paused or not
    //Cell textures (images)
    deadCellTexture = PIXI.Texture.fromImage("images/deadCell.png"),
    aliveCellTexture = PIXI.Texture.fromImage("images/aliveCell.png");

//FUNCTIONS
// Create the slider for fps control
function initSlider() {
    // Create the slider in #sldFps
    $("#sldFps").slider({
        range: "min", //Let the user only select one value
        value: fps, //Default valus is the current fps
        min: 0.1,     //Minimum is 1
        max: 60, //Maximum is 30
        step: 0.1,
        
        //When the slider is changed..
        slide: function(event, ui) {
            //Update the text
            $("#txtFps").val(ui.value);
            //Update the fps value
            fps = ui.value;
        }
    });
    //update the text
    $("#txtFps").val($("#sldFps").slider( "value" ));
}

// Initialize pixi.js' stage.
function initStage() {
    stage = new PIXI.Stage(0x000000, true);
    stage.setInteractive(true);

    return stage;
}

// Initialize pixi.js's renderer
function initRenderer() {
    renderer = PIXI.autoDetectRenderer(vCells*cellSize, hCells*cellSize);
    //append the renderer to the page
    document.body.appendChild(renderer.view);

    return renderer;
}

// Creates a cell with all its default attributes & callbacks
function createCell(stage, x, y) {
    cell = new PIXI.Sprite(deadCellTexture);

    //Defines the real (pixel) cordinates
    cell.position.x = x*cellSize;
    cell.position.y = y*cellSize;

    //Custom property used to know if the cell is alive or not 
    cell.alive = false;
    
    //makes the cell interactive (mouse events activated)
    cell.interactive = true;

    // Callbacks four mouse/touch events
    cell.mousedown = cell.touchstart = onCellMouseDown;
    cell.mouseover  = onCellMouseOver;
    // Adds the cell to the stage
    stage.addChild(cell);

    return cell;
}

function fillMatrix(stage) {
    for (y=0; y<hCells; y++) {
        matrix[y] = [];
        for (x=0; x<vCells; x++) {
            matrix[y][x] = createCell(stage, x, y);
        }
    }
}

//Kills a cell (paint it in black)
function killCell(cell) {
    cell.alive = false;
    cell.setTexture(deadCellTexture);
}

//Make a cell alive (paint it in white)
function makeAliveCell(cell) {
    cell.alive = true;
    cell.setTexture(aliveCellTexture);
}

//Switches the state of a cell (alive => dead; dead=>alive)
function switchCellState(cell) {
    if (cell.alive) {
        killCell(cell);
    }
    else {
        makeAliveCell(cell);
    }
}

//Returns the number of living neighbours
function countNeighbours(cellX, cellY) {
    //Initialize counter
    nb = 0;
    //for each row around the cell (y-1, y, y+1)    
    for (y = cellY-1; y <= cellY+1; y++) {
        //if the row is in the matrix
        if ((y >= 0) && (y <= vCells-1)) {
            //for each column around the cell (x-1, x, x+1)
            for (x = cellX-1; x <= cellX+1; x++) {
                //if the column is in the matrix
                if (((x >= 0) && (x <= hCells-1)) &&
                //and the cell is not the given cell
                (!((x == cellX) && (y == cellY))) &&
                //and the cell is alive
                (matrix[y][x].alive)) {
                    //Count one more living neighbour
                    nb++;    
                }
            }
        }
    }
    //Finally return the number of living neighbours
    return nb;
}

function nextStep() {
    // Will contain a list of the cells to kill or to make alive
    // after evaluating each cell
    toSwitch = [];
    //For each cell in matrix
    for (var y=0; y<matrix.length; y++) {
        for (var x=0; x<matrix[y].length; x++){
            cell = matrix[y][x];
            //Count the neighbours of the cell
            neighbours = countNeighbours(x, y);

            //If the cell is alive
            //and there's more than 3 or less than 2 neighbours..
            if ((cell.alive) && ((neighbours < 2) || (neighbours > 3)))
            {
                //Add the cell to the switch list, so it will be killed
                toSwitch.push(cell);
            }
            //If the cell is dead and it has 3 neighbours
            else if ((!cell.alive) && (neighbours == 3))
            {
                //Add the cell to the switch list, so it will be made alive
                toSwitch.push(cell);
            }
        }
    }

    //Switch the cells that have to be switched
    for(i=0; i<toSwitch.length; i++) {
        switchCellState(toSwitch[i]);
    }
}

// CALLBACKS
// If a mousedown event is trigerred on a cell, start painting
function onCellMouseDown() {
    // start painting on mouseover
    painting = true;
    //if the first clicked cell is alive...
    if (this.alive) {
        //start to paint dead cells
        paintLiving = false;
        //kills the clicked cell
        killCell(this);
        renderer.render(stage);
    }
    //if the first clicked cell is dead... 
    else {
        //start to paint living cells
        paintLiving = true;
        //make the clicked cell alive
        makeAliveCell(this);
    }
}

// When the mouse is over a cell and paint mode is activated, paint it
function onCellMouseOver() {
    if (painting) {
        if (paintLiving) {
            makeAliveCell(this);
        }
        else {
            killCell(this);
        }
    }
}

//Function that animates automatically the matrix
function animate() {
    //Already request the next animation frame
    animationId = requestAnimationFrame(animate);
    
    //Calculates the time between the last animation and now
    delta = Date.now()-lastStepTime;
    
    //Render the stage (always rendering, even when not playing, 
    // because PIXI.js is triggering mouse/touch events only when rendering )
    renderer.render(stage);
    
    if ((!pause) && (delta > 1000/fps)) {
        //Calculate the next step if pause != true
        nextStep();
        //Save the time of this step
        lastStepTime = Date.now();
    }
}

// When a mouseup event is trigerred, stop painting
$(document).on("mouseup", function() {
    painting = false;
});

//When the "Next" button is pressed, go one step forward
$("#btnNext").click(function(){
    nextStep();
});

//When the "Play button is pressed...
$("#btnPlay").click(function(){
    //if this is the "Play" button
    if ($(this).html() == "Play"){
        //Transform it into a "Pause" button
        $(this).html("Pause");
        //deactivate "Next step" and "Previous step" button
        $("#btnNext").attr("disabled", "disabled");
        $("#btnPrevious").attr("disabled", "disabled");
        //launch animation
        pause = false;
    }
    // If this is the "Pause" button
    else {
        //Transforms it into a "Play" button
        $(this).html("Play");
        //activate "Next step" and "Previous step" button
        $("#btnNext").removeAttr("disabled");
        $("#btnPrevious").removeAttr("disabled");
        //stop animation (if any)
        pause = true;
    }
});


// BEGINNING (fired when document is ready)
$(function() {
    //Initialize the fps slider
    initSlider();
    //Creation of the stage
    var stage = initStage();
    //Creation of the renderer
    var renderer = initRenderer();
    //Fill the matrix, and add it in the stage
    fillMatrix(stage);
    //Renders the initial stage
    renderer.render(stage);
    animate(); 
});