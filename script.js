// GLOBALS
var width = 40,  //width of the matrix
    height = 40, //height of the matrix
    matrix = [], //the matrix
    fps = 5,      //number of frames to display per second
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
    min: 0.1,   //Minimum is 1
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

// Create the div where to display the matrix
function initMatrix() {
  //Create the div
  matrixDiv = $('<div id="matrix">').appendTo('body');
  
  //make the matrix div not draggable (fixes bugs while painting)
  matrixDiv.attr("ondragstart", "return false;");
  
  //Set the div to the correct size
  matrixDiv.width(width*10);
  matrixDiv.height(height*10);
  
  //Fill the div and the matrix with cells
  for (y=0; y<height; y++) {
    matrix[y] = [];
    for (x=0; x<width; x++) {
      matrix[y][x] = $('<div class="cell">').appendTo(matrixDiv); 
    }
  }
}

// Returns true if the given cell is alive, otherwise return false
function cellIsAlive(cell) {
  if (cell.css("background-color") == "rgb(0, 0, 0)") {
    return false;
  }
  else {
    return true;
  }
}

function killCell(cell) {
  cell.css("background-color", "rgb(0, 0, 0)");
}

function makeAliveCell(cell) {
  cell.css("background-color", "rgb(255, 255, 255)");
}

function switchCellState(cell) {
  if (cellIsAlive(cell)) {
    killCell(cell);
  }
  else {
    makeAliveCell(cell);
  }
}

//Returns the number of living neighbours
function countNeighbours(x, y) {
  //Initialize counter
  nb = 0;
  // Count up
  if ((y > 0) && (cellIsAlive(matrix[y-1][x]))) {
    nb++;
  }
  // Count down    
  if ((y < matrix.length-1) && (cellIsAlive(matrix[y+1][x]))) {
    nb++;
  }
  //Count left
  if ((x > 0) && (cellIsAlive(matrix[y][x-1]))) { 
    nb++;
  }
  //Count right 
  if ((x < matrix[y].length-1) && (cellIsAlive(matrix[y][x+1]))) {
    nb++;
  }
  //Count up-left
  if ((y > 0) && (x > 0) && (cellIsAlive(matrix[y-1][x-1]))) {
    nb++;
  }
  //Count up-right
  if ((y > 0) && (x < matrix[y].length-1) && (cellIsAlive(matrix[y-1][x+1]))) {
    nb++;
  }
  //Count down-left    
  if ((y < matrix.length-1) && (x > 0) && (cellIsAlive(matrix[y+1][x-1]))) {
    nb++;
  }
  //Count down-right
   if ((y < matrix.length-1) && (x < matrix[y].length-1) && (cellIsAlive(matrix[y+1][x+1]))) {
    nb++;
  } 
  //Finally return the number of living neighbours
  return nb;
}

function nextStep() {
  // Will contain a list of the cells to kill or to make alive
  // after evaluating each cell
  toSwitch = [];
  //For each cell in matrix...
  for (var y=0; y<matrix.length; y++) {
    for (var x=0; x<matrix[y].length; x++){
      cell = matrix[y][x];
      //Count the neighbours of the cell
      neighbours = countNeighbours(x, y);
      //Gets the cell's state
      alive = cellIsAlive(cell);
      //If the cell is alive
      //and there's more than 3 or less than 2 neighbours..
      if ((alive) && ((neighbours < 2) || (neighbours > 3)))
      {
        //Add the cell to the switch list, so it will be killed
        toSwitch.push(cell);
      }
      //If the cell is dead and it has 3 neighbours
      else if ((!alive) && (neighbours == 3))
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

//Function that animates automatically the matrix
function animate() {
  //Already request the next animation frame
  animationId = requestAnimationFrame(animate);
  
  //Calculates the time between the last animation and now
  delta = Date.now()-lastAnimTime;
  
  //If it's time to draw the next frame (according to the fps limit)...
  if (delta > 1000/fps) {
    //Draw the next step
    nextStep();
    //Save the time of this animation
    lastAnimTime = Date.now();
  }
}

// BEGINNING (fired when document is ready)
(function() {
  //Initialize the fps slider
  initSlider();
  //Creation of the matrix
  initMatrix();
  
  // CALLBACKS
  // If a mousedown event is trigerred on a cell, start painting
  $(".cell").on("mousedown", function() {
    // start painting on mouseover
    painting = true;
    //if the first clicked cell is alive...
    if (cellIsAlive($(this))) {
      //start to paint dead cells
      paintLiving = false;
      //kills the clicked cell
      killCell($(this));
    }
    //if the first clicked cell is dead... 
    else {
      //start to paint living cells
      paintLiving = true;
      //make the clicked cell alive
      makeAliveCell($(this));
    }
  });
  
  // If a mouseup event is trigerred, stop painting
  $(document).on("mouseup", function() {
    painting = false;
  });
  
  $(".cell").on("mouseover", function() {
    if (painting) {
      if (paintLiving) {
        makeAliveCell($(this));
      }
      else {
        killCell($(this));
      }
    }
  });
  
  //Maps the button "Next" to the step function
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
  
  //When the "Pause" button is triggered...
  $("#btnPause").click(function(){
    //activate "Play" button
    $("#btnPlay").removeAttr("disabled");
    //deactivate "Pause" button
    $(this).attr("disabled", "disabled");
    //activate "Next step" and "Previous step" button
    $("#btnNext").removeAttr("disabled");
    $("#btnPrevious").removeAttr("disabled");
    //stop animation (if any)
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
}());