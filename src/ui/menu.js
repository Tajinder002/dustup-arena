import { MAPS } from "../maps/mapData.js?v=city-combat-v2";
import { randomInteger } from "../utils/math.js";
import { $, setMessage } from "../utils/dom.js";

export class MenuManager {
  constructor(soundManager, startHost, startJoin) {
    this.soundManager = soundManager;
    this.startHost = startHost;
    this.startJoin = startJoin;
  }

  initialize() {
    const mapSelect = $("map");
    MAPS.forEach((map, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = map.name;
      mapSelect.appendChild(option);
    });

    try {
      $("name").value = localStorage.getItem("dustup-name") || "";
    } catch (error) {
      console.debug("Name preference could not be read:", error);
    }

    const inviteRoom = new URLSearchParams(window.location.search).get("room");
    if (inviteRoom) $("code").value = inviteRoom.toUpperCase().slice(0, 4);

    $("host").addEventListener("click", () => {
      this.soundManager.initialize();
      this.startHost(this.getPlayerName());
    });

    $("join").addEventListener("click", () => {
      const roomCode = $("code").value.trim();
      if (roomCode.length !== 4) {
        setMessage("Enter the 4-letter room code.");
        return;
      }
      this.soundManager.initialize();
      this.startJoin(this.getPlayerName(), roomCode);
    });
  }

  getPlayerName() {
    const name = $("name").value.trim() || `Player${randomInteger(100)}`;
    try {
      localStorage.setItem("dustup-name", name);
    } catch (error) {
      console.debug("Name preference could not be saved:", error);
    }
    return name;
  }
}
