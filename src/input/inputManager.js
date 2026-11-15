import { $ } from "../utils/dom.js";
import { CAMERA_DISTANCE } from "../config/gameConfig.js?v=pubg-aim-v1";

export class InputManager {
  constructor(state, canvas) {
    this.state = state;
    this.canvas = canvas;
  }

  localInput() {
    const state = this.state;
    if (state.paused) {
      return { mx: 0, my: 0, s: false, a: state.yaw, p: state.pitch, j: false, r: false, cd: state.cameraDistance || CAMERA_DISTANCE };
    }

    const forward = (
      (state.keys.w || state.keys.arrowup ? 1 : 0)
      - (state.keys.s || state.keys.arrowdown ? 1 : 0)
      - state.touchInput.y
    );
    const right = (
      (state.keys.d || state.keys.arrowright ? 1 : 0)
      - (state.keys.a || state.keys.arrowleft ? 1 : 0)
      + state.touchInput.x
    );
    const cosine = Math.cos(state.yaw);
    const sine = Math.sin(state.yaw);

    return {
      mx: forward * cosine - right * sine,
      my: forward * sine + right * cosine,
      s: state.mouse.down,
      a: state.yaw,
      p: state.pitch,
      j: !!state.keys[" "] || state.touchInput.jump,
      r: !!state.keys.r || state.touchInput.reload,
      cd: Number.isFinite(state.cameraDistance) ? state.cameraDistance : CAMERA_DISTANCE
    };
  }

  bindDesktopControls() {
    const state = this.state;

    window.addEventListener("keydown", event => {
      state.keys[event.key.toLowerCase()] = true;
      if (event.key.startsWith("Arrow")) event.preventDefault();
    });
    window.addEventListener("keyup", event => {
      state.keys[event.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener("pointerdown", event => {
      if (event.pointerType !== "mouse") return;
      if (document.pointerLockElement !== this.canvas && this.canvas.requestPointerLock) {
        try {
          const result = this.canvas.requestPointerLock();
          result?.catch?.(() => {});
        } catch (error) {
          console.debug("Pointer lock request failed:", error);
        }
      }
      state.mouse.down = true;
    });

    document.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement !== this.canvas) state.mouse.down = false;
    });

    window.addEventListener("pointerup", event => {
      if (event.pointerType === "mouse") state.mouse.down = false;
    });

    window.addEventListener("mousemove", event => {
      if (document.pointerLockElement === this.canvas) {
        state.yaw += event.movementX * 0.0025;
        state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch - event.movementY * 0.0025));
      }
    });

    this.canvas.addEventListener("contextmenu", event => event.preventDefault());
  }

  toggleFullscreen() {
    const documentElement = document.documentElement;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const request = documentElement.requestFullscreen || documentElement.webkitRequestFullscreen;
        const result = request?.call(documentElement);
        result?.catch?.(() => {});

        const orientationLock = screen.orientation?.lock?.("landscape");
        orientationLock?.catch?.(() => {});
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        exit?.call(document);
      }
    } catch (error) {
      console.debug("Fullscreen toggle failed:", error);
    }
  }

  bindTouchControls() {
    if (!this.state.isTouch) return;

    const state = this.state;
    $("tc").style.display = "block";
    window.addEventListener("touchend", () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) this.toggleFullscreen();
    }, { once: true });

    const joystickArea = $("zl");
    const lookArea = $("zr");
    const joystickBase = $("jb");
    const joystickKnob = $("jk");
    let joystickPointerId = null;
    let joystickOriginX = 0;
    let joystickOriginY = 0;
    let lookPointerId = null;
    let previousLookX = 0;
    let previousLookY = 0;

    joystickArea.addEventListener("pointerdown", event => {
      if (joystickPointerId !== null) return;
      joystickPointerId = event.pointerId;
      joystickArea.setPointerCapture(joystickPointerId);
      joystickOriginX = event.clientX;
      joystickOriginY = event.clientY;
      joystickBase.style.display = "block";
      joystickBase.style.left = `${joystickOriginX}px`;
      joystickBase.style.top = `${joystickOriginY}px`;
      joystickKnob.style.transform = "none";
    });

    joystickArea.addEventListener("pointermove", event => {
      if (event.pointerId !== joystickPointerId) return;
      let deltaX = event.clientX - joystickOriginX;
      let deltaY = event.clientY - joystickOriginY;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance > 55) {
        deltaX *= 55 / distance;
        deltaY *= 55 / distance;
      }

      if (distance < 10) {
        state.touchInput.x = 0;
        state.touchInput.y = 0;
      } else {
        state.touchInput.x = deltaX / 55;
        state.touchInput.y = deltaY / 55;
      }
      joystickKnob.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });

    const releaseJoystick = event => {
      if (event.pointerId !== joystickPointerId) return;
      joystickPointerId = null;
      state.touchInput.x = 0;
      state.touchInput.y = 0;
      joystickBase.style.display = "none";
    };
    joystickArea.addEventListener("pointerup", releaseJoystick);
    joystickArea.addEventListener("pointercancel", releaseJoystick);

    lookArea.addEventListener("pointerdown", event => {
      if (lookPointerId !== null) return;
      lookPointerId = event.pointerId;
      lookArea.setPointerCapture(lookPointerId);
      previousLookX = event.clientX;
      previousLookY = event.clientY;
    });
    lookArea.addEventListener("pointermove", event => {
      if (event.pointerId !== lookPointerId) return;
      state.yaw += (event.clientX - previousLookX) * 0.006;
      state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch - (event.clientY - previousLookY) * 0.006));
      previousLookX = event.clientX;
      previousLookY = event.clientY;
    });
    const releaseLook = event => {
      if (event.pointerId === lookPointerId) lookPointerId = null;
    };
    lookArea.addEventListener("pointerup", releaseLook);
    lookArea.addEventListener("pointercancel", releaseLook);

    const bindHoldButton = (elementId, onPress, onRelease) => {
      const button = $(elementId);
      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        onPress();
      });
      button.addEventListener("pointerup", onRelease);
      button.addEventListener("pointercancel", onRelease);
    };

    bindHoldButton("bf", () => { state.mouse.down = true; }, () => { state.mouse.down = false; });
    const fireButton = $("bf");
    let firePointerId = null;
    let previousFireX = 0;
    let previousFireY = 0;
    fireButton.addEventListener("pointerdown", event => {
      firePointerId = event.pointerId;
      previousFireX = event.clientX;
      previousFireY = event.clientY;
    });
    fireButton.addEventListener("pointermove", event => {
      if (event.pointerId !== firePointerId) return;
      state.yaw += (event.clientX - previousFireX) * 0.006;
      state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch - (event.clientY - previousFireY) * 0.006));
      previousFireX = event.clientX;
      previousFireY = event.clientY;
    });
    const releaseFire = event => {
      if (event.pointerId === firePointerId) firePointerId = null;
    };
    fireButton.addEventListener("pointerup", releaseFire);
    fireButton.addEventListener("pointercancel", releaseFire);

    bindHoldButton("bj", () => { state.touchInput.jump = true; }, () => { state.touchInput.jump = false; });
    bindHoldButton("br", () => { state.touchInput.reload = true; }, () => { state.touchInput.reload = false; });
    $("bfs").addEventListener("click", () => this.toggleFullscreen());
  }

  bind() {
    this.bindDesktopControls();
    this.bindTouchControls();
  }
}
