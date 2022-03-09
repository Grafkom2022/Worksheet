"use strict";

/** @type {HTMLCanvasElement} */
var canvas;
/** @type {WebGLRenderingContext} */
var gl;

var maxNumTriangles = 200;
var maxNumPositions  = 3*maxNumTriangles;
var index = 0;
var index1 = 0;
var first = true;

var t = [];

var cIndex = 0;

var colors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),   // cyan
    vec4(0.8, 0.8, 0.8, 1.0)    // default
];
var state;  // Object shape state
var point=0;  // current point
var program_line;
var program_triangle;
var program_square;
var vBuffer_line;
var vBuffer_triangle;
var vBuffer_square;
var positionLoc_line;
var positionLoc_triangle;
var positionLoc_square;
var cBuffer;
var colorLoc;

init();

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height); // set the canvas viewport
    gl.clearColor(0.8, 0.8, 0.8, 1.0);  // set the canvas color
    gl.clear(gl.COLOR_BUFFER_BIT);  // clear the color buffer


    //
    //  Load shaders and initialize attribute buffers
    //
    program_line = initShaders(gl, "vertex-shader", "fragment-shader");
    program_triangle = initShaders(gl, "vertex-shader", "fragment-shader");
    program_square = initShaders(gl, "vertex-shader", "fragment-shader");

    // VBO for each shapes
    vBuffer_line = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_line);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPositions, gl.STATIC_DRAW);
    vBuffer_triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_triangle);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPositions, gl.STATIC_DRAW);
    vBuffer_square = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_square);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPositions, gl.STATIC_DRAW);
    
    // Can set this one as empty value(?) but still work
    var positionLoc_line = gl.getAttribLocation(program_line, "aPosition");
    gl.vertexAttribPointer(positionLoc_line, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc_line);
    var positionLoc_triangle = gl.getAttribLocation(program_triangle, "aPosition");
    gl.vertexAttribPointer(positionLoc_triangle, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc_triangle);
    var positionLoc_square = gl.getAttribLocation(program_square, "aPosition");
    gl.vertexAttribPointer(positionLoc_square, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc_square);
    
    // Buffer for colors
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumPositions, gl.STATIC_DRAW );
    
    // Points to color palette
    colorLoc = gl.getAttribLocation( program_line, "aColor");
    gl.vertexAttribPointer(colorLoc, 4 /* read vec4 values */, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
    

    var m = document.getElementById("mymenu");

    m.addEventListener("click", function() {
      cIndex = m.selectedIndex;
    });
    var clear = document.getElementById("clear");
    
    clear.addEventListener("click",function() {
      console.log("ClearEventListener");
      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_triangle);
      t[0] = vec2(-1,1);
      t[2] = vec2(1,-1);
      t[1] = vec2(t[0][0], t[2][1]);
      t[3] = vec2(t[2][0], t[0][1]);
      for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
      index += 4;
      console.log(t);
      
      gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
      var tt = vec4(colors[3]);
      for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
    });

    // Shape toggle
    document.getElementById("line").addEventListener("click",function() {
      first = true;
      if (state != "line") {
        state = "line";
        console.log("State change to "+state);
      }
    });
    document.getElementById("triangle").addEventListener("click",function() {
      point = 0;
      if (state != "triangle") {
        state = "triangle";
        console.log("State change to "+state);
      }
    });
    document.getElementById("square").addEventListener("click",function() {
      first = true;
      if (state != "square") {
        state = "square";
        console.log("State change to "+state);
      }
    });
    
    canvas.addEventListener("mousedown", function(event){
      if (state == "line") {
        console.log("click square");
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_line);
        if(first) {
          first = false;
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_line)
          t[0] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
        }

        else {
          first = true;
          t[1] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          for(var i=0; i<2; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
          index += 4;

          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
          var tt = vec4(colors[cIndex]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
        }
      } else if (state == "triangle") {
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_triangle);
        if(point < 2) {
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_triangle); 
          // create first 2 points
          t[point] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
            point++;
        } else  {
          // create last point
          t[point] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          point=0;
          
          // load points to buffer
          for(var i=0; i<3; i++){
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
          }
          index += 4; // must plus 4 to disconnect triangles
    
          // adding colors
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
          var tt = vec4(colors[cIndex]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
          console.log(tt);
        }
      } else if (state == "square") {
        console.log("click square");
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_square);
        if(first) {
          first = false;
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_square)
          t[0] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
        }

        else {
          first = true;
          t[2] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          t[1] = vec2(t[0][0], t[2][1]);
          t[3] = vec2(t[2][0], t[0][1]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
          index += 4;

          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
          var tt = vec4(colors[cIndex]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
        }
      }
    });
    render();
    
}
function render() {
  console.log("render");
  gl.clear( gl.COLOR_BUFFER_BIT );
  gl.useProgram( program_line );
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_line );
  gl.vertexAttribPointer( positionLoc_line, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( positionLoc_line );
  for(var i = 0; i<index; i+=4) gl.drawArrays( gl.LINES, i, 2 );

  gl.useProgram( program_triangle );
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_triangle );
  gl.vertexAttribPointer( positionLoc_triangle, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( positionLoc_triangle );
  for(var i = 0; i<index; i+=4) gl.drawArrays( gl.TRIANGLE_FAN, i, 3 );

  gl.useProgram( program_square );
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer_square );
  gl.vertexAttribPointer( positionLoc_square, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( positionLoc_square );
  for(var i = 0; i<index; i+=4) gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
        
  requestAnimationFrame(render);
}
