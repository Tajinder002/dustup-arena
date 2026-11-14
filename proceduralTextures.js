/** Small generated PBR maps. They are created once and shared by each map. */
export function createProceduralTextureSet(THREE, theme = {}) {
  const makeCanvasTexture = (draw, repeat = [8, 8], colorMap = true) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d", { alpha: false });
    draw(context, canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
    texture.anisotropy = 4;
    if (colorMap && "encoding" in texture) texture.encoding = THREE.sRGBEncoding;
    return texture;
  };

  let seed = theme.seed || 23;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const asphalt = makeCanvasTexture(context => {
    context.fillStyle = "#343638";
    context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 3200; index += 1) {
      const shade = Math.floor(48 + random() * 55);
      context.fillStyle = `rgba(${shade},${shade},${shade},${0.08 + random() * 0.2})`;
      const size = 1 + random() * 2.5;
      context.fillRect(random() * 256, random() * 256, size, size);
    }
    context.strokeStyle = "rgba(12,14,16,.24)";
    context.lineWidth = 1.4;
    for (let index = 0; index < 12; index += 1) {
      const x = random() * 256;
      const y = random() * 256;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + random() * 26 - 13, y + random() * 36);
      context.lineTo(x + random() * 42 - 21, y + random() * 50);
      context.stroke();
    }
  }, [10, 8]);

  const concrete = makeCanvasTexture(context => {
    context.fillStyle = theme.concrete || "#9b9b95";
    context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 2100; index += 1) {
      const shade = Math.floor(100 + random() * 100);
      context.fillStyle = `rgba(${shade},${shade},${shade},${random() * 0.11})`;
      context.fillRect(random() * 256, random() * 256, 1 + random() * 3, 1 + random() * 3);
    }
    context.strokeStyle = "rgba(30,30,30,.14)";
    context.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(256, y); context.stroke();
    }
  }, [4, 4]);

  const masonry = makeCanvasTexture(context => {
    context.fillStyle = theme.facade || "#9b9690";
    context.fillRect(0, 0, 256, 256);
    const brickHeight = 24;
    for (let row = 0; row < 11; row += 1) {
      const offset = row % 2 ? 32 : 0;
      for (let x = -64; x < 320; x += 64) {
        const shade = Math.floor(120 + random() * 55);
        context.fillStyle = `rgba(${shade},${shade - 4},${shade - 9},.18)`;
        context.fillRect(x + offset + 2, row * brickHeight + 2, 60, 19);
      }
    }
    context.strokeStyle = "rgba(28,27,26,.28)";
    context.lineWidth = 2;
    for (let y = 0; y <= 256; y += brickHeight) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(256, y); context.stroke();
    }
  }, [3, 4]);

  const roughness = makeCanvasTexture(context => {
    context.fillStyle = "#c5c5c5";
    context.fillRect(0, 0, 256, 256);
    for (let index = 0; index < 3000; index += 1) {
      const shade = Math.floor(90 + random() * 150);
      context.fillStyle = `rgb(${shade},${shade},${shade})`;
      context.fillRect(random() * 256, random() * 256, 1 + random() * 2, 1 + random() * 2);
    }
  }, [8, 8], false);

  const normal = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d");
    const heights = new Float32Array(128 * 128);
    for (let index = 0; index < heights.length; index += 1) heights[index] = random();
    const image = context.createImageData(128, 128);
    for (let y = 0; y < 128; y += 1) {
      for (let x = 0; x < 128; x += 1) {
        const left = heights[y * 128 + Math.max(0, x - 1)];
        const right = heights[y * 128 + Math.min(127, x + 1)];
        const up = heights[Math.max(0, y - 1) * 128 + x];
        const down = heights[Math.min(127, y + 1) * 128 + x];
        const dx = (left - right) * 0.34;
        const dy = (up - down) * 0.34;
        const length = Math.sqrt(dx * dx + dy * dy + 1);
        const offset = (y * 128 + x) * 4;
        image.data[offset] = Math.round((dx / length * 0.5 + 0.5) * 255);
        image.data[offset + 1] = Math.round((dy / length * 0.5 + 0.5) * 255);
        image.data[offset + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.anisotropy = 4;
    return texture;
  })();

  return { asphalt, concrete, masonry, roughness, normal };
}
