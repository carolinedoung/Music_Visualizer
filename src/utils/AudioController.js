import gsap from "gsap";
import detect from "bpm-detective";

class AudioController {
  constructor() {
    // L'élément audio sera initialisé lors de l'appel à setup()
    this.audio = null;
    this.ctx = null;
    this.audioSource = null;
    this.analyserNode = null;
    this.fdata = null;
    this.isPlaying = false;
    this.bpm = 120; // Valeur par défaut
    this.isSetup = false;
    
    // Informations sur les pistes
    this.currentTrackIndex = -1;
    this.trackList = [];
  }

  setup() {
    // Ne pas réinitialiser si déjà configuré
    if (this.isSetup) {
      console.log("AudioController déjà initialisé");
      return;
    }
    
    console.log("Initialisation d'AudioController");
    
    // Créer le contexte audio
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Créer l'élément audio
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.audio.volume = 0.1;

    // Connecter l'audio au contexte
    this.audioSource = this.ctx.createMediaElementSource(this.audio);
    
    // Configurer l'analyseur
    this.analyserNode = new AnalyserNode(this.ctx, {
      fftSize: 1024,
      smoothingTimeConstant: 0.8,
    });
    
    // Tableau pour les données de fréquence
    this.fdata = new Uint8Array(this.analyserNode.frequencyBinCount);

    // Connecter les nœuds
    this.audioSource.connect(this.analyserNode);
    this.audioSource.connect(this.ctx.destination);

    // Ajouter les écouteurs d'événements
    this.setupEventListeners();

    // Démarrer la boucle de mise à jour
    gsap.ticker.add(this.tick);
    
    this.isSetup = true;
  }

  setupEventListeners() {
    // Écouteurs pour les changements d'état de lecture
    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
    });

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
    });

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false;
      
      // Lecture automatique de la piste suivante
      if (this.currentTrackIndex < this.trackList.length - 1) {
        this.next();
      }
    });
    
    // Détecter le BPM lorsque les données sont chargées
    this.audio.addEventListener("loadeddata", async () => {
      await this.detectBPM();
    });
  }

  // Définir la liste de pistes
  setTracks(tracks) {
    this.trackList = [...tracks];
    return this;
  }

  // Jouer une piste
  play = (src, trackInfo = null) => {
    // S'assurer que l'audio est initialisé
    if (!this.isSetup) {
      this.setup();
    }
    
    if (!src) {
      console.error("Source audio manquante");
      return;
    }
    
    console.log("Lecture de:", src);
    
    // Si la même source est déjà chargée, juste reprendre la lecture
    if (this.audio.src === src && this.audio.paused) {
      this.resumePlayback();
      return;
    }
    
    // Sinon, arrêter la lecture en cours et charger la nouvelle source
    this.audio.pause();
    this.audio.src = src;
    
    // Mettre à jour l'index de la piste courante
    if (this.trackList.length > 0) {
      const newIndex = this.trackList.findIndex(track => 
        track.preview === src || track.path === src
      );
      
      if (newIndex !== -1) {
        this.currentTrackIndex = newIndex;
      }
    }
    
    // Lecture avec gestion des erreurs
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Erreur lors de la lecture:", error);
      });
    }
  };

  // Mettre en pause
  pausePlayback = () => {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  };

  // Reprendre la lecture
  resumePlayback = () => {
    if (this.audio && this.audio.paused && this.audio.src) {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Erreur lors de la reprise de la lecture:", error);
        });
      }
    }
  };

  // Alterner entre lecture et pause
  togglePlayPause = () => {
    if (this.audio) {
      if (this.audio.paused) {
        this.resumePlayback();
      } else {
        this.pausePlayback();
      }
    }
  };

  // Passer à la piste suivante
  next = () => {
    if (this.trackList.length === 0 || this.currentTrackIndex === -1) return;
    
    const nextIndex = (this.currentTrackIndex + 1) % this.trackList.length;
    const nextTrack = this.trackList[nextIndex];
    
    if (nextTrack) {
      this.play(nextTrack.preview || nextTrack.path);
    }
  };

  // Revenir à la piste précédente
  previous = () => {
    if (this.trackList.length === 0 || this.currentTrackIndex === -1) return;
    
    // Si moins de 3 secondes écoulées, aller à la piste précédente,
    // sinon redémarrer la piste actuelle
    if (this.audio.currentTime < 3) {
      const prevIndex = (this.currentTrackIndex - 1 + this.trackList.length) % this.trackList.length;
      const prevTrack = this.trackList[prevIndex];
      
      if (prevTrack) {
        this.play(prevTrack.preview || prevTrack.path);
      }
    } else {
      this.audio.currentTime = 0;
    }
  };

  // Obtenir la piste actuelle
  getCurrentTrack = () => {
    if (this.currentTrackIndex === -1 || this.trackList.length === 0) return null;
    return this.trackList[this.currentTrackIndex];
  };

  // Détection du BPM
  detectBPM = async () => {
    try {
      if (!this.audio || !this.audio.src) return;
      
      // Créer un contexte audio hors-ligne
      const offlineCtx = new OfflineAudioContext(
        1,
        this.audio.duration * this.ctx.sampleRate,
        this.ctx.sampleRate
      );
      
      // Récupérer les données audio
      const response = await fetch(this.audio.src);
      const buffer = await response.arrayBuffer();
      const audioBuffer = await offlineCtx.decodeAudioData(buffer);
      
      // Détecter le BPM
      this.bpm = detect(audioBuffer);
      console.log(`BPM détecté: ${this.bpm}`);
    } catch (error) {
      console.error("Erreur lors de la détection du BPM:", error);
      this.bpm = 120; // Valeur par défaut
    }
  };

  // Mettre à jour les données de fréquence
  tick = () => {
    if (this.analyserNode && this.fdata) {
      this.analyserNode.getByteFrequencyData(this.fdata);
    }
  };
}

// Créer et exporter une instance unique
const audioController = new AudioController();

export default audioController;