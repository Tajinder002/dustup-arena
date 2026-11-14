import { randomInteger } from "./math.js";

export function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += alphabet[randomInteger(alphabet.length)];
  }
  return code;
}
