"use strict";

/** @type {HTMLCanvasElement} */
var canvas;
/** @type {WebGLRenderingContext} */
var gl;

var maxNumTriangles = 200;
var maxNumPositions = 3 * maxNumTriangles;
var index = 0;
var maxpoints = 8;  //  specify max point for every object, multiple of 2

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
  vec4(0.5, 0.0, 0.5, 1.0),    // purple
  vec4(0.0, 0.5, 0.5, 1.0),    // teal
  vec4(0.5, 0.5, 0.0, 1.0),    // olive
];
var state;  // Object shape state
var pointstate = 0;  // current point state
var polygonnum;

// variables for rotating shapes
var theta_line = 0.0;
var theta_triangle = 0.0;
var theta_square = 0.0;
var theta_pentagon = 0.0;
var thetaLoc;
var rotate_line;
var rotate_triangle;
var rotate_square;
var rotate_pentagon;

var program_line;
var program_triangle;
var program_square;
var program_pentagon;
var vBuffer_line;
var vBuffer_triangle;
var vBuffer_square;
var vBuffer_pentagon;
var positionLoc_line;
var positionLoc_triangle;
var positionLoc_square;
var positionLoc_pentagon;
var cBuffer;
var colorLoc;

init();

// initialize VBO
function initvBuffer() {
  vBuffer_line = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_line);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPositions, gl.STATIC_DRAW);
  vBuffer_triangle = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_triangle);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPositions, gl.STATIC_DRAW);
  vBuffer_square = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_square);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPositions, gl.STATIC_DRAW);
  vBuffer_pentagon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_pentagon);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPositions, gl.STATIC_DRAW);
}

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
  program_pentagon = initShaders(gl, "vertex-shader", "fragment-shader");

  // initialize VBO for each shapes
  initvBuffer();

  // Can set this one as empty value(?) but still work
  // retrieve position location and enable vertex
  var positionLoc_line = gl.getAttribLocation(program_line, "aPosition");
  gl.vertexAttribPointer(positionLoc_line, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_line);
  var positionLoc_triangle = gl.getAttribLocation(program_triangle, "aPosition");
  gl.vertexAttribPointer(positionLoc_triangle, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_triangle);
  var positionLoc_square = gl.getAttribLocation(program_square, "aPosition");
  gl.vertexAttribPointer(positionLoc_square, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_square);
  var positionLoc_pentagon = gl.getAttribLocation(program_pentagon, "aPosition");
  gl.vertexAttribPointer(positionLoc_pentagon, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_pentagon);

  // Buffer for colors
  cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumPositions, gl.STATIC_DRAW);

  // Points to color palette
  colorLoc = gl.getAttribLocation(program_line, "aColor");
  gl.vertexAttribPointer(colorLoc, 4 /* read vec4 values */, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLoc);

  // set color index
  document.getElementById("colors").onclick = function () {
    cIndex = event.target.value;
  }

  // change rotate flags according to state
  document.getElementById("rotator").onclick = function () {
    if (state == "line") { rotate_line = event.target.id; }
    else if (state == "triangle") { rotate_triangle = event.target.id; }
    else if (state == "square") { rotate_square = event.target.id; }
    else if (state == "pentagon") { rotate_pentagon = event.target.id; }
  }

  // clearing canvas
  document.getElementById("clear").addEventListener("click", function () {
    // reinitialize every VBO to clear canvas
    initvBuffer();
    // reset rotate flag
    rotate_line = 0;
    rotate_triangle = 0;
    rotate_square = 0;
    rotate_pentagon = 0;
  });

  // Shape toggle
  document.getElementById("shape").onclick = function () {
    pointstate = 0;
    if (state != event.target.id) state = event.target.id;
  }

  // draw on canvas
  canvas.addEventListener("mousedown", function (event) {
    if (state == "line") {
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_line);
      if (pointstate == 0) {
        // create start point
        pointstate = 1;
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_line)
        t[0] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
      }

      else {
        // create last point
        pointstate = 0;
        t[1] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
        for (var i = 0; i < 2; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (index + i), flatten(t[i]));
        index += maxpoints; // choose index that is  >= points for render iteration

        // load colors to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var tt = vec4(colors[cIndex]);
        for (var i = 0; i < 4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index - maxpoints + i), flatten(tt));
      }
    } else if (state == "triangle") {
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_triangle);
      if (pointstate < 2) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_triangle);
        // create first 2 points
        t[pointstate] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
        pointstate++;
      } else {
        // create last point
        t[pointstate] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
        pointstate = 0;

        // load points to buffer
        for (var i = 0; i < 3; i++) {
          gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (index + i), flatten(t[i]));
        }
        index += maxpoints; // choose index that is  >= points for render iteration

        // load colors to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var tt = vec4(colors[cIndex]);
        for (var i = 0; i < 4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index - maxpoints + i), flatten(tt));
      }
    } else if (state == "square") {
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_square);
      if (pointstate == 0) {
        pointstate = 1;
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_square)
        t[0] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
      }

      else {
        pointstate = 0;
        t[2] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
        t[1] = vec2(t[0][0], t[2][1]);
        t[3] = vec2(t[2][0], t[0][1]);
        for (var i = 0; i < 4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (index + i), flatten(t[i]));
        index += maxpoints; // choose index that is  >= points for render iteration

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var tt = vec4(colors[cIndex]);
        for (var i = 0; i < 4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index - maxpoints + i), flatten(tt));
      }
    } else if (state == "pentagon") {
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_pentagon);
      if (pointstate < 4) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_pentagon);
        // create first 4 points
        t[pointstate] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
        pointstate++;
      } else {
        // create last point
        t[pointstate] = vec2(2 * event.clientX / canvas.width - 1,
          2 * (canvas.height - event.clientY) / canvas.height - 1);
        pointstate = 0;

        // load points to buffer
        for (var i = 0; i < 5; i++) {
          gl.bufferSubData(gl.ARRAY_BUFFER, 8 * (index + i), flatten(t[i]));
        }
        index += maxpoints; // choose index that is  >= points for render iteration

        // load colors to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        var tt = vec4(colors[cIndex]);
        for (var i = 0; i < 5; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16 * (index - maxpoints + i), flatten(tt));
      }
    }
  });
  render();

}
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // render shape for each shape program
  // use uniforms to transform shape object

  gl.useProgram(program_line);
  thetaLoc = gl.getUniformLocation(program_line, "uTheta");
  if (rotate_line == "cw") { theta_line += 0.1; }
  else if (rotate_line == "ccw") { theta_line += -0.1; }
  else { }
  gl.uniform1f(thetaLoc, theta_line);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_line);
  gl.vertexAttribPointer(positionLoc_line, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_line);
  for (var i = 0; i < index; i += maxpoints) gl.drawArrays(gl.LINES, i, 2);

  gl.useProgram(program_triangle);
  thetaLoc = gl.getUniformLocation(program_triangle, "uTheta");
  if (rotate_triangle == "cw") { theta_triangle += 0.1; }
  else if (rotate_triangle == "ccw") { theta_triangle += -0.1; }
  else { }
  gl.uniform1f(thetaLoc, theta_triangle);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_triangle);
  gl.vertexAttribPointer(positionLoc_triangle, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_triangle);
  for (var i = 0; i < index; i += maxpoints) gl.drawArrays(gl.TRIANGLE_FAN, i, 3);

  gl.useProgram(program_square);
  thetaLoc = gl.getUniformLocation(program_square, "uTheta");
  if (rotate_square == "cw") { theta_square += 0.1; }
  else if (rotate_square == "ccw") { theta_square += -0.1; }
  else { }
  gl.uniform1f(thetaLoc, theta_square);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_square);
  gl.vertexAttribPointer(positionLoc_square, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_square);
  for (var i = 0; i < index; i += maxpoints) gl.drawArrays(gl.TRIANGLE_FAN, i, 4);

  gl.useProgram(program_pentagon);
  thetaLoc = gl.getUniformLocation(program_pentagon, "uTheta");
  if (rotate_pentagon == "cw") { theta_pentagon += 0.1; }
  else if (rotate_pentagon == "ccw") { theta_pentagon += -0.1; }
  else { }
  gl.uniform1f(thetaLoc, theta_pentagon);
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_pentagon);
  gl.vertexAttribPointer(positionLoc_pentagon, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc_pentagon);
  for (var i = 0; i < index; i += maxpoints) gl.drawArrays(gl.TRIANGLE_FAN, i, 5);

  requestAnimationFrame(render);
}