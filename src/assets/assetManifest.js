/**
 * Runtime assets used by Dustup Arena.
 * The player character is supplied as a local GLB so every player loads the same rig.
 */
export const ASSET_MANIFEST = {
  character: {
    local: "./cyborg-rigged.glb?v=cyborg-pubg-v3",
    label: "Cyborg rigged player character",
    attribution: "User-supplied GLB; distribution license has not been independently verified"
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
