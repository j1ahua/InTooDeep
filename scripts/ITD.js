//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


//Create a Three.JS Scene
const scene = new THREE.Scene();
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 1000);

//keep track of mouse position, make the apple move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

//continuous auto rotation state
let autoRotationY = 0;
const baseSpeed = 0.0015;
const hoverSpeed = 0.001;
let isHovering = false;
let hoverFactor = 0;
const hoverLerpSpeed = 0.01;

//How strongly the cursor nudges rotation when hovering:
const hoverInfluence = 0.8; // tweak if needed


// keep 3d object on global variable to modify later
let object;

//OrbitControl allow the camera to move around in the scene
let controls;

//Set which object to render
let objToRender ='apple2';

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();
 
//load the file
loader.load(
    `models/${objToRender}/scene.gltf`,
    function (gltf){
        //If the file is loaded, add it to the scene
        object = gltf.scene;
        object.traverse((child) => {
            if (child.isMesh && child.material){
                child.material.color.set(0x470B0B);
            }
        })
        scene.add(object);
    },
    function (xhr){
        //While it is loading, log the progress
        console.log((xhr.loaded/xhr.total *100) + `% loaded`);
    },
    function (error){
        //If there is an error, log it
        console.error(error);
    }
);
//Instaniate a new renderer and set its size
const renderer = new THREE.WebGLRenderer( {alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

//Set how far the camera will be from the 3D model
camera.position.z = objToRender === "apple2" ? 5 : 500;  

//Add lights to the scene, so we can see the 3D model
const topLight = new THREE.DirectionalLight(0xD60953, 1); //(color, intensity)
topLight.position.set(500, 500, 500); //top-left-ish
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x969393, 1);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0x421A7D, 1.0, 25.0, Math.PI/4.0, 0.5, 1);
spotLight.position.copy(camera.position);
spotLight.map = new THREE.TextureLoader().load('images/pink-grad.jpg');



spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 1000;
spotLight.shadow.camera.fov = 80;

scene.add( spotLight );

//axes helper
const cameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
scene.add(cameraHelper);

//This adds controls to the camera, so we can rotate/ zoom it with the mouse


//Render the scene
function animate(){
    requestAnimationFrame(animate);
    
    if (object) {
        const target = isHovering ? 1: 0;
        hoverFactor += (target - hoverFactor) * hoverLerpSpeed;

        const speed = baseSpeed + (hoverSpeed - baseSpeed) * hoverFactor;
        
        // const speed = isHovering? hoverSpeed: baseSpeed;
        autoRotationY += speed;

        object.rotation.y = autoRotationY;
        object.rotation.x = 1.15;

        // if (isHovering){
        //     const targetOffsetY = (mouseX / window.innerWidth - 0.5) * 2;
        //     const targetOffsetX = (mouseY / window.innerHeight - 0.5) * 2;

        //     object.rotation.y += targetOffsetY * hoverInfluence * hoverFactor;
        //     object.rotation.x += targetOffsetX * hoverInfluence * hoverFactor;
        // }
    }
    renderer.render(scene, camera);
}
// Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

//raycasting for hovering effects on the apple
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

document.onmousemove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (object){
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(object, true);
        isHovering = intersects.length > 0;
    }
};
//start the 3D rendering
animate();
