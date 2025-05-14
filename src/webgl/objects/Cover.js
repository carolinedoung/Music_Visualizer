import * as THREE from "three";
import audioController from "../../utils/AudioController";
import scene from "../Scene";
import fragmentShader from "../shaders/cover/fragment.glsl";
import vertexShader from "../shaders/cover/vertex.glsl";

export default class Cover {
  constructor() {
    this.group = new THREE.Group();
    this.geometry = new THREE.PlaneGeometry(12, 12, 256, 256);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: new THREE.Uniform(),
        uSize: new THREE.Uniform(4),
        uTime: new THREE.Uniform(0),
        uAudioFrequency: new THREE.Uniform(0),
      },
      side: THREE.DoubleSide,
      fragmentShader: fragmentShader,
      vertexShader: vertexShader,
    });
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.group.add(this.mesh);
    this.addTweaks();
    
    // Ajouter un écouteur pour les changements de piste
    this.setupTrackChangeListener();
  }
  
  // Configurer l'écouteur de changement de piste
  setupTrackChangeListener() {
    // Si audioController a un système d'événements
    if (audioController.on && typeof audioController.on === 'function') {
      audioController.on('onTrackChange', (track) => {
        if (track && track.album && track.album.cover_xl) {
          this.setCover(track.album.cover_xl);
        }
      });
    }
    
    // Écouter également les changements de src audio
    const origSrc = audioController.audio ? audioController.audio.src : null;
    let lastSrc = origSrc;
    
    // Vérifier périodiquement si la src a changé
    this.srcCheckInterval = setInterval(() => {
      if (audioController.audio && audioController.audio.src !== lastSrc) {
        lastSrc = audioController.audio.src;
        
        // Trouver la piste correspondante
        const tracks = this.getTracksFromStore();
        if (tracks && tracks.length) {
          const sourceFileName = lastSrc.split('/').pop();
          const track = tracks.find(t => {
            if (t.preview === lastSrc) return true;
            if (t.path === lastSrc) return true;
            if (t.preview && t.preview.split('/').pop() === sourceFileName) return true;
            if (t.path && t.path.split('/').pop() === sourceFileName) return true;
            return false;
          });
          
          if (track && track.album && track.album.cover_xl) {
            this.setCover(track.album.cover_xl);
          }
        }
      }
    }, 500); // Vérifier toutes les 500ms
  }
  
  // Obtenir les pistes du store (à adapter selon votre système de stockage)
  getTracksFromStore() {
    // Si vous avez un accès direct au store
    if (window.store && window.store.getState) {
      return window.store.getState().tracks;
    } 
    
    // Sinon, essayer d'accéder via la propriété trackList d'audioController
    if (audioController.trackList) {
      return audioController.trackList;
    }
    
    return [];
  }
  
  addTweaks() {
    this.folder = scene.gui.addFolder("Cover");
    this.folder
      .add(this.material.uniforms.uSize, "value", 0, 10)
      .name("uSize")
      .onChange((value) => {
        this.material.uniforms.uSize.value = value;
      })
      .listen(); // rafraichit visuellement la GUI avec la nouvelle valeur
  }
  
  setCover(src) {
    if (!src) return;
    
    console.log("Mise à jour de la cover avec:", src);
    
    // charger la texture
    this.texture = scene.textureLoader.load(src);
    
    // donner la texture au material
    this.material.uniforms.uMap.value = this.texture;
    
    // force la recompilation du material
    this.material.needsUpdate = true;
  }
  
  update(time) {
    // màj le time passé en uniform
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uAudioFrequency.value = audioController.fdata ? audioController.fdata[0] : 0;
  }
  
  // Nettoyage quand la classe est détruite
  dispose() {
    if (this.srcCheckInterval) {
      clearInterval(this.srcCheckInterval);
    }
    
    // Supprimer l'écouteur si nécessaire
    if (audioController.off && typeof audioController.off === 'function') {
      audioController.off('onTrackChange');
    }
  }
}