import { useState, useEffect, useRef } from 'react';
import audioController from '../../utils/AudioController';
import useStore from '../../utils/store';
import s from './PlayerControls.module.scss';

const PlayerControls = () => {
  // S'assurer que AudioController est initialisé
  useEffect(() => {
    if (!audioController.isSetup) {
      audioController.setup();
    }
    
    // Forcer un rafraîchissement initial
    const initialTimer = setTimeout(() => {
      updateAudioStateFromController();
    }, 100);
    
    return () => clearTimeout(initialTimer);
  }, []);
  
  // État pour suivre les propriétés audio
  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    percentage: 0,
    src: ""
  });
  
  const progressRef = useRef(null);
  const { tracks } = useStore();
  const { isPlaying, currentTime, duration, percentage, src } = audioState;
  
  // Mettre à jour l'état audio depuis le contrôleur
  const updateAudioStateFromController = () => {
    if (!audioController.audio) return;
    
    setAudioState({
      isPlaying: !audioController.audio.paused,
      currentTime: audioController.audio.currentTime || 0,
      duration: audioController.audio.duration || 0,
      percentage: audioController.audio.duration 
        ? (audioController.audio.currentTime / audioController.audio.duration) * 100 
        : 0,
      src: audioController.audio.src || ""
    });
  };
  
  // Mettre à jour la trackList d'AudioController quand les pistes changent
  useEffect(() => {
    audioController.setTracks(tracks);
  }, [tracks]);
  
  // Identifier la piste actuelle
  const getCurrentTrack = () => {
    if (!src || !audioController.audio) return null;
    
    // Recherche par URL exacte
    let track = tracks.find(t => t.preview === src || t.path === src);
    if (track) return track;
    
    // Recherche par nom de fichier
    const sourceFileName = src.split('/').pop();
    track = tracks.find(t => {
      if (t.preview && t.preview.split('/').pop() === sourceFileName) return true;
      if (t.path && t.path.split('/').pop() === sourceFileName) return true;
      return false;
    });
    
    return track || null;
  };
  
  const currentTrack = getCurrentTrack();
  
  // Configurer les écouteurs d'événements audio
  useEffect(() => {
    // Vérifier si l'audio est disponible
    if (!audioController.audio) return;
    
    // Fonction pour mettre à jour l'état du lecteur
    const updateAudioState = () => {
      updateAudioStateFromController();
    };
    
    // Liste des événements à surveiller
    const events = ['play', 'pause', 'timeupdate', 'durationchange', 'loadeddata', 'loadstart', 'canplay'];
    
    // Nettoyer les écouteurs existants
    events.forEach(event => {
      audioController.audio.removeEventListener(event, updateAudioState);
    });
    
    // Ajouter les nouveaux écouteurs
    events.forEach(event => {
      audioController.audio.addEventListener(event, updateAudioState);
    });
    
    // État initial
    updateAudioState();
    
    // Nettoyage à la fin
    return () => {
      if (audioController.audio) {
        events.forEach(event => {
          audioController.audio.removeEventListener(event, updateAudioState);
        });
      }
    };
  }, []);
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = seconds => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Contrôles du lecteur
  const controls = {
    togglePlay: () => {
      if (!audioController.audio) return;
      
      if (audioController.audio.paused) {
        if (!audioController.audio.src && tracks.length > 0) {
          // Aucune piste en cours, jouer la première
          const firstTrack = tracks[0];
          audioController.play(firstTrack.preview || firstTrack.path);
        } else {
          audioController.resumePlayback();
        }
      } else {
        audioController.pausePlayback();
      }
    },
    
    seek: e => {
      if (!audioController.audio || !progressRef.current) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      audioController.audio.currentTime = (percent / 100) * audioController.audio.duration;
    },
    
    prev: () => {
      if (!audioController.audio) return;
      
      // Si on est au début de la piste, aller à la précédente
      if (audioController.audio.currentTime > 3) {
        audioController.audio.currentTime = 0;
      } else {
        // Utiliser la méthode de AudioController
        audioController.previous();
      }
    },
    
    next: () => {
      // Utiliser la méthode de AudioController
      audioController.next();
    },
    
    setVolume: e => {
      if (audioController.audio) {
        audioController.audio.volume = Number(e.target.value) / 100;
      }
    }
  };
  
  // Afficher une interface minimale si aucune piste n'est sélectionnée
  if (!currentTrack) {
    return (
      <div className={s.playerControls}>
        <div className={s.trackInfo}>
          <div className={s.trackDetails}>
            <div className={s.title}>Sélectionnez une piste</div>
          </div>
        </div>
        
        <div className={s.mainControls}>
          <div className={s.buttons}>
            <button disabled>⏮</button>
            <button 
              onClick={() => {
                if (tracks.length > 0) {
                  const firstTrack = tracks[0];
                  audioController.play(firstTrack.preview || firstTrack.path);
                }
              }} 
              className={s.playBtn}
            >
              ▶
            </button>
            <button disabled>⏭</button>
          </div>
          
          <div className={s.progressContainer}>
            <span>0:00</span>
            <div className={s.progressBar} ref={progressRef}>
              <div className={s.progress} style={{width: '0%'}}></div>
            </div>
            <span>0:00</span>
          </div>
        </div>
        
        <div className={s.volumeControl}>
          <span>🔊</span>
          <input 
            type="range" min="0" max="100" 
            defaultValue={audioController.audio?.volume * 100 || 50}
            onChange={controls.setVolume} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className={s.playerControls}>
      {/* Info piste */}
      <div className={s.trackInfo}>
        {currentTrack.album?.cover_xl && (
          <img src={currentTrack.album.cover_xl} alt="" className={s.cover} />
        )}
        <div className={s.trackDetails}>
          <div className={s.title}>{currentTrack.title || currentTrack.name || "Titre inconnu"}</div>
          <div className={s.artist}>
            {currentTrack.artists?.join(', ') || currentTrack.artist?.name || ''}
          </div>
        </div>
      </div>
      
      {/* Contrôles */}
      <div className={s.mainControls}>
        <div className={s.buttons}>
          <button onClick={controls.prev}>⏮</button>
          <button onClick={controls.togglePlay} className={s.playBtn}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={controls.next}>⏭</button>
        </div>
        
        <div className={s.progressContainer}>
          <span>{formatTime(currentTime)}</span>
          <div className={s.progressBar} ref={progressRef} onClick={controls.seek}>
            <div className={s.progress} style={{width: `${percentage}%`}}></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Volume */}
      <div className={s.volumeControl}>
        <span>🔊</span>
        <input 
          type="range" min="0" max="100" 
          defaultValue={audioController.audio?.volume * 100 || 50}
          onChange={controls.setVolume} 
        />
      </div>
    </div>
  );
};

export default PlayerControls;