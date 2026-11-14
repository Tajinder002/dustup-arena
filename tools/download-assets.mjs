import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const assets = [
  {
    path: "assets/models/characters/CesiumMan.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb"
  },
  {
    path: "assets/models/characters/CesiumMan-LICENSE.md",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/LICENSE.md"
  },
  {
    path: "assets/models/vehicles/CesiumMilkTruck.glb",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb"
  },
  {
    path: "assets/models/vehicles/CesiumMilkTruck-LICENSE.md",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/LICENSE.md"
  },
  {
    path: "assets/environments/city-sunset-1k.hdr",
    url: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr"
  }
];

let failures = 0;
for (const asset of assets) {
  const destination = resolve(root, asset.path);
  try {
    await mkdir(dirname(destination), { recursive: true });
    const response = await fetch(asset.url, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 100) throw new Error("Downloaded file is unexpectedly small");
    await writeFile(destination, bytes);
    process.stdout.write(`Downloaded ${asset.path} (${bytes.byteLength.toLocaleString()} bytes)\n`);
  } catch (error) {
    failures += 1;
    process.stderr.write(`Failed ${asset.path}: ${error.message}\n`);
  }
}

if (failures) {
  process.stderr.write(`\n${failures} asset download(s) failed. The game uses procedural fallbacks until these files are present.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("\nAll optional model and HDRI assets downloaded.\n");
}
