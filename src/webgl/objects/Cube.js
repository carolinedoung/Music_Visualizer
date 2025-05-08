import * as THREE from "three";
import audioController from "../../utils/AudioController";

export default class Cube {
  constructor() {
    this.group = new THREE.Group();

    this.count = 0;

    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({
      color: "0xFFFFFF",
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.group.add(this.mesh);
  }

  update(time, deltaTime) {
    if (audioController.bpm) {
      this.count += deltaTime * 0.001;

      if (this.count > 60 / audioController.bpm) {
        // changer la couleur
        this.material.color.setRGB(Math.random(), Math.random(), Math.random());

        this.count = 0;
      }
    }
  }
}
