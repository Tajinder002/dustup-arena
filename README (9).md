# Dustup Arena 3D — Realistic City Upgrade

Dustup Arena is a browser-based third-person city shooter for up to six players. The supplied PeerJS multiplayer simulation, 4-letter room codes, four maps, combat, respawning, controls and scoreboard remain in place. This upgrade replaces the old plain building boxes and pixel player with a detailed procedural city renderer, PBR-style surfaces, road layouts, city props, a human-shaped fallback character and an optional rigged glTF character pipeline.

## What changed

- **City environment:** detailed facade shells with repeated glass windows, frames, floor bands, roof equipment, style-specific architecture, sidewalks, asphalt roads, lane markings, crosswalks, trees, benches, streetlights, traffic signals and vehicles.
- **Four map identities:** New York (steel and masonry), Paris (stone facades and balconies), Tokyo (night palette and neon signage), and Dubai (warm stone, glass and stepped towers).
- **PBR-style materials:** generated asphalt, concrete and masonry maps plus roughness and normal maps. Textures are generated at runtime and shared across the active map.
- **Rendering:** ACES tone mapping, sRGB output, directional and hemisphere lighting, soft PC shadows on desktop, distance fog, environment reflections, and lower pixel ratio/shadows on touch devices.
- **LOD and batching:** buildings have high/low detail levels; repeated windows and road markings use `InstancedMesh`.
- **Characters:** a non-voxel human-shaped fallback is always available. A rigged, textured glTF character loads from `assets/models/characters/CesiumMan.glb` when downloaded, with remote fallback. Available animation clips are mapped by name through `AnimationMixer`; missing clips use procedural pose/recoil fallbacks.
- **Asset pipeline:** GLTFLoader-based `AssetLoader`, promise-aware `ModelCache`, HDR environment loader, progress indicator, error handling and an optional asset-download script.
- **Collision:** building footprints remain the same rectangles used by the host simulation and client prediction, so building visuals and movement/bullet colliders stay aligned.

## Important asset notes

The city architecture, cars, street furniture and PBR-style texture maps are generated procedurally in JavaScript. They are detailed game geometry, not photogrammetry scans or imported photorealistic building GLBs. The rigged character, sample truck and HDRI are optional binary assets and are **not bundled in this prepared ZIP**; the asset folders contain placeholders until you run the downloader. The game works without them using the procedural human/vehicle models and generated environment reflections.

To download the optional local files (requires internet):

```bash
npm run assets:download
```

This downloads the Khronos Cesium Man and Cesium Milk Truck glTF samples and a 1K Poly Haven HDRI into `assets/`. Their source credits and licenses are documented in `assets/ASSET_CREDITS.md`. The Cesium Man sample is a rigged, textured demonstration character; it is not a photorealistic motion-capture soldier. Only animations actually present in its file are played. When an expected action clip is absent, the renderer uses a procedural pose/recoil fallback rather than claiming that the model contains that animation. The current game therefore provides a detailed procedural city with a sample rigged character option—not a fully photorealistic scanned-world asset pack.

If local assets are missing, the character and HDRI loaders try their public upstream URLs. A network connection is required for those remote assets, the CDN libraries, Google Fonts and PeerJS signalling.

## Project structure

```text
dustup-arena/
├── index.html
├── README.md
├── DEPLOYMENT.md
├── package.json
├── assets/
│   ├── ASSET_CREDITS.md
│   ├── environments/
│   ├── models/
│   │   ├── buildings/
│   │   ├── characters/
│   │   ├── props/
│   │   └── vehicles/
│   └── textures/
│       ├── buildings/
│       ├── ground/
│       └── roads/
├── tools/download-assets.mjs
├── tests/simulation.test.js
├── styles/
│   ├── main.css
│   ├── menu.css
│   ├── game.css
│   ├── hud.css
│   └── mobile.css
└── src/
    ├── main.js
    ├── assets/
    │   ├── assetManifest.js
    │   ├── assetLoader.js
    │   ├── modelCache.js
    │   ├── environmentLoader.js
    │   └── proceduralTextures.js
    ├── config/gameConfig.js
    ├── state/gameState.js
    ├── audio/soundManager.js
    ├── maps/
    │   ├── mapData.js
    │   ├── mapManager.js
    │   └── mapRenderer.js
    ├── networking/peerManager.js
    ├── players/
    │   ├── player.js
    │   ├── playerManager.js
    │   ├── playerMovement.js
    │   ├── playerCombat.js
    │   ├── playerModel.js
    │   └── weaponModel.js
    ├── game/
    │   ├── collisionManager.js
    │   ├── gameSimulation.js
    │   ├── clientPrediction.js
    │   └── bulletManager.js
    ├── rendering/
    │   ├── scene.js
    │   ├── renderer.js
    │   ├── camera.js
    │   ├── playerRenderer.js
    │   └── hudRenderer.js
    ├── input/inputManager.js
    ├── ui/
    │   ├── menu.js
    │   └── pauseMenu.js
    └── utils/
        ├── dom.js
        ├── math.js
        ├── roomCode.js
        └── debugLogger.js
```

## Run locally

JavaScript modules must be served over HTTP; opening `index.html` directly with `file://` will not work.

1. Install Node.js 18 or newer (for the asset download script) and Python 3.
2. Open a terminal in the project folder.
3. Optionally download the local character/HDRI models:

   ```bash
   npm run assets:download
   ```

4. Start the static server:

   ```bash
   npm run serve
   ```

5. Open [http://localhost:8000](http://localhost:8000).

You can also use the VS Code Live Server extension.

## Tests

Run the core gameplay tests:

```bash
npm test
```

These tests cover map definitions, multiplayer snapshot layout, shooting, damage and kills. They do not prove live browser-to-browser PeerJS functionality or visual fidelity; test host and join from separate browsers/devices after deployment.

## GitHub Pages deployment

1. Upload the complete contents of this folder to the repository root (not a parent folder).
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose `main` and `/(root)`, then save.
5. Open the Pages URL displayed in settings.

Keep the full `src/`, `styles/` and `assets/` folders. The project uses relative asset paths and does not need a Node build step. GitHub Pages serves the static project, but browsers still need network access for the CDN libraries/PeerJS and for any optional remote glTF/HDRI fallback.

## Graphics and performance

Desktop enables antialiasing and soft shadows with a capped 1.5 device-pixel ratio. Touch devices use a lower pixel ratio and disable shadow maps. Buildings switch to a simpler LOD beyond the configured distance and repeating facade windows/road markings are instanced. The generated canvas textures are not KTX2-compressed; KTX2 is not included because the current surface textures are created procedurally.

## Libraries

- Three.js r128
- Three.js r128 GLTFLoader, SkeletonUtils and RGBELoader examples
- PeerJS 1.5.4
- Chakra Petch web font

## Multiplayer note

For players to meet in the same room, the host and joining players need the same deployed game version. The host creates a room; friends join with the four-letter room code or invite link.
