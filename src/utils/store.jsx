import { create } from "zustand";
import TRACKS from "./TRACKS";

const useStore = create((set) => ({
  // defaultTracks: TRACKS,

  // la liste processed par la librairie, et prête à être rendue dans le DOM
  tracks: [],
  setTracks: (newTracks) => set({ tracks: newTracks })
}));

export default useStore;