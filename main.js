import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import gsap from "gsap";
import LocomotiveScroll from 'locomotive-scroll';

const locomotiveScroll = new LocomotiveScroll();
const canvas = document.getElementById("canvas");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	40,
	window.innerWidth / window.innerHeight,
	0.1,
	100,
);

camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true,
	alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Setup post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.003;
composer.addPass(rgbShiftPass);

const pmremGenerator = new THREE.PMREMGenerator(renderer);

pmremGenerator.compileEquirectangularShader();

// Load HDRI environment map
let model;
new RGBELoader().load(
	"https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr",
	function (texture) {
		const envMap = pmremGenerator.fromEquirectangular(texture).texture;
		// scene.background = envMap;
		scene.environment = envMap;
		texture.dispose();
		pmremGenerator.dispose();

		// Load the GLTF model
		const loader = new GLTFLoader();

		loader.load(
			"/DamagedHelmet.gltf",
			function (gltf) {
				model = gltf.scene;
				scene.add(model);
			},
			undefined,
			function (error) {
				console.error(
					"An error occurred while loading the GLTF:",
					error,
				);
			},
		);
	},
);

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	composer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("mousemove", (event) => {
	if (model) {
		const mouseX = (event.clientX / window.innerWidth - 0.5) * Math.PI;
		const mouseY = (event.clientY / window.innerHeight - 0.5) * Math.PI;
		gsap.to(model.rotation, {
			x: mouseY * 0.12,
			y: mouseX * 0.12,
			duration: 0.8,
			ease: "power2.out",
		});
	}
});

function animate() {
	window.requestAnimationFrame(animate);

	composer.render(); // Use composer instead of renderer
}

animate();
