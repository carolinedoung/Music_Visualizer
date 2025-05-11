import { useState, useEffect, useRef } from 'react';
import audioController from '../../utils/AudioController';
import useStore from '../../utils/store';
import s from './PlayerControls.module.scss';

const PlayerControls = () => {
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
  
  // Trouver la piste actuelle
  const currentTrack = src ? (
    tracks.find(t => t.preview === src) || 
    tracks.find(t => src.includes(t.preview.split('/').pop())) || 
    { title: "Track", album: {} }
  ) : null;
  
  // Configurer les écouteurs d'événements
  useEffect(() => {
    if (!audioController.audio) return;
    
    const updateState = () => {
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
    
    // Ajouter tous les écouteurs avec la même fonction de callback
    const events = ['play', 'pause', 'timeupdate', 'durationchange', 'loadeddata', 'loadstart'];
    events.forEach(event => audioController.audio.addEventListener(event, updateState));
    
    // État initial
    updateState();
    
    // Nettoyage
    return () => events.forEach(event => 
      audioController.audio.removeEventListener(event, updateState)
    );
  }, []);
  
  // Si aucune piste n'est en cours, ne rien afficher
  if (!currentTrack) return null;
  
  // Formatage du temps (secondes -> MM:SS)
  const formatTime = seconds => {
    if (isNaN(seconds)) return '0:00';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  // Contrôles de lecture
  const controls = {
    togglePlay: () => audioController.audio.paused 
      ? audioController.audio.play() 
      : audioController.audio.pause(),
    
    seek: e => {
      const rect = progressRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      audioController.audio.currentTime = (percent / 100) * audioController.audio.duration;
    },
    
    prev: () => audioController.audio.currentTime > 3 
      ? audioController.audio.currentTime = 0 
      : null,
      
    next: () => {
      const idx = tracks.findIndex(t => t.preview === src);
      if (idx >= 0 && idx < tracks.length - 1) {
        audioController.play(tracks[idx + 1].preview);
      }
    },
    
    setVolume: e => audioController.audio.volume = Number(e.target.value) / 100
  };

  return (
    <div className={s.playerControls}>
      {/* Info piste */}
      <div className={s.trackInfo}>
        {currentTrack.album.cover_xl && (
          <img src={currentTrack.album.cover_xl} alt="" className={s.cover} />
        )}
        <div className={s.trackDetails}>
          <div className={s.title}>{currentTrack.title}</div>
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