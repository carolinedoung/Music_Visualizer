import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// post processing
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// objects
import Line from "./objects/Line";
import Board from "./objects/Board";
import LogoIut from "./objects/LogoIut";
import Cover from "./objects/Cover";
import audioController from "../utils/AudioController";
import Cube from "./objects/Cube";

class Scene {
  constructor() {}

  setup(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.currentObject = null;

    // instantier la logique three.js
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupStats();
    this.setupPostProcessing();
    this.setupGUI();

    this.setupTextureLoader();
    this.setupGltfLoader();

    this.addEvents();
    this.addObjects();
  }

  setupGUI() {
    this.gui = new GUI();

    this.bloomFolder = this.gui.addFolder("Bloom");
    this.bloomFolder
      .add(this.bloomParams, "threshold", 0, 1)
      .onChange((value) => {
        this.bloomPass.threshold = value;
      })
      .listen(); // rafraichit visuellement la GUI avec la nouvelle valeur

    this.bloomFolder
      .add(this.bloomParams, "strength", 0, 3)
      .onChange((value) => {
        this.bloomPass.strength = value;
      })
      .listen();

    this.bloomFolder
      .add(this.bloomParams, "radius", 0, 1)
      .onChange((value) => {
        this.bloomPass.radius = value;
      })
      .listen();
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);

    this.bloomParams = {
      threshold: 0,
      strength: 0.6,
      radius: 1,
    };

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0,
      0,
      0
    );

    this.bloomPass.threshold = this.bloomParams.threshold;
    this.bloomPass.strength = this.bloomParams.strength;
    this.bloomPass.radius = this.bloomParams.radius;

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
  }

  setupGltfLoader() {
    this.gltfLoader = new GLTFLoader();
  }

  setupTextureLoader() {
    this.textureLoader = new THREE.TextureLoader();
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  setupStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  addObjects() {
    // Déclaration des objets
    this.line = new Line();
    this.board = new Board();
    this.logoIut = new LogoIut();
    this.cover = new Cover();
    // this.cube = new Cube();
    // ....

    // ajout de l'objet à la scène par défaut
    this.camera.position.z = 20;
    this.scene.add(this.board.group);
    this.currentObject = this.board;
  }

  onResize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
  };

  addEvents() {
    gsap.ticker.add(this.tick);
    window.addEventListener("resize", this.onResize);
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    );

    // this.camera.position.z = 20;
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  pickVisualizer(index) {
    // on remove le group qui est rendu
    this.scene.remove(this.currentObject.group);

    // on change le current object
    switch (index) {
      case 0:
        // line
        this.camera.position.z = 200;
        this.currentObject = this.line;
        break;
      case 1:
        // board
        this.camera.position.z = 20;
        this.currentObject = this.board;
        break;
      case 2:
        // logo iut
        this.bloomParams.threshold = 0.6;
        this.bloomPass.threshold = 0.6;

        this.camera.position.z = 5;
        this.currentObject = this.logoIut;
        break;
      case 3:
        // logo iut
        this.bloomParams.threshold = 0.6;
        this.bloomPass.threshold = 0.6;

        this.camera.position.z = 20;
        this.currentObject = this.cover;
        break;
      default:
        break;
    }

    // on add le nouveau group
    this.scene.add(this.currentObject.group);
  }

  tick = (time, deltaTime, frame) => {
    this.stats.begin();

    // this.renderer.render(this.scene, this.camera);
    this.composer.render(); // prend le relais sur le renderer pour le post-processing

    this.controls.update();

    if (this.currentObject && audioController.fdata) {
      this.currentObject.update(time, deltaTime);
    }

    this.stats.end();
  };
}

const scene = new Scene();
export default scene;
