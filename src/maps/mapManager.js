import { MAPS } from "./mapData.js";
import { MapRenderer } from "./mapRenderer.js?v=simple-world-v2";

export class MapManager {
  constructor(state, THREE, assetLoader = null, logger = () => {}) {
    this.state = state;
    this.mapRenderer = new MapRenderer(state, THREE, assetLoader, logger);
  }

  setMap(index) {
    const map = MAPS[index];
    if (!map || (index === this.state.mapIndex && this.state.walls === map.walls)) return;

    this.state.mapIndex = index;
    this.state.walls = map.walls;
    this.state.wallHeights = map.wallHeights;

    const mapName = document.getElementById("mapname");
    if (mapName) mapName.textContent = map.name;
    if (this.state.scene) this.buildMap();
  }

  buildMap() {
    this.mapRenderer.buildMap();
  }
}
