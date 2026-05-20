const ctx = window.GameContext;
if (!ctx) {
  throw new Error('GameContext not found. Ensure main.js sets window.GameContext before loading the scene.');
}
const { CONFIG_FLYING: CONFIG_BASE, gameState, savedState, consumeInput, persistState, showResult, winnerDancerEl, shared } = ctx;

const CONFIG_FLYING = {
  ...CONFIG_BASE,
  gravity: 520,
  baseSpeed: 260,
  steerSpeed: 260,
  airSpeed: 240,
  dashSpeed: 260,
  dashDuration: 620,
  dashCooldown: 1500,
  treasuresToWin: 22,
  crabsToWin: 7,
  dragonsToWin: 9,
  maxTreasures: 9,
  treasureRespawnDelayMin: 900,
  treasureRespawnDelayMax: 1800,
  crabRespawnDelayMin: 1400,
  crabRespawnDelayMax: 2200,
};

export class FlyingZawgyiScene extends Phaser.Scene {
  constructor() {
    super("FlyingZawgyiScene");
    this.players = [];
    this.weatherIndex = 0;
    this.manualPaused = false;
    this.rulesActive = false;
    this.audio = null;
  }

  create() {
    shared.treasureScene = this;
    this.createTextures();
    this.createAnimations();
    this.createBackground();
    this.createWeatherSystem();
    this.createWorld();
    this.createGroups();
    this.createUi();
    this.createControls();
    this.createMusic();
    this.resetHunt("single");
    this.pauseGame();

  }

  createTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });

    const drawHeroFrame = (key, pose) => {
      const swayX = pose.swayX || 0;
      const swayY = pose.swayY || 0;
      const arm = pose.arm || 0;
      const staff = pose.staff || 0;
      const blink = pose.blink || false;
      const grin = pose.grin || 0;
      const hat = pose.hat || 0;
      graphics.clear();
      graphics.fillStyle(0x6b3a1e, 1);
      graphics.fillRect(4 + swayX, 10 + swayY - staff, 3, 30 + staff);
      graphics.fillStyle(0xf0c36a, 1);
      graphics.fillCircle(5 + swayX, 8 + swayY - staff, 4);

      graphics.fillStyle(0x6b2b20, 1);
      graphics.fillRoundedRect(6 + swayX, 16 + swayY, 20, 26, 9);
      graphics.fillStyle(0x8a3a2d, 1);
      graphics.fillRect(9 + swayX, 24 + swayY, 14, 10);

      graphics.fillStyle(0xf2c97b, 1);
      graphics.fillCircle(16 + swayX, 10 + swayY, 8);

      graphics.fillStyle(0xd24b40, 1);
      graphics.fillRoundedRect(6 + swayX + hat, 2 + swayY, 20, 6, 3);
      graphics.fillStyle(0xa83b32, 1);
      graphics.fillRect(8 + swayX + hat, 0 + swayY, 16, 3);

      graphics.fillStyle(0x4a2b12, 1);
      graphics.fillRect(10 + swayX, 8 + swayY, 4, 2);
      graphics.fillRect(18 + swayX, 8 + swayY, 4, 2);

      graphics.fillStyle(0x1f1f1f, 1);
      if (blink) {
        graphics.fillRect(10 + swayX, 11 + swayY, 5, 1);
        graphics.fillRect(18 + swayX, 11 + swayY, 5, 1);
      } else {
        graphics.fillCircle(12 + swayX, 11 + swayY, 2);
        graphics.fillCircle(20 + swayX, 11 + swayY, 2);
        graphics.fillStyle(0xf5efe2, 1);
        graphics.fillCircle(12 + swayX, 10 + swayY, 1);
        graphics.fillCircle(20 + swayX, 10 + swayY, 1);
      }

      graphics.fillStyle(0x8a3a2d, 1);
      graphics.fillRect(9 + swayX, 12 + swayY, 5, 2);
      graphics.fillRect(18 + swayX, 12 + swayY, 5, 2);

      graphics.fillStyle(0x6b2b20, 1);
      graphics.fillRoundedRect(12 + swayX, 14 + swayY + grin, 8, 2, 1);

      graphics.fillStyle(0xf2c97b, 1);
      graphics.fillRect(18 + swayX + arm, 20 + swayY, 6, 4);
      graphics.generateTexture(key, 32, 48);
    };

    drawHeroFrame("hero_idle_0", { swayX: 0, swayY: 0, arm: 0, staff: 0, grin: 0 });
    drawHeroFrame("hero_idle_1", { swayX: 1, swayY: -1, arm: 1, staff: 0, grin: 1 });
    drawHeroFrame("hero_idle_2", { swayX: -1, swayY: 1, arm: -1, staff: 0, blink: true });
    drawHeroFrame("hero_idle_3", { swayX: 0, swayY: -1, arm: 1, staff: 1, hat: 1 });

    drawHeroFrame("hero_run_0", { swayX: 2, swayY: -1, arm: 2, staff: 1, grin: 1 });
    drawHeroFrame("hero_run_1", { swayX: -2, swayY: 0, arm: -1, staff: 1, grin: 1 });
    drawHeroFrame("hero_run_2", { swayX: 1, swayY: 1, arm: 2, staff: 2, grin: 2 });
    drawHeroFrame("hero_run_3", { swayX: -1, swayY: 0, arm: 1, staff: 1, grin: 1 });

    drawHeroFrame("hero_jump", { swayX: 0, swayY: -2, arm: 2, staff: 2, grin: -1 });
    drawHeroFrame("hero_attack_0", { swayX: 2, swayY: -1, arm: 3, staff: 2, grin: 1 });
    drawHeroFrame("hero_attack_1", { swayX: 3, swayY: 0, arm: 4, staff: 2, grin: 2 });
    drawHeroFrame("hero_attack_2", { swayX: 1, swayY: 1, arm: 2, staff: 1, grin: 1 });

    graphics.clear();
    graphics.fillStyle(0xf0e2c4, 1);
    graphics.fillEllipse(17, 14, 26, 30);
    graphics.fillStyle(0xe3c993, 1);
    graphics.fillEllipse(17, 18, 20, 18);
    graphics.fillStyle(0xd2b27e, 1);
    graphics.fillCircle(12, 12, 2);
    graphics.fillCircle(20, 16, 2);
    graphics.fillCircle(18, 10, 1);
    graphics.generateTexture("creature", 34, 24);

    graphics.clear();
    graphics.fillStyle(0x7ad2b1, 1);
    graphics.fillEllipse(13, 8, 24, 14);
    graphics.fillStyle(0xf5efe2, 0.9);
    graphics.fillEllipse(10, 6, 10, 5);
    graphics.generateTexture("pill", 26, 16);

    graphics.clear();
    graphics.fillStyle(0x2b3e2a, 1);
    graphics.fillRoundedRect(0, 12, 64, 28, 12);
    graphics.fillStyle(0x365a34, 1);
    graphics.fillCircle(12, 12, 12);
    graphics.fillCircle(30, 8, 14);
    graphics.fillCircle(48, 12, 12);
    graphics.fillStyle(0x4f7a43, 1);
    graphics.fillCircle(18, 16, 10);
    graphics.fillCircle(38, 14, 11);
    graphics.fillStyle(0x1f2f20, 0.45);
    graphics.fillRoundedRect(4, 26, 56, 10, 6);
    graphics.generateTexture("bush", 64, 40);

    graphics.clear();
    graphics.fillStyle(0x5a3a22, 1);
    graphics.fillRoundedRect(20, 30, 18, 42, 8);
    graphics.fillStyle(0x3d2716, 1);
    graphics.fillRect(24, 40, 10, 12);
    graphics.fillStyle(0x2a1a10, 1);
    graphics.fillRect(26, 52, 6, 16);
    graphics.fillStyle(0x1f3d26, 1);
    graphics.fillCircle(28, 18, 24);
    graphics.fillStyle(0x2a5a35, 1);
    graphics.fillCircle(10, 22, 16);
    graphics.fillCircle(46, 22, 16);
    graphics.fillStyle(0x3f6d44, 1);
    graphics.fillCircle(20, 10, 12);
    graphics.fillCircle(38, 10, 12);
    graphics.generateTexture("tree", 56, 80);

    graphics.clear();
    graphics.fillStyle(0x4f7a48, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x3f6338, 1);
    graphics.fillRect(0, 48, 64, 16);
    graphics.generateTexture("ground", 64, 64);

    graphics.clear();
    graphics.fillStyle(0xf5efe2, 0.85);
    graphics.fillEllipse(50, 30, 90, 40);
    graphics.fillEllipse(30, 36, 60, 34);
    graphics.fillEllipse(80, 38, 50, 26);
    graphics.generateTexture("cloud", 120, 60);

    graphics.clear();
    graphics.fillStyle(0x6a5b44, 1);
    graphics.fillRect(0, 0, 128, 28);
    graphics.fillStyle(0x8a7a60, 1);
    graphics.fillRect(0, 0, 128, 4);
    graphics.generateTexture("platform", 128, 28);

    graphics.clear();
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillRoundedRect(0, 6, 26, 16, 6);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillRect(0, 12, 26, 5);
    graphics.generateTexture("treasure", 26, 22);

    graphics.clear();
    graphics.fillStyle(0x2f2a2d, 1);
    graphics.fillRoundedRect(0, 8, 28, 14, 6);
    graphics.fillStyle(0x46323a, 1);
    graphics.fillRect(2, 14, 24, 4);
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillCircle(8, 12, 3);
    graphics.fillCircle(20, 12, 3);
    graphics.fillRect(4, 6, 4, 4);
    graphics.fillRect(20, 6, 4, 4);
    graphics.generateTexture("assassin_0", 28, 22);

    graphics.clear();
    graphics.fillStyle(0x2f2a2d, 1);
    graphics.fillRoundedRect(0, 8, 28, 14, 6);
    graphics.fillStyle(0x46323a, 1);
    graphics.fillRect(2, 14, 24, 4);
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillCircle(8, 12, 3);
    graphics.fillCircle(20, 12, 3);
    graphics.fillRect(6, 6, 4, 4);
    graphics.fillRect(18, 6, 4, 4);
    graphics.generateTexture("assassin_1", 28, 22);

    graphics.clear();
    graphics.fillStyle(0x7fb5ff, 1);
    graphics.fillEllipse(12, 10, 24, 12);
    graphics.fillStyle(0x4e7bd6, 1);
    graphics.fillTriangle(4, 10, -6, 4, -6, 16);
    graphics.fillTriangle(20, 10, 34, 4, 34, 16);
    graphics.fillStyle(0xf5efe2, 1);
    graphics.fillCircle(10, 8, 2);
    graphics.fillCircle(16, 8, 2);
    graphics.generateTexture("dragon_0", 30, 18);

    graphics.clear();
    graphics.fillStyle(0x7fb5ff, 1);
    graphics.fillEllipse(12, 10, 24, 12);
    graphics.fillStyle(0x4e7bd6, 1);
    graphics.fillTriangle(6, 6, -6, 2, -2, 14);
    graphics.fillTriangle(18, 6, 32, 2, 26, 14);
    graphics.fillStyle(0xf5efe2, 1);
    graphics.fillCircle(10, 8, 2);
    graphics.fillCircle(16, 8, 2);
    graphics.generateTexture("dragon_1", 30, 18);

    graphics.clear();
    graphics.fillStyle(0xf0c36a, 0.35);
    graphics.fillCircle(30, 30, 30);
    graphics.fillStyle(0x7ad2b1, 0.25);
    graphics.fillCircle(30, 30, 20);
    graphics.generateTexture("levitate_glow", 60, 60);

    graphics.clear();
    graphics.lineStyle(4, 0xf0c36a, 0.9);
    graphics.beginPath();
    graphics.arc(18, 18, 16, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(340), false);
    graphics.strokePath();
    graphics.generateTexture("slash", 36, 36);

    graphics.clear();
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillCircle(6, 6, 6);
    graphics.fillStyle(0xfff2c5, 1);
    graphics.fillCircle(6, 6, 3);
    graphics.generateTexture("muzzle", 12, 12);

    graphics.clear();
    graphics.fillStyle(0x8ec5ff, 0.9);
    graphics.fillRect(0, 0, 3, 12);
    graphics.generateTexture("rain_drop", 3, 12);

    graphics.clear();
    graphics.fillStyle(0xf5efe2, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("spark", 8, 8);

    graphics.clear();
    graphics.lineStyle(3, 0xf0c36a, 1);
    graphics.strokeCircle(12, 12, 10);
    graphics.generateTexture("ring", 24, 24);

    graphics.clear();
    graphics.fillStyle(0xf2d7a1, 1);
    graphics.fillRect(0, 0, 512, 540);
    graphics.fillStyle(0xe8c98b, 1);
    graphics.fillRect(0, 120, 512, 140);
    graphics.fillStyle(0xdcb779, 1);
    graphics.fillRect(0, 260, 512, 140);
    graphics.fillStyle(0xbba06a, 1);
    for (let i = 0; i < 7; i += 1) {
      graphics.fillRect(0, 280 + i * 14, 512, 6);
    }
    for (let i = 0; i < 8; i += 1) {
      const baseX = 26 + i * 58;
      const baseY = 360 + (i % 3) * 10;
      const baseW = 28 + (i % 2) * 6;
      const baseH = 70 + (i % 4) * 10;
      graphics.fillStyle(0x8f6a42, 1);
      graphics.fillRect(baseX, baseY - baseH, baseW, baseH);
      graphics.fillStyle(0xb07a4f, 1);
      graphics.fillTriangle(baseX + baseW / 2, baseY - baseH - 26, baseX - 6, baseY - baseH, baseX + baseW + 6, baseY - baseH);
      graphics.fillStyle(0x6f4a30, 1);
      graphics.fillRect(baseX + 6, baseY - baseH - 30, baseW - 12, 8);
    }
    graphics.generateTexture("forest-far", 512, 540);

    graphics.clear();
    graphics.fillStyle(0xe2c789, 1);
    graphics.fillRect(0, 0, 512, 540);
    graphics.fillStyle(0xc7a567, 1);
    for (let i = 0; i < 10; i += 1) {
      graphics.fillRect(0, 280 + i * 10, 512, 4);
    }
    for (let i = 0; i < 6; i += 1) {
      const baseX = 40 + i * 74;
      const baseY = 380 + (i % 2) * 12;
      const baseW = 46 + (i % 2) * 8;
      const baseH = 100 + (i % 3) * 18;
      graphics.fillStyle(0x8c5c35, 1);
      graphics.fillRect(baseX, baseY - baseH, baseW, baseH);
      graphics.fillStyle(0xb1784a, 1);
      graphics.fillTriangle(baseX + baseW / 2, baseY - baseH - 36, baseX - 8, baseY - baseH, baseX + baseW + 8, baseY - baseH);
      graphics.fillStyle(0x6a4428, 1);
      graphics.fillRect(baseX + 10, baseY - baseH - 44, baseW - 20, 10);
      graphics.fillStyle(0x405f3b, 1);
      graphics.fillCircle(baseX - 10, baseY - baseH + 20, 14);
      graphics.fillStyle(0x335033, 1);
      graphics.fillRect(baseX - 12, baseY - baseH + 22, 6, 34);
    }
    graphics.generateTexture("forest-mid", 512, 540);

    graphics.clear();
    graphics.fillStyle(0xf7e7c1, 0.15);
    graphics.fillRect(0, 0, 512, 540);
    graphics.generateTexture("mist", 512, 540);
  }

  createAnimations() {
    if (this.anims.exists("hero-idle")) return;
    this.anims.create({
      key: "hero-idle",
      frames: [
        { key: "hero_idle_0" },
        { key: "hero_idle_1" },
        { key: "hero_idle_2" },
        { key: "hero_idle_3" },
      ],
      frameRate: 7,
      repeat: -1,
    });

    this.anims.create({
      key: "hero-run",
      frames: [
        { key: "hero_run_0" },
        { key: "hero_run_1" },
        { key: "hero_run_2" },
        { key: "hero_run_3" },
      ],
      frameRate: 12,
      repeat: -1,
    });

    this.anims.create({
      key: "hero-jump",
      frames: [{ key: "hero_jump" }],
      frameRate: 1,
    });

    this.anims.create({
      key: "hero-attack",
      frames: [
        { key: "hero_attack_0" },
        { key: "hero_attack_1" },
        { key: "hero_attack_2" },
      ],
      frameRate: 14,
      repeat: 0,
    });

    this.anims.create({
      key: "assassin-scuttle",
      frames: [
        { key: "assassin_0" },
        { key: "assassin_1" },
      ],
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "dragon-fly",
      frames: [
        { key: "dragon_0" },
        { key: "dragon_1" },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }

  createBackground() {
    const { width, height } = this.sys.game.canvas;
    this.add.rectangle(width / 2, height / 2, width, height, 0xe7c88d);

    this.bgLayers = {
      far: this.add.tileSprite(0, 0, width, height, "forest-far").setOrigin(0, 0),
      mid: this.add.tileSprite(0, 0, width, height, "forest-mid").setOrigin(0, 0),
      mist: this.add.tileSprite(0, 0, width, height, "mist").setOrigin(0, 0),
    };
    this.bgLayers.far.setAlpha(0.85);
    this.bgLayers.mid.setAlpha(0.9);
    this.bgLayers.mist.setAlpha(0.15);

    this.clouds = [];
    for (let i = 0; i < 5; i += 1) {
      const cloud = this.add.image(Phaser.Math.Between(80, width - 80), 60 + i * 24, "cloud");
      cloud.setAlpha(0.35 + i * 0.05);
      cloud.setScrollFactor(0.2);
      cloud.setDepth(2);
      this.clouds.push(cloud);
      const drift = Phaser.Math.Between(80, 160);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + drift,
        duration: Phaser.Math.Between(9000, 14000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  createWeatherSystem() {
    const { width, height } = this.sys.game.canvas;
    this.weatherOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1712, 0);
    this.weatherOverlay.setScrollFactor(0);
    this.weatherOverlay.setDepth(5);
    this.rain = null;

    this.weatherStates = [
      { name: "clear", overlay: 0x1f1a1b, overlayAlpha: 0.05, mistAlpha: 0.2, rain: false },
      { name: "mist", overlay: 0x2a1f20, overlayAlpha: 0.12, mistAlpha: 0.28, rain: false },
      { name: "dusk", overlay: 0x3b2a1a, overlayAlpha: 0.16, mistAlpha: 0.24, rain: false },
    ];

    this.applyWeather(this.weatherStates[this.weatherIndex]);
    this.time.addEvent({
      delay: 300000,
      loop: true,
      callback: () => {
        this.weatherIndex = (this.weatherIndex + 1) % this.weatherStates.length;
        this.applyWeather(this.weatherStates[this.weatherIndex]);
      },
    });
  }

  applyWeather(state) {
    if (!state) return;
    this.weatherOverlay.setFillStyle(state.overlay, state.overlayAlpha);
    if (this.bgLayers && this.bgLayers.mist) {
      this.bgLayers.mist.setAlpha(state.mistAlpha);
    }
    if (this.rain) {
      if (state.rain) {
        this.rain.start();
      } else {
        this.rain.stop();
      }
    }
  }

  createWorld() {
    this.physics.world.setBounds(0, 0, CONFIG_FLYING.world.width, CONFIG_FLYING.world.height);
    this.cameras.main.setBounds(0, 0, CONFIG_FLYING.world.width, CONFIG_FLYING.world.height);

    this.ground = this.physics.add.staticImage(CONFIG_FLYING.world.width / 2, CONFIG_FLYING.world.height - 80, "ground");
    this.ground.setDisplaySize(CONFIG_FLYING.world.width, 160);
    this.ground.refreshBody();
    this.groundTop = CONFIG_FLYING.world.height - 160;

    this.platforms = this.physics.add.staticGroup();
    const platformData = [
      { x: 420, y: CONFIG_FLYING.world.height - 220, w: 220 },
      { x: 920, y: CONFIG_FLYING.world.height - 320, w: 260 },
      { x: 1400, y: CONFIG_FLYING.world.height - 260, w: 240 },
      { x: 1780, y: CONFIG_FLYING.world.height - 360, w: 220 },
      { x: 2140, y: CONFIG_FLYING.world.height - 240, w: 220 },
      { x: 2520, y: CONFIG_FLYING.world.height - 320, w: 240 },
      { x: 2880, y: CONFIG_FLYING.world.height - 260, w: 220 },
    ];
    this.platformSpots = platformData.map((platform) => ({ x: platform.x, y: platform.y - 20 }));
    platformData.forEach((platform) => {
      const block = this.platforms.create(platform.x, platform.y, "platform");
      block.setDisplaySize(platform.w, 28);
      block.refreshBody();
    });

    this.treasureSpots = [
      { x: 360, y: CONFIG_FLYING.world.height - 260 },
      { x: 620, y: CONFIG_FLYING.world.height - 140 },
      { x: 920, y: CONFIG_FLYING.world.height - 360 },
      { x: 1180, y: CONFIG_FLYING.world.height - 220 },
      { x: 1400, y: CONFIG_FLYING.world.height - 290 },
      { x: 1640, y: CONFIG_FLYING.world.height - 180 },
      { x: 1800, y: CONFIG_FLYING.world.height - 410 },
      { x: 2020, y: CONFIG_FLYING.world.height - 260 },
      { x: 2280, y: CONFIG_FLYING.world.height - 360 },
      { x: 2520, y: CONFIG_FLYING.world.height - 220 },
      { x: 2760, y: CONFIG_FLYING.world.height - 310 },
      { x: 3020, y: CONFIG_FLYING.world.height - 420 },
    ];

    this.waterZones = null;
    this.waterVisuals = [];
  }

  createGroups() {
    this.creatures = this.physics.add.staticGroup();
    this.obstacles = this.physics.add.staticGroup();
    this.treasures = this.physics.add.staticGroup();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.crabs = this.physics.add.group({ allowGravity: false });
    this.dragons = this.physics.add.group({ allowGravity: false });
    this.fish = this.physics.add.group({ allowGravity: false });
  }

  createUi() {
    const { width } = this.sys.game.canvas;
    this.countdownText = this.add.text(width / 2, 140, "", {
      fontFamily: "Cinzel",
      fontSize: "64px",
      color: "#f0c36a",
    });
    this.countdownText.setOrigin(0.5, 0.5);
    this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(10);

    this.scoreText = this.add.text(24, 24, "", {
      fontFamily: "Barlow",
      fontSize: "16px",
      color: "#f5efe2",
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(10);

    this.soundButton = this.add.text(width - 130, 24, "MUTE", {
      fontFamily: "Barlow",
      fontSize: "14px",
      color: "#f0c36a",
      backgroundColor: "rgba(15, 23, 18, 0.65)",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });
    this.soundButton.setOrigin(1, 0);
    this.soundButton.setScrollFactor(0);
    this.soundButton.setDepth(12);
    this.soundButton.setInteractive({ useHandCursor: true });
    this.soundButton.on("pointerdown", () => this.toggleMute());

    this.pauseButton = this.add.text(width - 24, 24, "PAUSE", {
      fontFamily: "Barlow",
      fontSize: "14px",
      color: "#f0c36a",
      backgroundColor: "rgba(15, 23, 18, 0.65)",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    });
    this.pauseButton.setOrigin(1, 0);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setDepth(12);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerdown", () => this.togglePause());

    this.pauseOverlay = this.add.container(0, 0).setDepth(15).setVisible(false);
    const pauseShade = this.add.rectangle(480, 270, 960, 540, 0x0f1712, 0.45).setScrollFactor(0);
    const pauseTitle = this.add.text(480, 260, "Paused", {
      fontFamily: "Cinzel",
      fontSize: "36px",
      color: "#f0c36a",
      stroke: "#0f1712",
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    const pauseHint = this.add.text(480, 308, "Tap PAUSE or press Space to resume", {
      fontFamily: "Barlow",
      fontSize: "16px",
      color: "#f5efe2",
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    this.pauseOverlay.add([pauseShade, pauseTitle, pauseHint]);

    this.rulesLayer = this.add.container(0, 0).setDepth(20).setVisible(false);
    const rulesShade = this.add.rectangle(480, 270, 960, 540, 0x0f1712, 0.75).setScrollFactor(0);
    const rulesPanel = this.add.rectangle(480, 270, 640, 360, 0x16241a, 0.95).setScrollFactor(0);
    rulesPanel.setStrokeStyle(2, 0xf0c36a, 0.6);
    const rulesTitle = this.add.text(480, 150, "Zaw_The_Legend", {
      fontFamily: "Cinzel",
      fontSize: "30px",
      color: "#f0c36a",
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    const rulesSub = this.add.text(480, 185, "ဇော်ဂျီ ဒဏ္ဍာရီ", {
      fontFamily: "Noto Sans Myanmar",
      fontSize: "16px",
      color: "#f5efe2",
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    const rulesBody = this.add.text(480, 252,
      `Rules\\n• Collect ${CONFIG_FLYING.treasuresToWin} treasures + ${CONFIG_FLYING.crabsToWin} assassins + ${CONFIG_FLYING.dragonsToWin} dragons\\n• A Levitate (jump/float)\\n• B Staff Strike (stun hazards)\\n• C Alchemic Pill (shoot)\\n• D Dash (burst speed)\\n\\nမြန်မာ\\n• ရတနာ ${CONFIG_FLYING.treasuresToWin} + သတ်သမား ${CONFIG_FLYING.crabsToWin} + နဂါး ${CONFIG_FLYING.dragonsToWin} လက်ခံရင် အနိုင်\\n• A အာကာသသျှောင် (လေထဲပျံ)\\n• B တုတ်နဲ့ထိုး\\n• C ဆေးလုံးပစ်\\n• D မြန်တက်`,
      {
        fontFamily: "Barlow, Noto Sans Myanmar",
        fontSize: "15px",
        color: "#f5efe2",
        align: "center",
        wordWrap: { width: 560 },
      }
    ).setOrigin(0.5, 0.5).setScrollFactor(0);
    const rulesStart = this.add.text(480, 360, "Press Space to begin", {
      fontFamily: "Barlow",
      fontSize: "14px",
      color: "#f0c36a",
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    this.rulesLayer.add([rulesShade, rulesPanel, rulesTitle, rulesSub, rulesBody, rulesStart]);
    rulesShade.setInteractive({ useHandCursor: true });
    rulesPanel.setInteractive({ useHandCursor: true });
    rulesShade.on("pointerdown", () => this.handleRulesStart());
    rulesPanel.on("pointerdown", () => this.handleRulesStart());

    this.celebrationLayer = this.add.container(0, 0).setDepth(20).setVisible(false);
    this.celebrationShade = this.add.rectangle(480, 270, 960, 540, 0x0f1712, 0.65);
    this.celebrationShade.setScrollFactor(0);
    this.celebrationTitle = this.add.text(480, 210, "", {
      fontFamily: "Cinzel",
      fontSize: "42px",
      color: "#f0c36a",
      stroke: "#0f1712",
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    this.celebrationSubtitle = this.add.text(480, 260, "Relic claimed!", {
      fontFamily: "Barlow",
      fontSize: "18px",
      color: "#f5efe2",
    }).setOrigin(0.5, 0.5).setScrollFactor(0);
    this.celebrationLayer.add([this.celebrationShade, this.celebrationTitle, this.celebrationSubtitle]);
  }

  createControls() {
    this.keys = this.input.keyboard.addKeys({
      p1Jump: "W",
      p1Attack: "F",
      p1Skill: "R",
      p1Dash: "SHIFT",
      p1Left: "A",
      p1Right: "D",
      p2Jump: "UP",
      p2Attack: "L",
      p2Skill: "O",
      p2Dash: "ENTER",
      p2Left: "LEFT",
      p2Right: "RIGHT",
    });

    this.input.keyboard.on("keydown-F", () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    this.input.keyboard.on("keydown-P", () => {
      this.togglePause();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.rulesActive) {
        this.handleRulesStart();
      } else {
        this.togglePause();
      }
    });

    if (!this.boundSpaceHandler) {
      this.boundSpaceHandler = (event) => {
        if (event.code !== "Space") return;
        event.preventDefault();
        if (this.rulesActive) {
          this.handleRulesStart();
        } else {
          this.togglePause();
        }
      };
      window.addEventListener("keydown", this.boundSpaceHandler);
      this.events.once("shutdown", () => {
        window.removeEventListener("keydown", this.boundSpaceHandler);
        this.boundSpaceHandler = null;
      });
    }
  }

  createMusic() {
    const muted = localStorage.getItem("zaw-legend-muted") === "1";
    this.audio = {
      ctx: null,
      masterGain: null,
      musicGain: null,
      sfxGain: null,
      timer: null,
      step: 0,
      started: false,
      muted,
    };
    if (this.soundButton) {
      this.soundButton.setText(muted ? "UNMUTE" : "MUTE");
    }
  }

  ensureAudio() {
    if (!this.audio) this.createMusic();
    if (this.audio.started && this.audio.ctx) return this.audio.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.value = this.audio.muted ? 0 : 0.35;
    masterGain.connect(ctx.destination);

    const musicGain = ctx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(masterGain);

    const sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.2;
    sfxGain.connect(masterGain);

    this.audio.ctx = ctx;
    this.audio.masterGain = masterGain;
    this.audio.musicGain = musicGain;
    this.audio.sfxGain = sfxGain;
    this.audio.started = true;

    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  startMusic() {
    if (this.audio?.timer) return;
    const ctx = this.ensureAudio();
    if (!ctx) return;

    const melody = [
      659.25, 783.99, 659.25, 523.25,
      587.33, 0, 659.25, 880.0,
      783.99, 659.25, 587.33, 523.25,
      493.88, 587.33, 0, 783.99,
    ];
    const bass = [130.81, 146.83, 164.81, 174.61];

    const playNote = (freq, length, type, volume) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(volume, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, now + length);
      osc.connect(env);
      env.connect(this.audio.musicGain);
      osc.start(now);
      osc.stop(now + length + 0.02);
    };

    const tick = () => {
      if (ctx.state !== "running") return;
      const step = this.audio.step;
      const lead = melody[step % melody.length];
      if (lead > 0) {
        const wobble = step % 4 === 0 ? 1.05 : 0.97;
        playNote(lead * wobble, 0.16, "triangle", 0.2);
        if (step % 3 === 0) {
          playNote(lead * 1.5, 0.08, "square", 0.06);
        }
      }
      if (step % 4 === 0) {
        playNote(bass[(step / 4) % bass.length], 0.26, "sine", 0.1);
      }
      if (step % 8 === 4) {
        // goofy "boing"
        playNote(lead > 0 ? lead * 2.1 : 880, 0.12, "sawtooth", 0.05);
      }
      this.audio.step += 1;
    };

    this.audio.timer = setInterval(tick, 180);
  }

  playSfx(type) {
    const ctx = this.ensureAudio();
    if (!ctx || !this.audio?.sfxGain) return;
    const now = ctx.currentTime;
    if (type === "shoot") {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.2, now + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(env);
      env.connect(this.audio.sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  }

  toggleMute() {
    if (!this.audio) this.createMusic();
    this.audio.muted = !this.audio.muted;
    localStorage.setItem("zaw-legend-muted", this.audio.muted ? "1" : "0");
    if (this.audio.masterGain) {
      this.audio.masterGain.gain.value = this.audio.muted ? 0 : 0.35;
    }
    if (this.soundButton) {
      this.soundButton.setText(this.audio.muted ? "UNMUTE" : "MUTE");
    }
    if (!this.audio.muted && this.audio.ctx?.state === "suspended") {
      this.audio.ctx.resume();
    }
  }

  pauseGame() {
    this.physics.world.isPaused = true;
  }

  resumeGame() {
    if (this.manualPaused) return;
    this.physics.world.isPaused = false;
  }

  togglePause() {
    if (this.rulesActive || gameState.status === "countdown" || gameState.status === "finished") return;
    if (this.manualPaused) {
      this.manualPaused = false;
      this.pauseOverlay.setVisible(false);
      this.pauseButton.setText("PAUSE");
      gameState.status = "playing";
      this.physics.world.isPaused = false;
      this.time.timeScale = 1;
      this.anims.resumeAll();
      this.tweens.resumeAll();
      if (this.audio?.ctx && this.audio.ctx.state === "suspended") {
        this.audio.ctx.resume();
      }
    } else if (gameState.status === "playing") {
      this.manualPaused = true;
      this.pauseOverlay.setVisible(true);
      this.pauseButton.setText("PLAY");
      gameState.status = "paused";
      this.physics.world.isPaused = true;
      this.time.timeScale = 0;
      this.anims.pauseAll();
      this.tweens.pauseAll();
      if (this.audio?.ctx && this.audio.ctx.state === "running") {
        this.audio.ctx.suspend();
      }
    }
  }

  showRules() {
    this.rulesActive = true;
    if (this.rulesLayer) this.rulesLayer.setVisible(true);
    gameState.status = "rules";
    this.pauseGame();
  }

  handleRulesStart() {
    if (!this.rulesActive) return;
    this.rulesActive = false;
    if (this.rulesLayer) this.rulesLayer.setVisible(false);
    gameState.status = "countdown";
    this.startMusic();
    this.showCountdown();
  }

  resetHunt(mode) {
    this.clearGroups();
    this.setupPlayers(mode);
    this.spawnCreatures();
    this.spawnObstacles();
    this.spawnCrabs();
    this.spawnDragons();
    this.spawnFish();
    this.spawnInitialTreasures();
    this.updateScoreHud();
    if (this.celebrationLayer) {
      this.celebrationLayer.setVisible(false);
    }
  }

  clearGroups() {
    this.creatures.clear(true, true);
    this.obstacles.clear(true, true);
    this.treasures.clear(true, true);
    this.projectiles.clear(true, true);
    if (this.crabs) this.crabs.clear(true, true);
    if (this.dragons) this.dragons.clear(true, true);
    if (this.fish) this.fish.clear(true, true);
    this.players.forEach((player) => {
      player.sprite.destroy();
      if (player.label) player.label.destroy();
      if (player.glow) player.glow.destroy();
    });
    this.players = [];
  }

  startHunt(mode) {
    this.resetHunt(mode);
    gameState.status = "countdown";
    gameState.winner = null;
    this.manualPaused = false;
    if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
    if (this.pauseButton) this.pauseButton.setText("PAUSE");
    this.time.timeScale = 1;
    this.anims.resumeAll();
    this.tweens.resumeAll();
    this.showRules();
  }

  showCountdown() {
    const steps = ["3", "2", "1", "GO"];
    let index = 0;
    this.countdownText.setScale(1);
    this.countdownText.setAlpha(1);
    this.countdownText.setText(steps[index]);
    this.pauseGame();

    this.time.addEvent({
      delay: CONFIG_FLYING.countdownStep,
      repeat: steps.length - 1,
      callback: () => {
        index += 1;
        this.countdownText.setText(steps[index]);
        if (steps[index] === "GO") {
          this.countdownText.setScale(1.1);
        }
        if (index === steps.length - 1) {
          this.time.delayedCall(CONFIG_FLYING.countdownStep, () => {
            this.countdownText.setText("");
            gameState.status = "playing";
            this.resumeGame();
          });
        }
      },
    });
  }

  setupPlayers(mode) {
    const player1 = this.createPlayer(1, 120, CONFIG_FLYING.world.height - 200, 0xf0c36a, false);
    const player2 = this.createPlayer(2, 200, CONFIG_FLYING.world.height - 200, 0x7ad2b1, mode === "single");

    this.players = [player1, player2];

    this.players.forEach((player) => {
      this.physics.add.collider(player.sprite, this.ground);
      this.physics.add.collider(player.sprite, this.platforms);
      this.physics.add.collider(player.sprite, this.obstacles);
      this.physics.add.collider(player.sprite, this.creatures);
      this.physics.add.overlap(player.sprite, this.crabs, this.handleCrabOverlap, null, this);
      this.physics.add.overlap(player.sprite, this.dragons, this.handleDragonOverlap, null, this);
      this.physics.add.overlap(player.sprite, this.fish, this.handleFishOverlap, null, this);
      player.sprite.setDragX(CONFIG_FLYING.groundDrag);
    });

    this.physics.add.overlap(player1.sprite, this.treasures, this.handleTreasurePickup, null, this);
    this.physics.add.overlap(player2.sprite, this.treasures, this.handleTreasurePickup, null, this);
    this.physics.add.overlap(this.projectiles, this.creatures, this.handleProjectileCreatureHit, null, this);
    this.physics.add.overlap(this.projectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.overlap(this.projectiles, this.crabs, this.handleProjectileCrabHit, null, this);
    this.physics.add.overlap(this.projectiles, this.dragons, this.handleProjectileDragonHit, null, this);
    this.physics.add.overlap(this.projectiles, this.fish, this.handleProjectileFishHit, null, this);
    this.physics.add.overlap(this.projectiles, player1.sprite, this.handleProjectilePlayerHit, null, this);
    this.physics.add.overlap(this.projectiles, player2.sprite, this.handleProjectilePlayerHit, null, this);
  }

  createPlayer(id, x, y, tint, ai) {
    const sprite = this.physics.add.sprite(x, y, "hero_idle_0");
    sprite.setTint(tint);
    sprite.setCollideWorldBounds(true);
    sprite.body.setSize(18, 34).setOffset(7, 12);
    const glow = this.add.image(sprite.x, sprite.y + 10, "levitate_glow");
    glow.setAlpha(0);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setScale(0.8);
    glow.setDepth(-1);
    const label = this.add.text(sprite.x, sprite.y - 40, `P${id}`, {
      fontFamily: "Barlow",
      fontSize: "14px",
      color: "#f5efe2",
      stroke: "#0f1712",
      strokeThickness: 3,
    });
    label.setOrigin(0.5, 1);

    return {
      id,
      sprite,
      label,
      glow,
      baseTint: tint,
      ai,
      treasures: 0,
      crabs: 0,
      dragons: 0,
      aimX: 1,
      aimY: 0,
      boostUntil: 0,
      slowUntil: 0,
      stunUntil: 0,
      stunTween: null,
      finishTime: null,
      dashUntil: 0,
      dashCooldown: 0,
      attackUntil: 0,
      levitateUntil: 0,
      levitateCooldown: 0,
      pillCooldown: 0,
      finished: false,
    };
  }

  spawnCreatures() {
    const positions = [
      { x: 560, y: CONFIG_FLYING.world.height - 140 },
      { x: 960, y: CONFIG_FLYING.world.height - 360 },
      { x: 1360, y: CONFIG_FLYING.world.height - 220 },
      { x: 1750, y: CONFIG_FLYING.world.height - 420 },
      { x: 2180, y: CONFIG_FLYING.world.height - 180 },
      { x: 2580, y: CONFIG_FLYING.world.height - 340 },
      { x: 3000, y: CONFIG_FLYING.world.height - 260 },
    ];
    positions.forEach((pos) => this.creatures.create(pos.x, pos.y, "creature"));
  }

  spawnObstacles() {
    const groundY = this.groundTop + 12;
    const positions = [
      { x: 740, y: groundY, type: "bush" },
      { x: 1160, y: groundY, type: "tree" },
      { x: 1560, y: groundY, type: "bush" },
      { x: 1980, y: groundY, type: "tree" },
      { x: 2360, y: groundY, type: "bush" },
      { x: 2760, y: groundY, type: "tree" },
    ];
    positions.forEach((pos) => {
      const obstacle = this.obstacles.create(pos.x, pos.y, pos.type);
      if (pos.type === "tree") {
        obstacle.setOrigin(0.5, 1);
        obstacle.body.setSize(36, 48).setOffset(10, 24);
      } else {
        obstacle.setOrigin(0.5, 0.7);
        obstacle.body.setSize(40, 20).setOffset(12, 18);
      }
    });
  }

  spawnCrabs() {
    for (let i = 0; i < 4; i += 1) {
      const crab = this.crabs.create(0, 0, "assassin_0");
      crab.setOrigin(0.5, 1);
      crab.setImmovable(true);
      crab.body.setSize(22, 14).setOffset(3, 6);
      this.resetCrab(crab);
      crab.play("assassin-scuttle");
    }
  }

  resetCrab(crab) {
    const groundY = this.groundTop;
    const laneX = Phaser.Math.Between(220, CONFIG_FLYING.world.width - 220);
    const range = Phaser.Math.Between(220, 320);
    crab.x = laneX;
    crab.y = groundY;
    crab.setData("left", laneX - range * 0.5);
    crab.setData("right", laneX + range * 0.5);
    crab.setData("dir", Math.random() > 0.5 ? 1 : -1);
    crab.setData("speed", Phaser.Math.Between(50, 80));
    if (crab.body && crab.body.updateFromGameObject) {
      crab.body.updateFromGameObject();
    }
  }

  spawnDragons() {
    const heights = [
      CONFIG_FLYING.world.height - 520,
      CONFIG_FLYING.world.height - 420,
      CONFIG_FLYING.world.height - 360,
    ];
    const positions = [
      { x: 740, y: heights[0], range: 240 },
      { x: 1520, y: heights[1], range: 300 },
      { x: 2380, y: heights[2], range: 280 },
    ];

    positions.forEach((pos) => {
      const dragon = this.dragons.create(pos.x, pos.y, "dragon_0");
      dragon.setOrigin(0.5, 0.5);
      dragon.setImmovable(true);
      dragon.setData("left", pos.x - pos.range * 0.5);
      dragon.setData("right", pos.x + pos.range * 0.5);
      dragon.setData("dir", Math.random() > 0.5 ? 1 : -1);
      dragon.setData("speed", Phaser.Math.Between(60, 90));
      dragon.setData("baseY", pos.y);
      dragon.setData("t", Math.random() * Math.PI * 2);
      dragon.play("dragon-fly");
    });
  }

  spawnFish() {
    const lanes = [
      { x: 620, y: this.groundTop - 120, range: 220 },
      { x: 1480, y: this.groundTop - 160, range: 260 },
      { x: 2280, y: this.groundTop - 140, range: 240 },
      { x: 2860, y: this.groundTop - 180, range: 220 },
    ];
    lanes.forEach((lane) => {
      const fish = this.fish.create(lane.x, lane.y, "dragon_0");
      fish.setScale(0.85);
      fish.clearTint();
      fish.setData("left", lane.x - lane.range * 0.5);
      fish.setData("right", lane.x + lane.range * 0.5);
      fish.setData("dir", Math.random() > 0.5 ? 1 : -1);
      fish.setData("speed", Phaser.Math.Between(70, 100));
      fish.setData("baseY", lane.y);
      fish.setData("t", Math.random() * Math.PI * 2);
      fish.play("dragon-fly");
    });
  }

  spawnInitialTreasures() {
    const count = Math.min(CONFIG_FLYING.maxTreasures, this.treasureSpots.length);
    for (let i = 0; i < count; i += 1) {
      this.spawnTreasure();
    }
  }

  spawnTreasure() {
    if (!this.treasureSpots || !this.treasureSpots.length) return;
    const attempts = 10;
    for (let i = 0; i < attempts; i += 1) {
      let x = 0;
      let y = 0;
      const usePlatform = this.platformSpots && this.platformSpots.length && Math.random() < 0.55;
      if (usePlatform) {
        const spot = this.platformSpots[Math.floor(Math.random() * this.platformSpots.length)];
        x = Phaser.Math.Clamp(spot.x + Phaser.Math.Between(-60, 60), 80, CONFIG_FLYING.world.width - 80);
        y = Phaser.Math.Clamp(spot.y + Phaser.Math.Between(-20, 20), 120, this.groundTop - 80);
      } else {
        x = Phaser.Math.Between(100, CONFIG_FLYING.world.width - 100);
        y = Phaser.Math.Clamp(this.groundTop - Phaser.Math.Between(40, 140), 140, this.groundTop - 40);
      }

      const tooCloseToTreasure = this.treasures.getChildren().some((treasure) => {
        return Phaser.Math.Distance.Between(x, y, treasure.x, treasure.y) < 90;
      });
      if (tooCloseToTreasure) continue;

      const tooCloseToPlayer = this.players.some((player) => {
        return Phaser.Math.Distance.Between(x, y, player.sprite.x, player.sprite.y) < 120;
      });
      if (tooCloseToPlayer) continue;

      this.treasures.create(x, y, "treasure");
      return;
    }

    const fallbackX = Phaser.Math.Between(120, CONFIG_FLYING.world.width - 120);
    const fallbackY = Phaser.Math.Clamp(this.groundTop - 80, 140, this.groundTop - 40);
    this.treasures.create(fallbackX, fallbackY, "treasure");
  }

  update(time, delta) {
    if (gameState.status !== "playing") return;

    this.players.forEach((player) => {
      if (player.finished) return;
      if (time < player.stunUntil) {
        this.applyStunMovement(player);
      } else {
        const input = player.ai ? this.runAi(player) : this.collectInput(player.id);
        this.updateAim(player, input);
        this.updateWaterState(player);
        this.applyInput(player, input);
        this.applyMovement(player, time, delta, input);
      }
      this.updatePlayerAnimation(player);
      this.updateLabel(player);
      this.checkVictory(player);
    });

    this.updateCrabs(delta);
    this.updateDragons(delta);
    this.updateFish(delta);
    this.enforceTether();
    this.updateProjectiles(delta);
    this.cleanupProjectiles();
    this.updateCamera();
    this.updateParallax();
  }

  updateCrabs(delta) {
    if (!this.crabs) return;
    this.crabs.getChildren().forEach((crab) => {
      if (!crab.active) return;
      if (this.isHazardDisabled(crab)) return;
      const dir = crab.getData("dir");
      const speed = crab.getData("speed");
      crab.x += dir * (speed * delta) / 1000;
      if (crab.x < crab.getData("left")) {
        crab.setData("dir", 1);
        crab.setFlipX(false);
      }
      if (crab.x > crab.getData("right")) {
        crab.setData("dir", -1);
        crab.setFlipX(true);
      }
    });
  }

  updateDragons(delta) {
    if (!this.dragons) return;
    this.dragons.getChildren().forEach((dragon) => {
      if (!dragon.active) return;
      if (this.isHazardDisabled(dragon)) return;
      const dir = dragon.getData("dir");
      const speed = dragon.getData("speed");
      dragon.x += dir * (speed * delta) / 1000;
      const t = dragon.getData("t") + 0.02;
      dragon.setData("t", t);
      const bob = Math.sin(t) * 10;
      dragon.y = dragon.getData("baseY") + bob;

      if (dragon.x < dragon.getData("left")) {
        dragon.setData("dir", 1);
        dragon.setFlipX(false);
      }
      if (dragon.x > dragon.getData("right")) {
        dragon.setData("dir", -1);
        dragon.setFlipX(true);
      }
    });
  }

  updateFish(delta) {
    if (!this.fish) return;
    this.fish.getChildren().forEach((fish) => {
      if (!fish.active) return;
      if (this.isHazardDisabled(fish)) return;
      const dir = fish.getData("dir");
      const speed = fish.getData("speed");
      fish.x += dir * (speed * delta) / 1000;
      const t = fish.getData("t") + 0.025;
      fish.setData("t", t);
      const bob = Math.sin(t) * 6;
      fish.y = fish.getData("baseY") + bob;

      if (fish.x < fish.getData("left")) {
        fish.setData("dir", 1);
        fish.setFlipX(false);
      }
      if (fish.x > fish.getData("right")) {
        fish.setData("dir", -1);
        fish.setFlipX(true);
      }
    });
  }

  updateProjectiles(delta) {
    this.projectiles.getChildren().forEach((pill) => {
      if (!pill.active) return;
      const t = (pill.getData("wobble") || 0) + delta * 0.008;
      pill.setData("wobble", t);
      const dirX = pill.getData("dirX") ?? 1;
      const dirY = pill.getData("dirY") ?? 0;
      const perpX = -dirY;
      const perpY = dirX;
      const prevOffset = pill.getData("wobbleOffset") || 0;
      const offset = Math.sin(t) * 3;
      pill.x += (offset - prevOffset) * perpX;
      pill.y += (offset - prevOffset) * perpY;
      pill.setData("wobbleOffset", offset);
    });
  }

  enforceTether() {
    if (this.players.length < 2) return;
    const [p1, p2] = this.players;
    const dx = p2.sprite.x - p1.sprite.x;
    const dy = p2.sprite.y - p1.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= CONFIG_FLYING.maxSeparation) return;
    const excess = dist - CONFIG_FLYING.maxSeparation;
    const pull = Math.min(160, excess * 0.5);
    const nx = dx / dist;
    const ny = dy / dist;
    p1.sprite.body.velocity.x += nx * pull;
    p1.sprite.body.velocity.y += ny * pull * 0.6;
    p2.sprite.body.velocity.x -= nx * pull;
    p2.sprite.body.velocity.y -= ny * pull * 0.6;
  }

  collectInput(playerId) {
    const network = consumeInput(playerId);
    const keyboard = {
      jump: Phaser.Input.Keyboard.JustDown(playerId === 1 ? this.keys.p1Jump : this.keys.p2Jump),
      attack: Phaser.Input.Keyboard.JustDown(playerId === 1 ? this.keys.p1Attack : this.keys.p2Attack),
      skill: Phaser.Input.Keyboard.JustDown(playerId === 1 ? this.keys.p1Skill : this.keys.p2Skill),
      dash: Phaser.Input.Keyboard.JustDown(playerId === 1 ? this.keys.p1Dash : this.keys.p2Dash),
      moveX:
        (playerId === 1 ? (this.keys.p1Right.isDown ? 1 : 0) - (this.keys.p1Left.isDown ? 1 : 0)
          : (this.keys.p2Right.isDown ? 1 : 0) - (this.keys.p2Left.isDown ? 1 : 0)),
      moveY: 0,
    };

    return {
      jump: network.jump || keyboard.jump,
      attack: network.attack || keyboard.attack,
      skill: network.skill || keyboard.skill,
      dash: network.dash || keyboard.dash,
      moveX: Math.abs(network.moveX) > 0.05 ? network.moveX : keyboard.moveX,
      moveY: Math.abs(network.moveY) > 0.05 ? network.moveY : keyboard.moveY,
    };
  }

  applyInput(player, input) {
    if (input.jump) this.doLevitate(player);
    if (input.attack) this.doAttack(player);
    if (input.skill) this.doPill(player);
    if (input.dash) this.doDash(player);
  }

  doLevitate(player) {
    const now = this.time.now;
    if (now < player.levitateCooldown) return;

    player.levitateUntil = now + CONFIG_FLYING.levitateDuration;
    player.levitateCooldown = now + CONFIG_FLYING.levitateCooldown;

    const body = player.sprite.body;
    if (body.blocked.down) {
      body.setVelocityY(CONFIG_FLYING.jumpVelocity);
    } else {
      body.setVelocityY(Math.min(body.velocity.y, CONFIG_FLYING.jumpVelocity * 0.6));
    }
  }

  doAttack(player) {
    player.attackUntil = this.time.now + CONFIG_FLYING.attackWindow;
    this.tryAttackHit(player);
    const facing = player.sprite.flipX ? -1 : 1;
    const slash = this.add.image(player.sprite.x + facing * 22, player.sprite.y - 8, "slash");
    slash.setScale(0.8);
    slash.setRotation(facing < 0 ? Math.PI : 0);
    slash.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scale: 1.4,
      duration: 180,
      onComplete: () => slash.destroy(),
    });
  }

  doPill(player) {
    if (this.time.now < player.pillCooldown) return;
    if (!player.sprite.anims.isPlaying || player.sprite.anims.currentAnim?.key !== "hero-attack") {
      player.sprite.play("hero-attack", true);
    }
    const pill = this.projectiles.create(player.sprite.x, player.sprite.y - 8, "pill");
    const aimMag = Math.hypot(player.aimX || 0, player.aimY || 0);
    let aimX = aimMag > 0.1 ? player.aimX / aimMag : player.sprite.flipX ? -1 : 1;
    let aimY = aimMag > 0.1 ? player.aimY / aimMag : 0;
    const assisted = this.getAimAssist(player, aimX, aimY);
    aimX = assisted.x;
    aimY = assisted.y;
    const speed = CONFIG_FLYING.pillSpeed;
    pill.x += aimX * 22;
    pill.y += aimY * 10;
    pill.setVelocity(aimX * speed, aimY * speed);
    pill.setScale(1.2);
    pill.body.setSize(18, 10, true);
    pill.setTint(player.sprite.tintTopLeft);
    pill.setData("owner", player.id);
    pill.setAngle(Phaser.Math.RadToDeg(Math.atan2(aimY, aimX)));
    pill.setData("baseY", pill.y);
    pill.setData("wobble", Math.random() * Math.PI * 2);
    pill.setData("dirX", aimX);
    pill.setData("dirY", aimY);
    const trail = this.add.particles(0, 0, "spark", {
      follow: pill,
      speed: 0,
      lifespan: { min: 200, max: 420 },
      scale: { start: 0.6, end: 0 },
      quantity: 1,
      frequency: 40,
      blendMode: "ADD",
    });
    const pulseTween = this.tweens.add({
      targets: pill,
      scale: 1.45,
      yoyo: true,
      repeat: -1,
      duration: 160,
    });
    pill.setData("trail", trail);
    pill.setData("pulseTween", pulseTween);
    const muzzle = this.add.image(player.sprite.x + aimX * 18, player.sprite.y - 8, "muzzle");
    muzzle.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: muzzle,
      alpha: 0,
      scale: 2.1,
      duration: 120,
      onComplete: () => muzzle.destroy(),
    });
    this.tweens.add({
      targets: player.sprite,
      x: player.sprite.x - aimX * 6,
      y: player.sprite.y - aimY * 4,
      duration: 80,
      yoyo: true,
    });
    this.playSfx("shoot");
    player.pillCooldown = this.time.now + CONFIG_FLYING.pillCooldown;
  }

  getAimAssist(player, aimX, aimY) {
    const range = CONFIG_FLYING.pillAimAssistRange || 0;
    if (!range) return { x: aimX, y: aimY };
    const base = new Phaser.Math.Vector2(aimX, aimY);
    if (base.lengthSq() < 0.01) {
      base.set(player.sprite.flipX ? -1 : 1, 0);
    }
    base.normalize();
    const minDot = Math.cos(Phaser.Math.DegToRad(CONFIG_FLYING.pillAimAssistAngle || 50));
    const targets = [
      ...this.crabs.getChildren(),
      ...this.dragons.getChildren(),
      ...this.fish.getChildren(),
      ...this.creatures.getChildren(),
      ...this.obstacles.getChildren(),
    ];
    let best = null;
    let bestDist = range;
    targets.forEach((target) => {
      if (!target.active) return;
      const dx = target.x - player.sprite.x;
      const dy = target.y - player.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range) return;
      const dir = new Phaser.Math.Vector2(dx, dy).normalize();
      const dot = base.dot(dir);
      if (dot < minDot) return;
      if (dist < bestDist) {
        bestDist = dist;
        best = dir;
      }
    });
    if (best) return { x: best.x, y: best.y };
    return { x: base.x, y: base.y };
  }

  doDash(player) {
    const now = this.time.now;
    if (now < player.dashCooldown) return;
    player.dashUntil = now + CONFIG_FLYING.dashDuration;
    player.dashCooldown = now + CONFIG_FLYING.dashCooldown;
  }

  tryAttackHit(player) {
    const range = 80;
    const hitCreature = this.findTargetInRange(this.creatures, player, range, 50);

    if (hitCreature) {
      this.applyHazardHit(hitCreature, 3000, "melee", player);
      this.applyBoost(player);
    }

    const hitObstacle = this.findTargetInRange(this.obstacles, player, range, 60);

    if (hitObstacle) {
      this.applyHazardHit(hitObstacle, 3000, "melee", player);
      this.applyBoost(player);
    }

    const hitCrab = this.findTargetInRange(this.crabs, player, range, 50);
    if (hitCrab) {
      this.applyHazardHit(hitCrab, 3000, "melee", player, "crab");
      this.applyBoost(player);
    }

    const hitDragon = this.findTargetInRange(this.dragons, player, range + 20, 70);
    if (hitDragon) {
      this.applyHazardHit(hitDragon, 3000, "melee", player, "dragon");
      this.applyBoost(player);
    }
  }

  handleTreasurePickup(playerSprite, treasure) {
    const player = this.players.find((p) => p.sprite === playerSprite);
    if (!player || !treasure.active) return;
    treasure.destroy();
    player.treasures += 1;
    this.updateScoreHud();
    this.maybeDeclareWinner();

    if (gameState.status === "playing") {
      const delay = Phaser.Math.Between(CONFIG_FLYING.treasureRespawnDelayMin, CONFIG_FLYING.treasureRespawnDelayMax);
      this.time.delayedCall(delay, () => {
        if (gameState.status !== "playing") return;
        if (this.treasures.countActive(true) < CONFIG_FLYING.maxTreasures) {
          this.spawnTreasure();
        }
      });
    }
  }

  handleProjectileCreatureHit(pill, creature) {
    const ownerId = pill.getData("owner");
    const player = this.players.find((p) => p.id === ownerId);
    if (creature.active && !this.isHazardDisabled(creature)) {
      this.applyHazardHit(creature, 2200, "gun", player);
    }
    this.destroyProjectile(pill);
    if (player) this.applyBoost(player);
  }

  handleProjectileObstacleHit(pill, obstacle) {
    if (!obstacle.active || this.isHazardDisabled(obstacle)) return;
    const ownerId = pill.getData("owner");
    const player = this.players.find((p) => p.id === ownerId);
    this.applyHazardHit(obstacle, 2200, "gun", player);
    this.destroyProjectile(pill);
  }

  handleProjectileCrabHit(pill, crab) {
    if (!crab.active || this.isHazardDisabled(crab)) return;
    const ownerId = pill.getData("owner");
    const player = this.players.find((p) => p.id === ownerId);
    this.applyHazardHit(crab, 2200, "gun", player, "crab");
    this.destroyProjectile(pill);
  }

  handleProjectileDragonHit(pill, dragon) {
    if (!dragon.active || this.isHazardDisabled(dragon)) return;
    const ownerId = pill.getData("owner");
    const player = this.players.find((p) => p.id === ownerId);
    this.applyHazardHit(dragon, 2200, "gun", player, "dragon");
    this.destroyProjectile(pill);
  }

  handleProjectileFishHit(pill, fish) {
    if (!fish.active || this.isHazardDisabled(fish)) return;
    const ownerId = pill.getData("owner");
    const player = this.players.find((p) => p.id === ownerId);
    this.applyHazardHit(fish, 2200, "gun", player, "dragon");
    this.destroyProjectile(pill);
  }

  handleProjectilePlayerHit(pill, target) {
    const ownerId = pill.getData("owner");
    const player = this.players.find((p) => p.sprite === target);
    if (!player || player.id === ownerId) return;
    this.destroyProjectile(pill);
    this.applyStun(player);
    this.applySlow(player, CONFIG_FLYING.pillSlowDuration);
  }

  handleCrabOverlap(playerSprite, crab) {
    const player = this.players.find((p) => p.sprite === playerSprite);
    if (!player || !crab.active) return;
    if (this.isHazardDisabled(crab)) return;
    if (this.time.now < player.stunUntil) return;
    this.applyStun(player, CONFIG_FLYING.crabStunDuration);
  }

  handleDragonOverlap(playerSprite, dragon) {
    const player = this.players.find((p) => p.sprite === playerSprite);
    if (!player || !dragon.active) return;
    if (this.isHazardDisabled(dragon)) return;
    if (this.time.now < player.stunUntil) return;
    this.applyStun(player, CONFIG_FLYING.crabStunDuration);
  }

  handleFishOverlap(playerSprite, fish) {
    const player = this.players.find((p) => p.sprite === playerSprite);
    if (!player || !fish.active) return;
    if (this.isHazardDisabled(fish)) return;
    if (this.time.now < player.stunUntil) return;
    this.applyStun(player, CONFIG_FLYING.crabStunDuration);
  }

  applyBoost(player) {
    player.boostUntil = this.time.now + CONFIG_FLYING.creatureBoost;
  }

  applySlow(player, duration) {
    player.slowUntil = this.time.now + duration;
  }

  applyStun(player, duration = CONFIG_FLYING.stunDuration) {
    const now = this.time.now;
    player.stunUntil = now + duration;
    player.sprite.setTint(player.baseTint);
    if (player.stunTween) {
      player.stunTween.stop();
    }
    player.stunTween = this.tweens.add({
      targets: player.sprite,
      alpha: 0.35,
      yoyo: true,
      repeat: 5,
      duration: 100,
      onComplete: () => {
        if (this.time.now >= player.stunUntil) {
          player.sprite.setAlpha(1);
          player.sprite.setTint(player.baseTint);
        }
      },
    });

    if (player.dizzyTrail) {
      player.dizzyTrail.destroy();
    }
    player.dizzyTrail = this.add.particles(0, 0, "spark", {
      follow: player.sprite,
      followOffset: { x: 0, y: -30 },
      speed: 0,
      lifespan: { min: 250, max: 500 },
      scale: { start: 0.6, end: 0 },
      quantity: 1,
      frequency: 60,
      blendMode: "ADD",
    });
    this.time.delayedCall(duration, () => {
      if (player.dizzyTrail) {
        player.dizzyTrail.destroy();
        player.dizzyTrail = null;
      }
    });
  }

  findTargetInRange(group, player, range, yRange) {
    if (!group) return null;
    const candidates = group.getChildren();
    return candidates.find((target) => {
      if (!target.active) return false;
      if (this.isHazardDisabled(target)) return false;
      const dx = target.x - player.sprite.x;
      const dy = Math.abs(target.y - player.sprite.y);
      return dx > -20 && dx < range && dy < yRange;
    });
  }

  isHazardDisabled(target) {
    return target.getData("disabledUntil") && target.getData("disabledUntil") > this.time.now;
  }

  applyHazardHit(target, duration, mode, attacker, hazardType) {
    if (!target || !target.active) return;
    const now = this.time.now;
    if (hazardType === "crab") {
      if (attacker) this.awardHazardHit(attacker, hazardType);
      const respawnDelay = Phaser.Math.Between(CONFIG_FLYING.crabRespawnDelayMin, CONFIG_FLYING.crabRespawnDelayMax);
      target.setData("disabledUntil", now + respawnDelay);
      target.setVisible(false);
      target.setActive(false);
      if (target.body) target.body.enable = false;
      this.time.delayedCall(respawnDelay, () => {
        if (!target) return;
        this.resetCrab(target);
        target.setActive(true);
        target.setVisible(true);
        target.clearTint();
        target.setAlpha(1);
        target.setAngle(0);
        target.setData("disabledUntil", 0);
        if (target.body) {
          target.body.enable = true;
          if (target.body.updateFromGameObject) {
            target.body.updateFromGameObject();
          }
        }
        if (target.anims) {
          target.anims.resume();
        }
      });
      return;
    }
    target.setData("disabledUntil", now + duration);
    target.setData("disabledMode", mode);
    if (target.body) target.body.enable = false;
    target.setAlpha(0.7);
    const tint = mode === "melee" ? 0xf0c36a : 0x7ad2b1;
    target.setTint(tint);
    if (attacker && hazardType) {
      this.awardHazardHit(attacker, hazardType);
    }
    if (target.anims) {
      target.anims.pause();
    }
    if (target.body && target.body.setVelocity) {
      target.body.setVelocity(0, 0);
    }
    const spin = this.tweens.add({
      targets: target,
      angle: { from: -8, to: 8 },
      yoyo: true,
      repeat: 6,
      duration: 90,
    });
    target.setData("spin", spin);
    this.time.delayedCall(duration, () => {
      if (!target.active) return;
      target.clearTint();
      target.setAlpha(1);
      target.setAngle(0);
      if (target.body) {
        target.body.enable = true;
        if (target.body.updateFromGameObject) {
          target.body.updateFromGameObject();
        }
      }
      if (target.anims) {
        target.anims.resume();
      }
      const stored = target.getData("spin");
      if (stored) stored.stop();
      target.setData("disabledUntil", 0);
    });
  }

  awardHazardHit(player, hazardType) {
    if (!player) return;
    if (hazardType === "crab") {
      player.crabs += 1;
    }
    if (hazardType === "dragon") {
      player.dragons += 1;
    }
    this.updateScoreHud();
    this.maybeDeclareWinner();
  }

  applyMovement(player, time, delta, input) {
    const body = player.sprite.body;
    const boost = time < player.boostUntil ? CONFIG_FLYING.baseSpeed * 0.35 : 0;
    const slow = time < player.slowUntil ? CONFIG_FLYING.slowPenalty : 0;
    const dash = time < player.dashUntil ? CONFIG_FLYING.dashSpeed : 0;
    if (player.inWater) {
      const waterSpeed = CONFIG_FLYING.airSpeed * 0.8 + boost - slow;
      body.setVelocityX((input.moveX || 0) * waterSpeed);
      body.setVelocityY((input.moveY || 0) * waterSpeed);
      body.setGravityY(0);
      return;
    }
    const isAir = !body.blocked.down;
    const speed = (isAir ? CONFIG_FLYING.airSpeed : CONFIG_FLYING.steerSpeed) + boost + dash - slow;
    const targetVelX = Phaser.Math.Clamp(input.moveX, -1, 1) * speed;

    if (Math.abs(input.moveX) > 0.05) {
      body.setVelocityX(targetVelX);
    } else {
      body.setVelocityX(Phaser.Math.Linear(body.velocity.x, 0, 0.12));
    }

    if (time < player.levitateUntil) {
      body.setGravityY(CONFIG_FLYING.levitateGravityOffset);
      const lift = (input.moveY || 0) * CONFIG_FLYING.levitateLift * (delta * 0.6);
      const nextY = Phaser.Math.Clamp(body.velocity.y + lift, -CONFIG_FLYING.levitateMaxUp, CONFIG_FLYING.levitateMaxDown);
      body.setVelocityY(nextY);
    } else {
      body.setGravityY(0);
    }
  }

  updateWaterState(player) {
    if (!this.waterZones) {
      player.inWater = false;
      return;
    }
    let inWater = false;
    this.physics.overlap(player.sprite, this.waterZones, () => {
      inWater = true;
    });
    player.inWater = inWater;
  }

  applyStunMovement(player) {
    const body = player.sprite.body;
    body.setVelocityX(0);
    if (body.blocked.down) {
      body.setVelocityY(0);
    }
  }

  updatePlayerAnimation(player) {
    const body = player.sprite.body;
    if (!body) return;
    if (this.time.now < player.attackUntil) {
      if (!player.sprite.anims.isPlaying || player.sprite.anims.currentAnim?.key !== "hero-attack") {
        player.sprite.play("hero-attack", true);
      }
    } else if (!body.blocked.down) {
      player.sprite.play("hero-jump", true);
    } else if (Math.abs(body.velocity.x) > 15) {
      player.sprite.play("hero-run", true);
    } else {
      player.sprite.play("hero-idle", true);
    }

    if (body.velocity.x < -5) player.sprite.setFlipX(true);
    if (body.velocity.x > 5) player.sprite.setFlipX(false);

    const airborne = !body.blocked.down;
    player.sprite.setScale(1, 1);

    if (player.glow) {
      const levitating = this.time.now < player.levitateUntil;
      const watery = player.inWater;
      const glowAlpha = levitating ? 0.85 : airborne ? 0.55 : watery ? 0.35 : 0;
      player.glow.setAlpha(glowAlpha);
      player.glow.setVisible(glowAlpha > 0.02);
      player.glow.x = player.sprite.x;
      player.glow.y = player.sprite.y + 18;
    }
  }

  updateAim(player, input) {
    const mag = Math.hypot(input.moveX || 0, input.moveY || 0);
    if (mag > 0.12) {
      player.aimX = (input.moveX || 0) / mag;
      player.aimY = (input.moveY || 0) / mag;
      return;
    }
    if (player.inWater && Math.abs(input.moveY || 0) > 0.1) {
      player.aimX = 0;
      player.aimY = input.moveY > 0 ? 1 : -1;
      return;
    }
    if (Math.abs(player.sprite.body.velocity.x) > 4) {
      player.aimX = player.sprite.body.velocity.x > 0 ? 1 : -1;
      player.aimY = 0;
      return;
    }
    if (player.aimX === 0 && player.aimY === 0) {
      player.aimX = player.sprite.flipX ? -1 : 1;
      player.aimY = 0;
    }
  }

  updateLabel(player) {
    if (!player.label) return;
    player.label.x = player.sprite.x;
    player.label.y = player.sprite.y - 36;
  }

  runAi(player) {
    const remainingTreasures = this.treasures.getChildren();
    if (!remainingTreasures.length) return { jump: false, attack: false, skill: false, dash: false, moveX: 0, moveY: 0 };

    const target = remainingTreasures.reduce((closest, treasure) => {
      if (!closest) return treasure;
      const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, treasure.x, treasure.y);
      const closestDist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, closest.x, closest.y);
      return dist < closestDist ? treasure : closest;
    }, null);

    const moveX = target.x > player.sprite.x + 20 ? 1 : target.x < player.sprite.x - 20 ? -1 : 0;
    const moveY = target.y < player.sprite.y - 40 ? -0.8 : 0.4;

    if (target.y < player.sprite.y - 60 && player.sprite.body.blocked.down) {
      this.doLevitate(player);
    }

    if (Math.random() < 0.02) this.doAttack(player);
    if (Math.random() < 0.01) this.doPill(player);

    return { jump: false, attack: false, skill: false, dash: false, moveX, moveY };
  }

  updateScoreHud() {
    const p1 = this.players[0];
    const p2 = this.players[1];
    this.scoreText.setText(
      `Relic Quest • ${CONFIG_FLYING.treasuresToWin} treasure + ${CONFIG_FLYING.crabsToWin} assassins + ${CONFIG_FLYING.dragonsToWin} dragons\n` +
      `P1: ${p1 ? p1.treasures : 0}T ${p1 ? p1.crabs : 0}A ${p1 ? p1.dragons : 0}D  |  ` +
      `P2: ${p2 ? p2.treasures : 0}T ${p2 ? p2.crabs : 0}A ${p2 ? p2.dragons : 0}D\n` +
      `Wins P1: ${savedState.wins[1]}  |  Wins P2: ${savedState.wins[2]}`
    );
  }

  cleanupProjectiles() {
    this.projectiles.getChildren().forEach((pill) => {
      if (pill.x > CONFIG_FLYING.world.width || pill.x < 0 || pill.y < 0 || pill.y > CONFIG_FLYING.world.height) {
        this.destroyProjectile(pill);
      }
    });
  }

  destroyProjectile(pill) {
    if (!pill || !pill.active) return;
    const trail = pill.getData("trail");
    const pulseTween = pill.getData("pulseTween");
    if (pulseTween) pulseTween.stop();
    if (trail) trail.destroy();
    pill.destroy();
  }

  updateCamera() {
    if (!this.players.length) return;
    const xs = this.players.map((player) => player.sprite.x);
    const ys = this.players.map((player) => player.sprite.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = Math.max(320, maxX - minX + CONFIG_FLYING.cameraPaddingX);
    const height = Math.max(220, maxY - minY + CONFIG_FLYING.cameraPaddingY);

    const zoomX = 960 / width;
    const zoomY = 540 / height;
    const targetZoom = Phaser.Math.Clamp(Math.min(zoomX, zoomY), CONFIG_FLYING.cameraZoomMin, CONFIG_FLYING.cameraZoomMax);

    const targetX = Phaser.Math.Clamp(centerX - 480 / targetZoom, 0, CONFIG_FLYING.world.width - 960 / targetZoom);
    const targetY = Phaser.Math.Clamp(centerY - 270 / targetZoom, 0, CONFIG_FLYING.world.height - 540 / targetZoom);

    this.cameras.main.zoom = Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, 0.08);
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX, 0.08);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.08);
  }

  updateParallax() {
    const camX = this.cameras.main.scrollX;
    if (!this.bgLayers) return;
    this.bgLayers.far.tilePositionX = camX * 0.2;
    this.bgLayers.mid.tilePositionX = camX * 0.45;
    this.bgLayers.mist.tilePositionX = camX * 0.3;
  }

  checkVictory(player) {
    if (player.finished) return;
    this.maybeDeclareWinner();
  }

  maybeDeclareWinner() {
    if (gameState.winner) return;
    const reached = this.players.filter((player) => this.playerMeetsGoal(player));
    if (!reached.length) return;

    reached.forEach((player) => {
      if (!player.finishTime) {
        player.finishTime = this.time.now;
      }
    });

    const winner = reached.reduce((best, player) => {
      if (!best) return player;
      if (player.finishTime < best.finishTime) return player;
      if (player.finishTime === best.finishTime && player.treasures > best.treasures) return player;
      if (player.finishTime === best.finishTime && player.treasures === best.treasures && player.id < best.id) return player;
      return best;
    }, null);

    if (winner) this.declareWinner(winner);
  }

  playerMeetsGoal(player) {
    return player.treasures >= CONFIG_FLYING.treasuresToWin &&
      player.crabs >= CONFIG_FLYING.crabsToWin &&
      player.dragons >= CONFIG_FLYING.dragonsToWin;
  }

  declareWinner(player) {
    if (gameState.winner) return;
    player.finished = true;
    gameState.winner = player.id;
    gameState.status = "finished";
    this.manualPaused = false;
    if (this.pauseOverlay) this.pauseOverlay.setVisible(false);
    if (this.pauseButton) this.pauseButton.setText("PAUSE");
    this.time.timeScale = 1;
    this.anims.resumeAll();
    this.tweens.resumeAll();
    savedState.wins[player.id] += 1;
    persistState();
    this.pauseGame();
    if (winnerDancerEl) {
      winnerDancerEl.classList.toggle("winner-p2", player.id === 2);
    }
    const p1 = this.players[0];
    const p2 = this.players[1];
    const p1Score = p1 ? `${p1.treasures}T ${p1.crabs}A ${p1.dragons}D` : "0";
    const p2Score = p2 ? `${p2.treasures}T ${p2.crabs}A ${p2.dragons}D` : "0";
    this.playCelebration(player, p1Score, p2Score);
    this.time.delayedCall(900, () => {
      showResult(
        `Player ${player.id} claims the relic crown!`,
        `Final score — P1: ${p1Score}  |  P2: ${p2Score}`
      );
    });
  }

  playCelebration(player, p1Score, p2Score) {
    if (!this.celebrationLayer) return;
    this.celebrationTitle.setText(`Player ${player.id} Wins!`);
    this.celebrationSubtitle.setText(`Relic claimed • P1 ${p1Score} / P2 ${p2Score}`);
    this.celebrationLayer.setVisible(true);
    this.celebrationLayer.setAlpha(0);
    this.celebrationLayer.setScale(0.95);
    this.tweens.add({
      targets: this.celebrationLayer,
      alpha: 1,
      scale: 1,
      duration: 320,
      ease: "Back.Out",
    });

    const burst = this.add.particles(player.sprite.x, player.sprite.y - 30, "spark", {
      speed: { min: 80, max: 240 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 600, max: 1200 },
      gravityY: 420,
      scale: { start: 1.2, end: 0 },
      quantity: 24,
      blendMode: "ADD",
    });

    this.time.delayedCall(1200, () => burst.destroy());

    const rain = this.add.particles(480, -20, "spark", {
      speedY: { min: 120, max: 260 },
      speedX: { min: -40, max: 40 },
      lifespan: { min: 900, max: 1400 },
      scale: { start: 0.8, end: 0 },
      quantity: 4,
      frequency: 80,
      gravityY: 260,
      emitZone: { source: new Phaser.Geom.Rectangle(0, 0, 960, 40), type: "random" },
      blendMode: "ADD",
    });
    this.time.delayedCall(1200, () => rain.destroy());

    for (let i = 0; i < 6; i += 1) {
      const ring = this.add.image(player.sprite.x, player.sprite.y - 30, "ring");
      ring.setAlpha(0.8);
      this.tweens.add({
        targets: ring,
        scale: 2.2,
        alpha: 0,
        duration: 700,
        ease: "Cubic.Out",
        delay: i * 80,
        onComplete: () => ring.destroy(),
      });
    }
  }
}
