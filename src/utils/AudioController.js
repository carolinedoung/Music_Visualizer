import gsap from "gsap";
import detect from "bpm-detective";

class AudioController {
  constructor() {
    // Initialiser les propriétés
    this.isPlaying = false;
    this.currentTrackIndex = -1;
    this.trackList = [];
    this.callbacks = {
      onTrackChange: [],
      onPlayStateChange: [],
      onTimeUpdate: []
    };
  }

  setup() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.bpm = null;
    this.audio.volume = 0.1;

    this.audioSource = this.ctx.createMediaElementSource(this.audio);

    this.analyserNode = new AnalyserNode(this.ctx, {
      fftSize: 1024,
      smoothingTimeConstant: 0.8,
    });

    this.fdata = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.audioSource.connect(this.analyserNode);
    this.audioSource.connect(this.ctx.destination);

    // Ajouter des écouteurs d'événements
    this.setupEventListeners();

    gsap.ticker.add(this.tick);
  }

  setupEventListeners() {
    this.audio.addEventListener("loadeddata", async () => {
      await this.detectBPM();
    });

    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.notifyPlayStateChange();
    });

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.notifyPlayStateChange();
    });

    this.audio.addEventListener("ended", () => {
      this.isPlaying = false;
      this.notifyPlayStateChange();
      
      // Auto-play next track on end
      if (this.currentTrackIndex < this.trackList.length - 1) {
        this.next();
      }
    });

    this.audio.addEventListener("timeupdate", () => {
      this.notifyTimeUpdate();
    });
  }

  // Définir la liste de lecture
  setTracks(tracks) {
    this.trackList = [...tracks];
    return this;
  }

  // Jouer une piste à partir de son URL
  play = (src, trackInfo = null) => {
    // Si la même source est déjà chargée, juste reprendre la lecture
    if (this.audio.src === src && this.audio.paused) {
      this.resumePlayback();
      return;
    }
    
    // Sinon, charger et jouer la nouvelle source
    this.audio.src = src;
    
    // Mettre à jour l'index de la piste courante si l'information est disponible
    if (trackInfo && this.trackList.length > 0) {
      const newIndex = this.trackList.findIndex(track => 
        track.preview === src || 
        (trackInfo.id && track.id === trackInfo.id)
      );
      
      if (newIndex !== -1) {
        this.currentTrackIndex = newIndex;
        this.notifyTrackChange();
      }
    } else if (this.trackList.length > 0) {
      // Essayer de trouver la piste par son URL
      const newIndex = this.trackList.findIndex(track => track.preview === src);
      
      if (newIndex !== -1) {
        this.currentTrackIndex = newIndex;
        this.notifyTrackChange();
      }
    }
    
    this.audio.play().catch(error => {
      console.error("Error playing audio:", error);
    });
  };

  // Mettre en pause
  pausePlayback = () => {
    if (!this.audio.paused) {
      this.audio.pause();
    }
  };

  // Reprendre la lecture
  resumePlayback = () => {
    if (this.audio.paused && this.audio.src) {
      this.audio.play().catch(error => {
        console.error("Error resuming playback:", error);
      });
    }
  };

  // Alterner entre lecture et pause
  togglePlayPause = () => {
    if (this.audio.paused) {
      this.resumePlayback();
    } else {
      this.pausePlayback();
    }
  };

  // Passer à la piste suivante
  next = () => {
    if (this.trackList.length === 0 || this.currentTrackIndex === -1) return;
    
    const nextIndex = (this.currentTrackIndex + 1) % this.trackList.length;
    this.playTrackAtIndex(nextIndex);
  };

  // Revenir à la piste précédente
  previous = () => {
    if (this.trackList.length === 0 || this.currentTrackIndex === -1) return;
    
    // Si moins de 3 secondes écoulées, aller à la piste précédente,
    // sinon redémarrer la piste actuelle
    if (this.audio.currentTime < 3) {
      const prevIndex = (this.currentTrackIndex - 1 + this.trackList.length) % this.trackList.length;
      this.playTrackAtIndex(prevIndex);
    } else {
      this.audio.currentTime = 0;
    }
  };

  // Jouer une piste à un index spécifique
  playTrackAtIndex = (index) => {
    if (index < 0 || index >= this.trackList.length) return;
    
    this.currentTrackIndex = index;
    const track = this.trackList[index];
    
    if (track && track.preview) {
      this.audio.src = track.preview;
      this.audio.play().catch(error => {
        console.error("Error playing track at index:", error);
      });
      
      this.notifyTrackChange();
    }
  };

  // Obtenir la piste actuelle
  getCurrentTrack = () => {
    if (this.currentTrackIndex === -1 || this.trackList.length === 0) return null;
    return this.trackList[this.currentTrackIndex];
  };

  // Obtenir la durée actuelle et totale
  getTime = () => {
    return {
      current: this.audio.currentTime,
      duration: this.audio.duration || 0,
      percentage: this.audio.duration 
        ? (this.audio.currentTime / this.audio.duration) * 100 
        : 0
    };
  };

  // Définir la position de lecture
  seekTo = (percentage) => {
    if (this.audio.duration) {
      this.audio.currentTime = (percentage / 100) * this.audio.duration;
    }
  };

  // Régler le volume (0-1)
  setVolume = (volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audio.volume = clampedVolume;
  };

  // Système d'événements
  on = (event, callback) => {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
    return this; // Pour le chaînage
  };

  off = (event, callback) => {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
    return this; // Pour le chaînage
  };

  notifyTrackChange = () => {
    const currentTrack = this.getCurrentTrack();
    this.callbacks.onTrackChange.forEach(callback => callback(currentTrack, this.currentTrackIndex));
  };

  notifyPlayStateChange = () => {
    this.callbacks.onPlayStateChange.forEach(callback => callback(this.isPlaying));
  };

  notifyTimeUpdate = () => {
    const timeInfo = this.getTime();
    this.callbacks.onTimeUpdate.forEach(callback => callback(timeInfo));
  };

  detectBPM = async () => {
    try {
      // Create an offline audio context to process the data
      const offlineCtx = new OfflineAudioContext(
        1,
        this.audio.duration * this.ctx.sampleRate,
        this.ctx.sampleRate
      );
      // Decode the current audio data
      const response = await fetch(this.audio.src); // Fetch the audio file
      const buffer = await response.arrayBuffer();
      const audioBuffer = await offlineCtx.decodeAudioData(buffer);
      // Use bpm-detective to detect the BPM
      this.bpm = detect(audioBuffer);
      console.log(`Detected BPM: ${this.bpm}`);
    } catch (error) {
      console.error("Error detecting BPM:", error);
      this.bpm = 120; // Fallback to a default BPM
    }
  };

  tick = () => {
    this.analyserNode.getByteFrequencyData(this.fdata);
  };
}

const audioController = new AudioController();
export default audioController;
