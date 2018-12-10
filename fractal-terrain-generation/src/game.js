import * as THREE from 'three';
import * as log from 'loglevel';

import Stats from './stats';
import { PointerLockControls } from './pointerLockControls';

class Game {
  constructor() {
    log.setLevel('info');
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight,
      1, 10000);
    this.controls = new PointerLockControls(this.camera, 50, 30, 50);
    this.generateTitlePlate();
    this.scene = new THREE.Scene();
    this.controls.enabled = true;
    this.scene.add(this.controls.getObject());
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // for some OSX users this may solve some performance issues
    // this.renderer.setPixelRatio(1);

    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '12px';
    this.stats.domElement.style.top = '12px';

    this.cumDelta = 0;
    this.clock = new THREE.Clock();
    this.updateProcedures = {};
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.domElement);
    window.addEventListener('resize', this.resize.bind(this));
  }

  setBackgroundColor(backgroundColor) {
    this.scene.background = backgroundColor;
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getObject(name) {
    return this.scene.getObjectByName(name);
  }

  addMesh(mesh) {
    this.scene.add(mesh);
    log.trace(`Adding mesh "${mesh.name}" to scene`);
  }

  /**
   * Attempt to remove a mesh with the specified name.
   *
   * @param {string} meshName - name of the mesh to remove
   */
  removeMesh(meshName) {
    const tarMesh = this.scene.getObjectByName(meshName);
    if (tarMesh) {
      this.scene.remove(tarMesh);
      return true;
    }
    log.warn(`Mesh "${meshName}" could not be removed from scene`);
    log.warn(tarMesh);
    return false;
  }

  update(delta) {
    this.stats.update(delta);
    this.cumDelta += delta;
    if (this.cumDelta >= 0.001) {
      this.controls.update(this.cumDelta * 100);
      this.cumDelta = 0;
    }

    const cameraPos = this.controls.getObject().position;
    const procedureNames = Object.keys(this.updateProcedures);
    for (const procName of procedureNames) {
      const procedureObj = this.updateProcedures[procName];
      if (procedureObj.lastUpdate.getElapsedTime() >= procedureObj.rate) {
        const temp = procedureObj.rate;
        procedureObj.rate = 1000000000;
        procedureObj.procedure(delta, cameraPos);
        procedureObj.lastUpdate.start();
        procedureObj.rate = temp;
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    const delta = this.clock.getDelta();
    this.update(delta);
    requestAnimationFrame(this.animate.bind(this));
    this.render();
  }

  overrideMaterial(material) {
    this.scene.overrideMaterial = material;
  }

  addUpdateProcedure(name, procedure, rate = 1) {
    this.updateProcedures[name] = {
      procedure,
      rate,
      lastUpdate: new THREE.Clock(),
    };
    this.updateProcedures[name].lastUpdate.start();
  }

  rmUpdateProcedure(name) {
    delete this.updateProcedures[name];
  }

  generateTitlePlate() {
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    const havePointerLock = 'pointerLockElement' in document ||
     'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    const self = this;

    function pointerlockerror() {
      instructions.style.display = '';
    }

    if (havePointerLock) {
      const element = document.body;
      // eslint-disable-next-line no-inner-declarations
      function pointerlockchange() {
        if (document.pointerLockElement === element ||
          document.mozPointerLockElement === element ||
          document.webkitPointerLockElement === element) {
          self.controls.enabled = true;
          blocker.style.display = 'none';
        } else {
          self.controls.enabled = false;
          blocker.style.display = '-webkit-box';
          blocker.style.display = '-moz-box';
          blocker.style.display = 'box';
          instructions.style.display = '';
        }
      }

      document.addEventListener('pointerlockchange', pointerlockchange, false);
      document.addEventListener('mozpointerlockchange', pointerlockchange, false);
      document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

      document.addEventListener('pointerlockerror', pointerlockerror, false);
      document.addEventListener('mozpointerlockerror', pointerlockerror, false);
      document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

      // eslint-disable-next-line no-inner-declarations
      function fullscreenchange() {
        if (document.fullscreenElement === element ||
          document.mozFullscreenElement === element ||
          document.mozFullScreenElement === element) {
          document.removeEventListener('fullscreenchange', fullscreenchange);
          document.removeEventListener('mozfullscreenchange', fullscreenchange);
          element.requestPointerLock();
        }
      }

      instructions.addEventListener('click', () => {
        instructions.style.display = 'none';
        element.requestPointerLock = element.requestPointerLock ||
          element.mozRequestPointerLock || element.webkitRequestPointerLock;

        if (/Firefox/i.test(navigator.userAgent)) {
          document.addEventListener('fullscreenchange', fullscreenchange, false);
          document.addEventListener('mozfullscreenchange', fullscreenchange, false);

          element.requestFullscreen = element.requestFullscreen ||
            element.mozRequestFullscreen || element.mozRequestFullScreen ||
            element.webkitRequestFullscreen;
          element.requestFullscreen();
        } else {
          element.requestPointerLock();
        }
      }, false);
    } else {
      instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
    }
  }
}


module.exports = {
  Game,
};
