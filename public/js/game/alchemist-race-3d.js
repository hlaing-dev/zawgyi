const ACTION_ORDER = ["a", "b", "x", "y"];

const CONFIG = {
  worldSize: 60,
  targetScore: 1000,
  commonPoints: 10,
  rarePoints: 50,
  potionPoints: 200,
  qteMultiplier: 1.5,
  qteLength: 5,
  qteLimitMs: 8000,
  confusionMs: 9000,
  bigHeadMs: 9000,
  stealCooldownMs: 1600,
  stealChance: 0.28,
  pickupRadius: 1.6,
  cauldronRadius: 2.4,
  commonHerbs: 26,
  rareHerbs: 10,
};

export class AlchemistRace3D {
  constructor({ canvas, consumeInput, gameState, showResult, shared, getLang }) {
    this.canvas = canvas;
    this.consumeInput = consumeInput;
    this.gameState = gameState;
    this.showResult = showResult;
    this.shared = shared;
    this.getLang = getLang;
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.ui = null;
    this.players = [];
    this.commonHerbs = [];
    this.rareHerbs = [];
    this.cauldrons = [];
    this.glow = null;
    this.running = false;
    this.lastTick = 0;
    this.messages = { p1: "", p2: "" };
  }

  start(playMode) {
    if (!this.canvas || !window.BABYLON) return;
    this.stop();
    this.engine = new BABYLON.Engine(this.canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.08, 0.1, 0.12, 1);
    this.shared.alchemistRace3D = this;
    this.running = true;
    this.lastTick = performance.now();

    this.createCamera();
    this.createLights();
    this.createEnvironment();
    this.createPlayers();
    this.createHerbs();
    this.createCauldrons();
    this.createUI();

    this.engine.runRenderLoop(() => {
      if (!this.running) return;
      this.update();
      this.scene.render();
    });

    window.addEventListener("resize", this.handleResize);
    this.gameState.status = "playing";
    this.gameState.winner = null;
    this.gameState.gameMode = "alchemist-race-3d";
  }

  stop() {
    this.running = false;
    if (this.engine) {
      this.engine.stopRenderLoop();
    }
    if (this.scene) {
      this.scene.dispose();
    }
    if (this.engine) {
      this.engine.dispose();
    }
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.ui = null;
    this.players = [];
    this.commonHerbs = [];
    this.rareHerbs = [];
    this.cauldrons = [];
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    if (this.engine) this.engine.resize();
  };

  createCamera() {
    const center = new BABYLON.Vector3(0, 0, 0);
    const camera = new BABYLON.ArcRotateCamera(
      "alchemistCam",
      Math.PI / 2,
      Math.PI / 2.8,
      70,
      center,
      this.scene
    );
    camera.lowerRadiusLimit = 70;
    camera.upperRadiusLimit = 70;
    camera.lowerBetaLimit = Math.PI / 3.2;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.attachControl(this.canvas, false);
    camera.inputs.clear();
    this.camera = camera;
  }

  createLights() {
    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.6;
    hemi.diffuse = new BABYLON.Color3(0.82, 0.82, 0.9);
    hemi.groundColor = new BABYLON.Color3(0.2, 0.25, 0.22);

    const dir = new BABYLON.DirectionalLight("dir", new BABYLON.Vector3(-0.4, -1, -0.2), this.scene);
    dir.position = new BABYLON.Vector3(20, 40, 20);
    dir.intensity = 0.9;

    const shadow = new BABYLON.ShadowGenerator(1024, dir);
    shadow.useBlurExponentialShadowMap = true;
    shadow.blurKernel = 12;
    this.shadow = shadow;

    this.glow = new BABYLON.GlowLayer("glow", this.scene, { blurKernelSize: 32 });
    this.glow.intensity = 0.55;
  }

  createEnvironment() {
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: CONFIG.worldSize, height: CONFIG.worldSize },
      this.scene
    );
    const groundMat = new BABYLON.PBRMaterial("groundMat", this.scene);
    groundMat.albedoColor = new BABYLON.Color3(0.16, 0.3, 0.2);
    groundMat.metallic = 0.1;
    groundMat.roughness = 0.9;
    ground.material = groundMat;
    ground.receiveShadows = true;

    for (let i = 0; i < 18; i += 1) {
      const trunk = BABYLON.MeshBuilder.CreateCylinder(
        `treeTrunk${i}`,
        { height: 4, diameterTop: 0.6, diameterBottom: 0.8 },
        this.scene
      );
      trunk.position = new BABYLON.Vector3(
        this.randomRange(-CONFIG.worldSize / 2 + 4, CONFIG.worldSize / 2 - 4),
        2,
        this.randomRange(-CONFIG.worldSize / 2 + 4, CONFIG.worldSize / 2 - 4)
      );
      const trunkMat = new BABYLON.PBRMaterial(`trunkMat${i}`, this.scene);
      trunkMat.albedoColor = new BABYLON.Color3(0.32, 0.2, 0.12);
      trunkMat.roughness = 0.8;
      trunk.material = trunkMat;
      trunk.receiveShadows = true;
      this.shadow.addShadowCaster(trunk);

      const crown = BABYLON.MeshBuilder.CreateSphere(`treeCrown${i}`, { diameter: 3.6 }, this.scene);
      crown.position = trunk.position.add(new BABYLON.Vector3(0, 3, 0));
      const crownMat = new BABYLON.PBRMaterial(`crownMat${i}`, this.scene);
      crownMat.albedoColor = new BABYLON.Color3(0.15, 0.35, 0.22);
      crownMat.roughness = 0.85;
      crown.material = crownMat;
      crown.receiveShadows = true;
      this.shadow.addShadowCaster(crown);
    }

    const peak = BABYLON.MeshBuilder.CreateCylinder("peak", { height: 8, diameterTop: 4, diameterBottom: 12 }, this.scene);
    peak.position = new BABYLON.Vector3(0, 4, -CONFIG.worldSize / 2 + 6);
    const peakMat = new BABYLON.PBRMaterial("peakMat", this.scene);
    peakMat.albedoColor = new BABYLON.Color3(0.3, 0.26, 0.22);
    peakMat.roughness = 0.9;
    peak.material = peakMat;

    const pagoda = BABYLON.MeshBuilder.CreateCylinder("pagoda", { height: 4, diameterTop: 1.2, diameterBottom: 3 }, this.scene);
    pagoda.position = peak.position.add(new BABYLON.Vector3(0, 6, 0));
    const pagodaMat = new BABYLON.PBRMaterial("pagodaMat", this.scene);
    pagodaMat.albedoColor = new BABYLON.Color3(0.86, 0.66, 0.2);
    pagodaMat.emissiveColor = new BABYLON.Color3(0.5, 0.35, 0.1);
    pagodaMat.metallic = 0.8;
    pagodaMat.roughness = 0.3;
    pagoda.material = pagodaMat;
    this.glow.addIncludedOnlyMesh(pagoda);
  }

  createPlayers() {
    this.players = [
      this.buildPlayer(1, new BABYLON.Vector3(-10, 0, 18), new BABYLON.Color3(0.95, 0.65, 0.35)),
      this.buildPlayer(2, new BABYLON.Vector3(10, 0, 18), new BABYLON.Color3(0.45, 0.78, 0.65)),
    ];
  }

  buildPlayer(id, position, tint) {
    const root = new BABYLON.TransformNode(`player${id}`, this.scene);
    root.position = position.clone();

    const body = BABYLON.MeshBuilder.CreateCapsule(`body${id}`, { height: 3, radius: 0.9 }, this.scene);
    body.parent = root;
    body.position.y = 1.5;
    const bodyMat = new BABYLON.PBRMaterial(`bodyMat${id}`, this.scene);
    bodyMat.albedoColor = tint;
    bodyMat.roughness = 0.65;
    body.material = bodyMat;
    this.shadow.addShadowCaster(body);

    const head = BABYLON.MeshBuilder.CreateSphere(`head${id}`, { diameter: 1.2 }, this.scene);
    head.parent = root;
    head.position.y = 3.2;
    const headMat = new BABYLON.PBRMaterial(`headMat${id}`, this.scene);
    headMat.albedoColor = new BABYLON.Color3(0.96, 0.88, 0.7);
    headMat.roughness = 0.4;
    head.material = headMat;
    this.shadow.addShadowCaster(head);

    const staff = BABYLON.MeshBuilder.CreateCylinder(`staff${id}`, { height: 3.2, diameter: 0.18 }, this.scene);
    staff.parent = root;
    staff.position = new BABYLON.Vector3(1, 1.5, 0.4);
    staff.rotation.z = Math.PI / 10;
    const staffMat = new BABYLON.PBRMaterial(`staffMat${id}`, this.scene);
    staffMat.albedoColor = new BABYLON.Color3(0.42, 0.26, 0.14);
    staffMat.roughness = 0.85;
    staff.material = staffMat;

    return {
      id,
      root,
      body,
      head,
      points: 0,
      common: 0,
      rare: 0,
      legendary: 0,
      speed: 6.2,
      confusedUntil: 0,
      bigHeadUntil: 0,
      stealCooldown: 0,
      qte: null,
      message: "",
    };
  }

  createHerbs() {
    for (let i = 0; i < CONFIG.commonHerbs; i += 1) {
      const herb = this.spawnHerb("common");
      this.commonHerbs.push(herb);
    }
    for (let i = 0; i < CONFIG.rareHerbs; i += 1) {
      const herb = this.spawnHerb("rare");
      this.rareHerbs.push(herb);
    }
  }

  spawnHerb(type) {
    const herb = BABYLON.MeshBuilder.CreateSphere(`herb_${type}_${Math.random()}`, { diameter: type === "rare" ? 1.3 : 1 }, this.scene);
    herb.position = new BABYLON.Vector3(
      this.randomRange(-CONFIG.worldSize / 2 + 3, CONFIG.worldSize / 2 - 3),
      0.6 + (type === "rare" ? 1.2 : 0.6),
      this.randomRange(-CONFIG.worldSize / 2 + 3, CONFIG.worldSize / 2 - 3)
    );
    herb.metadata = { type, active: true, respawnAt: 0 };
    const mat = new BABYLON.PBRMaterial(`herbMat_${type}_${Math.random()}`, this.scene);
    if (type === "rare") {
      mat.albedoColor = new BABYLON.Color3(0.6, 0.4, 0.95);
      mat.emissiveColor = new BABYLON.Color3(0.4, 0.2, 0.8);
      mat.metallic = 0.3;
    } else {
      mat.albedoColor = new BABYLON.Color3(0.3, 0.8, 0.45);
      mat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.2);
      mat.metallic = 0.1;
    }
    mat.roughness = 0.4;
    herb.material = mat;
    this.glow.addIncludedOnlyMesh(herb);
    this.shadow.addShadowCaster(herb);
    return herb;
  }

  createCauldrons() {
    const baseZ = CONFIG.worldSize / 2 - 6;
    const cauldronPositions = [
      new BABYLON.Vector3(-12, 0, baseZ),
      new BABYLON.Vector3(12, 0, baseZ),
    ];

    this.cauldrons = cauldronPositions.map((pos, index) => {
      const cauldron = BABYLON.MeshBuilder.CreateCylinder(`cauldron${index}`, { height: 1.6, diameterTop: 2.2, diameterBottom: 2.6 }, this.scene);
      cauldron.position = pos.add(new BABYLON.Vector3(0, 0.8, 0));
      const mat = new BABYLON.PBRMaterial(`cauldronMat${index}`, this.scene);
      mat.albedoColor = new BABYLON.Color3(0.18, 0.22, 0.22);
      mat.roughness = 0.5;
      cauldron.material = mat;

      const glow = BABYLON.MeshBuilder.CreateTorus(`cauldronGlow${index}`, { diameter: 2.2, thickness: 0.18 }, this.scene);
      glow.position = pos.add(new BABYLON.Vector3(0, 1.6, 0));
      const glowMat = new BABYLON.StandardMaterial(`glowMat${index}`, this.scene);
      glowMat.emissiveColor = new BABYLON.Color3(0.1, 0.6, 0.4);
      glow.material = glowMat;
      glow.setEnabled(false);

      const particles = new BABYLON.ParticleSystem(`brewParticles${index}`, 600, this.scene);
      particles.particleTexture = new BABYLON.Texture("https://cdn.babylonjs.com/textures/flare.png", this.scene);
      particles.emitter = glow;
      particles.minEmitBox = new BABYLON.Vector3(-0.2, 0, -0.2);
      particles.maxEmitBox = new BABYLON.Vector3(0.2, 0.1, 0.2);
      particles.color1 = new BABYLON.Color4(0.7, 0.3, 0.9, 1);
      particles.color2 = new BABYLON.Color4(0.2, 0.7, 0.8, 1);
      particles.minSize = 0.2;
      particles.maxSize = 0.45;
      particles.emitRate = 220;
      particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
      particles.direction1 = new BABYLON.Vector3(-0.3, 1, -0.3);
      particles.direction2 = new BABYLON.Vector3(0.3, 1.2, 0.3);
      particles.gravity = new BABYLON.Vector3(0, -0.3, 0);
      particles.minLifeTime = 0.3;
      particles.maxLifeTime = 0.8;
      particles.updateSpeed = 0.02;
      particles.stop();

      return { cauldron, glow, particles, playerId: index + 1 };
    });
  }

  createUI() {
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("alchemist-ui", true, this.scene);
    const title = new BABYLON.GUI.TextBlock();
    title.text = "Alchemist's Race";
    title.color = "#f5efe2";
    title.fontSize = 22;
    title.fontFamily = "Cinzel";
    title.top = "-45%";
    gui.addControl(title);

    const p1Text = new BABYLON.GUI.TextBlock();
    p1Text.text = "P1";
    p1Text.color = "#f0c36a";
    p1Text.fontSize = 16;
    p1Text.fontFamily = "Barlow";
    p1Text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    p1Text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    p1Text.left = "24px";
    p1Text.top = "18px";
    gui.addControl(p1Text);

    const p2Text = new BABYLON.GUI.TextBlock();
    p2Text.text = "P2";
    p2Text.color = "#7ad2b1";
    p2Text.fontSize = 16;
    p2Text.fontFamily = "Barlow";
    p2Text.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    p2Text.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    p2Text.left = "-24px";
    p2Text.top = "18px";
    gui.addControl(p2Text);

    const p1Qte = new BABYLON.GUI.TextBlock();
    p1Qte.text = "";
    p1Qte.color = "#f5efe2";
    p1Qte.fontSize = 14;
    p1Qte.fontFamily = "Barlow";
    p1Qte.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    p1Qte.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    p1Qte.left = "24px";
    p1Qte.top = "50px";
    gui.addControl(p1Qte);

    const p2Qte = new BABYLON.GUI.TextBlock();
    p2Qte.text = "";
    p2Qte.color = "#f5efe2";
    p2Qte.fontSize = 14;
    p2Qte.fontFamily = "Barlow";
    p2Qte.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    p2Qte.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    p2Qte.left = "-24px";
    p2Qte.top = "50px";
    gui.addControl(p2Qte);

    this.ui = { gui, p1Text, p2Text, p1Qte, p2Qte, title };
  }

  update() {
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;

    this.players.forEach((player) => {
      const input = this.consumeInput(player.id);
      this.updatePlayer(player, input, delta, now);
      this.checkHerbPickup(player, now);
      this.updateBrewing(player, input, now);
    });

    this.handleSteal(now);
    this.updateUi(now);
  }

  updatePlayer(player, input, delta, now) {
    let moveX = input.moveX || 0;
    let moveZ = input.moveY || 0;
    if (now < player.confusedUntil) {
      moveX *= -1;
      moveZ *= -1;
    }

    const slow = now < player.bigHeadUntil ? 0.65 : 1;
    const speed = player.speed * slow;
    const nextX = player.root.position.x + moveX * speed * delta;
    const nextZ = player.root.position.z + moveZ * speed * delta;
    player.root.position.x = BABYLON.Scalar.Clamp(nextX, -CONFIG.worldSize / 2 + 2, CONFIG.worldSize / 2 - 2);
    player.root.position.z = BABYLON.Scalar.Clamp(nextZ, -CONFIG.worldSize / 2 + 2, CONFIG.worldSize / 2 - 2);

    if (now < player.bigHeadUntil) {
      player.head.scaling.setAll(3);
    } else {
      player.head.scaling.setAll(1);
    }
  }

  updateBrewing(player, input, now) {
    const cauldron = this.cauldrons[player.id - 1];
    if (!cauldron) return;

    const dist = BABYLON.Vector3.Distance(player.root.position, cauldron.cauldron.position);
    const ready = player.rare >= 3;

    if (player.qte) {
      const pressed = this.getPressedAction(input);
      if (pressed) {
        const expected = player.qte.sequence[player.qte.index];
        if (pressed === expected) {
          player.qte.index += 1;
          if (player.qte.index >= player.qte.sequence.length) {
            this.finishBrew(player, true);
          }
        } else {
          this.finishBrew(player, false);
        }
      }
      if (now - player.qte.startedAt > CONFIG.qteLimitMs) {
        this.finishBrew(player, false);
      }
      return;
    }

    if (dist <= CONFIG.cauldronRadius && input.b) {
      if (ready) {
        this.startBrew(player);
      } else {
        player.message = "Need 3 rare herbs";
      }
    }
  }

  startBrew(player) {
    const seq = [];
    for (let i = 0; i < CONFIG.qteLength; i += 1) {
      seq.push(ACTION_ORDER[Math.floor(Math.random() * ACTION_ORDER.length)]);
    }
    player.qte = {
      sequence: seq,
      index: 0,
      startedAt: performance.now(),
    };
    player.message = "Brew sequence!";
    const cauldron = this.cauldrons[player.id - 1];
    if (cauldron) {
      cauldron.glow.setEnabled(true);
      cauldron.particles.start();
    }
  }

  finishBrew(player, success) {
    const cauldron = this.cauldrons[player.id - 1];
    if (cauldron) {
      cauldron.glow.setEnabled(false);
      cauldron.particles.stop();
    }

    if (success) {
      const points = Math.round(CONFIG.potionPoints * CONFIG.qteMultiplier);
      player.points += points;
      player.legendary += 1;
      player.rare = Math.max(0, player.rare - 3);
      player.message = `Potion! +${points}`;
    } else {
      player.points = Math.max(0, player.points - 40);
      player.confusedUntil = performance.now() + CONFIG.confusionMs;
      player.bigHeadUntil = performance.now() + CONFIG.bigHeadMs;
      player.message = "Failed brew! Drunk controls!";
    }

    player.qte = null;
    this.checkWin(player);
  }

  checkHerbPickup(player, now) {
    const checkGroup = (list, type, points) => {
      list.forEach((herb) => {
        if (!herb.metadata.active) {
          if (now > herb.metadata.respawnAt) {
            herb.metadata.active = true;
            herb.setEnabled(true);
            herb.position = new BABYLON.Vector3(
              this.randomRange(-CONFIG.worldSize / 2 + 3, CONFIG.worldSize / 2 - 3),
              0.6 + (type === "rare" ? 1.2 : 0.6),
              this.randomRange(-CONFIG.worldSize / 2 + 3, CONFIG.worldSize / 2 - 3)
            );
          }
          return;
        }
        const dist = BABYLON.Vector3.Distance(player.root.position, herb.position);
        if (dist <= CONFIG.pickupRadius) {
          herb.metadata.active = false;
          herb.metadata.respawnAt = now + this.randomRange(1500, 3500);
          herb.setEnabled(false);
          player.points += points;
          if (type === "rare") {
            player.rare += 1;
          } else {
            player.common += 1;
          }
          player.message = type === "rare" ? `Rare herb +${points}` : `Herb +${points}`;
          this.checkWin(player);
        }
      });
    };

    checkGroup(this.commonHerbs, "common", CONFIG.commonPoints);
    checkGroup(this.rareHerbs, "rare", CONFIG.rarePoints);
  }

  handleSteal(now) {
    const p1 = this.players[0];
    const p2 = this.players[1];
    if (!p1 || !p2) return;
    const dist = BABYLON.Vector3.Distance(p1.root.position, p2.root.position);
    if (dist > 2.2) return;
    if (now < p1.stealCooldown || now < p2.stealCooldown) return;
    if (Math.random() > CONFIG.stealChance) return;

    const victim = Math.random() > 0.5 ? p1 : p2;
    const dropType = victim.rare > 0 ? "rare" : victim.common > 0 ? "common" : null;
    if (!dropType) return;

    if (dropType === "rare") victim.rare -= 1;
    if (dropType === "common") victim.common -= 1;

    const drop = this.spawnHerb(dropType);
    drop.position = victim.root.position.add(new BABYLON.Vector3(0, 0.6, 0));
    drop.metadata.active = true;

    p1.stealCooldown = now + CONFIG.stealCooldownMs;
    p2.stealCooldown = now + CONFIG.stealCooldownMs;
    victim.message = "Herb stolen!";
  }

  checkWin(player) {
    if (player.points >= CONFIG.targetScore && !this.gameState.winner) {
      this.gameState.winner = player.id;
      this.gameState.status = "finished";
      this.running = false;
      this.showResult(`Player ${player.id} wins!`, `Reached ${player.points} points first.`);
    }
  }

  updateUi() {
    if (!this.ui) return;
    const p1 = this.players[0];
    const p2 = this.players[1];
    if (p1) {
      const qte = p1.qte ? `QTE: ${p1.qte.sequence.join(" → ")}` : p1.rare >= 3 ? "Ready to Brew" : p1.message || "";
      this.ui.p1Text.text = `P1 ${p1.points} pts | Herbs ${p1.common} | Rare ${p1.rare} | Potions ${p1.legendary}`;
      this.ui.p1Qte.text = qte;
    }
    if (p2) {
      const qte = p2.qte ? `QTE: ${p2.qte.sequence.join(" → ")}` : p2.rare >= 3 ? "Ready to Brew" : p2.message || "";
      this.ui.p2Text.text = `P2 ${p2.points} pts | Herbs ${p2.common} | Rare ${p2.rare} | Potions ${p2.legendary}`;
      this.ui.p2Qte.text = qte;
    }
  }

  getPressedAction(input) {
    if (!input) return null;
    for (const action of ACTION_ORDER) {
      if (input[action]) return action;
    }
    return null;
  }

  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  getDebugState() {
    return {
      status: this.gameState.status,
      mode: this.gameState.mode,
      gameMode: this.gameState.gameMode,
      players: this.players.map((player) => ({
        id: player.id,
        x: Number(player.root.position.x.toFixed(2)),
        z: Number(player.root.position.z.toFixed(2)),
        points: player.points,
        common: player.common,
        rare: player.rare,
        legendary: player.legendary,
        qte: player.qte ? player.qte.sequence.join("") : null,
      })),
    };
  }
}
