/**
 * Optional production assets. The project includes procedural fallbacks so it
 * remains playable before these binary files have been downloaded.
 */
export const ASSET_MANIFEST = {
  character: {
    local: "./assets/models/characters/CesiumMan.glb",
    remote: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb",
    label: "Cesium Man character",
    attribution: "Cesium, Khronos glTF Sample Assets (2017), CC BY 4.0"
  },
  vehicle: {
    local: "./assets/models/vehicles/CesiumMilkTruck.glb",
    remote: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
    label: "Cesium Milk Truck vehicle",
    attribution: "Cesium, Khronos glTF Sample Assets (2017), CC BY 4.0"
  },
  environment: {
    local: "./assets/environments/city-sunset-1k.hdr",
    remote: "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr",
    label: "City sunset HDRI",
    attribution: "Poly Haven — Joburg Central Sunset, CC0"
  }
};
