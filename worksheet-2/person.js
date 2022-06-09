"use strict";
/* 
Ketergantungan objek:
Badan tersambung kepada leher, lengan atas, dan kaki atas.
    -Jika badan diputar maka seluru objek berputar mengikuti badan.
Leher dan kepala tersambung.
    -Jika leher bergerak maka kepala juga ikut, tetapi tidak sebaliknya.
Lengan/kaki atas dan lengan/kaki bawah tersambung.
    -Jika lengan/kaki atas bergerak, maka lengan/kaki bawah ikut bergerak.

Struktur node/part:
-Torso
    -Neck
        -Head
    -LeftUpperArm
        -LeftLowerArm
    -RightUpperArm
        -RightLowerArm
    -LeftUpperLeg
        -LeftLowerLeg
    -RightUpperLeg
        -RightLowerLeg
*/

var canvas;
var gl;
var program;

var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var torsoId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 10;
var leftUpperArmId = 2;
var leftLowerArmId = 3;
var rightUpperArmId = 4;
var rightLowerArmId = 5;
var leftUpperLegId = 6;
var leftLowerLegId = 7;
var rightUpperLegId = 8;
var rightLowerLegId = 9;
var neckId = 11;

var torsoLength = 1.0;
var torsoHeight = 3.5;
var torsoWidth = 2.0;
var upperArmHeight = 2.0;
var lowerArmHeight = 2.0;
var upperArmWidth  = 0.65;
var lowerArmWidth  = 0.5;
var upperLegWidth  = 0.75;
var lowerLegWidth  = 0.5;
var lowerLegHeight = 2.0;
var upperLegHeight = 3.0;
var headHeight = 2.0;
var headWidth = 1.8;
var neckHeight = 1.0;
var neckWidth = 1.0;

var numNodes = 12;
var angle = 0;

// Sudut perputaran, sesuai dengan index part objek
var initTheta = [90, 0, 90, 0, 240, 0, 90, 0, 240, 0, 0, 0];
var theta = [...initTheta];

var translation = 0;

var stack = [];

var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

var normalsArray = [];
var nMatrix, nMatrixLoc;

// Light Parameters
var lightPosition = vec4(0, 5, 0, 1.0);
var lightAmbient = vec4(0.2,0.2,0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// Material Parameters
var materialAmbient = vec4(0.7, 0.7, 0.7, 1.0);
var materialDiffuse = vec4(0.63, 0.38, 0.24, 1);
var materialSpecular = vec4(0.63, 0.38, 0.24, 1);
var materialShininess = 2.0;

var ambientProduct;
var diffuseProduct;
var specularProduct;

// Animation
var runFlag = true;
var upperTheta = 1;
var lowerTheta = 1.0*upperTheta;
var neckTheta = 0.5;
var speed = 0.01;
var neckdirection = 1;
var RUAdirection = 1;
var LUAdirection = -1;
var RULdirection = 1;
var LULdirection = -1;
var RLAdirection = 0;
var LLAdirection = 0;
var RLLdirection = 0;
var LLLdirection = 0;

init();

//-------------------------------------------

function scale4(a, b, c) {
    var result = mat4();
    result[0] = a;
    result[5] = b;
    result[10] = c;
    return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case torsoId:

    m = translate(translation, 0, 0);
    m = mult(m, rotate(theta[torsoId], vec3(0, 1, 0)));
    figure[torsoId] = createNode( m, torso, null, neckId );
    break;

    case neckId:
    
    m = translate(0.0, torsoHeight, -0.5*(torsoLength-neckWidth));
    m = mult(m, rotate(theta[neckId], vec3(1, 0, 0)));
    figure[neckId] = createNode( m, neck, leftUpperArmId, headId);
    break;

    case headId:
    case head1Id:
    case head2Id:


    m = translate(0.0, headHeight, 0.0);
    m = mult(m, rotate(theta[head1Id], vec3(1, 0, 0)))
    m = mult(m, rotate(theta[head2Id], vec3(0, 1, 0)));
    m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
    figure[headId] = createNode( m, head, null, null);
    break;


    case leftUpperArmId:

    m = translate(-0.5*(torsoWidth+upperArmWidth), upperArmHeight + torsoHeight/2, -0.5*(torsoLength-upperArmWidth));
    m = mult(m, rotateX(theta[leftUpperArmId], vec3(-1, 0.5, -1)));
    figure[leftUpperArmId] = createNode( m, leftUpperArm, rightUpperArmId, leftLowerArmId );
    break;

    case rightUpperArmId:

    m = translate(0.5*(torsoWidth+upperArmWidth), upperArmHeight + torsoHeight/2, -0.5*(torsoLength-upperArmWidth));
    m = mult(m, rotateX(theta[rightUpperArmId], vec3(1, 0.5, 1)));
    figure[rightUpperArmId] = createNode( m, rightUpperArm, leftUpperLegId, rightLowerArmId );
    break;

    case leftUpperLegId:

    m = translate(-0.5*(torsoWidth-upperLegWidth), 0.1*upperLegHeight, 0.5*(torsoLength-upperLegWidth));
    m = mult(m , rotate(theta[leftUpperLegId], vec3(1, 0, 0)));
    figure[leftUpperLegId] = createNode( m, leftUpperLeg, rightUpperLegId, leftLowerLegId );
    break;

    case rightUpperLegId:

    m = translate(0.5*(torsoWidth-upperLegWidth), 0.1*upperLegHeight, 0.5*(torsoLength-upperLegWidth));
    m = mult(m, rotate(theta[rightUpperLegId], vec3(1, 0, 0)));
    figure[rightUpperLegId] = createNode( m, rightUpperLeg, null, rightLowerLegId );
    break;

    case leftLowerArmId:

    m = translate(0.0, upperArmHeight, 0.0);
    m = mult(m, rotateX(theta[leftLowerArmId], vec3(1, 0, 1)));
    figure[leftLowerArmId] = createNode( m, leftLowerArm, null, null );
    break;

    case rightLowerArmId:

    m = translate(0.0, upperArmHeight, 0.0);
    m = mult(m, rotateX(theta[rightLowerArmId], vec3(-1, 0, -1)));
    figure[rightLowerArmId] = createNode( m, rightLowerArm, null, null );
    break;

    case leftLowerLegId:

    m = translate(0.0, upperLegHeight, 0.0);
    m = mult(m, rotate(theta[leftLowerLegId],vec3(1, 0, 0)));
    figure[leftLowerLegId] = createNode( m, leftLowerLeg, null, null );
    break;

    case rightLowerLegId:

    m = translate(0.0, upperLegHeight, 0.0);
    m = mult(m, rotate(theta[rightLowerLegId], vec3(1, 0, 0)));
    figure[rightLowerLegId] = createNode( m, rightLowerLeg, null, null );
    break;

    }

}

function traverse(Id) {
    if(Id == null) return;
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
    figure[Id].render();
    if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
    if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function torso() {

    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*torsoHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale( torsoWidth, torsoHeight, torsoLength));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function neck() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * neckHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale(neckWidth, neckHeight, neckWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerArm() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, torsoLength) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, torsoLength) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix) );
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
    
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
}


function cube()
{
    quad( 1, 0, 3, 2 );  // Front
    quad( 2, 3, 7, 6 ); // Right
    quad( 3, 0, 4, 7 );  // Bottom
    quad( 6, 5, 1, 2 );  // Top
    quad( 4, 5, 6, 7 );  // Back
    quad( 5, 4, 0, 1 ); // Left
}

function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-15.0,15.0,-10.0, 15.0,-15.0,10.0);
    modelViewMatrix = mat4();


    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix)  );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix)  );


    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    // Create shapes
    cube();

    // Setup buffers
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    // Calculate lighting
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("run").onclick = function(event) {
        runFlag = true;
    };

    document.getElementById("stop").onclick = function(event) {
        runFlag = false;
    };

    gl.uniform4fv( gl.getUniformLocation(program,"uAmbientProduct"),ambientProduct );
    gl.uniform4fv( gl.getUniformLocation(program,"uDiffuseProduct"),diffuseProduct );
    gl.uniform4fv( gl.getUniformLocation(program,"uSpecularProduct"), specularProduct );
    gl.uniform4fv( gl.getUniformLocation(program,"uLightPosition"), lightPosition );
    gl.uniform1f( gl.getUniformLocation(program,"uShininess"),materialShininess );

    for(i=0; i<numNodes; i++) initNodes(i);

    render();
}

function render() {
    if (runFlag) {
        if (theta[neckId] <= -30) neckdirection = 1
        else if (theta[neckId] >= 30) neckdirection = -1;
        if (theta[rightUpperArmId] >= 240) RUAdirection = -1
        else if (theta[rightUpperArmId] <= 90) RUAdirection = 1;
        if (theta[leftUpperArmId] >= 240) LUAdirection = -1
        else if (theta[leftUpperArmId] <= 90) LUAdirection = 1;
        if (theta[rightUpperLegId] >= 240) RULdirection = -1
        else if (theta[rightUpperLegId] <= 90) RULdirection = 1;
        if (theta[leftUpperLegId] >= 240) LULdirection = -1
        else if (theta[leftUpperLegId] <= 90) LULdirection = 1;

        if (theta[rightUpperArmId] <= 180 && RLAdirection == -1) RLAdirection = 1
        else if (theta[rightLowerArmId] >= 90) RLAdirection = -1
        else if (theta[rightLowerArmId] <= 0) RLAdirection = 1;
        if (theta[leftUpperArmId] <= 180 && LLAdirection == -1) LLAdirection = 1
        else if (theta[leftLowerArmId] >= 90) LLAdirection = -1
        else if (theta[leftLowerArmId] <= 0) LLAdirection = 1;
        if (theta[rightUpperLegId] <= 180 && RLLdirection == -1) RLLdirection = 1
        else if (theta[rightLowerLegId] >= 90) RLLdirection = -1;
        else if (theta[rightLowerLegId] <= 0) RLLdirection = 1;
        if (theta[leftUpperLegId] <= 180 && LLLdirection == -1) LLLdirection = 1
        else if (theta[leftLowerLegId] >= 90) LLLdirection = -1
        else if (theta[leftLowerLegId] <= 0) LLLdirection = 1;

        if (translation >= 5 || translation <= -5) {
            speed = -speed;
        }

        if (translation >= 3.95 && translation <= 5) theta[torsoId] = Number(theta[torsoId])+1;

        if (translation <= -3.95 && translation >= -5) theta[torsoId] = Number(theta[torsoId])-1;
        
        theta[neckId] = Number(theta[neckId])+neckTheta*neckdirection;
        theta[rightUpperArmId] = Number(theta[rightUpperArmId])+upperTheta*RUAdirection;
        theta[leftUpperArmId] = Number(theta[leftUpperArmId])+upperTheta*LUAdirection;
        theta[rightUpperLegId] = Number(theta[rightUpperLegId])+upperTheta*RULdirection;
        theta[leftUpperLegId] = Number(theta[leftUpperLegId])+upperTheta*LULdirection;
        theta[rightLowerArmId] = Number(theta[rightLowerArmId])+lowerTheta*RLAdirection;
        theta[leftLowerArmId] = Number(theta[leftLowerArmId])+lowerTheta*LLAdirection;
        theta[rightLowerLegId] = Number(theta[rightLowerLegId])+lowerTheta*RLLdirection;
        theta[leftLowerLegId] = Number(theta[leftLowerLegId])+lowerTheta*LLLdirection;
        translation = translation + speed;
        
        initNodes(torsoId);
        initNodes(neckId);
        initNodes(rightUpperArmId);
        initNodes(leftUpperArmId);
        initNodes(rightUpperLegId);
        initNodes(leftUpperLegId);
        initNodes(rightLowerArmId);
        initNodes(leftLowerArmId);
        initNodes(rightLowerLegId);
        initNodes(leftLowerLegId);
    } else {}
    gl.clear( gl.COLOR_BUFFER_BIT );
        traverse(torsoId);
        requestAnimationFrame(render);
}