import { MAPS } from "./mapData.js";
import { WORLD_WIDTH, WORLD_HEIGHT } from "../config/gameConfig.js";
import { ASSET_MANIFEST } from "../assets/assetManifest.js";

/** Builds the city locally from PBR geometry so every peer sees the same map. */
export class MapRenderer {
  constructor(state, THREE, assetLoader = null, logger = () => {}) {
    this.state = state;
    this.THREE = THREE;
    this.assetLoader = assetLoader;
    this.logger = logger;
    this.surface = null;
    this.shared = null;
  }

  buildMap() {
    const THREE = this.THREE;
    const scene = this.state.scene;
    const map = MAPS[this.state.mapIndex];
    if (!scene || !map) return;

    this.disposeCurrentMap();
    this.surface = null;
    this.shared = null;

    this.state.mapGroup = new THREE.Group();
    this.state.mapGroup.name = `${map.style}-minimal-city`;
    scene.add(this.state.mapGroup);

    scene.background = new THREE.Color(map.sky);
    scene.fog = null;
    if (this.state.ambientLight) this.state.ambientLight.intensity = 1;
    if (this.state.sunLight) {
      this.state.sunLight.castShadow = false;
      this.state.sunLight.intensity = 0.8;
    }

    this.buildMinimalMap(map);
  }

  buildMinimalMap(map) {
    const THREE = this.THREE;
    const group = this.state.mapGroup;
    const groundMaterial = new THREE.MeshBasicMaterial({ color: map.ground || 0x64696e });
    const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x292d33 });
    const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

    const addFlatPlane = (x, y, z, width, depth, material) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(x, y, z);
      plane.castShadow = false;
      plane.receiveShadow = false;
      group.add(plane);
      return plane;
    };

    // Plain ground and unmarked roads only: no kerbs, lane paint, crossings,
    // sidewalks, signs, parks, trees, vehicles or decorative props.
    addFlatPlane(
      WORLD_WIDTH / 2,
      -1.15,
      WORLD_HEIGHT / 2,
      WORLD_WIDTH + 600,
      WORLD_HEIGHT + 600,
      groundMaterial
    );

    const verticalRoads = [0.26, 0.5, 0.74].map(value => WORLD_WIDTH * value);
    const horizontalRoads = [0.345, 0.66].map(value => WORLD_HEIGHT * value);
    verticalRoads.forEach(x => addFlatPlane(x, -0.35, WORLD_HEIGHT / 2, 154, WORLD_HEIGHT, roadMaterial));
    horizontalRoads.forEach(z => addFlatPlane(WORLD_WIDTH / 2, -0.32, z, WORLD_WIDTH, 148, roadMaterial));

    // Retain every gameplay collision building as one flat instanced box.
    const walls = map.walls || [];
    if (walls.length) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const buildings = new THREE.InstancedMesh(geometry, buildingMaterial, walls.length);
      const dummy = new THREE.Object3D();
      walls.forEach(([x, z, width, depth], index) => {
        const height = Math.max(8, map.heightAt(index));
        dummy.position.set(x + width / 2, height / 2, z + depth / 2);
        dummy.scale.set(width, height, depth);
        dummy.updateMatrix();
        buildings.setMatrixAt(index, dummy.matrix);
        const tint = map.tint?.[index % (map.tint?.length || 1)] ?? 0x7b838b;
        buildings.setColorAt(index, new THREE.Color(tint));
      });
      buildings.instanceMatrix.needsUpdate = true;
      if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
      // Three.js r128 InstancedMesh has no computeBoundingSphere() method.
      // Disable frustum culling so the instanced city blocks always render.
      buildings.frustumCulled = false;
      buildings.castShadow = false;
      buildings.receiveShadow = false;
      group.add(buildings);
    }
  }

  createMaterials(map) {
    const THREE = this.THREE;
    const texture = this.surface;
    const glassColor = map.style === "tokyo" ? 0x29435d : map.style === "dubai" ? 0x6793a6 : 0x68808d;
    return {
      asphalt: new THREE.MeshStandardMaterial({ map: texture.asphalt, roughnessMap: texture.roughness, normalMap: texture.normal, normalScale: new THREE.Vector2(0.28, 0.28), roughness: 0.94, metalness: 0.02 }),
      road: new THREE.MeshStandardMaterial({ color: map.style === "tokyo" ? 0x252a32 : 0x303336, map: texture.asphalt, normalMap: texture.normal, normalScale: new THREE.Vector2(0.24, 0.24), roughness: 0.92 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture.concrete, roughnessMap: texture.roughness, normalMap: texture.normal, normalScale: new THREE.Vector2(0.18, 0.18), roughness: 0.88 }),
      facade: new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture.masonry, roughnessMap: texture.roughness, normalMap: texture.normal, normalScale: new THREE.Vector2(0.12, 0.12), roughness: 0.83 }),
      glass: new THREE.MeshStandardMaterial({ color: glassColor, metalness: 0.58, roughness: 0.2, transparent: true, opacity: 0.9 }),
      glassDark: new THREE.MeshStandardMaterial({ color: 0x172b3a, metalness: 0.62, roughness: 0.25 }),
      frame: new THREE.MeshStandardMaterial({ color: map.style === "paris" ? 0x4b4741 : 0x333d45, metalness: 0.5, roughness: 0.48 }),
      trim: new THREE.MeshStandardMaterial({ color: map.style === "paris" ? 0xe0d3bc : map.style === "dubai" ? 0xd4c19c : 0x606870, metalness: 0.2, roughness: 0.64 }),
      accent: new THREE.MeshStandardMaterial({ color: map.accent, metalness: 0.24, roughness: 0.56 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x343a40, metalness: 0.78, roughness: 0.34 }),
      leaf: new THREE.MeshStandardMaterial({ color: map.style === "tokyo" ? 0x254b49 : 0x385e3b, roughness: 0.9 }),
      grass: new THREE.MeshStandardMaterial({ color: 0x4d7142, roughness: 1 }),
      lane: new THREE.MeshStandardMaterial({ color: map.style === "tokyo" ? 0xb2a8b9 : 0xd8d2b8, roughness: 0.86 }),
      emissive: new THREE.MeshStandardMaterial({ color: map.accent, emissive: map.accent, emissiveIntensity: map.style === "tokyo" ? 1.9 : 0.3, roughness: 0.34 })
    };
  }

  disposeCurrentMap() {
    const group = this.state.mapGroup;
    if (!group) return;
    const geometries = new Set();
    const materials = new Set();
    group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
      else if (object.material) materials.add(object.material);
    });
    this.state.scene.remove(group);
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      material.map?.dispose?.();
      material.roughnessMap?.dispose?.();
      material.normalMap?.dispose?.();
      material.dispose?.();
    });
    this.surface = null;
    this.shared = null;
  }

  addMesh(geometry, material, x, y, z, parent = this.state.mapGroup) {
    const mesh = new this.THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  addBox(x, y, z, width, height, depth, material, parent = this.state.mapGroup) {
    return this.addMesh(new this.THREE.BoxGeometry(width, height, depth), material, x, y, z, parent);
  }

  addPlane(x, y, z, width, depth, material, parent = this.state.mapGroup) {
    const plane = this.addMesh(new this.THREE.PlaneGeometry(width, depth), material, x, y, z, parent);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.castShadow = false;
    return plane;
  }

  addExtraBox(centerX, baseY, centerZ, width, height, depth, color, parent = this.state.mapGroup) {
    const material = new this.THREE.MeshStandardMaterial({ color, roughness: 0.78 });
    return this.addBox(centerX, baseY + height / 2, centerZ, width, height, depth, material, parent);
  }

  buildGroundAndRoads(map) {
    const THREE = this.THREE;
    this.addPlane(WORLD_WIDTH / 2, -1.15, WORLD_HEIGHT / 2, WORLD_WIDTH + 600, WORLD_HEIGHT + 600, this.shared.asphalt);

    const verticalRoads = [0.26, 0.5, 0.74].map(value => WORLD_WIDTH * value);
    const horizontalRoads = [0.345, 0.66].map(value => WORLD_HEIGHT * value);
    verticalRoads.forEach(x => {
      this.addPlane(x, -0.35, WORLD_HEIGHT / 2, 154, WORLD_HEIGHT, this.shared.road);
      this.addLaneDashes(x - 22, 0, WORLD_HEIGHT, true, map);
      this.addLaneDashes(x + 22, 0, WORLD_HEIGHT, true, map);
    });
    horizontalRoads.forEach(z => {
      this.addPlane(WORLD_WIDTH / 2, -0.3, z, WORLD_WIDTH, 148, this.shared.road);
      this.addLaneDashes(0, z - 21, WORLD_WIDTH, false, map);
      this.addLaneDashes(0, z + 21, WORLD_WIDTH, false, map);
    });

    const dashGeometryVertical = new THREE.BoxGeometry(2.2, 0.22, 26);
    const dashGeometryHorizontal = new THREE.BoxGeometry(26, 0.22, 2.2);
    const dashMaterial = this.shared.lane;
    for (const x of verticalRoads) {
      const dashes = new THREE.InstancedMesh(dashGeometryVertical, dashMaterial, 20);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 20; i += 1) {
        dummy.position.set(x, 0.02, 40 + i * 77);
        dummy.updateMatrix();
        dashes.setMatrixAt(i, dummy.matrix);
      }
      dashes.instanceMatrix.needsUpdate = true;
      this.state.mapGroup.add(dashes);
    }
    for (const z of horizontalRoads) {
      const dashes = new THREE.InstancedMesh(dashGeometryHorizontal, dashMaterial, 30);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < 30; i += 1) {
        dummy.position.set(40 + i * 80, 0.02, z);
        dummy.updateMatrix();
        dashes.setMatrixAt(i, dummy.matrix);
      }
      dashes.instanceMatrix.needsUpdate = true;
      this.state.mapGroup.add(dashes);
    }

    for (const x of verticalRoads) {
      horizontalRoads.forEach(z => this.addCrosswalk(x, z));
    }
  }

  addLaneDashes() { /* Lane segments are batched in buildGroundAndRoads. */ }

  addCrosswalk(centerX, centerZ) {
    const geometry = new this.THREE.BoxGeometry(5, 0.25, 22);
    const count = 8;
    const stripes = new this.THREE.InstancedMesh(geometry, this.shared.lane, count);
    const dummy = new this.THREE.Object3D();
    for (let index = 0; index < count; index += 1) {
      dummy.position.set(centerX - 67 + index * 19, 0.04, centerZ - 92);
      dummy.updateMatrix();
      stripes.setMatrixAt(index, dummy.matrix);
    }
    stripes.instanceMatrix.needsUpdate = true;
    this.state.mapGroup.add(stripes);
  }

  buildDetailedBuilding(map, x, z, width, depth, height, index) {
    const THREE = this.THREE;
    const centerX = x + width / 2;
    const centerZ = z + depth / 2;
    const building = new THREE.LOD();
    building.position.set(centerX, 0, centerZ);
    building.name = `${map.style}-building-${index + 1}`;

    const low = new THREE.Group();
    const high = new THREE.Group();
    const facadeMaterial = this.shared.facade.clone();
    facadeMaterial.color.setHex(map.tint[index % map.tint.length]);
    const shell = this.addBox(0, height / 2, 0, width, height, depth, facadeMaterial, low);
    shell.castShadow = true;
    shell.receiveShadow = true;

    const detailedShell = this.addBox(0, height / 2, 0, width, height, depth, facadeMaterial.clone(), high);
    detailedShell.castShadow = true;
    detailedShell.receiveShadow = true;
    this.addBox(0, 5, 0, width + 8, 10, depth + 8, this.shared.trim, high);
    this.addBox(0, height - 3, 0, width + 5, 6, depth + 5, this.shared.trim, high);
    this.addFacadeWindows(high, width, depth, height, map);
    this.addCornerColumns(high, width, depth, height, map);
    this.addRoofDetails(high, width, depth, height, map, index);
    this.addStyleDetails(high, width, depth, height, map, index);

    building.addLevel(high, 0);
    building.addLevel(low, 680);
    this.state.mapGroup.add(building);
    this.addSidewalkAround(x, z, width, depth, map);
  }

  addFacadeWindows(parent, width, depth, height, map) {
    const THREE = this.THREE;
    const floors = Math.max(2, Math.min(13, Math.floor((height - 18) / 26)));
    const frontColumns = Math.max(2, Math.min(12, Math.floor(width / 34)));
    const sideColumns = Math.max(2, Math.min(8, Math.floor(depth / 34)));
    const windowWidth = Math.min(19, width / frontColumns * 0.56);
    const windowHeight = map.style === "paris" ? 17 : 18;
    const count = floors * (frontColumns * 2 + sideColumns * 2);
    const frame = new THREE.InstancedMesh(
      new THREE.BoxGeometry(windowWidth + 4, windowHeight + 4, 1.9),
      this.shared.frame,
      count
    );
    const glass = new THREE.InstancedMesh(
      new THREE.BoxGeometry(windowWidth, windowHeight, 1),
      this.shared.glass,
      count
    );
    const dummy = new THREE.Object3D();
    let instance = 0;
    const yStart = 20;
    const yGap = floors > 1 ? (height - 30) / floors : 28;

    const addWindow = (x, y, z, rotationY = 0) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rotationY, 0);
      dummy.updateMatrix();
      frame.setMatrixAt(instance, dummy.matrix);
      dummy.position.set(x, y, z + (rotationY === Math.PI ? -0.9 : 0.9));
      if (Math.abs(rotationY) > 1) dummy.position.set(x, y, z - 0.9);
      else if (rotationY > 0.1) dummy.position.set(x + 0.9, y, z);
      else if (rotationY < -0.1) dummy.position.set(x - 0.9, y, z);
      dummy.updateMatrix();
      glass.setMatrixAt(instance, dummy.matrix);
      instance += 1;
    };

    for (let floor = 0; floor < floors; floor += 1) {
      const y = yStart + floor * yGap;
      for (let column = 0; column < frontColumns; column += 1) {
        const x = -width / 2 + (column + 0.5) * width / frontColumns;
        addWindow(x, y, depth / 2 + 1, 0);
        addWindow(x, y, -depth / 2 - 1, Math.PI);
      }
      for (let column = 0; column < sideColumns; column += 1) {
        const z = -depth / 2 + (column + 0.5) * depth / sideColumns;
        addWindow(width / 2 + 1, y, z, Math.PI / 2);
        addWindow(-width / 2 - 1, y, z, -Math.PI / 2);
      }
    }
    frame.count = instance;
    glass.count = instance;
    frame.instanceMatrix.needsUpdate = true;
    glass.instanceMatrix.needsUpdate = true;
    frame.castShadow = false;
    glass.castShadow = false;
    parent.add(frame, glass);

    const floorBandGeometry = new THREE.BoxGeometry(width + 1, 1.4, depth + 1);
    const bands = new THREE.InstancedMesh(floorBandGeometry, this.shared.trim, Math.max(1, floors - 1));
    for (let floor = 1; floor < floors; floor += 1) {
      dummy.position.set(0, yStart + floor * yGap - 12, 0);
      dummy.updateMatrix();
      bands.setMatrixAt(floor - 1, dummy.matrix);
    }
    bands.instanceMatrix.needsUpdate = true;
    parent.add(bands);

    if (map.style === "paris") this.addBalconyRows(parent, width, depth, height, floors, frontColumns);
  }

  addBalconyRows(parent, width, depth, height, floors, columns) {
    const THREE = this.THREE;
    const count = Math.max(2, Math.min(columns, 8));
    const balcony = new THREE.InstancedMesh(
      new THREE.BoxGeometry(Math.min(23, width / count * 0.62), 1.2, 5),
      this.shared.metal,
      count * 2
    );
    const rail = new THREE.InstancedMesh(
      new THREE.BoxGeometry(Math.min(23, width / count * 0.62), 3, 0.6),
      this.shared.metal,
      count * 2
    );
    const dummy = new THREE.Object3D();
    let index = 0;
    const y = Math.min(height - 24, 40);
    for (const side of [-1, 1]) {
      for (let column = 0; column < count; column += 1) {
        const x = -width / 2 + (column + 0.5) * width / count;
        dummy.position.set(x, y, side * (depth / 2 + 3));
        dummy.updateMatrix();
        balcony.setMatrixAt(index, dummy.matrix);
        dummy.position.y = y + 2.3;
        dummy.position.z = side * (depth / 2 + 5.5);
        dummy.updateMatrix();
        rail.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    balcony.instanceMatrix.needsUpdate = true;
    rail.instanceMatrix.needsUpdate = true;
    parent.add(balcony, rail);
  }

  addCornerColumns(parent, width, depth, height, map) {
    const THREE = this.THREE;
    const points = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const columns = new THREE.InstancedMesh(
      new THREE.BoxGeometry(map.style === "paris" ? 4.8 : 3.2, height, 4.8),
      this.shared.trim,
      4
    );
    const dummy = new THREE.Object3D();
    points.forEach(([x, z], index) => {
      dummy.position.set(x * (width / 2 - 3), height / 2, z * (depth / 2 - 3));
      dummy.updateMatrix();
      columns.setMatrixAt(index, dummy.matrix);
    });
    columns.instanceMatrix.needsUpdate = true;
    parent.add(columns);
  }

  addRoofDetails(parent, width, depth, height, map, index) {
    const THREE = this.THREE;
    if (map.style === "paris") {
      const roof = this.addMesh(
        new THREE.ConeGeometry(Math.max(width, depth) * 0.58, Math.min(38, height * 0.22), 4),
        new THREE.MeshStandardMaterial({ color: 0x44454a, roughness: 0.76 }),
        0, height + Math.min(18, height * 0.1), 0, parent
      );
      roof.scale.z = depth / width;
      roof.rotation.y = Math.PI / 4;
    } else if (map.style === "dubai") {
      const upper = this.addBox(0, height + 10, 0, width * 0.78, 20, depth * 0.78, this.shared.glass, parent);
      upper.castShadow = true;
      if (height > 180) {
        const spire = this.addMesh(new THREE.ConeGeometry(Math.max(4, width * 0.035), 46, 8), this.shared.trim, 0, height + 43, 0, parent);
        spire.rotation.y = Math.PI / 8;
      }
    } else {
      const rooftopUnit = this.addBox(width * 0.24, height + 9, -depth * 0.17, width * 0.22, 18, depth * 0.2, this.shared.metal, parent);
      rooftopUnit.castShadow = true;
      if (map.style === "new-york" && index % 3 === 0) {
        const tower = this.addMesh(new THREE.CylinderGeometry(7, 8, 16, 12), this.shared.frame, -width * 0.2, height + 14, depth * 0.18, parent);
        tower.castShadow = true;
      }
    }
  }

  addStyleDetails(parent, width, depth, height, map, index) {
    const THREE = this.THREE;
    if (map.style === "tokyo") {
      const sign = this.createSignTexture(index % 2 ? "TOKYO" : "24H", map.accent);
      const signMaterial = new THREE.MeshStandardMaterial({ map: sign, emissive: map.accent, emissiveMap: sign, emissiveIntensity: 1.25, roughness: 0.42, side: THREE.DoubleSide });
      const board = this.addBox(0, Math.max(24, height * 0.36), depth / 2 + 2.1, Math.min(width * 0.72, 100), 18, 1.8, signMaterial, parent);
      board.castShadow = false;
      const verticalSign = this.addBox(width / 2 + 1.7, Math.max(34, height * 0.52), 0, 13, Math.min(70, height * 0.34), 2, this.shared.emissive, parent);
      verticalSign.castShadow = false;
    }

    if (map.style === "new-york") {
      for (let unit = 0; unit < 2; unit += 1) {
        const ac = this.addBox(-width * 0.24 + unit * 22, height + 8, depth * 0.2, 16, 14, 16, this.shared.metal, parent);
        ac.castShadow = true;
      }
    }

    if (map.style === "paris") {
      const awningMaterial = this.shared.accent;
      const awning = this.addBox(0, 17, depth / 2 + 5, Math.min(width * 0.72, 92), 3, 13, awningMaterial, parent);
      awning.rotation.x = -0.1;
      this.addBox(0, 8, depth / 2 + 7, Math.min(width * 0.7, 90), 15, 1.5, this.shared.glassDark, parent);
    }
  }

  createSignTexture(label, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "#101622";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = color;
    context.lineWidth = 8;
    context.strokeRect(5, 5, 502, 118);
    context.font = "bold 64px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = color;
    context.shadowBlur = 18;
    context.fillStyle = "#f6eaff";
    context.fillText(label, 256, 65);
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.encoding = this.THREE.sRGBEncoding;
    return texture;
  }

  addSidewalkAround(x, z, width, depth, map) {
    const edge = 14;
    const y = 0.05;
    this.addBox(x + width / 2, y, z - edge / 2, width + edge * 2, 1.1, edge, this.shared.concrete);
    this.addBox(x + width / 2, y, z + depth + edge / 2, width + edge * 2, 1.1, edge, this.shared.concrete);
    this.addBox(x - edge / 2, y, z + depth / 2, edge, 1.1, depth, this.shared.concrete);
    this.addBox(x + width + edge / 2, y, z + depth / 2, edge, 1.1, depth, this.shared.concrete);
    const curbMaterial = new this.THREE.MeshStandardMaterial({ color: map.style === "tokyo" ? 0x62616c : 0xc0bcb1, roughness: 0.9 });
    this.addBox(x + width / 2, 1.25, z - edge, width + 22, 1.8, 2, curbMaterial);
    this.addBox(x + width / 2, 1.25, z + depth + edge, width + 22, 1.8, 2, curbMaterial);
  }

  buildParks(map) {
    const THREE = this.THREE;
    for (const [x, z, width, depth] of map.park || []) {
      this.addPlane(x + width / 2, 0.03, z + depth / 2, width, depth, this.shared.grass);
      this.addPlane(x + width / 2, 0.07, z + depth / 2, Math.min(30, width * 0.4), depth * 0.9, this.shared.concrete);
      const treeCount = 18;
      for (let index = 0; index < treeCount; index += 1) {
        const column = index % 6;
        const row = Math.floor(index / 6);
        this.addTree(x + 40 + column * (width - 80) / 5, z + 36 + row * (depth - 72) / 2);
      }
    }
  }

  addTree(x, z) {
    const THREE = this.THREE;
    const trunk = this.addMesh(new THREE.CylinderGeometry(2.2, 3.3, 28, 7), this.shared.frame, x, 14, z);
    trunk.castShadow = true;
    const crown = this.addMesh(new THREE.IcosahedronGeometry(18, 1), this.shared.leaf, x, 37, z);
    crown.scale.set(1, 1.12, 1);
    crown.castShadow = true;
    const crown2 = this.addMesh(new THREE.IcosahedronGeometry(11, 1), this.shared.leaf, x + 8, 47, z - 3);
    crown2.castShadow = true;
  }

  buildStreetFurniture(map) {
    const lampPositions = [
      [600, 450], [1200, 450], [1800, 450],
      [600, 1020], [1200, 1020], [1800, 1020]
    ];
    lampPositions.forEach(([x, z]) => this.addStreetLamp(x, z, map));

    const benchPositions = map.style === "new-york" ? [[420, 770], [1900, 770]] : [[WORLD_WIDTH * 0.5 - 60, WORLD_HEIGHT * 0.5], [WORLD_WIDTH * 0.5 + 60, WORLD_HEIGHT * 0.5]];
    benchPositions.forEach(([x, z]) => this.addBench(x, z));
    this.addTrashBin(270, 560);
    this.addTrashBin(2110, 1040);
  }

  addStreetLamp(x, z, map) {
    const THREE = this.THREE;
    const poleMaterial = this.shared.metal;
    const pole = this.addMesh(new THREE.CylinderGeometry(1.3, 2, 88, 8), poleMaterial, x, 44, z);
    pole.castShadow = true;
    this.addBox(x + 9, 85, z, 19, 2.5, 2.5, poleMaterial);
    const lampMaterial = map.style === "tokyo" ? this.shared.emissive : new THREE.MeshStandardMaterial({ color: 0xffe8bb, emissive: 0xffdca0, emissiveIntensity: 0.8 });
    const lamp = this.addMesh(new THREE.SphereGeometry(4.5, 10, 8), lampMaterial, x + 18, 82, z);
    lamp.castShadow = false;
  }

  addBench(x, z) {
    const wood = new this.THREE.MeshStandardMaterial({ color: 0x76543b, roughness: 0.78 });
    const metal = this.shared.metal;
    this.addBox(x, 8, z, 34, 3, 10, wood);
    this.addBox(x, 17, z - 5, 34, 15, 3, wood);
    for (const side of [-12, 12]) {
      this.addBox(x + side, 4, z, 2.5, 8, 12, metal);
    }
  }

  addTrashBin(x, z) {
    const body = this.addMesh(new this.THREE.CylinderGeometry(5, 5.8, 16, 10), this.shared.metal, x, 8, z);
    body.castShadow = true;
    this.addMesh(new this.THREE.CylinderGeometry(6, 6, 2, 10), this.shared.frame, x, 17, z);
  }

  buildTrafficAndVehicles(map) {
    const spots = map.style === "tokyo"
      ? [[1110, 720, 0.2], [1320, 890, Math.PI], [1850, 760, Math.PI / 2]]
      : map.style === "paris"
        ? [[720, 550, 0], [1170, 550, Math.PI], [1680, 1030, 0]]
        : map.style === "dubai"
          ? [[940, 640, 0], [1500, 780, Math.PI], [1840, 700, Math.PI / 2]]
          : [[625, 520, 0], [1190, 520, Math.PI], [1770, 1030, Math.PI / 2], [600, 1050, 0]];
    const colors = [0x263b54, 0x8d2c25, 0x9e9e98, 0xd8d4c8];
    const firstCar = this.createCar(colors[0]);
    firstCar.position.set(spots[0][0], 0, spots[0][1]);
    firstCar.rotation.y = spots[0][2];
    this.state.mapGroup.add(firstCar);
    for (let index = 1; index < spots.length; index += 1) {
      const [x, z, rotation] = spots[index];
      const car = this.createCar(colors[index % colors.length]);
      car.position.set(x, 0, z);
      car.rotation.y = rotation;
      this.state.mapGroup.add(car);
    }
    this.loadVehicleAsset(this.state.mapGroup, spots[0], firstCar);
    this.addTrafficLight(850, 440, map);
    this.addTrafficLight(1530, 1010, map);
  }

  async loadVehicleAsset(mapGroup, placement, fallbackCar) {
    if (!this.assetLoader?.available) return;
    try {
      const gltf = await this.assetLoader.loadFirstAvailable(
        [ASSET_MANIFEST.vehicle.local, ASSET_MANIFEST.vehicle.remote],
        ASSET_MANIFEST.vehicle.label
      );
      if (this.state.mapGroup !== mapGroup) return;
      const vehicle = this.assetLoader.cloneScene(gltf.scene);
      vehicle.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      const bounds = new this.THREE.Box3().setFromObject(vehicle);
      const size = new this.THREE.Vector3();
      const center = new this.THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);
      const scale = 92 / Math.max(size.x, size.z, 0.01);
      vehicle.scale.setScalar(scale);
      vehicle.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      const wrapper = new this.THREE.Group();
      wrapper.name = "OptionalCesiumMilkTruck";
      wrapper.add(vehicle);
      wrapper.position.set(placement[0], 0, placement[1]);
      wrapper.rotation.y = placement[2];
      mapGroup.remove(fallbackCar);
      mapGroup.add(wrapper);
      this.logger(`Rigged/GLB vehicle model loaded from ${gltf.sourceUrl}`);
    } catch (error) {
      this.logger(`Optional GLB vehicle not loaded; procedural parked cars remain: ${error.message}`);
    }
  }

  createCar(color) {
    const THREE = this.THREE;
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color, metalness: 0.58, roughness: 0.28 });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x263c4c, metalness: 0.55, roughness: 0.19 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x151719, roughness: 0.96 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xabb3b7, metalness: 0.86, roughness: 0.22 });
    const part = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };
    part(new THREE.BoxGeometry(45, 11, 88), bodyMaterial, 0, 13, 0);
    part(new THREE.BoxGeometry(35, 17, 43), bodyMaterial, 0, 26, -3);
    part(new THREE.BoxGeometry(32, 13, 1.2), glassMaterial, 0, 27, 19);
    part(new THREE.BoxGeometry(32, 13, 1.2), glassMaterial, 0, 27, -25);
    part(new THREE.BoxGeometry(1.2, 12, 15), glassMaterial, -18.5, 27, -3);
    part(new THREE.BoxGeometry(1.2, 12, 15), glassMaterial, 18.5, 27, -3);
    part(new THREE.BoxGeometry(37, 2.2, 1.8), chrome, 0, 12, 44.5);
    part(new THREE.BoxGeometry(37, 2.2, 1.8), chrome, 0, 12, -44.5);
    const wheelGeometry = new THREE.CylinderGeometry(7, 7, 5, 12);
    for (const x of [-23, 23]) {
      for (const z of [-28, 28]) {
        const wheel = part(wheelGeometry, rubber, x, 8, z);
        wheel.rotation.z = Math.PI / 2;
        const hub = part(new THREE.CylinderGeometry(3.1, 3.1, 5.4, 10), chrome, x, 8, z);
        hub.rotation.z = Math.PI / 2;
      }
    }
    const headlight = new THREE.MeshStandardMaterial({ color: 0xfff1cc, emissive: 0xffe8ae, emissiveIntensity: 0.35 });
    part(new THREE.BoxGeometry(10, 4, 1.5), headlight, -13, 18, 44.8);
    part(new THREE.BoxGeometry(10, 4, 1.5), headlight, 13, 18, 44.8);
    return group;
  }

  addTrafficLight(x, z, map) {
    const THREE = this.THREE;
    this.addMesh(new THREE.CylinderGeometry(1.5, 2, 42, 8), this.shared.metal, x, 21, z);
    this.addBox(x, 48, z, 9, 22, 7, this.shared.frame);
    const lightColors = [0xe34a42, 0xe7b947, 0x39b66a];
    lightColors.forEach((color, index) => {
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: map.style === "tokyo" ? 0.45 : 0.16 });
      this.addMesh(new THREE.SphereGeometry(2.4, 8, 6), material, x, 55 - index * 7, z + 4);
    });
  }

  buildBoundary(map) {
    const curb = new this.THREE.MeshStandardMaterial({ color: map.edge, roughness: 0.9 });
    this.addBox(WORLD_WIDTH / 2, 2.5, -5, WORLD_WIDTH, 5, 10, curb);
    this.addBox(WORLD_WIDTH / 2, 2.5, WORLD_HEIGHT + 5, WORLD_WIDTH, 5, 10, curb);
    this.addBox(-5, 2.5, WORLD_HEIGHT / 2, 10, 5, WORLD_HEIGHT, curb);
    this.addBox(WORLD_WIDTH + 5, 2.5, WORLD_HEIGHT / 2, 10, 5, WORLD_HEIGHT, curb);
  }
}
