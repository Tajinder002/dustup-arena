import { createGameState } from "./state/gameState.js";
import { AssetLoader } from "./assets/assetLoader.js";
import { SoundManager } from "./audio/soundManager.js";
import { CollisionManager } from "./game/collisionManager.js";
import { GameSimulation } from "./game/gameSimulation.js";
import { ClientPrediction } from "./game/clientPrediction.js";
import { InputManager } from "./input/inputManager.js";
import { MapManager } from "./maps/mapManager.js";
import { PeerManager } from "./networking/peerManager.js";
import { SceneManager } from "./rendering/scene.js";
import { PlayerRenderer } from "./rendering/playerRenderer.js?v=cyborg-shoot-overlay-v3";
import { CameraController } from "./rendering/camera.js?v=cyborg-shoot-overlay-v3";
import { HudRenderer } from "./rendering/hudRenderer.js";
import { GameRenderer } from "./rendering/renderer.js";
import { MenuManager } from "./ui/menu.js";
import { PauseMenu } from "./ui/pauseMenu.js";
import { DebugLogger } from "./utils/debugLogger.js";
import { $, setMessage } from "./utils/dom.js";
import { MAPS } from "./maps/mapData.js";

class DustupArenaGame {
  constructor(THREE, Peer) {
    this.state = createGameState();
    this.state.hudContext = $("c").getContext("2d");

    this.THREE = THREE;
    this.Peer = Peer;
    this.debugLogger = new DebugLogger(this.state);
    this.soundManager = new SoundManager();
    this.state.soundManager = this.soundManager;
    this.assetLoader = new AssetLoader(THREE, {
      onProgress: progress => this.updateAssetProgress(progress),
      logger: message => this.debugLogger.log(message)
    });

    this.collisionManager = new CollisionManager(this.state);
    this.mapManager = new MapManager(
      this.state,
      THREE,
      this.assetLoader,
      message => this.debugLogger.log(message)
    );
    this.sceneManager = new SceneManager(
      this.state,
      THREE,
      this.mapManager,
      message => this.debugLogger.log(message)
    );
    this.simulation = new GameSimulation(this.state, this.collisionManager);
    this.inputManager = new InputManager(this.state, $("c"));
    this.prediction = new ClientPrediction(
      this.state,
      this.collisionManager,
      this.soundManager,
      () => this.inputManager.localInput()
    );

    this.playerRenderer = new PlayerRenderer(
      this.state,
      THREE,
      this.soundManager,
      this.assetLoader,
      message => this.debugLogger.log(message)
    );
    this.cameraController = new CameraController(this.state, this.collisionManager);
    this.hudRenderer = new HudRenderer(this.state, THREE);
    this.gameRenderer = new GameRenderer(
      this.state,
      this.simulation,
      this.prediction,
      this.playerRenderer,
      this.cameraController,
      this.hudRenderer,
      this.soundManager,
      THREE
    );

    this.pauseMenu = new PauseMenu(this.state, $("c"), this.inputManager);
    this.networkManager = new PeerManager(this.state, Peer, {
      enterGame: () => this.enterGame(),
      startRenderLoop: () => this.gameRenderer.startAnimationLoop(),
      localInput: () => this.inputManager.localInput(),
      step: deltaSeconds => this.simulation.step(deltaSeconds),
      broadcast: () => this.simulation.broadcast(),
      addPlayer: (playerId, name) => this.simulation.addPlayer(playerId, name),
      setMap: mapIndex => this.mapManager.setMap(mapIndex),
      logDebug: message => this.debugLogger.log(message)
    });

    this.menuManager = new MenuManager(
      this.soundManager,
      name => this.networkManager.startHost(name),
      (name, roomCode) => this.networkManager.startJoin(name, roomCode)
    );
  }

  enterGame() {
    const state = this.state;
    $("menu").style.display = "none";
    $("game").style.display = "flex";

    if (!state.scene) this.sceneManager.initialize();

    const hud = $("hud");
    hud.hidden = false;
    const roomMarkup = state.isHost
      ? `Room <b>${state.room}</b> &nbsp; <a href="#" id="cp">copy invite link</a>`
      : `Room <b>${state.room}</b>`;
    hud.innerHTML = `${roomMarkup} &nbsp; Map: <span id="mapname">${MAPS[state.mapIndex].name}</span>`;

    const copyInvite = $("cp");
    if (copyInvite) {
      copyInvite.addEventListener("click", async event => {
        event.preventDefault();
        const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${state.room}`;
        try {
          await navigator.clipboard.writeText(inviteUrl);
          copyInvite.textContent = "copied";
        } catch {
          copyInvite.textContent = "couldn't copy, select and copy it manually";
        }
      });
    }
  }

  updateAssetProgress(progress) {
    const label = $("asset-loading-label");
    const bar = $("asset-loading-progress");
    const wrapper = $("asset-loading");
    if (!label || !bar || !wrapper) return;
    wrapper.hidden = false;
    label.textContent = progress.phase === "complete"
      ? `${progress.label} ready`
      : `Loading ${progress.label}…`;
    if (progress.total > 0) {
      const percent = Math.max(0, Math.min(100, progress.loaded / progress.total * 100));
      bar.style.width = `${percent}%`;
    } else if (progress.phase === "complete") {
      bar.style.width = "100%";
    }
  }

  initialize() {
    this.inputManager.bind();
    this.pauseMenu.bind();
    this.menuManager.initialize();
    this.debugLogger.bindPanel();
    this.playerRenderer.initialize().then(loaded => {
      const label = $("asset-loading-label");
      const wrapper = $("asset-loading");
      const bar = $("asset-loading-progress");
      if (bar) bar.style.width = "100%";
      if (label) label.textContent = loaded ? "3D character ready" : "Using built-in character model";
      window.setTimeout(() => { if (wrapper) wrapper.hidden = true; }, 1800);
    });

    window.addEventListener("error", event => {
      this.debugLogger.log(`JS ERROR: ${event.message}`);
    });
    window.addEventListener("unhandledrejection", event => {
      const reason = event.reason?.message || String(event.reason);
      this.debugLogger.log(`PROMISE ERROR: ${reason}`);
    });
  }
}

function start() {
  const THREE = window.THREE;
  const Peer = window.Peer;

  if (!THREE || !Peer) {
    setMessage("A required game library did not load. Refresh the page and try again.");
    console.error("Dustup Arena could not initialize: Three.js or PeerJS is unavailable.");
    return;
  }

  const game = new DustupArenaGame(THREE, Peer);
  game.initialize();
  window.dustupArena = game;
}

start();
