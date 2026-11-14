import { MAP_SCALE } from "../config/gameConfig.js";

const rawMaps = [
  {
    name: "New York", style: "new-york", sky: 0x9ec7e8, ground: 0x3a3d42, edge: 0x777777,
    amb: 0.72, lit: 0, win: "#657d91", tint: [0x777d83, 0x8b8178, 0x6d7b83, 0x9b9487],
    facade: "#7f8388", glass: "#426174", accent: "#b75f43", concrete: "#92918d",
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
    name: "Paris", style: "paris", sky: 0xbcd6ee, ground: 0x6e6a60, edge: 0x8a8478,
    amb: 0.78, lit: 0, win: "#50697d", tint: [0xc9bda7, 0xb4a48a, 0xe0d2b8],
    facade: "#c1b39b", glass: "#415b6f", accent: "#b35f50", concrete: "#b9ae9d",
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
    name: "Tokyo", style: "tokyo", sky: 0x111826, ground: 0x252831, edge: 0x30323a,
    amb: 0.48, lit: 1, win: "#ff4fa3", tint: [0x333746, 0x242d3c, 0x35313f, 0x202a34],
    facade: "#303641", glass: "#142637", accent: "#ed43a6", concrete: "#454954",
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
    name: "Dubai", style: "dubai", sky: 0x8fd0ff, ground: 0xb9a77f, edge: 0xa88e62,
    amb: 0.84, lit: 0, win: "#9fd6ee", tint: [0xb8c5c8, 0xd6c7aa, 0x9fb2b8, 0xc9c0ac],
    facade: "#c8b99b", glass: "#4e7e94", accent: "#d1a45f", concrete: "#c6b697",
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

export const MAPS = rawMaps.map(map => {
  const walls = map.walls.map(wall => wall.map(value => value * MAP_SCALE));
  const park = (map.park || []).map(area => area.map(value => value * MAP_SCALE));
  return {
    ...map,
    walls,
    park,
    heightAt: index => map.heightAt(index) * 1.6,
    wallHeights: walls.map((_, index) => map.heightAt(index) * 1.6)
  };
});
