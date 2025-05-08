import * as THREE from "three";
import audioController from "../../utils/AudioController";

export default class Board {
  constructor() {
    this.width = 16;
    this.gap = 1;
    this.group = new THREE.Group();
    this.count = 0;
    this.materialCount = 0;

    this.geometry = new THREE.BoxGeometry(1, 1, 1);

    this.whiteMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    this.pinkMaterial = new THREE.MeshBasicMaterial({
      color: 0x8f00ff,
    });

    for (let y = 0; y < this.width; y++) {
      for (let x = 0; x < this.width; x++) {
        let mesh;

        if (x % 2 === y % 2) {
          mesh = new THREE.Mesh(this.geometry, this.whiteMaterial);
        } else {
          mesh = new THREE.Mesh(this.geometry, this.pinkMaterial);
        }

        mesh.position.set(-this.width / 2 + x, -this.width / 2 + y, 0);

        this.group.add(mesh);
      }
    }
  }

  update(time, deltaTime) {
    if (audioController.bpm) {
      this.count += deltaTime * 0.001;

      if (this.count > 60 / audioController.bpm) {
        if (this.materialCount % 2 === 0) {
          this.whiteMaterial.color.setHex(0x8f00ff);
          this.pinkMaterial.color.setHex(0xffffff);
        } else {
          this.pinkMaterial.color.setHex(0x8f00ff);
          this.whiteMaterial.color.setHex(0xffffff);
        }

        this.count = 0;
        this.materialCount += 1;
      }
    }

    for (let i = 0; i < this.group.children.length; i++) {
      this.group.children[i].scale.z = audioController.fdata[i] * 0.05;
    }

    this.group.rotation.x += 0.001;
    this.group.rotation.y += 0.001;
  }
}
