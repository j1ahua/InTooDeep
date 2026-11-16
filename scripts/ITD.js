import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

//values that scrolling controls:
const apple = { x: 0, y: 0, scale: 1, spin: 0};
let baseScale = 1; //the apple's original scale from the gltf

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);


//Create a Three.JS Scene
const scene = new THREE.Scene();
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 1000);


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


//Set which object to render
let objToRender ='apple2';

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();
 
//load the file

//Instaniate a new renderer and set its size
const renderer = new THREE.WebGLRenderer( {
    alpha: true, 
    antialias: true
});
const pixelRatio = Math.min(window.devicePixelRatio, 2);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(pixelRatio);

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

//Set how far the camera will be from the 3D model
camera.position.z = objToRender === "apple2" ? 5 : 500;  


//Rim light shader
const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main(){
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
    `;
const fragmentShader = `
    uniform vec3 rimColor;
    uniform float rimPower;
    uniform float rimIntensity;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main(){
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Calculate rim light using Fresnel effect
        float rim = 1.0 -max(0.0, dot(normal, viewDir));
        rim = pow(rim, rimPower) * rimIntensity;
        
        // Base color with rim light
        vec3 finalColor = vec3(0.1, 0.1, 0.15) + rimColor * rim;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        rimColor: { value: new THREE.Color(0x47002E)},
        rimPower: { value: 5.0 },
        rimIntensity: { value: 5.5 }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

//Add lights to the scene, so we can see the 3D model
const topLight = new THREE.DirectionalLight(0xD60953, 1); //(color, intensity)
topLight.position.set(500, 500, 500); //top-left-ish
topLight.castShadow = true;
scene.add(topLight);



const spotLight = new THREE.SpotLight(0x421A7D, 1.0, 25.0, Math.PI/4.0, 0.5, 1);
spotLight.position.copy(camera.position);




spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 1000;
spotLight.shadow.camera.fov = 80;

scene.add(spotLight);

//axes helper
// const cameraHelper = new THREE.CameraHelper(spotLight.shadow.camera);
// scene.add(cameraHelper);

loader.load(
    `models/${objToRender}/scene.gltf`,
    function (gltf){
        //If the file is loaded, add it to the scene
        object = gltf.scene;
        const meshesToProcess = [];
        object.traverse((child) => {
            if (child.isMesh){

                meshesToProcess.push(child);
            }
        });
        meshesToProcess.forEach((child)=>{
                // grab the PBR material GLTFLoader already built, before we overwrite it
                const original = child.material;

                // base mesh: real lit material, keeps textures + reacts to your lights
                child.material = new THREE.MeshStandardMaterial({
                    map: original.map,
                    normalMap: original.normalMap,
                    metalnessMap: original.metalnessMap,
                    roughnessMap: original.roughnessMap,
                    metalness: original.metalness,
                    roughness: original.roughness,
                    color: new THREE.Color(0x5E0000)
                });
                child.castShadow = true;
                child.receiveShadow = true;

                // overlay mesh: same geometry, rim shader, added as a child
                const rimMesh = new THREE.Mesh(child.geometry, material);
                child.add(rimMesh);
        });

            
        baseScale = object.scale.x;
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
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
const bloomPass = new UnrealBloomPass(resolution, 0.2, 0.4, 1);
composer.addPass( bloomPass );


//Render the scene
function animate(){
    // requestAnimationFrame(animate);
    
    if (object) {
        const target = isHovering ? 1: 0;
        hoverFactor += (target - hoverFactor) * hoverLerpSpeed;
        const speed = baseSpeed + (hoverSpeed - baseSpeed) * hoverFactor;
        autoRotationY += speed;

        object.rotation.y = autoRotationY + apple.spin; //auto spin + scroll
        object.rotation.x = 1.15;
        object.position.x = apple.x;
        object.position.y = apple.y;
        object.scale.setScalar(baseScale * apple.scale);
    }
    renderer.render(scene, camera);
    // composer.render();
}
// Add a listener to the window, so we can resize the window and the camera
// const container = document.getElementById("container3D");
function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio); // ratio first
    renderer.setSize(width, height);

    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
}

window.addEventListener("resize", onResize);

//raycasting for hovering effects on the apple
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

document.onmousemove = (e) => {

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    if (object){
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(object, true);
        isHovering = intersects.length > 0;
    }
};

function getLeftX(){
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov /2));
    const halfWidth = halfHeight * camera.aspect;
    return -halfWidth * 2; //center of the left half of the screen
}

// gsap.to(apple, {
//     spin: Math.PI * 2,      //one full turn on the y axis
//     scale: 0.3,            //shrink
//     x: () => getLeftX(),
//     ease: "none",
//     scrollTrigger:{
//         trigger: ".hero",
//         start: "top top",
//         end: "bottom top",
//         scrub: 1,
//         invalidateOnRefresh: true
//     }
// });

//Text "spawns" from the apple, wipes in from left to right

// gsap.utils.toArray(".content > *").forEach((el) => {
//     gsap.fromTo(el,
//         { clipPath: "inset(0 100% 0 0)", x: -60, opacity: 0 },
//         {
//             clipPath: "inset(0 0% 0 0)",
//             x: 0,
//             opacity: 1,
//             duration: 1,
//             ease: "power3.out",
//             scrollTrigger: {
//                 trigger: el,
//                 start: "top 85%",
//                 toggleActions: "play none none reverse"
//             }
//         }
//     );
// });
const POS = {
  start:   { nx: 0,    ny: 0,     scale: 1 },
  left:    { nx: -0.65, ny: 0,     scale: 0.3 },
  about:   { nx: 0.65,  ny: 0.45,  scale: 0.4 },
  contact: { nx: 0.65,  ny: -0.5,  scale: 0.3 }
};

function worldAt(p) {
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const halfW = halfH * camera.aspect;
  return { x: p.nx * halfW, y: p.ny * halfH };
}

// one scroll-scrubbed move from one spot to another
function appleMove(from, to, spinFrom, spinTo, st) {
  gsap.fromTo(apple,
    { x: () => worldAt(from).x, y: () => worldAt(from).y, scale: from.scale, spin: spinFrom },
    {
      x: () => worldAt(to).x, y: () => worldAt(to).y, scale: to.scale, spin: spinTo,
      ease: "none",
      immediateRender: false, // otherwise a later move would overwrite an earlier one on load
      scrollTrigger: { scrub: true, invalidateOnRefresh: true, ...st }
    }
  );
}
const track = document.querySelector(".episodes");
const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth * 0.5);

// 1. hero -> apple moves left (replaces your old gsap.to(apple, ...))
appleMove(POS.start, POS.left, 0, Math.PI * 2, {
  trigger: ".hero", start: "top top", end: "bottom top"
});

// 2. episodes: pin the section and slide the cards sideways
const horizontalTween = gsap.to(track, {
  x: () => -getDistance(),
  ease: "none",
  scrollTrigger: {
    trigger: ".descriptions",
    start: "top top",
    end: () => "+=" + getDistance(),
    pin: true,
    scrub: true,
    invalidateOnRefresh: true,
    anticipatePin: 1
  }
});

// apple stays on the left and turns half a rotation while the cards slide
appleMove(POS.left, POS.left, Math.PI * 2, Math.PI * 3, {
  trigger: ".descriptions", start: "top top", end: () => "+=" + getDistance()
});

// 3. About Me: left -> top-right
appleMove(POS.left, POS.about, Math.PI * 3, Math.PI * 5, {
  trigger: ".aboutMe", start: "top bottom", end: "top 40%"
});

// 4. Contact: top-right -> bottom-right
appleMove(POS.about, POS.contact, Math.PI * 5, Math.PI * 7, {
  trigger: ".contact", start: "top bottom", end: "top 40%"
});

// cards ease in as they enter from the right
gsap.utils.toArray(".episode-card").forEach((card) => {
  gsap.fromTo(card,
    { opacity: 0, scale: 0.85, x: 40 },
    {
      opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        containerAnimation: horizontalTween, // tells ScrollTrigger the card moves sideways
        start: "left 90%",
        toggleActions: "play none none reverse"
      }
    }
  );
});

// About Me and Contact still wipe in left to right
gsap.utils.toArray(".aboutMe > *, .contact > *").forEach((el) => {
  gsap.fromTo(el,
    { clipPath: "inset(0 100% 0 0)", x: -60, opacity: 0 },
    {
      clipPath: "inset(0 0% 0 0)", x: 0, opacity: 1, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
    }
  );
});


gsap.ticker.add(animate);