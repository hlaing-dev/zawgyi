const ctx = window.GameContext;
if (!ctx) {
  throw new Error("GameContext not found. Ensure main.js sets window.GameContext before loading the scene.");
}
const { gameState, consumeInput, showResult, shared } = ctx;

const HIDDEN_CONFIG = {
  worldWidth: 2800,
  worldHeight: 1600,
  groundY: 1200,
  speed: 240,
  jumpVelocity: -450,
  gravity: 900,
  dashSpeed: 420,
  dashDuration: 180,
  dashCooldown: 900,
  stunDuration: 1200,
  trapStunDuration: 1500,
  puzzleWindow: 2600,
  relicsToBoss: 3,
  bossHitsToWin: 3,
  dualRevealRadius: 320,
  lanternBoostRadius: 120,
  lanternBoostDuration: 1200,
  stoneLightRange: 140,
  lightRadius: 260,
  projectileSpeed: 620,
  projectileCooldown: 260,
};

const HIDDEN_TEXT = {
  en: {
    title: "Hidden Pagoda · Co-op adventure",
    puzzleHint: (target) => `Stay close to reveal stones · Puzzle: make ${target}`,
    numbers: (p1, p2) => `P1: ${p1}  P2: ${p2}`,
    relics: (current, total) => `Relics: ${current}/${total}`,
    ready: "Both stones active! Shoot now.",
    help: [
      "How to play:",
      "1) Move together to brighten the stones.",
      "2) P1 light left stone, P2 light right stone (B = Staff Light).",
      "3) A relic appears. Collect 3 to awaken the guardian.",
      "4) Both light the guardian core together to win.",
    ],
    statusWrong: "Wrong stone. Try together!",
    statusRelic: "Relic revealed! Collect it.",
    statusBoss: "Guardian awakened!",
  },
  my: {
    title: "ပျောက်ကွယ်သော စေတီ · ပူးပေါင်းစွန့်စားမှု",
    puzzleHint: (target) => `အတူတကွ ရပ်ပြီး ကျောက်စာပေါ်လာအောင်လုပ်ပါ · ပဟေဠိ: ${target} ဖြစ်အောင်လုပ်ပါ`,
    numbers: (p1, p2) => `P1: ${p1}  P2: ${p2}`,
    relics: (current, total) => `ရတနာ: ${current}/${total}`,
    ready: "ကျောက်စာအသင့်! အခု မီးတင်ပါ။",
    help: [
      "ကစားပုံ:",
      "၁) အတူတကွ နီးနီး ရပ်ပါ (ကျောက်စာပေါ်မည်)",
      "၂) P1 ဘယ်ကျောက်၊ P2 ညာကျောက်ကို B နဲ့ မီးတင်ပါ",
      "၃) ရတနာထွက်လာမယ်၊ ၃ ခုစုပါ",
      "၄) ကာကွယ်သူ ကျောက်မျက်ကို နှစ်ယောက်တပြိုင်နက် မီးတင်ပါ",
    ],
    statusWrong: "မှားတဲ့ကျောက်ပါ! အတူတကွပြန်လုပ်ပါ။",
    statusRelic: "ရတနာပေါ်လာပြီ! ယူပါ။",
    statusBoss: "ကာကွယ်သူ ပေါ်လာပြီ!",
  },
};

export class HiddenPagodaScene extends Phaser.Scene {
  constructor() {
    super("HiddenPagodaScene");
    this.players = [];
    this.projectiles = null;
    this.spirits = null;
    this.statues = null;
    this.relics = null;
    this.boss = null;
    this.bossCore = null;
    this.uiText = null;
    this.puzzleText = null;
    this.relicText = null;
    this.darkOverlay = null;
    this.puzzle = null;
    this.dualRevealItems = [];
    this.bossHealth = HIDDEN_CONFIG.bossHitsToWin;
    this.lightingEnabled = false;
  }

  create() {
    shared.hiddenScene = this;
    this.physics.world.gravity.y = HIDDEN_CONFIG.gravity;
    this.lightingEnabled = false;
    this.lang = window.GameContext?.language || "en";

    this.createTextures();
    this.createWorld();
    this.createGroups();
    this.createPlayers();
    this.createPuzzle();
    this.createStatues();
    this.createSpirits();
    this.createBoss();
    this.createUi();
    this.setupColliders();
    this.applyLanguage();

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
    graphics.fillStyle(0x6d5c44, 1);
    graphics.fillRoundedRect(0, 0, 64, 48, 10);
    graphics.fillStyle(0x44392b, 1);
    graphics.fillRect(6, 8, 52, 30);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillCircle(20, 22, 6);
    graphics.fillCircle(44, 22, 6);
    graphics.generateTexture("stone_wall", 64, 48);

    graphics.clear();
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillRoundedRect(0, 0, 26, 20, 6);
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillCircle(13, 8, 5);
    graphics.generateTexture("relic", 26, 20);

    graphics.clear();
    graphics.fillStyle(0x374b41, 1);
    graphics.fillRoundedRect(0, 6, 56, 36, 10);
    graphics.fillStyle(0x2a3831, 1);
    graphics.fillRect(6, 12, 44, 18);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillCircle(28, 16, 6);
    graphics.generateTexture("puzzle_stone", 56, 44);

    graphics.clear();
    graphics.fillStyle(0x2c2e3a, 1);
    graphics.fillRoundedRect(0, 0, 46, 46, 10);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillCircle(23, 20, 8);
    graphics.generateTexture("statue", 46, 46);

    graphics.clear();
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillCircle(6, 6, 6);
    graphics.generateTexture("statue_gem", 12, 12);

    graphics.clear();
    graphics.fillStyle(0x6ec7ff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(6, 6, 3);
    graphics.generateTexture("spirit", 16, 16);

    graphics.clear();
    graphics.fillStyle(0xf0c36a, 1);
    graphics.fillRect(0, 0, 40, 58);
    graphics.fillStyle(0x9c6b24, 1);
    graphics.fillRect(4, 6, 32, 10);
    graphics.fillStyle(0xe3c993, 1);
    graphics.fillRect(6, 22, 28, 26);
    graphics.generateTexture("guardian", 40, 58);

    graphics.clear();
    graphics.fillStyle(0xd04b3c, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("lantern_shot", 8, 8);

    graphics.clear();
    graphics.fillStyle(0x32433a, 1);
    graphics.fillRect(0, 0, 64, 32);
    graphics.fillStyle(0x3f5749, 1);
    graphics.fillRect(0, 0, 64, 8);
    graphics.generateTexture("hidden_ground", 64, 32);

  }

  createWorld() {
    this.physics.world.setBounds(0, 0, HIDDEN_CONFIG.worldWidth, HIDDEN_CONFIG.worldHeight);

    this.add.rectangle(
      HIDDEN_CONFIG.worldWidth / 2,
      HIDDEN_CONFIG.worldHeight / 2,
      HIDDEN_CONFIG.worldWidth,
      HIDDEN_CONFIG.worldHeight,
      0x111418,
      1
    );

    this.ground = this.physics.add.staticImage(
      HIDDEN_CONFIG.worldWidth / 2,
      HIDDEN_CONFIG.groundY + 16,
      "hidden_ground"
    );
    this.ground.setScale(HIDDEN_CONFIG.worldWidth / 64, 1).refreshBody();
    if (this.lightingEnabled) this.ground.setPipeline("Light2D");

    const wallCount = 18;
    for (let i = 0; i < wallCount; i += 1) {
      const wall = this.add.image(
        120 + i * 150,
        HIDDEN_CONFIG.groundY - 220 - (i % 2) * 40,
        "stone_wall"
      );
      wall.setScale(1 + (i % 3) * 0.08);
      if (this.lightingEnabled) wall.setPipeline("Light2D");
    }

    this.cameras.main.setBounds(0, 0, HIDDEN_CONFIG.worldWidth, HIDDEN_CONFIG.worldHeight);

    this.darkOverlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.0);
    this.darkOverlay.setOrigin(0, 0).setScrollFactor(0).setDepth(1);
  }

  createGroups() {
    this.projectiles = this.physics.add.group();
    this.spirits = this.physics.add.group();
    this.statues = this.physics.add.group();
    this.relics = this.physics.add.group({ immovable: true, allowGravity: false });
  }

  createPlayers() {
    const createPlayer = (id, x, texture, tint) => {
      const sprite = this.physics.add.sprite(x, HIDDEN_CONFIG.groundY - 60, texture);
      sprite.setCollideWorldBounds(true);
      sprite.setDrag(700, 0);
      sprite.setMaxVelocity(HIDDEN_CONFIG.speed * 1.4, HIDDEN_CONFIG.speed * 1.4);
      sprite.setDepth(20);
      if (typeof tint === "number") sprite.setTint(tint);
      if (this.lightingEnabled) sprite.setPipeline("Light2D");

      const light = null;

      return {
        id,
        sprite,
        light,
        facing: 1,
        lastShotAt: 0,
        stunnedUntil: 0,
        dashUntil: 0,
        dashCooldownUntil: 0,
        meleeCooldownUntil: 0,
        jumpCount: 0,
        lanternBoostUntil: 0,
      };
    };

    const centerX = HIDDEN_CONFIG.worldWidth / 2;
    this.players = [
      createPlayer(1, centerX - 140, "hero_idle_0", 0xf0c36a),
      createPlayer(2, centerX + 140, "hero_idle_0", 0x7ad2b1),
    ];
  }

  createPuzzle() {
    this.puzzle = {
      target: 10,
      p1Value: 4,
      p2Value: 6,
      solved: { 1: false, 2: false },
      active: true,
      lastSolvedAt: 0,
      relicsFound: 0,
    };

    const centerX = HIDDEN_CONFIG.worldWidth / 2;
    const stoneY = HIDDEN_CONFIG.groundY - 160;

    const createStone = (ownerId, x) => {
      const stone = this.physics.add.staticImage(x, stoneY, "puzzle_stone");
      stone.owner = ownerId;
      stone.value = 0;
      stone.setAlpha(0.35);
      stone.body.enable = false;
      if (this.lightingEnabled) stone.setPipeline("Light2D");
      const label = this.add.text(x, stoneY - 10, "", {
        fontFamily: "Cinzel, serif",
        fontSize: "20px",
        color: "#f5efe2",
      }).setOrigin(0.5);
      label.setAlpha(0.35);
      if (this.lightingEnabled) label.setPipeline("Light2D");
      stone.label = label;
      this.dualRevealItems.push({ sprite: stone, label, active: false, pulse: null });
      return stone;
    };

    this.puzzleStone1 = createStone(1, centerX - 160);
    this.puzzleStone2 = createStone(2, centerX + 160);

    this.shufflePuzzle();
  }

  shufflePuzzle() {
    const target = Phaser.Math.Between(7, 12);
    const p1Value = Phaser.Math.Between(2, target - 2);
    const p2Value = target - p1Value;
    this.puzzle.target = target;
    this.puzzle.p1Value = p1Value;
    this.puzzle.p2Value = p2Value;
    this.puzzle.solved = { 1: false, 2: false };
    this.puzzle.active = true;
    this.puzzle.lastSolvedAt = 0;

    this.puzzleStone1.value = p1Value;
    this.puzzleStone2.value = p2Value;
    this.puzzleStone1.label.setText(String(p1Value));
    this.puzzleStone2.label.setText(String(p2Value));
  }

  createStatues() {
    for (let i = 0; i < 3; i += 1) {
      const statue = this.statues.create(520 + i * 640, HIDDEN_CONFIG.groundY - 48, "statue");
      statue.setCollideWorldBounds(true);
      statue.setBounce(1, 0);
      statue.setImmovable(true);
      statue.body.allowGravity = false;
      statue.setVelocityX(i % 2 === 0 ? 60 : -60);
      statue.hitTimes = { 1: 0, 2: 0 };
      statue.stunnedUntil = 0;
      if (this.lightingEnabled) statue.setPipeline("Light2D");

      const gem = this.add.image(statue.x, statue.y - 10, "statue_gem");
      if (this.lightingEnabled) gem.setPipeline("Light2D");
      statue.gem = gem;
    }
  }

  createSpirits() {
    for (let i = 0; i < 5; i += 1) {
      const spirit = this.spirits.create(
        Phaser.Math.Between(260, HIDDEN_CONFIG.worldWidth - 260),
        Phaser.Math.Between(320, HIDDEN_CONFIG.groundY - 320),
        "spirit"
      );
      spirit.baseX = spirit.x;
      spirit.baseY = spirit.y;
      spirit.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
      spirit.setCircle(8);
      spirit.body.allowGravity = false;
      if (this.lightingEnabled) spirit.setPipeline("Light2D");
    }
  }

  createBoss() {
    this.boss = this.physics.add.staticImage(HIDDEN_CONFIG.worldWidth - 220, HIDDEN_CONFIG.groundY - 140, "guardian");
    this.boss.setVisible(false);
    this.boss.body.enable = false;
    if (this.lightingEnabled) this.boss.setPipeline("Light2D");

    this.bossCore = this.physics.add.staticImage(this.boss.x, this.boss.y - 10, "statue_gem");
    this.bossCore.setVisible(false);
    this.bossCore.body.enable = false;
    if (this.lightingEnabled) this.bossCore.setPipeline("Light2D");

    this.bossHitTimes = { 1: 0, 2: 0 };
  }

  createUi() {
    this.uiText = this.add.text(24, 18, "Hidden Pagoda · Co-op adventure", {
      fontFamily: "Cinzel, serif",
      fontSize: "16px",
      color: "#f5efe2",
    }).setScrollFactor(0).setDepth(60);

    this.puzzleText = this.add.text(24, 42, "Stay close to reveal stones · Puzzle: make 0", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#b4a48d",
    }).setScrollFactor(0).setDepth(60);

    this.relicText = this.add.text(24, 62, "Relics: 0/3", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#b4a48d",
    }).setScrollFactor(0).setDepth(60);

    this.helpPanel = this.add.rectangle(24, 88, 420, 140, 0x0b0f0d, 0.65);
    this.helpPanel.setOrigin(0, 0).setScrollFactor(0).setDepth(55);

    this.helpText = this.add.text(36, 98, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "12px",
      color: "#f5efe2",
      lineSpacing: 4,
    }).setScrollFactor(0).setDepth(60);

    this.statusText = this.add.text(24, 240, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#f0c36a",
    }).setScrollFactor(0).setDepth(60).setAlpha(0);

    this.readyText = this.add.text(24, 262, "", {
      fontFamily: "Barlow, sans-serif",
      fontSize: "13px",
      color: "#7ad2b1",
    }).setScrollFactor(0).setDepth(60).setAlpha(0);
  }

  setupColliders() {
    this.players.forEach((player) => {
      this.physics.add.collider(player.sprite, this.ground);
      this.physics.add.overlap(player.sprite, this.statues, () => {
        this.stunPlayer(player, HIDDEN_CONFIG.trapStunDuration);
      });
      this.physics.add.overlap(player.sprite, this.spirits, (_, spirit) => {
        if (!spirit.active) return;
        this.stunPlayer(player, HIDDEN_CONFIG.stunDuration);
      });
    this.physics.add.overlap(player.sprite, this.relics, (_, relic) => {
      if (!relic.active) return;
      relic.disableBody(true, true);
      this.puzzle.relicsFound += 1;
      this.updateRelicProgress();
      this.flashStatus(this.getText().statusRelic);
    });
    });

    this.physics.add.overlap(this.projectiles, this.spirits, (projectile, spirit) => {
      projectile.destroy();
      spirit.disableBody(true, true);
      this.time.delayedCall(1400, () => {
        spirit.enableBody(true, spirit.baseX, spirit.baseY, true, true);
        spirit.body.allowGravity = false;
      });
    });

    this.physics.add.overlap(this.projectiles, [this.puzzleStone1, this.puzzleStone2], (projectile, stone) => {
      projectile.destroy();
      this.handlePuzzleHit(projectile.ownerId, stone);
    });

    this.physics.add.overlap(this.projectiles, this.statues, (projectile, statue) => {
      projectile.destroy();
      this.handleStatueHit(projectile.ownerId, statue);
    });

    this.physics.add.overlap(this.projectiles, this.bossCore, (projectile) => {
      projectile.destroy();
      this.handleBossHit(projectile.ownerId);
    });
  }

  handlePuzzleHit(ownerId, stone) {
    if (!this.puzzle.active) return;
    if (!this.stonesReady) return;
    if (stone.owner !== ownerId) {
      this.flashStatus(this.getText().statusWrong);
      this.failPuzzle();
      return;
    }
    this.puzzle.solved[ownerId] = true;
    this.puzzle.lastSolvedAt = this.time.now;
    if (this.puzzle.solved[1] && this.puzzle.solved[2]) {
      this.spawnRelic();
      this.flashStatus(this.getText().statusRelic);
      this.shufflePuzzle();
    }
  }

  failPuzzle() {
    this.puzzle.solved = { 1: false, 2: false };
    this.puzzle.lastSolvedAt = 0;
    this.puzzle.active = false;
    this.time.delayedCall(800, () => {
      this.puzzle.active = true;
      this.shufflePuzzle();
    });
  }

  spawnRelic() {
    const relicX = HIDDEN_CONFIG.worldWidth / 2;
    const relicY = HIDDEN_CONFIG.groundY - 220;
    const relic = this.relics.create(relicX, relicY, "relic");
    relic.body.allowGravity = false;
    if (this.lightingEnabled) relic.setPipeline("Light2D");
    relic.setDepth(25);

    const beacon = this.add.text(relicX, relicY - 30, "Relic!", {
      fontFamily: "Cinzel, serif",
      fontSize: "14px",
      color: "#f0c36a",
    }).setOrigin(0.5).setDepth(26);

    this.tweens.add({
      targets: [relic, beacon],
      y: "-=12",
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.time.delayedCall(5000, () => {
      if (relic.active) relic.disableBody(true, true);
      if (beacon) beacon.destroy();
    });
  }

  updateRelicProgress() {
    const target = HIDDEN_CONFIG.relicsToBoss;
    if (this.relicText) {
      this.relicText.setText(this.getText().relics(this.puzzle.relicsFound, target));
    }
    if (this.puzzle.relicsFound >= target && !this.boss.body.enable) {
      this.boss.setVisible(true);
      this.boss.body.enable = true;
      this.bossCore.setVisible(true);
      this.bossCore.body.enable = true;
      this.flashStatus(this.getText().statusBoss);
    }
  }

  handleStatueHit(ownerId, statue) {
    if (this.time.now < statue.stunnedUntil) return;
    statue.hitTimes[ownerId] = this.time.now;
    const otherId = ownerId === 1 ? 2 : 1;
    if (this.time.now - statue.hitTimes[otherId] < 700) {
      statue.stunnedUntil = this.time.now + HIDDEN_CONFIG.trapStunDuration;
      statue.setVelocityX(0);
      statue.setTint(0x88ffdd);
    }
  }

  handleBossHit(ownerId) {
    if (!this.boss.body.enable || gameState.status === "ended") return;
    this.bossHitTimes[ownerId] = this.time.now;
    const otherId = ownerId === 1 ? 2 : 1;
    if (this.time.now - this.bossHitTimes[otherId] < 700) {
      this.bossHealth -= 1;
      this.boss.setTint(0xffd59c);
      this.time.delayedCall(200, () => this.boss.clearTint());
      if (this.bossHealth <= 0) {
        this.finishRound();
      }
    }
  }

  finishRound() {
    gameState.status = "ended";
    showResult("Hidden Pagoda secured!", "The guardian yields to your dual light.");
  }

  stunPlayer(player, duration) {
    player.stunnedUntil = Math.max(player.stunnedUntil, this.time.now + duration);
    player.sprite.setTint(0x88ff88);
    this.time.delayedCall(duration, () => player.sprite.clearTint());
  }

  fireProjectile(player, dirX, dirY) {
    const now = this.time.now;
    if (now - player.lastShotAt < HIDDEN_CONFIG.projectileCooldown) return;
    player.lastShotAt = now;

    const shot = this.projectiles.create(player.sprite.x, player.sprite.y - 8, "lantern_shot");
    shot.ownerId = player.id;
    shot.body.allowGravity = false;
    if (this.lightingEnabled) shot.setPipeline("Light2D");

    const length = Math.max(0.01, Math.hypot(dirX, dirY));
    shot.setVelocity((dirX / length) * HIDDEN_CONFIG.projectileSpeed, (dirY / length) * HIDDEN_CONFIG.projectileSpeed);

    this.time.delayedCall(1200, () => {
      if (shot.active) shot.destroy();
    });
  }

  performMelee(player) {
    const hitbox = this.physics.add.sprite(player.sprite.x + player.facing * 26, player.sprite.y, "statue_gem");
    hitbox.setScale(1.4);
    hitbox.ownerId = player.id;
    hitbox.body.allowGravity = false;
    hitbox.setAlpha(0.2);

    this.physics.add.overlap(hitbox, this.spirits, (_, spirit) => {
      spirit.disableBody(true, true);
      this.time.delayedCall(1200, () => {
        spirit.enableBody(true, spirit.baseX, spirit.baseY, true, true);
        spirit.body.allowGravity = false;
      });
    });

    this.physics.add.overlap(hitbox, this.statues, (_, statue) => {
      this.handleStatueHit(player.id, statue);
    });

    this.physics.add.overlap(hitbox, [this.puzzleStone1, this.puzzleStone2], (_, stone) => {
      this.handlePuzzleHit(player.id, stone);
    });

    this.physics.add.overlap(hitbox, this.bossCore, () => {
      this.handleBossHit(player.id);
    });

    this.time.delayedCall(120, () => {
      if (hitbox.active) hitbox.destroy();
    });
  }

  updateStatues() {
    this.statues.getChildren().forEach((statue) => {
      if (!statue.active) return;
      statue.gem.setPosition(statue.x, statue.y - 10);
      if (this.time.now < statue.stunnedUntil) {
        return;
      }
      if (statue.tintTopLeft !== 0xffffff) {
        statue.clearTint();
      }
      if (statue.body.blocked.left || statue.body.blocked.right) {
        statue.setVelocityX(-statue.body.velocity.x);
      }
    });
  }

  updateSpirits() {
    this.spirits.getChildren().forEach((spirit) => {
      if (!spirit.active) return;
      spirit.y = spirit.baseY + Math.sin(this.time.now / 500 + spirit.phase) * 18;
    });
  }

  updateDualReveal() {
    const p1 = this.players[0];
    const p2 = this.players[1];
    if (!p1 || !p2) return;

    let activeCount = 0;
    this.dualRevealItems.forEach((item) => {
      const sprite = item.sprite;
      const label = item.label;
      const boostActive = this.time.now < p1.lanternBoostUntil || this.time.now < p2.lanternBoostUntil;
      const radius = HIDDEN_CONFIG.dualRevealRadius + (boostActive ? HIDDEN_CONFIG.lanternBoostRadius : 0);
      const dist1 = Phaser.Math.Distance.Between(p1.sprite.x, p1.sprite.y, sprite.x, sprite.y);
      const dist2 = Phaser.Math.Distance.Between(p2.sprite.x, p2.sprite.y, sprite.x, sprite.y);
      const shouldShow = dist1 < radius && dist2 < radius;
      this.setRevealState(item, shouldShow);
      if (shouldShow) activeCount += 1;
    });

    if (this.readyText) {
      const allActive = activeCount >= this.dualRevealItems.length && this.dualRevealItems.length > 0;
      this.readyText.setText(allActive ? this.getText().ready : "");
      this.readyText.setAlpha(allActive ? 1 : 0);
    }

    this.stonesReady = activeCount >= this.dualRevealItems.length && this.dualRevealItems.length > 0;
  }

  updateUi() {
    if (this.puzzleText) {
      const text = this.getText();
      const numbers = text.numbers(this.puzzle.p1Value, this.puzzle.p2Value);
      this.puzzleText.setText(`${text.puzzleHint(this.puzzle.target)} · ${numbers}`);
    }
  }

  tryLightStone(player) {
    if (!this.stonesReady || !this.puzzle.active) return;
    const stone = player.id === 1 ? this.puzzleStone1 : this.puzzleStone2;
    if (!stone || !stone.active) return;
    const distance = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, stone.x, stone.y);
    if (distance > HIDDEN_CONFIG.stoneLightRange) return;
    this.handlePuzzleHit(player.id, stone);
  }

  setRevealState(item, isActive) {
    if (!item || item.active === isActive) return;
    item.active = isActive;
    const sprite = item.sprite;
    const label = item.label;
    if (!sprite) return;

    sprite.setAlpha(isActive ? 1 : 0.35);
    sprite.setTint(isActive ? 0xf0c36a : 0xffffff);
    if (sprite.body) sprite.body.enable = isActive;
    if (label) {
      label.setAlpha(isActive ? 1 : 0.35);
      label.setColor(isActive ? "#f0c36a" : "#b4a48d");
    }

    if (item.pulse) {
      item.pulse.stop();
      item.pulse = null;
    }

    if (isActive) {
      sprite.setScale(1);
      if (label) label.setScale(1);
      item.pulse = this.tweens.add({
        targets: [sprite, label].filter(Boolean),
        scale: 1.18,
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      sprite.setScale(1);
      if (label) label.setScale(1);
    }
  }

  getText() {
    return HIDDEN_TEXT[this.lang] || HIDDEN_TEXT.en;
  }

  applyLanguage() {
    const text = this.getText();
    if (this.uiText) this.uiText.setText(text.title);
    if (this.puzzleText) {
      const numbers = text.numbers(this.puzzle.p1Value, this.puzzle.p2Value);
      this.puzzleText.setText(`${text.puzzleHint(this.puzzle.target)} · ${numbers}`);
    }
    if (this.relicText) this.relicText.setText(text.relics(this.puzzle.relicsFound, HIDDEN_CONFIG.relicsToBoss));
    if (this.helpText) this.helpText.setText(text.help.join("\n"));
    if (this.readyText && this.readyText.alpha > 0) {
      this.readyText.setText(text.ready);
    }
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

  update(time) {
    if (gameState.status !== "playing") return;

    this.players.forEach((player) => {
      const input = consumeInput(player.id);
      const now = this.time.now;

      if (player.light) {
        player.light.x = player.sprite.x;
        player.light.y = player.sprite.y - 10;
      }

      if (now < player.stunnedUntil) {
        player.sprite.setVelocityX(0);
        return;
      }

      if (player.sprite.body.blocked.down) {
        player.jumpCount = 0;
      }

      const moveX = input.moveX || 0;
      const moveY = input.moveY || 0;
      if (Math.abs(moveX) > 0.2) {
        player.facing = moveX > 0 ? 1 : -1;
      }

      if (now > player.dashUntil) {
        player.sprite.body.setVelocityX(moveX * HIDDEN_CONFIG.speed);
      }

      if (input.a && player.jumpCount < 2) {
        player.sprite.body.setVelocityY(HIDDEN_CONFIG.jumpVelocity);
        player.jumpCount += 1;
      }

      if (input.y && now > player.dashCooldownUntil) {
        player.dashUntil = now + HIDDEN_CONFIG.dashDuration;
        player.dashCooldownUntil = now + HIDDEN_CONFIG.dashCooldown;
        player.sprite.body.setVelocityX(player.facing * HIDDEN_CONFIG.dashSpeed);
      }

      if (input.b && now > player.meleeCooldownUntil) {
        player.meleeCooldownUntil = now + 420;
        this.performMelee(player);
        this.tryLightStone(player);
      }

      if (input.x) {
        player.lanternBoostUntil = now + HIDDEN_CONFIG.lanternBoostDuration;
      }
    });

    this.updateDualReveal();
    this.updateStatues();
    this.updateSpirits();
    this.updateUi();


    const p1 = this.players[0];
    const p2 = this.players[1];
    if (p1 && p2) {
      const midX = (p1.sprite.x + p2.sprite.x) / 2;
      const midY = (p1.sprite.y + p2.sprite.y) / 2;
      const cam = this.cameras.main;
      cam.centerOn(midX, midY);
    }
  }
}
