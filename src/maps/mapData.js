import {
  MAP_SCALE, WORLD_WIDTH, WORLD_HEIGHT
} from "../config/gameConfig.js?v=pubg-aim-v1";

function stableHash(row, column, seed) {
  let value = (Math.imul(row + 1, 374761393)
    + Math.imul(column + 1, 668265263)
    + Math.imul(seed + 1, 1442695041)) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

/**
 * Create a deterministic street grid of additional buildings in the expanded
 * city footprint. The gaps around the main avenues remain open for movement.
 */
function createDistrictWalls(baseWalls, mapIndex) {
  const rawWidth = WORLD_WIDTH / MAP_SCALE;
  const rawHeight = WORLD_HEIGHT / MAP_SCALE;
  const columns = 14;
  const rows = 9;
  const cellWidth = rawWidth / columns;
  const cellDepth = rawHeight / rows;
  const verticalRoads = [0.26, 0.5, 0.74].map(value => WORLD_WIDTH * value / MAP_SCALE);
  const horizontalRoads = [0.345, 0.66].map(value => WORLD_HEIGHT * value / MAP_SCALE);
  const verticalClearance = 154 / (2 * MAP_SCALE) + 18;
  const horizontalClearance = 148 / (2 * MAP_SCALE) + 18;
  const generated = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const hash = stableHash(row, column, mapIndex + 17);
      if (hash % 13 === 0) continue;

      const width = 76 + (hash % 40);
      const depth = 72 + ((hash >>> 8) % 42);
      const x = column * cellWidth + (cellWidth - width) / 2;
      const z = row * cellDepth + (cellDepth - depth) / 2;

      const blocksMainAvenue = verticalRoads.some(roadX =>
        x < roadX + verticalClearance && x + width > roadX - verticalClearance
      ) || horizontalRoads.some(roadZ =>
        z < roadZ + horizontalClearance && z + depth > roadZ - horizontalClearance
      );
      if (blocksMainAvenue) continue;

      const overlapsExisting = baseWalls.some(([baseX, baseZ, baseWidth, baseDepth]) =>
        x < baseX + baseWidth + 14
        && x + width + 14 > baseX
        && z < baseZ + baseDepth + 14
        && z + depth + 14 > baseZ
      );
      if (overlapsExisting) continue;

      generated.push([x, z, width, depth]);
    }
  }

  return generated;
}

const rawMaps = [
  {
    name: "New York", style: "new-york", sky: 0x111a27, ground: 0x252b32, edge: 0x414b56,
    amb: 0.52, lit: 0, win: "#8a9da9", tint: [0x39434d, 0x48413b, 0x34434b, 0x4b4b48],
    facade: "#3c4650", glass: "#203645", accent: "#8f5848", concrete: "#4b4b49",
    walls: [60, 300, 540, 780].flatMap(x => [45, 265, 485].map(y => [x, y, 160, 140]))
      .filter(([x, y]) => !(y === 265 && (x === 300 || x === 540))),
    park: [[300, 265, 400, 140]],
    heightAt: index => index === 7 ? 200 : 70 + ((index * 53) % 9) * 22,
    extra: (THREE, box) => {
      box(860, 200, 115, 90, 50, 90, 0xcfc7b0);
      box(860, 250, 115, 50, 40, 50, 0xcfc7b0);
      box(860, 290, 115, 12, 50, 12, 0xcfc7b0);
    }
  },
  {
    name: "Paris", style: "paris", sky: 0x182333, ground: 0x292a2b, edge: 0x514c46,
    amb: 0.55, lit: 0, win: "#91a2ad", tint: [0x5a5147, 0x51483f, 0x655a4c],
    facade: "#514a42", glass: "#253849", accent: "#805248", concrete: "#62594d",
    walls: [[60, 60, 230, 120], [60, 470, 230, 120], [710, 60, 230, 120], [710, 470, 230, 120], [330, 60, 340, 70], [330, 520, 340, 70], [60, 260, 140, 130], [800, 260, 140, 130], [422, 247, 24, 24], [554, 247, 24, 24], [422, 379, 24, 24], [554, 379, 24, 24]],
    heightAt: index => index < 8 ? 55 + ((index * 7) % 4) * 8 : 10,
    extra: (THREE, box, group) => {
      const tower = new THREE.Mesh(new THREE.ConeGeometry(110, 320, 4), new THREE.MeshStandardMaterial({ color: 0x7a5c3e, roughness: 0.82 }));
      tower.position.set(500, 160, 325);
      tower.rotation.y = Math.PI / 4;
      group.add(tower);
    }
  },
  {
    name: "Tokyo", style: "tokyo", sky: 0x0b101c, ground: 0x171c26, edge: 0x303744,
    amb: 0.46, lit: 1, win: "#ff65b5", tint: [0x252b39, 0x1b2635, 0x2a2434, 0x182531],
    facade: "#252d39", glass: "#101f2d", accent: "#d83991", concrete: "#303846",
    walls: [[60, 50, 300, 200], [640, 50, 300, 200], [60, 400, 300, 200], [640, 400, 300, 200], [420, 60, 160, 80], [420, 510, 160, 80], [60, 285, 110, 80], [830, 285, 110, 80]],
    heightAt: index => 90 + ((index * 61) % 5) * 50,
    extra: (THREE, box) => {
      for (let index = 0; index < 8; index += 1) {
        box(400 + index * 28, 0, 262, 16, 0.8, 40, 0xdddddd);
        box(400 + index * 28, 0, 388, 16, 0.8, 40, 0xdddddd);
      }
    }
  },
  {
    name: "Dubai", style: "dubai", sky: 0x1a2836, ground: 0x37332d, edge: 0x645541,
    amb: 0.58, lit: 0, win: "#a6bac0", tint: [0x586064, 0x665744, 0x4b5a60, 0x635d50],
    facade: "#5a554a", glass: "#263e4d", accent: "#a98750", concrete: "#655b4a",
    walls: [[100, 100, 90, 90], [260, 180, 70, 70], [700, 150, 80, 80], [820, 380, 90, 90], [240, 430, 80, 80], [650, 450, 70, 70], [110, 330, 60, 60], [880, 150, 60, 60], [470, 295, 60, 60], [420, 100, 60, 50], [560, 540, 60, 50]],
    heightAt: index => index === 8 ? 60 : 100 + ((index * 47) % 6) * 45,
    extra: (THREE, box, group) => {
      [[24, 32, 200, 100], [14, 24, 200, 300], [2, 14, 160, 480]].forEach(([top, bottom, height, y]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, 6), new THREE.MeshStandardMaterial({ color: 0xc8e0ee, metalness: 0.55, roughness: 0.24 }));
        tower.position.set(500, y, 325);
        group.add(tower);
      });
    }
  }
];

export const MAPS = rawMaps.map((map, mapIndex) => {
  const baseWalls = map.walls;
  const districtWalls = createDistrictWalls(baseWalls, mapIndex);
  const allWalls = [...baseWalls, ...districtWalls];
  const rawHeightAt = index => {
    if (index < baseWalls.length) return map.heightAt(index);
    const hash = stableHash(index - baseWalls.length, mapIndex, 29);
    const styleBonus = mapIndex === 2 ? 24 : mapIndex === 3 ? 12 : 0;
    return 48 + (hash % 7) * 14 + styleBonus;
  };
  const walls = allWalls.map(wall => wall.map(value => value * MAP_SCALE));
  const heightAt = index => rawHeightAt(index) * 1.6;
  const park = (map.park || []).map(area => area.map(value => value * MAP_SCALE));

  return {
    ...map,
    walls,
    park,
    heightAt,
    wallHeights: walls.map((_, index) => heightAt(index)),
    buildingCount: walls.length
  };
});
