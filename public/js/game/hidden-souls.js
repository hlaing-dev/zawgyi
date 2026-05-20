const ctx = window.GameContext;
if (!ctx) {
  throw new Error("GameContext not found. Ensure main.js sets window.GameContext before loading the scene.");
}
const { gameState, consumeInput, showResult, shared } = ctx;

const SOULS_CONFIG = {
  worldWidth: 1200,
  worldHeight: 700,
  groundY: 520,
  speed: 260,
  jumpVelocity: -460,
  gravity: 900,
  dashSpeed: 520,
  dashDuration: 160,
  dashCooldown: 900,
  relicSpeed: 420,
  relicStunDuration: 2400,
  relicRespawnDelay: 1000,
  relicCatchRadius: 28,
  flowerMinY: 90,
  flowerMaxY: 280,
  flowerCount: 6,
  tether: {
    safe: 220,
    warn: 380,
    danger: 520,
    break: 620,
  },
  doubleFireWindow: 420,
  relicsToBoss: 7,
  bossHitsToWin: 3,
  bossBackRadius: 28,
  bossHitCooldown: 900,
  hazardCount: 4,
};

const SOULS_TEXT = {
  en: {
    title: "Hidden Souls · Twin Shadows",
    hint: "Trap the flying flower with your tether, then both light it (X). Goal: 7 flowers. Avoid danger mushrooms.",
    relics: (count, goal) => `Flowers: ${count}/${goal}`,
    tetherSafe: "Tether: Strong",
    tetherWarn: "Tether: Stretching",
    tetherDanger: "Tether: Fragile",
    tetherBroken: "Tether: Broken — Reunite!",
    stunned: "Flower stunned! Both press X.",
    collected: "Flower secured!",
    hazardHit: "Danger mushroom hit! Lost a flower.",
    boss: "Stone Guardian awakened! Cut its back with the tether.",
    unleash: "UNLEASH!",
  },
  my: {
    title: "ဝိညာဉ်အဖော် · အရိပ်အဖော်",
    hint: "ကြိုးတန်းနဲ့ ပျံသန်းပန်းကို ဖမ်းပြီး X ကို အတူနှိပ်ပါ။ ပန်း ၇ ခု ရယူရမယ်။ အန္တရာယ် မုရမောက်ကို ရှောင်ပါ။",
    relics: (count, goal) => `ပန်း: ${count}/${goal}`,
    tetherSafe: "ကြိုးတန်း: သန်မာ",
    tetherWarn: "ကြိုးတန်း: ဆွဲကာလ",
    tetherDanger: "ကြိုးတန်း: ပျက်လို့နီး",
    tetherBroken: "ကြိုးတန်း: ပျက်နေ — ပြန်နီးပါ!",
    stunned: "ပန်းတိတ်! X ကို အတူနှိပ်ပါ။",
    collected: "ပန်း ရပြီး!",
    hazardHit: "အန္တရာယ် မုရမောက် ထိမိပြီး ပန်း ၁ ခု လျော့သွားသည်။",
    boss: "ကျောက်ကာကွယ်သူ ပေါ်လာပြီ! ကြိုးတန်းနဲ့ နောက်ဘက်ကို ဖြတ်ပါ။",
    unleash: "အင်အားဖြင့် တိုက်!",
  },
};

export class HiddenSoulsScene extends Phaser.Scene {
  constructor() {
    super("HiddenSoulsScene");
    this.players = [];
    this.flowers = [];
    this.hazards = [];
    this.relicsCaught = 0;
    this.tetherState = "safe";
    this.tetherBroken = false;
    this.tetherGraphics = null;
    this.boss = null;
    this.bossCore = null;
    this.bossHits = 0;
    this.lastBossHitAt = 0;
    this.lang = "en";
    this.audio = null;
    this.musicStarted = false;
  }

  create() {
    shared.hiddenSoulsScene = this;
    this.physics.world.gravity.y = SOULS_CONFIG.gravity;
    this.lang = window.GameContext?.language || "en";

    this.createTextures();
    this.createWorld();
    this.createPlayers();
    this.createFlowers();
    this.createHazards();
    this.createBoss();
    this.createUi();

    this.tetherGraphics = this.add.graphics();
    this.tetherGraphics.setDepth(40);
    this.tetherGraphics.setBlendMode(Phaser.BlendModes.ADD);
    this.chainOffset = 0;
    this.setupCamera();

    this.handleLangChange = (event) => {
      if (!event?.detail?.lang) return;
      this.lang = event.detail.lang;
      this.applyLanguage();
    };
    window.addEventListener("zaw-lang-change", this.handleLangChange);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("zaw-lang-change", this.handleLangChange);
    });

    gameState.status = "playing";
    gameState.winner = null;
    this.startMusic();
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

    graphics.clear();
    graphics.fillStyle(0xf6e7b0, 1);
    graphics.fillCircle(16, 16, 11);
    graphics.fillStyle(0x7ad2b1, 0.98);
    graphics.fillCircle(16, 6, 6);
    graphics.fillCircle(6, 18, 6);
    graphics.fillCircle(26, 18, 6);
    graphics.fillStyle(0xfff6df, 0.8);
    graphics.fillCircle(12, 14, 2);
    graphics.fillCircle(20, 18, 2);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillCircle(16, 16, 3);
    graphics.generateTexture("soul_flower", 32, 32);

    graphics.clear();
    graphics.fillStyle(0x37433c, 1);
    graphics.fillRoundedRect(0, 0, 80, 80, 16);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillCircle(40, 26, 10);
    graphics.fillStyle(0x5b6b63, 1);
    graphics.fillRoundedRect(18, 48, 44, 18, 8);
    graphics.generateTexture("stone_guardian", 80, 80);

    graphics.clear();
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("guardian_core", 16, 16);

    graphics.clear();
    graphics.fillStyle(0x2e5b42, 1);
    graphics.fillRect(0, 0, 64, 32);
    graphics.fillStyle(0x3e7a55, 1);
    graphics.fillRect(0, 0, 64, 8);
    graphics.fillStyle(0x2a4a37, 0.7);
    graphics.fillRect(0, 18, 64, 3);
    graphics.fillRect(0, 24, 64, 3);
    graphics.generateTexture("souls_ground", 64, 32);

    graphics.clear();
    graphics.fillStyle(0x3d2a1e, 1);
    graphics.fillCircle(16, 20, 14);
    graphics.fillStyle(0xc94040, 1);
    graphics.fillCircle(16, 12, 10);
    graphics.fillStyle(0xfff5e2, 1);
    graphics.fillCircle(12, 10, 2);
    graphics.fillCircle(20, 14, 2);
    graphics.fillStyle(0x7a1414, 0.6);
    graphics.fillCircle(16, 12, 4);
    graphics.generateTexture("danger_mushroom", 32, 32);
  }

  createWorld() {
    this.physics.world.setBounds(0, 0, SOULS_CONFIG.worldWidth, SOULS_CONFIG.worldHeight);
    this.cameras.main.setBackgroundColor(0x182024);
    this.add.rectangle(
      SOULS_CONFIG.worldWidth / 2,
      SOULS_CONFIG.worldHeight / 2,
      SOULS_CONFIG.worldWidth,
      SOULS_CONFIG.worldHeight,
      0x1b242a,
      1
    );
    this.add.rectangle(
      SOULS_CONFIG.worldWidth / 2,
      SOULS_CONFIG.groundY - 160,
      SOULS_CONFIG.worldWidth,
      140,
      0x202b31,
      0.8
    );
    for (let i = 0; i < 6; i += 1) {
      const block = this.add.rectangle(160 + i * 160, 140 + (i % 2) * 30, 70, 36, 0x2c353b, 0.5);
      block.setStrokeStyle(1, 0x3b464e, 0.5);
    }

    this.ground = this.physics.add.staticImage(
      SOULS_CONFIG.worldWidth / 2,
      SOULS_CONFIG.groundY + 16,
      "souls_ground"
    );
    this.ground.setScale(SOULS_CONFIG.worldWidth / 64, 1).refreshBody();

    this.cameras.main.setBounds(0, 0, SOULS_CONFIG.worldWidth, SOULS_CONFIG.worldHeight);
  }

  createPlayers() {
    const centerX = SOULS_CONFIG.worldWidth / 2;
    const createPlayer = (id, x, tint) => {
      const sprite = this.physics.add.sprite(x, SOULS_CONFIG.groundY - 60, "hero_idle_0");
      sprite.setCollideWorldBounds(true);
      sprite.setScale(1.15);
      sprite.setDrag(700, 0);
      sprite.setMaxVelocity(SOULS_CONFIG.speed * 1.4, SOULS_CONFIG.speed * 1.4);
      sprite.setTint(tint);
      sprite.setDepth(15);
      const glow = this.add.circle(sprite.x, sprite.y - 10, 26, tint, 0.18);
      glow.setDepth(14);
      const label = this.add.text(sprite.x, sprite.y - 50, `P${id}`, {
        fontFamily: "Barlow, sans-serif",
        fontSize: "14px",
        color: "#f5efe2",
        stroke: "#0f1712",
        strokeThickness: 3,
      }).setOrigin(0.5, 1);
      this.physics.add.collider(sprite, this.ground);
      return {
        id,
        sprite,
        label,
        glow,
        facing: 1,
        lastFireAt: 0,
        jumpCount: 0,
        dashUntil: 0,
        dashCooldownUntil: 0,
      };
    };

    this.players = [
      createPlayer(1, centerX - 140, 0xf0c36a),
      createPlayer(2, centerX + 140, 0x7ad2b1),
    ];
  }

  createFlowers() {
    this.flowers = [];
    for (let i = 0; i < SOULS_CONFIG.flowerCount; i += 1) {
      const flower = this.physics.add.sprite(0, 0, "soul_flower");
      flower.setScale(1.2);
      flower.setDepth(20);
      flower.setCircle(14);
      flower.setBounce(1, 1);
      flower.setCollideWorldBounds(true);
      flower.body.allowGravity = false;
      flower.entangled = false;
      flower.stunnedUntil = 0;
      flower.respawnAt = 0;
      this.placeFlower(flower, true);
      this.flowers.push(flower);
    }
  }

  createHazards() {
    this.hazards = [];
    for (let i = 0; i < SOULS_CONFIG.hazardCount; i += 1) {
      const mushroom = this.physics.add.sprite(0, 0, "danger_mushroom");
      mushroom.setScale(1.1);
      mushroom.setCircle(12);
      mushroom.setBounce(1, 1);
      mushroom.setCollideWorldBounds(true);
      mushroom.body.allowGravity = false;
      mushroom.active = true;
      this.placeHazard(mushroom, true);
      this.hazards.push(mushroom);
    }
  }

  createBoss() {
    this.boss = this.physics.add.staticImage(SOULS_CONFIG.worldWidth / 2, SOULS_CONFIG.groundY - 120, "stone_guardian");
    this.boss.setVisible(false);
    this.boss.body.enable = false;

    this.bossCore = this.physics.add.staticImage(this.boss.x, this.boss.y, "guardian_core");
    this.bossCore.setVisible(false);
    this.bossCore.body.enable = false;
  }

  createUi() {
    this.titleText = this.add.text(24, 18, "", {
      fontFamily: "Cinzel, serif",
      fontSize: "16px",
      color: "#f5efe2",
    }).setScrollFactor(0).setDepth(50);

    this.hintText = this.add.text(24, 40, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#b4a48d",
    }).setScrollFactor(0).setDepth(50);

    this.relicText = this.add.text(24, 60, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#b4a48d",
    }).setScrollFactor(0).setDepth(50);

    this.tetherText = this.add.text(24, 80, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#7ad2b1",
    }).setScrollFactor(0).setDepth(50);

    this.statusText = this.add.text(24, 104, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#f0c36a",
    }).setScrollFactor(0).setDepth(50).setAlpha(0);

    this.applyLanguage();
  }

  applyLanguage() {
    const text = SOULS_TEXT[this.lang] || SOULS_TEXT.en;
    if (this.titleText) this.titleText.setText(text.title);
    if (this.hintText) this.hintText.setText(text.hint);
    if (this.relicText) this.relicText.setText(text.relics(this.relicsCaught, SOULS_CONFIG.relicsToBoss));
  }

  update(time) {
    if (gameState.status !== "playing") return;

    this.handlePlayers();
    this.updateTether();
    this.updateFlowers();
    this.updateHazards();
    this.updateBoss();
    this.updateUi();
  }

  handlePlayers() {
    this.players.forEach((player) => {
      const input = consumeInput(player.id);
      const now = this.time.now;

      if (player.sprite.body.blocked.down) {
        player.jumpCount = 0;
      }

      const moveX = input.moveX || 0;
      if (Math.abs(moveX) > 0.1) {
        player.facing = moveX > 0 ? 1 : -1;
      }

      if (now > player.dashUntil) {
        player.sprite.body.setVelocityX(moveX * SOULS_CONFIG.speed);
      }

      if (input.a && player.jumpCount < 2) {
        player.sprite.body.setVelocityY(SOULS_CONFIG.jumpVelocity);
        player.jumpCount += 1;
      }

      if (input.y && now > player.dashCooldownUntil) {
        player.dashUntil = now + SOULS_CONFIG.dashDuration;
        player.dashCooldownUntil = now + SOULS_CONFIG.dashCooldown;
        const dashDir = Math.abs(moveX) > 0.1 ? Math.sign(moveX) : player.facing;
        player.sprite.body.setVelocityX(dashDir * SOULS_CONFIG.dashSpeed);
      }

      if (input.x) {
        player.lastFireAt = now;
      }

      if (input.b) {
        this.staffPulse(player);
      }

      if (player.label) {
        player.label.setPosition(player.sprite.x, player.sprite.y - 50);
      }
      if (player.glow) {
        player.glow.setPosition(player.sprite.x, player.sprite.y - 10);
      }
    });
  }

  staffPulse(player) {
    const pulse = this.add.circle(player.sprite.x, player.sprite.y - 10, 34, 0xf0c36a, 0.25);
    pulse.setDepth(45);
    this.tweens.add({
      targets: pulse,
      scale: 2,
      alpha: 0,
      duration: 380,
      ease: "Sine.easeOut",
      onComplete: () => pulse.destroy(),
    });
  }

  updateTether() {
    const [p1, p2] = this.players;
    const dist = Phaser.Math.Distance.Between(p1.sprite.x, p1.sprite.y, p2.sprite.x, p2.sprite.y);

    if (dist <= SOULS_CONFIG.tether.safe) {
      this.tetherState = "safe";
    } else if (dist <= SOULS_CONFIG.tether.warn) {
      this.tetherState = "warn";
    } else if (dist <= SOULS_CONFIG.tether.danger) {
      this.tetherState = "danger";
    } else {
      this.tetherState = "broken";
    }

    this.tetherBroken = this.tetherState === "broken";

    const colors = {
      safe: 0x7ad2b1,
      warn: 0xf0c36a,
      danger: 0xe06b5b,
      broken: 0x5b5b5b,
    };

    this.tetherGraphics.clear();
    const alpha = this.tetherBroken ? 0.25 : 0.95;
    const color = colors[this.tetherState];
    const amplitude = this.tetherBroken ? 0 : (this.tetherState === "safe" ? 6 : this.tetherState === "warn" ? 9 : 12);
    const segments = 18;
    const x1 = p1.sprite.x;
    const y1 = p1.sprite.y - 10;
    const x2 = p2.sprite.x;
    const y2 = p2.sprite.y - 10;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    this.chainOffset = (this.chainOffset + 0.05) % 1;

    this.tetherGraphics.lineStyle(8, color, alpha);
    this.tetherGraphics.beginPath();
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const wave = Math.sin(t * Math.PI * 2 + this.chainOffset * 6) * amplitude;
      const px = x1 + dx * t + nx * wave;
      const py = y1 + dy * t + ny * wave;
      if (i === 0) {
        this.tetherGraphics.moveTo(px, py);
      } else {
        this.tetherGraphics.lineTo(px, py);
      }
    }
    this.tetherGraphics.strokePath();

    if (!this.tetherBroken) {
      this.tetherGraphics.lineStyle(2, 0xffffff, 0.25);
      this.tetherGraphics.beginPath();
      this.tetherGraphics.moveTo(x1, y1);
      this.tetherGraphics.lineTo(x2, y2);
      this.tetherGraphics.strokePath();
    }
  }

  updateHazards() {
    if (!this.hazards.length) return;
    if (this.tetherBroken) {
      this.hazards.forEach((hazard) => {
        hazard.setVisible(true);
        hazard.setAlpha(0.2);
        hazard.body.enable = false;
      });
      return;
    }

    const [p1, p2] = this.players;
    this.hazards.forEach((hazard) => {
      if (!hazard.visible) {
        this.placeHazard(hazard, false);
      }
      if (hazard.alpha < 1) {
        hazard.setAlpha(1);
      }
      if (!hazard.body.enable) {
        hazard.body.enable = true;
      }

      const dist = this.distanceToSegment(
        hazard.x,
        hazard.y,
        p1.sprite.x,
        p1.sprite.y - 10,
        p2.sprite.x,
        p2.sprite.y - 10
      );

      if (dist <= SOULS_CONFIG.relicCatchRadius) {
        this.triggerHazard(hazard);
      }
    });
  }

  triggerHazard(hazard) {
    hazard.setVisible(false);
    hazard.body.enable = false;
    this.relicsCaught = Math.max(0, this.relicsCaught - 1);
    this.flashStatus(this.getText().hazardHit);
    this.time.delayedCall(1000, () => {
      this.placeHazard(hazard, false);
    });
  }

  updateFlowers() {
    if (!this.flowers.length) return;

    if (this.tetherBroken) {
      this.flowers.forEach((flower) => {
        flower.setVisible(true);
        flower.setAlpha(0.25);
        flower.body.enable = false;
        flower.entangled = false;
      });
      return;
    }

    const [p1, p2] = this.players;
    this.flowers.forEach((flower) => {
      if (!flower.visible && this.time.now > flower.respawnAt) {
        this.placeFlower(flower, false);
      }
      if (!flower.visible) return;
      if (flower.alpha < 1) {
        flower.setAlpha(1);
      }
      if (!flower.body.enable) {
        flower.body.enable = true;
      }

      if (flower.entangled) {
        if (this.time.now > flower.stunnedUntil) {
          flower.entangled = false;
          flower.clearTint();
          flower.scale = 1;
          this.kickFlower(flower);
        } else if (this.checkDoubleFire()) {
          this.collectFlower(flower);
        }
        return;
      }

      const dist = this.distanceToSegment(
        flower.x,
        flower.y,
        p1.sprite.x,
        p1.sprite.y - 10,
        p2.sprite.x,
        p2.sprite.y - 10
      );

      if (dist <= SOULS_CONFIG.relicCatchRadius) {
        this.entangleFlower(flower);
      }
    });
  }

  entangleFlower(flower) {
    flower.entangled = true;
    flower.stunnedUntil = this.time.now + SOULS_CONFIG.relicStunDuration;
    flower.body.setVelocity(0, 0);
    flower.setTint(0xf0c36a);
    const ring = this.add.circle(flower.x, flower.y, 18, 0x7ad2b1, 0.25);
    ring.setDepth(28);
    this.tweens.add({
      targets: ring,
      scale: 1.8,
      alpha: 0,
      duration: 520,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: flower,
      scale: 1.2,
      yoyo: true,
      repeat: -1,
      duration: 260,
      ease: "Sine.easeInOut",
    });
    this.flashStatus(this.getText().stunned);
  }

  checkDoubleFire() {
    const [p1, p2] = this.players;
    const now = this.time.now;
    const within = (time) => now - time < SOULS_CONFIG.doubleFireWindow;
    return within(p1.lastFireAt) && within(p2.lastFireAt);
  }

  collectFlower(flower) {
    this.relicsCaught += 1;
    flower.entangled = false;
    flower.setVisible(false);
    flower.body.enable = false;
    flower.clearTint();
    flower.scale = 1;
    flower.respawnAt = this.time.now + SOULS_CONFIG.relicRespawnDelay;
    this.flashStatus(this.getText().collected);

    const burst = this.add.circle(flower.x, flower.y, 10, 0xf0c36a, 0.6);
    this.tweens.add({
      targets: burst,
      scale: 3,
      alpha: 0,
      duration: 500,
      ease: "Sine.easeOut",
      onComplete: () => burst.destroy(),
    });

    if (this.relicsCaught >= SOULS_CONFIG.relicsToBoss) {
      this.spawnBoss();
    }
  }

  placeFlower(flower, initial) {
    const spawnX = Phaser.Math.Between(180, SOULS_CONFIG.worldWidth - 180);
    const spawnY = Phaser.Math.Between(SOULS_CONFIG.flowerMinY, SOULS_CONFIG.flowerMaxY);
    flower.setVisible(true);
    flower.body.enable = true;
    flower.setAlpha(1);
    flower.setPosition(spawnX, spawnY);
    flower.clearTint();
    flower.entangled = false;
    flower.stunnedUntil = 0;
    if (!initial) {
      this.kickFlower(flower);
    } else {
      this.kickFlower(flower);
    }
  }

  kickFlower(flower) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const vx = Math.cos(angle) * SOULS_CONFIG.relicSpeed;
    const vy = Math.sin(angle) * SOULS_CONFIG.relicSpeed * 0.45;
    flower.body.setVelocity(vx, vy);
  }

  placeHazard(hazard, initial) {
    const spawnX = Phaser.Math.Between(180, SOULS_CONFIG.worldWidth - 180);
    const spawnY = Phaser.Math.Between(SOULS_CONFIG.flowerMinY + 40, SOULS_CONFIG.flowerMaxY + 120);
    hazard.setVisible(true);
    hazard.body.enable = true;
    hazard.setAlpha(1);
    hazard.setPosition(spawnX, spawnY);
    hazard.clearTint();
    if (!initial) {
      this.kickHazard(hazard);
    } else {
      this.kickHazard(hazard);
    }
  }

  kickHazard(hazard) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const vx = Math.cos(angle) * (SOULS_CONFIG.relicSpeed * 0.8);
    const vy = Math.sin(angle) * (SOULS_CONFIG.relicSpeed * 0.5);
    hazard.body.setVelocity(vx, vy);
  }

  spawnBoss() {
    if (this.boss.body.enable) return;
    this.boss.setVisible(true);
    this.boss.body.enable = true;
    this.bossCore.setVisible(true);
    this.bossCore.body.enable = true;
    this.flashStatus(this.getText().boss);
  }

  updateBoss() {
    if (!this.boss.body.enable || this.tetherBroken) return;
    const [p1, p2] = this.players;
    const target = Phaser.Math.Distance.Between(p1.sprite.x, p1.sprite.y, this.boss.x, this.boss.y)
      < Phaser.Math.Distance.Between(p2.sprite.x, p2.sprite.y, this.boss.x, this.boss.y)
      ? p1
      : p2;
    const facing = target.sprite.x < this.boss.x ? -1 : 1;
    const backX = this.boss.x + (facing === 1 ? -34 : 34);
    const backPoint = { x: backX, y: this.boss.y };
    this.bossCore.setPosition(backPoint.x, backPoint.y);

    const dist = this.distanceToSegment(
      backPoint.x,
      backPoint.y,
      p1.sprite.x,
      p1.sprite.y - 10,
      p2.sprite.x,
      p2.sprite.y - 10
    );

    if (dist <= SOULS_CONFIG.bossBackRadius && this.time.now - this.lastBossHitAt > SOULS_CONFIG.bossHitCooldown) {
      this.lastBossHitAt = this.time.now;
      this.bossHits += 1;
      this.flashStatus(this.getText().unleash);
      this.cameras.main.shake(200, 0.004);
      if (this.bossHits >= SOULS_CONFIG.bossHitsToWin) {
        this.finishRound();
      }
    }
  }

  finishRound() {
    gameState.status = "ended";
    showResult("Hidden Souls secured!", "Twin shadows claimed the relics.");
  }

  updateUi() {
    const text = this.getText();
    if (this.relicText) this.relicText.setText(text.relics(this.relicsCaught, SOULS_CONFIG.relicsToBoss));
    if (this.tetherText) {
      const map = {
        safe: text.tetherSafe,
        warn: text.tetherWarn,
        danger: text.tetherDanger,
        broken: text.tetherBroken,
      };
      this.tetherText.setText(map[this.tetherState]);
    }
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.centerOn(SOULS_CONFIG.worldWidth / 2, SOULS_CONFIG.worldHeight / 2);
    const zoomX = cam.width / SOULS_CONFIG.worldWidth;
    const zoomY = cam.height / SOULS_CONFIG.worldHeight;
    cam.setZoom(Math.min(zoomX, zoomY));
  }

  getText() {
    return SOULS_TEXT[this.lang] || SOULS_TEXT.en;
  }

  flashStatus(message) {
    if (!this.statusText) return;
    this.statusText.setText(message);
    this.statusText.setAlpha(1);
    this.tweens.add({
      targets: this.statusText,
      alpha: 0,
      duration: 1200,
      ease: "Sine.easeIn",
    });
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const b = c1 / c2;
    const bx = x1 + b * vx;
    const by = y1 + b * vy;
    return Math.hypot(px - bx, py - by);
  }

  startMusic() {
    if (this.musicStarted) return;
    this.musicStarted = true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.audio = new AudioCtx();
    if (this.audio.state === "suspended") {
      this.audio.resume();
    }

    const master = this.audio.createGain();
    master.gain.value = 0.18;
    master.connect(this.audio.destination);

    const playTone = (freq, duration, start, type, volume) => {
      const osc = this.audio.createOscillator();
      const gain = this.audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    };

    const melody = [
      659.25, 783.99, 659.25, 523.25,
      587.33, 0, 659.25, 880.0,
      783.99, 659.25, 587.33, 523.25,
      493.88, 587.33, 0, 783.99,
    ];
    const bass = [130.81, 146.83, 164.81, 174.61];
    let step = 0;
    const loop = () => {
      const base = this.audio.currentTime;
      const lead = melody[step % melody.length];
      if (lead > 0) {
        const wobble = step % 4 === 0 ? 1.04 : 0.98;
        playTone(lead * wobble, 0.16, base + 0.01, "triangle", 0.18);
        if (step % 3 === 0) {
          playTone(lead * 1.5, 0.08, base + 0.02, "square", 0.05);
        }
      }
      if (step % 4 === 0) {
        const note = bass[(step / 4) % bass.length];
        playTone(note, 0.3, base + 0.02, "sine", 0.12);
      }
      step += 1;
      setTimeout(loop, 180);
    };
    loop();
  }
}
