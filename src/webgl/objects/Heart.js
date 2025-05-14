import * as THREE from "three";
import audioController from "../../utils/AudioController";

export default class Heart {
  constructor() {
    // Créer un groupe pour contenir tous les éléments
    this.group = new THREE.Group();
    
    // Créer un matériau rouge pour le cœur
    this.material = new THREE.MeshBasicMaterial({
      color: 0xff1a1a,
      side: THREE.DoubleSide
    });
    
    // Créer un matériau pour les particules
    this.particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6699,
    });
    
    // Créer la forme du cœur en utilisant une forme personnalisée
    this.createHeartShape();
    
    // Créer des particules autour du cœur
    this.createParticles();
    
    // Rotation pour mettre le cœur à l'endroit
    this.group.rotation.z = Math.PI; // Rotation de 180 degrés autour de l'axe Z
  }
  
  createHeartShape() {
    // Créer une forme de cœur 2D
    const heartShape = new THREE.Shape();
    
    // Dessiner la forme du cœur avec des courbes de Bézier
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, -0.5, -1, -1.4, -2, 0);
    heartShape.bezierCurveTo(-3, 1.5, 0, 3, 0, 3);
    heartShape.bezierCurveTo(0, 3, 3, 1.5, 2, 0);
    heartShape.bezierCurveTo(1, -1.4, 0, -0.5, 0, 0);
    
    // Extruder la forme 2D en 3D
    const extrudeSettings = {
      steps: 2,
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 3
    };
    
    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    
    // Créer le maillage avec la géométrie et le matériau
    this.heart = new THREE.Mesh(heartGeometry, this.material);
    
    // Ajuster l'échelle et la position
    this.heart.scale.set(0.5, 0.5, 0.5);
    this.heart.position.set(0, 0, 0);
    
    // Ajouter au groupe
    this.group.add(this.heart);
  }
  
  createParticles() {
    // Créer des petites sphères comme particules autour du cœur
    const particleCount = 30;
    const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    
    // Fonction pour générer un point sur la forme d'un cœur
    const heartPoint = (t) => {
      // Paramètres t entre 0 et 1
      const angle = t * Math.PI * 2;
      
      // Équation paramétrique d'un cœur
      const x = 0.8 * 16 * Math.pow(Math.sin(angle), 3);
      const y = 0.8 * (13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2 * Math.cos(3*angle) - Math.cos(4*angle));
      
      return { x: x / 16, y: y / 16 };
    };
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, this.particleMaterial);
      
      // Générer un point sur la forme d'un cœur avec un peu de bruit
      const t = Math.random();
      const point = heartPoint(t);
      
      // Ajouter du bruit à la position
      const radius = 1.8 + Math.random() * 0.5;
      const noise = (Math.random() - 0.5) * 0.3;
      
      particle.position.x = point.x * radius + noise;
      particle.position.y = point.y * radius + noise;
      particle.position.z = (Math.random() - 0.5) * 0.8;
      
      // Stocker la position initiale et l'index pour l'animation
      particle.userData = {
        initialPosition: particle.position.clone(),
        index: i,
        t: t // Paramètre t pour l'animation
      };
      
      this.group.add(particle);
    }
  }
  
  update(time, deltaTime) {
    // Faire tourner lentement (uniquement sur l'axe Y pour maintenir l'orientation)
    this.group.rotation.y += deltaTime * 0.0005;
    
    // Faire réagir le cœur et les particules à l'audio
    if (audioController.fdata) {
      const beatFactor = audioController.fdata[0] / 255;
      const scale = 1 + beatFactor * 0.3;
      
      // Faire battre le cœur
      if (this.heart) {
        this.heart.scale.set(scale * 0.5, scale * 0.5, scale * 0.5);
      }
      
      // Animer les particules
      for (let i = 1; i < this.group.children.length; i++) {
        const particle = this.group.children[i];
        if (particle && particle.userData) {
          const initialPos = particle.userData.initialPosition;
          const index = particle.userData.index;
          const t = particle.userData.t;
          
          // Faire bouger les particules avec une amplitude qui dépend de l'audio
          const timeOffset = time * 0.001;
          particle.position.x = initialPos.x + Math.sin(timeOffset + index) * 0.2 * beatFactor;
          particle.position.y = initialPos.y + Math.cos(timeOffset + index) * 0.2 * beatFactor;
          particle.position.z = initialPos.z + Math.sin(timeOffset * 2 + t * 10) * 0.2 * beatFactor;
          
          // Faire varier la taille des particules
          const particleScale = 1 + beatFactor * 0.8;
          particle.scale.set(particleScale, particleScale, particleScale);
        }
      }
    }
  }
}