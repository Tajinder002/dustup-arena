import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = {
  matchMedia: () => ({ matches: false })
};

const { MAPS, GAME_VERSION, WORLD_WIDTH, WORLD_HEIGHT, BULLET_SPEED, MAX_PLAYERS } = await import("../src/maps/mapData.js").then(async module => {
  const config = await import("../src/config/gameConfig.js");
  return {
    MAPS: module.MAPS,
    GAME_VERSION: config.GAME_VERSION,
    WORLD_WIDTH: config.WORLD_WIDTH,
    WORLD_HEIGHT: config.WORLD_HEIGHT,
    BULLET_SPEED: config.BULLET_SPEED,
    MAX_PLAYERS: config.MAX_PLAYERS
  };
});
const { createGameState } = await import("../src/state/gameState.js");
const { CollisionManager } = await import("../src/game/collisionManager.js");
const { GameSimulation } = await import("../src/game/gameSimulation.js");

test("all four maps are defined", () => {
  assert.deepEqual(MAPS.map(map => map.name), ["New York", "Paris", "Tokyo", "Dubai"]);
});

test("simulation snapshots retain the expected multiplayer fields", () => {
  const state = createGameState();
  const collisionManager = new CollisionManager(state);
  const simulation = new GameSimulation(state, collisionManager);

  simulation.addPlayer("host", "Host");
  simulation.addPlayer("guest", "Guest");
  const snapshot = simulation.createSnapshot();

  assert.equal(snapshot.p.length, 2);
  assert.equal(snapshot.v, GAME_VERSION);
  assert.equal(snapshot.m, 0);
  assert.equal(snapshot.p[0].length, 14);
});

test("shooting can damage and eliminate another player", () => {
  const state = createGameState();
  const collisionManager = new CollisionManager(state);
  const simulation = new GameSimulation(state, collisionManager);
  const host = simulation.addPlayer("host", "Host");
  const guest = simulation.addPlayer("guest", "Guest");

  host.x = 1000;
  host.y = 800;
  host.angle = 0;
  guest.x = 1200;
  guest.y = 800;
  state.inputs.host = { mx: 0, my: 0, a: 0, p: 0, s: true, j: false, r: false };
  state.inputs.guest = { mx: 0, my: 0, a: 0, p: 0, s: false, j: false, r: false };

  for (let frame = 0; frame < 125; frame += 1) simulation.step(1 / 60);

  assert.ok(state.shotsFired >= 5);
  assert.equal(guest.health, 0);
  assert.equal(guest.deaths, 1);
  assert.equal(host.kills, 1);
});


test("expanded maps have dense buildings inside the larger world", () => {
  assert.equal(WORLD_WIDTH, 4800);
  assert.equal(WORLD_HEIGHT, 3120);
  for (const map of MAPS) {
    assert.ok(map.walls.length >= 40, `${map.name} should have at least 40 buildings`);
    assert.equal(map.wallHeights.length, map.walls.length);
    for (const [x, y, width, depth] of map.walls) {
      assert.ok(x >= 0 && y >= 0);
      assert.ok(x + width <= WORLD_WIDTH + 0.001);
      assert.ok(y + depth <= WORLD_HEIGHT + 0.001);
    }
  }
});

test("combat and room capacity use the new tuning", () => {
  assert.equal(BULLET_SPEED, 2400);
  assert.equal(MAX_PLAYERS, 16);
});
