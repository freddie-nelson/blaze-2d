import { glMatrix, vec2 } from "gl-matrix";
import { setKey } from "../../keyboard";
import Player from "../../player";

/**
 * Creates a virtual joystick which can be used to control a {@link Player}'s movement on a touch device.
 *
 * @param element The element to append the joystick to
 * @param player The player to control
 */
export function createVirtualJoystick(element: HTMLElement, player: Player) {
  const styles = document.createElement("style");
  styles.innerHTML = `
    .blz-joystick {
      display: flex;
      position: fixed;
      left: 5%;
      bottom: 5%;
      border-radius: 50%;
      width: 8rem;
      height: 8rem;
      background-color: rgba(0,0,0,0.5);
      border: .5rem solid rgba(255,255,255, 0.1);
      justify-content: center;
      align-items: center;
    }

    .blz-joystick .blz-stick {
      border-radius: 50%;
      width: 70%;
      height: 70%;
      background: radial-gradient(black, #1f1f1f, #444444);
      transform-origin: center;
    }
  `;
  document.head.appendChild(styles);

  const joystick = document.createElement("div");
  joystick.classList.add("blz-joystick");

  const stick = document.createElement("div");
  stick.classList.add("blz-stick");
  joystick.appendChild(stick);

  element.appendChild(joystick);

  const calculateMovementKeys = (angle: number) => {
    const bleed = 30;
    const deg = (angle / Math.PI) * 180;

    const fDeg = 0;
    const bDeg = 180;
    const bDeg2 = -180;
    const rDeg = 90;
    const lDeg = -90;

    const frDeg = 45;
    const flDeg = -45;
    const brDeg = 135;
    const blDeg = -135;

    setKey(player.keys.forward, false);
    setKey(player.keys.back, false);
    setKey(player.keys.left, false);
    setKey(player.keys.right, false);

    if (deg > fDeg - bleed && deg < fDeg + bleed) {
      setKey(player.keys.forward, true);
    } else if (deg > rDeg - bleed && deg < rDeg + bleed) {
      setKey(player.keys.right, true);
    } else if (deg > lDeg - bleed && deg < lDeg + bleed) {
      setKey(player.keys.left, true);
    } else if (deg > bDeg - bleed || deg < bDeg2 + bleed) {
      setKey(player.keys.back, true);
    } else if (deg > frDeg - bleed && deg < frDeg + bleed) {
      setKey(player.keys.forward, true);
      setKey(player.keys.right, true);
    } else if (deg > flDeg - bleed && deg < flDeg + bleed) {
      setKey(player.keys.forward, true);
      setKey(player.keys.left, true);
    } else if (deg > brDeg - bleed && deg < brDeg + bleed) {
      setKey(player.keys.back, true);
      setKey(player.keys.right, true);
    } else if (deg > blDeg - bleed && deg < blDeg + bleed) {
      setKey(player.keys.back, true);
      setKey(player.keys.left, true);
    }
  };

  const angleOrigin = vec2.fromValues(0, -1);

  const calculateStickPos = (e: TouchEvent) => {
    // find touch that targets joystick
    let touch: Touch;
    for (const t of Array.from(e.changedTouches)) {
      if (t.target === joystick || joystick.contains(<Node>t.target)) {
        touch = t;
        break;
      }
    }
    if (!touch) return;

    e.preventDefault();

    const joyRect = joystick.getBoundingClientRect();
    const radius = joyRect.width / 2;
    const centerX = joyRect.left + joyRect.width / 2;
    const centerY = joyRect.top + joyRect.height / 2;

    const touchX = touch.pageX;
    const touchY = touch.pageY;

    const distX = Math.abs(centerX - touchX);
    const distY = Math.abs(centerY - touchY);
    const dist = Math.sqrt(distX * distX + distY * distY);

    const touchVec = vec2.fromValues(touchX - centerX, touchY - centerY);
    vec2.normalize(touchVec, touchVec);
    vec2.scale(touchVec, touchVec, Math.min(radius * 0.75, dist));

    stick.style.transform = `translate(${touchVec[0]}px, ${touchVec[1]}px)`;

    // get angle between -Math.PI and Math.PI (0 is directly up)
    const angle = vec2.angle(angleOrigin, touchVec);
    calculateMovementKeys(touchVec[0] >= 0 ? angle : 0 - angle);
  };

  joystick.addEventListener("touchstart", calculateStickPos);
  joystick.addEventListener("touchmove", calculateStickPos);
  joystick.addEventListener("touchend", () => {
    stick.style.transform = "";

    setKey(player.keys.forward, false);
    setKey(player.keys.back, false);
    setKey(player.keys.left, false);
    setKey(player.keys.right, false);
  });
}
