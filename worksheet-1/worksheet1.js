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
var maxpoint; // max num of points click to make an object
var program;
var program1;
var vBuffer;
var vBuffer1;
var positionLoc;
var positionLoc1;
var cBuffer;
var cBuffer1;
var colorLoc;
var colorLoc1;

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
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    program1 = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program1)
    vBuffer = gl.createBuffer();
    vBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPositions, gl.STATIC_DRAW);
    
    positionLoc = gl.getAttribLocation( program, "aPosition");
    positionLoc1 = gl.getAttribLocation( program1, "aPosition");
    gl.vertexAttribPointer(positionLoc1, 2 /* read vec2 values */, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(positionLoc1);
    gl.vertexAttribPointer(positionLoc, 2 /* read vec2 values */, gl.FLOAT, true, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    
    cBuffer = gl.createBuffer();
    cBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumPositions, gl.STATIC_DRAW );
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumPositions, gl.STATIC_DRAW );
    
    colorLoc = gl.getAttribLocation( program, "aColor");
    colorLoc1 = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(colorLoc1, 4 /* read vec4 values */, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc1);
    gl.vertexAttribPointer(colorLoc, 4 /* read vec4 values */, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var m = document.getElementById("mymenu");

    m.addEventListener("click", function() {
      cIndex = m.selectedIndex;
    });
    var clear = document.getElementById("clear");
    
    clear.addEventListener("click",function() {
      console.log("ClearEventListener");
      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
      t[0] = vec2(-1,1);
      t[2] = vec2(1,-1);
      t[1] = vec2(t[0][0], t[2][1]);
      t[3] = vec2(t[2][0], t[0][1]);
      for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
      index += 4;
      console.log(t);
      
      gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
      var tt = vec4(colors[7]);
      for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
      rendersquare();
    });

    // Shape toggle
    document.getElementById("line").addEventListener("click",function() {
      if (state != "line") {
        state = "line";
        rendersquare();
        console.log("State change to "+state);
      }
    });
    document.getElementById("triangle").addEventListener("click",function() {
      
      point = 0;
      if (state != "triangle") {
        state = "triangle";
        render();
        console.log("State change to "+state);
      }
    });
    document.getElementById("square").addEventListener("click",function() {
      first = true;
      if (state != "square") {
        state = "square";
        render();
        console.log("State change to "+state);
      }
    });
    
    canvas.addEventListener("mousedown", function(event){
      if (state == "triangle") {
        if(point < 2) {
          // create first 2 points
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer)
          t[point] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
            point++;
          console.log(t);
        } else  {
          // create last point
          t[point] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          point=0;
          console.log(t);
          
          // load points to buffer
          for(var i=0; i<3; i++){
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
          }
          index += 4; // must plus 4 to disconnect triangles
    
          // adding colors
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer1);
          var tt = vec4(colors[cIndex]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
          
        }
      } else if (state == "square") {
        if(first) {
          // set up vectors to create an image
          first = false;
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer)
          t[0] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          console.log(t);
        }
    
        else {
          // set end points of rectangle
          first = true;
          t[2] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          t[1] = vec2(t[0][0], t[2][1]);
          t[3] = vec2(t[2][0], t[0][1]);
          // load points to buffer
          for(var i=0; i<4; i++){
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
          }
          index += 4;
    
          // adding colors
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
          var tt = vec4(colors[cIndex]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
          console.log(t);
        }
      }
    });
    
}
function rendertriangle() {
  gl.clear( gl.COLOR_BUFFER_BIT );
    for(var i = 0; i<index; i+=4){
        gl.drawArrays( gl.TRIANGLE_FAN, i, 3 );
      console.log(i);
    }
  requestAnimationFrame(rendertriangle);
}

function rendersquare() {
  gl.clear( gl.COLOR_BUFFER_BIT );
    for(var i = 0; i<index; i+=4)
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
  requestAnimationFrame(rendersquare);
}

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT );

  gl.useProgram( program1 );
  gl.enableVertexAttribArray( positionLoc1 );
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer1 );
  gl.vertexAttribPointer( positionLoc1, 2, gl.FLOAT, false, 0, 0 );
  for(var i = 0; i<index1; i+=4)
    gl.drawArrays( gl.TRIANGLE_FAN, i, 3 );

  gl.useProgram( program );

  gl.enableVertexAttribArray( positionLoc );
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
  for(var i = 0; i<index; i+=4)
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
        
  requestAnimationFrame(render);
}
