import { useState } from "react";
import scene from "../../webgl/Scene";
import s from "./Picker.module.scss";

const VISUALIZERS = [
  {
    name: "Line",
    index: 0,
  },
  {
    name: "Board",
    index: 1,
  },
  {
    name: "Logo Iut",
    index: 2,
  },
  {
    name: "Cover",
    index: 3,
  },
];

const Picker = () => {
  const [current, setCurrent] = useState(0);

  const pickVisualizer = (index) => {
    // changer visuellement la liste
    setCurrent(index);

    // appeler la méthode qui permet de changer d'objet 3D
    scene.pickVisualizer(index);
  };

  return (
    <div className={s.picker}>
      {VISUALIZERS.map((visualizer) => (
        <span
          key={visualizer.name}
          className={`${current === visualizer.index ? s.current : ""}`}
          onClick={() => pickVisualizer(visualizer.index)}
        >
          {visualizer.name}
        </span>
      ))}
    </div>
  );
};

export default Picker;
