import * as THREE from 'three';

// Modified from
// https://github.com/mrdoob/three.js/blob/master/examples/js/controls/PointerLockControls.js

class PointerLockControls {
  constructor(camera, startX, startY, startZ) {
    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);

    this.yawObject = new THREE.Object3D();
    this.yawObject.position.y = 10;
    this.yawObject.add(this.pitchObject);

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    this.isOnObject = false;
    this.canJump = false;

    this.velocity = new THREE.Vector3();

    const PI_2 = Math.PI / 2;

    const self = this;

    function onMouseMove(event) {
      if (self.enabled === false) return;

      const movementX = event.movementX ||
        event.mozMovementX || event.webkitMovementX || 0;
      const movementY = event.movementY ||
        event.mozMovementY || event.webkitMovementY || 0;

      self.yawObject.rotation.y -= movementX * 0.002;
      self.pitchObject.rotation.x -= movementY * 0.002;

      self.pitchObject.rotation.x = Math.max(-PI_2,
        Math.min(PI_2, self.pitchObject.rotation.x));
    }

    function onKeyDown(event) {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          self.moveForward = true;
          break;

        case 37: // left
        case 65: // a
          self.moveLeft = true; break;

        case 40: // down
        case 83: // s
          self.moveBackward = true;
          break;

        case 39: // right
        case 68: // d
          self.moveRight = true;
          break;

        case 32: // space
          self.goingUp = true;
          break;

        case 16: // shift
          self.goingDown = true;
          break;

        default:
          // don't do anything
      }
    }

    function onKeyUp(event) {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          self.moveForward = false;
          break;

        case 37: // left
        case 65: // a
          self.moveLeft = false;
          break;

        case 40: // down
        case 83: // a
          self.moveBackward = false;
          break;

        case 39: // right
        case 68: // d
          self.moveRight = false;
          break;

        case 32: // space
          self.velocity.y = 0;
          self.goingUp = false;
          break;

        case 16: // shift
          self.velocity.y = 0;
          self.goingDown = false;
          break;

        default:
          // don't do anything
      }
    }

    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    this.enabled = false;
    this.velocity.y = 0;
    this.yawObject.position.x = startX;
    this.yawObject.position.y = startY;
    this.yawObject.position.z = startZ;
  }

  getObject() {
    return this.yawObject;
  }

  isOnObject(onObject) {
    this.isOnObject = onObject;
    this.canJump = onObject;
  }

  update(inputDelta) {
    if (this.enabled === false) return;

    let delta = inputDelta;
    delta *= 0.1;

    this.velocity.x += (-this.velocity.x) * 0.08 * delta;
    this.velocity.z += (-this.velocity.z) * 0.08 * delta;

    if (this.goingUp) {
      if (this.velocity.y >= 5) {
        this.velocity.y = 5;
      } else {
        this.velocity.y += 0.1;
      }
    } else if (this.goingDown) {
      if (this.velocity.y <= -5) {
        this.velocity.y = -5;
      } else {
        this.velocity.y -= 0.1;
      }
    }

    if (this.moveForward) this.velocity.z -= 0.32 * delta;
    if (this.moveBackward) this.velocity.z += 0.32 * delta;

    if (this.moveLeft) this.velocity.x -= 0.32 * delta;
    if (this.moveRight) this.velocity.x += 0.32 * delta;

    this.yawObject.translateX(this.velocity.x);
    this.yawObject.translateY(this.velocity.y);
    this.yawObject.translateZ(this.velocity.z);

    if (this.yawObject.position.y < 10) {
      this.velocity.y = 0;
      this.yawObject.position.y = 10;
    }
  }
}

module.exports = {
  PointerLockControls,
};
