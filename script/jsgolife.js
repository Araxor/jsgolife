// GLOBALS
var width = 40,    //width of the matrix
    height = 40, //height of the matrix
    matrix = [], //the matrix
    fps = 5,            //number of frames to display per second
    animationId = 0, //to remember wich animation start/stop
    lastAnimTime = Date.now(), //to remember when was called the last animation frame
    painting = false,
    paintLiving = true;

//FUNCTIONS
// Create the slider for fps control
function initSlider() {
    // Create the slider in #sldFps
    $("#sldFps").slider({
        range: "min", //Let the user only select one value
        value: fps, //Default valus is the current fps
        min: 0.1,     //Minimum is 1
        max: 30, //Maximum is 30
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

function initStage() {
    // initialize the stage and the renderer
    stage = new PIXI.Stage(0x000000, true);
    stage.setInteractive(true);

    return stage;
}

function initRenderer(rendererWidth, rendererHeight) {
    renderer = PIXI.autoDetectRenderer(rendererWidth, rendererHeight);
    //append the renderer to the page
    document.body.appendChild(renderer.view);

    return renderer;
}

function createCell(stage, x, y, width) {
    cell = new PIXI.Graphics();
    cell.beginFill(0x111111, 1)
    cell.lineStyle(1, 0x000000, 1);
    cell.drawRect(x*width, y*width, width, width);
    cell.endFill();
    stage.addChild(cell);

    cell.alive = false;
    console.log('x:'+x+" y:"+y+" bound:"cell.getBoundingClientRect());
    //cell.hitArea = new PIXI.Rectangle(x, y, x+width, y+width);
    cell.mousedown = function(data) {
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
    };
    //cell.mouseup = cell.touchend = onCellMouseUp;

    return cell;
}

function fillMatrix(stage) {
    for (y=0; y<height; y++) {
        matrix[y] = [];
        for (x=0; x<width; x++) {
            matrix[y][x] = createCell(stage, x, y, width);
        }
    }
}

//Kills a cell (paint it in black)
function killCell(cell) {
    cell.alive = false;
    cell.clear();
    cell.beginFill(0x000000, 1);
    cell.lineStyle(1, 0x000000, 1);
    cell.drawRect(cell.position.x, cell.position.y, width, width);
    cell.endFill();
}

//Make a cell alive (paint it in white)
function makeAliveCell(cell) {
    cell.alive = true;
    cell.clear();
    cell.beginFill(0xFFFFFF, 1);
    cell.lineStyle(1, 0x000000, 1);
    cell.drawRect(cell.position.x, cell.position.y, width, width);
    cell.endFill();
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
        if ((y >= 0) && (y <= height-1)) {
            //for each column around the cell (x-1, x, x+1)
            for (x = cellX-1; x <= cellX+1; x++) {
                //if the column is in the matrix
                if ((x >= 0) && (x <= width-1)) {
                    //if the cell is not the given cell
                    if (!((x == cellX) && (y == cellY))) {
                        //if the cell is alive
                        if (matrix[y][x].alive){
                            //Count one more living neighbour
                            nb++;
                        }
                    }
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

// BEGINNING (fired when document is ready)

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



// CALLBACKS
// If a mousedown event is trigerred on a cell, start painting
function onCellMouseDown() {
    console.log("cell clicked");
    // start painting on mouseover
    painting = true;
    //if the first clicked cell is alive...
    if (cellIsAlive(this)) {
        //start to paint dead cells
        paintLiving = false;
        //kills the clicked cell
        killCell(this);
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
function onCellMouseUp() {
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
    delta = Date.now()-lastAnimTime;
    
    //If it's time to draw the next frame (according to the fps limit)...
    if (delta > 1000/fps) {
        //Render the stage
        renderer.render(stage);
        //Calculate the next step
        nextStep();
        //Save the time of this animation
        lastAnimTime = Date.now();
    }
}

// When a mouseup event is trigerred, stop painting
$(document).on("mouseup", function() {
    painting = false;
});

//When the button "Next" is pressed, go one step forward
$("#btnNext").click(function(){
    nextStep();
});

//When the "Play button is triggered...
$("#btnPlay").click(function(){
    //if this is the "Play" button
    if ($(this).html() == "Play"){
        //Transform it into a "Pause" button
        $(this).html("Pause");
        //deactivate "Next step" and "Previous step" button
        $("#btnNext").attr("disabled", "disabled");
        $("#btnPrevious").attr("disabled", "disabled");
        //launch animation
        animationId = requestAnimationFrame(animate);
    }
    // If this is the "Pause" button
    else {
        //Transforms it into a "Play" button
        $(this).html("Play");
        //activate "Next step" and "Previous step" button
        $("#btnNext").removeAttr("disabled");
        $("#btnPrevious").removeAttr("disabled");
        //stop animation (if any)
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }
});
