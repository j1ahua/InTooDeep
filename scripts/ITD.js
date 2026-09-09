//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// keep 3d object on global variable to modify later
let object;

//OrbitControl allow the camera to move around in the scene
let controls;

//Set which object to render
let objToRender ='apple';

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

//load the file
loader.load(
    `models/${objToRender}/scene.gltf`,
    function (gltf){
        //If the file is loaded, add it to the scene
        object = gltf.scene;
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

const renderer = new THREE.WebGL