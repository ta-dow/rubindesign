﻿/*
* Original Author: Iacopo Sassarini
* Modified By: Israel Montoya - izzythecubemaster@gmail.com
*/

if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var VISUALS_VISIBLE = true;
//IM Default value: 1500;
var SCALE_FACTOR = 1500;
//IM Default value: 200
var CAMERA_BOUND = 400;
var NUM_POINTS_SUBSET = 40000;
var NUM_SUBSETS       = 7;
var NUM_POINTS = (NUM_POINTS_SUBSET * NUM_SUBSETS);
//IM Default value: 5
var NUM_LEVELS = 9;
//IM Default value: 400;
var LEVEL_DEPTH = 1000;
//IM Default value: 1
var DEF_BRIGHTNESS = 1.2;
var DEF_SATURATION = 0.8;
var SPRITE_SIZE = Math.ceil(3 * window.innerWidth / 1600);
// IM Added chaos mode boolean
var CHAOS_ENABLED = false;
        
// Orbit parameters constraints
var A_MIN = -30;
var A_MAX = 30;
var B_MIN = .2;
var B_MAX = 1.8;
var C_MIN = 5;
var C_MAX = 17;
var D_MIN = 0;
var D_MAX = 10;
var E_MIN = 0;
var E_MAX = 12;

// Orbit parameters
var a, b, c, d, e;
        
// Orbit data
var orbit = {
    subsets: [],
    xMin: 0,
    xMax: 0,
    yMin: 0,
    yMax: 0,
    scaleX: 0,
    scaleY: 0
}
// Initialize data points
for (var i = 0; i < NUM_SUBSETS; i++){
    var subsetPoints = [];
    for (var j = 0; j < NUM_POINTS_SUBSET; j++){
        subsetPoints[j] = {
            x: 0,
            y: 0, 
            vertex:  new THREE.Vertex(new THREE.Vector3(0,0,0))
        };
    }
    orbit.subsets.push(subsetPoints);
}       
var container, stats;
var camera, scene, renderer, composer, hueValues = [];
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

// Initial speed relative to hardware speed (original = 6)
var speed = 1;
// Initial rotation speed (original = 0.005)
var rotationSpeed = 0.005;

init();
animate();

function init() {
    // IM: New options are as follows
    // - cubeLR.png (hypercube)
    // - fractalLR.png (fractal)
    // - galaxy.png (default)
    sprite1 = THREE.ImageUtils.loadTexture("cubeLR.png");

    container = document.createElement( 'div' );
    container.id = 'main-canvas';
    document.body.appendChild(container);
    // Camera FOV default 82
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 3 * SCALE_FACTOR );
    camera.position.z = SCALE_FACTOR/2;
    scene = new THREE.Scene();
    // Fog - Default value 0.0012
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);
    generateOrbit();
    for (var s = 0; s < NUM_SUBSETS; s++){hueValues[s] = Math.random();}
            
    // Create particle systems
    for (var k = 0; k < NUM_LEVELS; k++){
        for (var s = 0; s < NUM_SUBSETS; s++){
            var geometry = new THREE.Geometry();
            for (var i = 0; i < NUM_POINTS_SUBSET; i++){geometry.vertices.push( orbit.subsets[s][i].vertex);}
            var materials = new THREE.ParticleBasicMaterial( { size: (SPRITE_SIZE ), map: sprite1, blending: THREE.AdditiveBlending, depthTest: false, transparent : true } );
            materials.color.setHSV(hueValues[s], DEF_SATURATION, DEF_BRIGHTNESS);
            var particles = new THREE.ParticleSystem( geometry, materials );
            particles.myMaterial = materials;
            particles.myLevel = k;
            particles.mySubset = s;
            particles.position.x = 0;
            particles.position.y = 0;
            particles.position.z = - LEVEL_DEPTH * k - (s  * LEVEL_DEPTH / NUM_SUBSETS) + SCALE_FACTOR/2;
            particles.needsUpdate = 0;
            scene.add( particles );
        }
    }

    // Setup renderer and effects
    renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '5px';
    stats.domElement.style.right = '5px';
    container.appendChild( stats.domElement );
            
    // Setup listeners
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );
    document.addEventListener( 'keydown', onKeyDown, false );
    window.addEventListener( 'resize', onWindowResize, false );
            
    // Schedule orbit regeneration
    //setInterval(updateOrbit, 7000);
    setInterval(updateOrbit, 250);
}

function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
}

function render() {
    /* IM - Mouse Driven Camera Positioning (temporarily removed)                  
    if (camera.position.x >= - CAMERA_BOUND && camera.position.x <= CAMERA_BOUND){
        camera.position.x += ( mouseX - camera.position.x ) * 0.05;
        if (camera.position.x < - CAMERA_BOUND) camera.position.x = -CAMERA_BOUND;
        if (camera.position.x >  CAMERA_BOUND) camera.position.x = CAMERA_BOUND;
    }
    if (camera.position.y >= - CAMERA_BOUND && camera.position.y <= CAMERA_BOUND){
        camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
        if (camera.position.y < - CAMERA_BOUND) camera.position.y = -CAMERA_BOUND;
        if (camera.position.y >  CAMERA_BOUND) camera.position.y = CAMERA_BOUND;
    }
    */
            
    camera.lookAt( scene.position );
            
    for( i = 0; i < scene.objects.length; i++ ) {
        scene.objects[i].position.z +=  speed;
        scene.objects[i].rotation.z += rotationSpeed;
        if (scene.objects[i].position.z > camera.position.z){
            scene.objects[i].position.z = - (NUM_LEVELS -1) * LEVEL_DEPTH;
            if (scene.objects[i].needsUpdate == 1){
                scene.objects[i].geometry.__dirtyVertices = true;   
                scene.objects[i].myMaterial.color.setHSV( hueValues[scene.objects[i].mySubset], DEF_SATURATION, DEF_BRIGHTNESS);
                scene.objects[i].needsUpdate = 0;
            }
        }
    }
    renderer.render( scene, camera );
}

///////////////////////////////////////////////
// Hopalong Orbit Generator
///////////////////////////////////////////////         
function updateOrbit(){
    generateOrbit();
    for (var s = 0; s < NUM_SUBSETS; s++){
        hueValues[s] = Math.random();
    }
    for( i = 0; i < scene.objects.length; i++ ) {
        scene.objects[i].needsUpdate = 1;
    }

}
        
function generateOrbit(){
    var x, y, z, x1;
    var idx = 0;

    prepareOrbit();
            
    // Using local vars should be faster
    var al = a;
    var bl = b;
    var cl = c;
    var dl = d;
    var el = e;
    var subsets = orbit.subsets;
    var num_points_subset_l = NUM_POINTS_SUBSET;
    var num_points_l = NUM_POINTS;
    var scale_factor_l = SCALE_FACTOR;
            
    var xMin = 0, xMax = 0, yMin = 0, yMax = 0;

    for (var s = 0; s < NUM_SUBSETS; s++){
            
        // Use a different starting point for each orbit subset
        x = s * .005 * (0.5-Math.random());
        y = s * .005 * (0.5-Math.random());
                
        var curSubset = subsets[s];
                
        for (var i = 0; i < num_points_subset_l; i++){
                
            // Iteration formula (generalization of the Barry Martin's original one)
            z = (dl + Math.sqrt(Math.abs(bl * x - cl)));
            if (x > 0) {x1 = y - z;}
            else if (x == 0) {x1 = y;}
            else {x1 = y + z;}
            y = al - x;
            x = x1 + el;        

            curSubset[i].x = x;
            curSubset[i].y = y;
                    
            if (x < xMin) {xMin = x;}
            else if (x > xMax) {xMax = x;}
            if (y < yMin) {yMin = y;}
            else if (y > yMax) {yMax = y;}
                    
            idx++;
        }
    }
                            
    var scaleX = 2 * scale_factor_l / (xMax - xMin);
    var scaleY = 2 * scale_factor_l / (yMax - yMin);
            
    orbit.xMin = xMin;
    orbit.xMax = xMax;
    orbit.yMin = yMin;
    orbit.yMax = yMax;
    orbit.scaleX = scaleX;
    orbit.scaleY = scaleY;
            
    // Normalize and update vertex data             
    for (var s = 0; s < NUM_SUBSETS; s++){
        var curSubset = subsets[s];
        for (var i = 0; i < num_points_subset_l; i++){
            curSubset[i].vertex.position.x = scaleX * (curSubset[i].x - xMin) - scale_factor_l;
            curSubset[i].vertex.position.y = scaleY * (curSubset[i].y - yMin) - scale_factor_l;                 
        }
    }
}
        
function prepareOrbit(){
    shuffleParams();
    orbit.xMin = 0;
    orbit.xMax = 0;
    orbit.yMin = 0;
    orbit.yMax = 0;
}
        
function shuffleParams() {
    a = A_MIN + Math.random() * (A_MAX - A_MIN);
    b = B_MIN + Math.random() * (B_MAX - B_MIN);
    c = C_MIN + Math.random() * (C_MAX - C_MIN);
    d = D_MIN + Math.random() * (D_MAX - D_MIN);
    e = E_MIN + Math.random() * (E_MAX - E_MIN);
}

///////////////////////////////////////////////
// Event listeners
///////////////////////////////////////////////
function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
}

function onDocumentTouchStart( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;
    }
}

function onWindowResize( event ) {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}               
        
function onKeyDown(event) {
    // IM: Old speed increase that stops increasing speed when a speed of 20 is reached
    //if(event.keyCode == 38 && speed < 20) speed += .5;
    // IM: New speed increase without limit (realistically hardware limited)
    if (event.keyCode == 38) speed += .5;
        //else if (event.keyCode == 40 && speed > 0) speed -= .5;
    else if (event.keyCode == 40) speed -= .5;
    else if (event.keyCode == 37) rotationSpeed += .001;
    else if (event.keyCode == 39) rotationSpeed -= .001;
    else if (event.keyCode == 72 || event.keyCode == 104) toggleVisuals();
    // C
    else if (event.keyCode == 67) toggleChaos();
    // W
    else if (event.keyCode == 87) camera.position.y += 5;
    // A
    else if (event.keyCode == 83) camera.position.y -= 5;
    // S
    else if (event.keyCode == 65) camera.position.x -= 5;
    // D
    else if (event.keyCode == 68) camera.position.x += 5;
    // Space
    else if (event.keyCode == 32) {
        camera.position.x = 0;
        camera.position.y = 0;
    }

}
    
function showHideAbout() {
    if (document.getElementById('about').style.display == "block") {
        document.getElementById('about').style.display = "none";
    } else {
        document.getElementById('about').style.display = "block";
    }
}
        
function toggleVisuals(){
    if(VISUALS_VISIBLE){
        document.getElementById('info').style.display = 'none';
        stats.domElement.style.display = 'none';
        renderer.domElement.style.cursor = "none";
        VISUALS_VISIBLE = false;
    }
    else {
        document.getElementById('info').style.display = 'block';
        stats.domElement.style.display = 'block';
        renderer.domElement.style.cursor = "";
        VISUALS_VISIBLE = true;
    }
}

//IM Toggles Constraints on Random Numbers
function toggleChaos() {
    if (CHAOS_ENABLED) {
        A_MIN = -42;
        A_MAX = 42;
        B_MIN = 0;
        B_MAX = 42;
        C_MIN = 0;
        C_MAX = 42;
        D_MIN = 0;
        D_MAX = 42;
        E_MIN = 0;
        E_MAX = 42;
        CHAOS_ENABLED = false;
        console.log("Chaos Disabled");
    }
    else {
        A_MIN = -30;
        A_MAX = 30;
        B_MIN = .2;
        B_MAX = 1.8;
        C_MIN = 5;
        C_MAX = 17;
        D_MIN = 0;
        D_MAX = 10;
        E_MIN = 0;
        E_MAX = 12;
        CHAOS_ENABLED = true;
        console.log("Chaos Enabled");
    }
}