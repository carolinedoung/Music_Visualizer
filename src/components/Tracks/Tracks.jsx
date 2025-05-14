import { useEffect, useState } from "react";
import Track from "../Track/Track";
import useStore from "../../utils/store";
import { fetchMetadata } from "../../utils/utils";
import TRACKS from "../../utils/TRACKS";
import fetchJsonp from "fetch-jsonp";
import s from "./Tracks.module.scss";

const Tracks = () => {
  // permet d'alterner entre true et false pour afficher / cacher le composant
  const [showTracks, setShowTracks] = useState(false);
  const { tracks, setTracks } = useStore();
  
  // État pour gérer les résultats de recherche séparément
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  
  // écouter la variable tracks qui vient du store
  useEffect(() => {
    if (tracks.length > TRACKS.length) {
      setShowTracks(true);
    }
  }, [tracks]);
  
  useEffect(() => {
    // Charge seulement les métadonnées pour les tracks initiaux
    // et ne modifie jamais cette liste avec les résultats de recherche
    fetchMetadata(TRACKS, tracks, setTracks);
  }, []);
  
  const onKeyDown = (e) => {
    if (e.keyCode === 13 && e.target.value !== "") {
      // l'utilisateur a appuyé sur sa touche entrée
      const userInput = e.target.value;
      // appeler la fonction de recherche sans modifier les tracks
      getSongs(userInput);
      // Assurez-vous que le mode de recherche est activé
      setIsSearching(true);
    }
  };
  
  const onChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (value === "") {
      // Si l'input est vide, on revient à la liste normale
      setIsSearching(false);
      setSearchResults([]);
    } else {
      // L'utilisateur est en train de taper
      setIsSearching(true);
      
      // Si l'utilisateur tape, attendre un peu avant de faire la recherche
      if (value.length > 2) {
        // Debounce la recherche pour éviter trop d'appels API
        const timeoutId = setTimeout(() => {
          getSongs(value);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
  };
  
  const getSongs = async (userInput) => {
    let response = await fetchJsonp(
      `https://api.deezer.com/search?q=${userInput}&output=jsonp`
    );
    if (response.ok) {
      response = await response.json();
      // Mettre à jour uniquement les résultats de recherche
      setSearchResults(response.data);
      // Assurez-vous que ces résultats n'affectent jamais les tracks originaux
      // Notez que nous ne faisons PAS setTracks() avec ces résultats
    } else {
      // erreurs
      setSearchResults([]);
    }
  };
  
  // Fonction pour effacer la recherche
  const clearSearch = () => {
    setSearchInput("");
    setIsSearching(false);
    setSearchResults([]);
  };
  
  // Détermine quelle liste afficher
  const displayedTracks = isSearching ? searchResults : tracks;
  
  return (
    <>
      <div
        className={s.toggleTracks}
        onClick={() => setShowTracks(!showTracks)}
      >
        tracklist
      </div>
      <section
        className={`${s.wrapper} ${showTracks ? s.wrapper_visible : ""}`}
      >
        {/* Barre de recherche avec bouton pour effacer */}
        <div className={s.searchContainer}>
          <input
            type="text"
            placeholder="Chercher un artiste"
            className={s.searchInput}
            onKeyDown={onKeyDown}
            onChange={onChange}
            value={searchInput}
          />
          {isSearching && (
            <button onClick={clearSearch} className={s.clearSearch}>
              ✕
            </button>
          )}
          {isSearching && (
            <div className={s.searchStatus}>
              Résultats pour "{searchInput}"
            </div>
          )}
        </div>
       
        <div className={s.tracks}>
          <div className={s.header}>
            <span className={s.order}>#</span>
            <span className={s.title}>Titre</span>
            <span className={s.duration}>Durée</span>
          </div>
          {displayedTracks.map((track, i) => (
            <Track
              key={`${isSearching ? 'search' : 'library'}-${track.id || track.title}-${i}`}
              title={track.title}
              duration={track.duration}
              cover={track.album?.cover_xl}
              src={track.preview}
              index={i}
            />
          ))}
          {isSearching && searchResults.length === 0 && searchInput.length > 2 && (
            <div className={s.noResults}>Aucun résultat trouvé</div>
          )}
        </div>
      </section>
    </>
  );
};

export default Tracks;