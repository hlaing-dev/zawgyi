const socket = window.io();

const lobbyEl = document.getElementById("lobby");
const roomPanelEl = document.getElementById("room-panel");
const roomCodeEl = document.getElementById("room-code");
const roomLinkEl = document.getElementById("room-link");
const roomQrEl = document.getElementById("room-qr");
const statusTextEl = document.getElementById("status-text");
const connectedCountEl = document.getElementById("connected-count");
const roomModeEl = document.getElementById("room-mode");
const roomTitleEl = document.getElementById("room-title");
const roomMetaModeLabelEl = document.getElementById("room-meta-mode-label");
const roomMetaConnectedLabelEl = document.getElementById("room-meta-connected-label");
const startSingleBtn = document.getElementById("start-single");
const startMultiBtn = document.getElementById("start-multi");
const startRaceBtn = document.getElementById("start-race");
const resultEl = document.getElementById("result");
const resultTitleEl = document.getElementById("result-title");
const resultCopyEl = document.getElementById("result-copy");
const rematchBtn = document.getElementById("rematch-race");
const restartBtn = document.getElementById("restart-race");
const winnerDancerEl = document.getElementById("winner-dancer");
const modeChipEl = document.getElementById("mode-chip");
const modeChipLabelEl = document.getElementById("mode-chip-label");
const modeHeadlineEl = document.getElementById("mode-headline");
const modeSubcopyEl = document.getElementById("mode-subcopy");
const modeDialogEl = document.getElementById("mode-dialog");
const modeDialogCloseBtn = document.getElementById("mode-dialog-close");
const modeDialogCopyEl = document.getElementById("mode-dialog-copy");
const modeConfirmBtn = document.getElementById("mode-confirm");
const modeCancelBtn = document.getElementById("mode-cancel");
const openModeDialogBtn = document.getElementById("open-mode-dialog");
const modeGridContainers = document.querySelectorAll("[data-mode-grid]");
const modeHintEl = document.getElementById("mode-hint");
const controllerHintEl = document.getElementById("controller-hint");
const hintMissingCountEl = document.getElementById("hint-missing-count");
const hintRoomIdEl = document.getElementById("hint-room-id");
const hintRoomLinkEl = document.getElementById("hint-room-link");
const hintTitleEl = document.getElementById("hint-title");
const hintCopyEl = document.getElementById("hint-copy");
const hintStepsEl = document.getElementById("hint-steps");
const hintStepsPrefixEl = document.getElementById("hint-steps-prefix");
const hintStepsMidEl = document.getElementById("hint-steps-mid");
const langToggleEl = document.getElementById("lang-toggle");
const footerPhoneEl = document.getElementById("footer-phone");
const footerKeyboardEl = document.getElementById("footer-keyboard");
const footerFullscreenEl = document.getElementById("footer-fullscreen");
const game3dEl = document.getElementById("game-3d");
const babylonCanvasEl = document.getElementById("babylon-canvas");

const STORAGE_KEY = "zawgyi-game-v1";
const LANG_KEY = "zawgyi-lang";

const UI_TEXT = {
  en: {
    single: "Single Player (vs AI)",
    multi: "Two-Player Local",
    roomId: "Room ID",
    mode: "Mode",
    connected: "Connected controllers",
    hintTitle: "Connect with Room ID",
    hintCopy: (missing) => `Waiting for ${missing} controller(s).`,
    hintStepsPrefix: "Enter",
    hintStepsMid: "or visit",
    footerPhone: "Phone: Left joystick move/levitate • Right ABXY skills",
    footerKeyboard: "Keyboard: P1 Move A/D + W/F/R/Shift, P2 Move Left/Right + Up/L/O/Enter",
    footerFullscreen: "Fullscreen: F",
    lobbyHintDefault: "Pick Single Player or Two-Player, then tap Launch.",
    lobbyHintSingle: "Single Player armed. Tap Launch to begin.",
    lobbyHintMultiReady: "Two controllers ready. Tap Launch when everyone is set.",
    lobbyHintMultiWait: "Connect two controllers, then tap Launch when ready.",
    coopOnly: "Co-op only. Choose Two-Player to continue.",
    statusSingle: "Single player - AI enabled",
    statusMulti: "Waiting for two controllers",
    statusLobby: "Lobby ready",
  },
  my: {
    single: "တစ်ယောက်ချင်း (AI ပါ)",
    multi: "နှစ်ယောက်ပေါင်း (Local)",
    roomId: "အခန်း ID",
    mode: "မုဒ်",
    connected: "ချိတ်ဆက်ထားသော ကွန်ထရိုလား",
    hintTitle: "အခန်း ID ဖြင့် ချိတ်ဆက်ပါ",
    hintCopy: (missing) => `ကွန်ထရိုလား ${missing} ခု လိုအပ်နေပါသေးသည်။`,
    hintStepsPrefix: "အခန်း",
    hintStepsMid: "သို့မဟုတ်",
    footerPhone: "ဖုန်း: ဘယ်ဘက် joystick လှုပ်ရှား/လေထဲပျံ • ညာဘက် ABXY ခလုတ်များ",
    footerKeyboard: "ကီးဘုတ်: P1 A/D + W/F/R/Shift, P2 Left/Right + Up/L/O/Enter",
    footerFullscreen: "ပြည့်မျက်နှာပြင်: F",
    lobbyHintDefault: "တစ်ယောက်ချင်း သို့မဟုတ် နှစ်ယောက်ပေါင်းကို ရွေးပြီး စတင်ပါ။",
    lobbyHintSingle: "တစ်ယောက်ချင်း ပြင်ဆင်ပြီးပါပြီ။ စတင်ရန် Launch ကိုနှိပ်ပါ။",
    lobbyHintMultiReady: "ကွန်ထရိုလား ၂ ခု ပြင်ဆင်ပြီးပါပြီ။ စတင်ရန် Launch ကိုနှိပ်ပါ။",
    lobbyHintMultiWait: "ကွန်ထရိုလား ၂ ခု ချိတ်ဆက်ပြီးမှ Launch ကိုနှိပ်ပါ။",
    coopOnly: "ပူးပေါင်းကစားရမည့် မုဒ်။ နှစ်ယောက်ပေါင်းကို ရွေးပါ။",
    statusSingle: "တစ်ယောက်ချင်း - AI ပါ",
    statusMulti: "ကွန်ထရိုလား ၂ ခု စောင့်နေသည်",
    statusLobby: "Lobby အသင့်",
  },
};

let currentLang = localStorage.getItem(LANG_KEY) || "en";

function t(key, ...args) {
  const dict = UI_TEXT[currentLang] || UI_TEXT.en;
  const value = dict[key];
  if (typeof value === "function") return value(...args);
  return value || key;
}

function getModeText(def, field) {
  if (currentLang === "my") {
    const alt = def[`${field}My`];
    if (alt) return alt;
  }
  return def[field];
}

const GAME_MODES = {
  "treasure-zawgyi": {
    key: "treasure-zawgyi",
    title: "Treasure Zawgyi",
    titleMy: "ရတနာ ဇော်ဂျီ",
    tagline: "Gather relics and outpace your rival.",
    taglineMy: "ရတနာစုဆောင်းပြီး ပြိုင်ဘက်ကို ကျော်လွန်ပါ။",
    summary: "Collect treasures, defeat crabs, and sky fish to claim victory.",
    summaryMy: "ရတနာများ စုဆောင်းပြီး ကဏန်းနှင့် ငါးပျံများကို ရှင်းလင်းပါ။",
    description: "Gather 15 treasures, defeat 5 crabs, and 5 sky fish faster than your rival.",
    descriptionMy: "ရတနာ ၁၅ ခု၊ ကဏန်း ၅ ကောင်၊ ငါးပျံ ၅ ကောင်ကို စုဆောင်း/ရှင်းလင်းပါ။",
    badge: "Classic",
    badgeMy: "မူရင်း",
    available: true,
    cta: "Treasure Hunt",
    ctaMy: "ရတနာရှာမုဒ်",
    startLabel: "Launch Treasure Zawgyi",
    startLabelMy: "ရတနာ ဇော်ဂျီ စတင်မည်",
    sceneKey: "TreasureHuntScene",
  },
  "flying-zawgyi": {
    key: "flying-zawgyi",
    title: "Flying Zawgyi",
    titleMy: "ပျံသန်း ဇော်ဂျီ",
    tagline: "Collect roots, brew the potion, then soar to the golden pagoda.",
    taglineMy: "အမြစ်တွေ စု၊ ဆေးဖျော်ပြီး ရွှေစေတီသို့ ပျံသန်းပါ။",
    summary: "Phase 1: gather herbal roots. Phase 2: complete the alchemy sequence. Phase 3: fly to the peak.",
    summaryMy: "အဆင့် ၁ အမြစ်စု၊ အဆင့် ၂ ဆေးဖျော်၊ အဆင့် ၃ ထိပ်သို့ ပျံသန်း။",
    description: "Find 3 Herbal Roots, brew the potion at your cauldron, then reach the Golden Pagoda first.",
    descriptionMy: "အမြစ် ၃ ခု ရှာ၊ ဓာတ်ပေါင်းဖိုမှာ ဆေးဖျော်ပြီး ရွှေစေတီကို အရင်ထိပါ။",
    badge: "New",
    badgeMy: "အသစ်",
    available: true,
    cta: "Launch Flying Zawgyi",
    ctaMy: "ပျံသန်း ဇော်ဂျီ",
    startLabel: "Launch Flying Zawgyi",
    startLabelMy: "ပျံသန်း ဇော်ဂျီ စတင်မည်",
    sceneKey: "FlyingZawgyiScene",
  },
  "hidden-pagoda": {
    key: "hidden-pagoda",
    title: "Hidden Pagoda",
    titleMy: "ပျောက်ကွယ်သော စေတီ",
    tagline: "Co-op cave adventure with dual lantern puzzles.",
    taglineMy: "မီးအိမ်နှစ်ခု ပဟေဠိပါဝင်သော ပူးပေါင်းစွန့်စားမှု။",
    summary: "Explore together, solve puzzles with red/blue lights, and defeat the guardian.",
    summaryMy: "အတူတကွ စူးစမ်းပြီး မီးအိမ်ပဟေဠိ ဖြေ၊ ကာကွယ်သူကို အနိုင်ယူပါ။",
    description: "Co-op only: solve dual-light puzzles and defeat the guardian to claim the hidden pagoda.",
    descriptionMy: "ပူးပေါင်းကစားရမည့် မုဒ်။ မီးအိမ်ပဟေဠိ ဖြေပြီး ကာကွယ်သူကို အနိုင်ယူပါ။",
    badge: "Soon",
    badgeMy: "မကြာမီ",
    available: false,
    cta: "Enter Hidden Pagoda",
    ctaMy: "ပျောက်ကွယ်စေတီ",
    startLabel: "Launch Hidden Pagoda",
    startLabelMy: "ပျောက်ကွယ်စေတီ စတင်မည်",
    sceneKey: "HiddenPagodaScene",
    requiresControllers: true,
  },
  "hidden-souls": {
    key: "hidden-souls",
    title: "Hidden Souls",
    titleMy: "ဝိညာဉ်အဖော်",
    tagline: "Twin Shadows tether to trap the flying relic.",
    taglineMy: "ကြိုးတန်းအင်အားနဲ့ ရွှေရတနာကို ဖမ်းဆီးပါ။",
    summary: "Keep your tether strong, stun the relic, then light it together to claim it.",
    summaryMy: "ကြိုးတန်းအားကို ထိန်းပြီး ရတနာကို တိုက်ခိုက်ပါ၊ အတူတကွ မီးတင်ပြီး ရယူပါ။",
    description: "Co-op only: use the luminous tether to stun the relic, then both light it to claim.",
    descriptionMy: "ပူးပေါင်းကစားရမည့် မုဒ်။ ကြိုးတန်းဖြင့် ရတနာကို တိတ်စေပြီး နှစ်ယောက်တပြိုင်နက် မီးတင်ရယူပါ။",
    badge: "New",
    badgeMy: "အသစ်",
    available: true,
    cta: "Enter Hidden Souls",
    ctaMy: "ဝိညာဉ်အဖော်",
    startLabel: "Launch Hidden Souls",
    startLabelMy: "ဝိညာဉ်အဖော် စတင်မည်",
    sceneKey: "HiddenSoulsScene",
    requiresControllers: true,
  },
  "alchemist-race-3d": {
    key: "alchemist-race-3d",
    title: "Alchemist's Race 3D",
    titleMy: "အလယ်မစ် ပြိုင်ပွဲ 3D",
    tagline: "Collect herbs, brew potions, and race to 1,000 points.",
    taglineMy: "မြက်ဆေးစု၊ ဆေးဖျော်၊ အမှတ် ၁၀၀၀ ရောက်အောင် ပြိုင်ပါ။",
    summary: "Common herbs give 10 pts, rare herbs give 50 pts, and perfect brews score 200+.",
    summaryMy: "သာမန်မြက် ၁၀ မှတ်၊ ရှားပါးမြက် ၅၀ မှတ်၊ အောင်မြင်ဆေးဖျော်မှု ၂၀၀ မှတ်ကျော်။",
    description: "A 3D co-op race using Babylon.js: gather herbs, brew potions with QTE bonuses, and reach 1,000 points first.",
    descriptionMy: "Babylon.js 3D မုဒ်: မြက်ဆေးစု၊ QTE ဖြင့် ဆေးဖျော်ကာ ၁၀၀၀ မှတ်ကို အရင်ရပါ။",
    badge: "3D",
    badgeMy: "3D",
    available: true,
    cta: "Enter Alchemist's Race",
    ctaMy: "အလယ်မစ် ပြိုင်ပွဲ",
    startLabel: "Launch Alchemist's Race 3D",
    startLabelMy: "3D အလယ်မစ် ပြိုင်ပွဲ စတင်မည်",
    engine: "babylon",
    requiresControllers: false,
  },
};

let pendingGameMode = "treasure-zawgyi";

const CONFIG = {
  world: { width: 3200, height: 1300 },
  baseSpeed: 230,
  steerSpeed: 230,
  airSpeed: 180,
  groundDrag: 900,
  jumpVelocity: -430,
  gravity: 760,
  levitateDuration: 1200,
  levitateCooldown: 1500,
  levitateGravityOffset: -520,
  levitateLift: 0.55,
  levitateMaxUp: 260,
  levitateMaxDown: 240,
  attackWindow: 280,
  pillCooldown: 450,
  pillSpeed: 620,
  pillAimAssistRange: 320,
  pillAimAssistAngle: 55,
  pillSlowDuration: 1400,
  slowPenalty: 140,
  dashSpeed: 200,
  dashDuration: 520,
  dashCooldown: 1700,
  creatureBoost: 1000,
  treasuresToWin: 15,
  crabsToWin: 5,
  dragonsToWin: 5,
  maxTreasures: 7,
  treasureRespawnDelayMin: 1200,
  treasureRespawnDelayMax: 2200,
  crabRespawnDelayMin: 1800,
  crabRespawnDelayMax: 2800,
  countdownStep: 700,
  stunDuration: 1000,
  crabStunDuration: 1500,
  maxSeparation: 900,
  cameraPaddingX: 280,
  cameraPaddingY: 200,
  cameraZoomMin: 0.75,
  cameraZoomMax: 1.05,
};

const lobbyState = {
  mode: null,
  gameMode: "treasure-zawgyi",
  roomId: null,
  roomUrl: "",
  hostUrl: "",
  connected: new Set(),
  waitingForRoom: false,
};

const gameState = {
  status: "lobby",
  mode: "",
  gameMode: "treasure-zawgyi",
  winner: null,
};

const savedState = {
  lastMode: null,
  lastGameMode: "treasure-zawgyi",
  wins: { 1: 0, 2: 0 },
};

const shared = {
  treasureScene: null,
  flyingScene: null,
  hiddenScene: null,
  hiddenSoulsScene: null,
  pendingStart: null,
  activeGameMode: "treasure-zawgyi",
};

const inputState = {
  1: { jump: false, attack: false, skill: false, dash: false, a: false, b: false, x: false, y: false, moveX: 0, moveY: 0 },
  2: { jump: false, attack: false, skill: false, dash: false, a: false, b: false, x: false, y: false, moveX: 0, moveY: 0 },
};

const ACTION_ALIAS = {
  a: "jump",
  b: "attack",
  x: "skill",
  y: "dash",
};

let winnerLottie = null;

function initWinnerLottie() {
  if (!winnerDancerEl || typeof window.lottie === "undefined") return;
  if (winnerLottie) return;
  winnerLottie = window.lottie.loadAnimation({
    container: winnerDancerEl,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "/assets/wizard/animations/12345.json",
    assetsPath: "/assets/wizard/images/",
    rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
  });
}

function applyLanguage() {
  if (langToggleEl) langToggleEl.textContent = currentLang === "en" ? "MM" : "EN";
  if (startSingleBtn) startSingleBtn.textContent = t("single");
  if (startMultiBtn) startMultiBtn.textContent = t("multi");
  if (roomTitleEl) roomTitleEl.textContent = t("roomId");
  if (roomMetaModeLabelEl) roomMetaModeLabelEl.textContent = t("mode");
  if (roomMetaConnectedLabelEl) roomMetaConnectedLabelEl.textContent = t("connected");
  if (footerPhoneEl) footerPhoneEl.textContent = t("footerPhone");
  if (footerKeyboardEl) footerKeyboardEl.textContent = t("footerKeyboard");
  if (footerFullscreenEl) footerFullscreenEl.textContent = t("footerFullscreen");
  updateModeUI();
  updateLobbyUI();
  if (window.GameContext) {
    window.GameContext.language = currentLang;
  }
  window.dispatchEvent(new CustomEvent("zaw-lang-change", { detail: { lang: currentLang } }));
}

function getModeDefinition(key) {
  return GAME_MODES[key] || GAME_MODES["treasure-zawgyi"];
}

function ensurePlayableMode(key) {
  const def = getModeDefinition(key);
  return def.available ? def.key : "treasure-zawgyi";
}

function normalizeAction(action) {
  if (!action) return "";
  const lower = String(action).toLowerCase();
  if (lower === "move") return "move";
  const activeMode = shared.activeGameMode || lobbyState.gameMode || "treasure-zawgyi";
  if (activeMode === "treasure-zawgyi") {
    return ACTION_ALIAS[lower] || lower;
  }
  return lower;
}

function queueInput(slot, action) {
  if (!inputState[slot]) return;
  if (!Object.prototype.hasOwnProperty.call(inputState[slot], action)) return;
  inputState[slot][action] = true;
}

function setAxis(slot, x, y) {
  if (!inputState[slot]) return;
  inputState[slot].moveX = Number.isFinite(x) ? x : 0;
  inputState[slot].moveY = Number.isFinite(y) ? y : 0;
}

function consumeInput(slot) {
  const payload = { ...inputState[slot] };
  payload.jump = payload.jump || payload.a;
  payload.attack = payload.attack || payload.b;
  payload.skill = payload.skill || payload.x;
  payload.dash = payload.dash || payload.y;
  inputState[slot].jump = false;
  inputState[slot].attack = false;
  inputState[slot].skill = false;
  inputState[slot].dash = false;
  inputState[slot].a = false;
  inputState[slot].b = false;
  inputState[slot].x = false;
  inputState[slot].y = false;
  return payload;
}

function setStatus(text) {
  if (statusTextEl) statusTextEl.textContent = text;
}

async function resolveHostUrl() {
  try {
    const response = await fetch("/host-info");
    if (!response.ok) return;
    const data = await response.json();
    if (data.hostUrl) {
      lobbyState.hostUrl = data.hostUrl;
      if (lobbyState.roomId) {
        lobbyState.roomUrl = `${lobbyState.hostUrl}/controller.html?room=${lobbyState.roomId}&mode=${lobbyState.gameMode}`;
        updateLobbyUI();
        if (window.QRCode && roomQrEl) {
          roomQrEl.innerHTML = "";
          window.QRCode.toCanvas(roomQrEl, lobbyState.roomUrl, { width: 140 }, () => {});
        }
      }
    }
  } catch (err) {
    console.warn("Host URL lookup failed", err);
  }
}

function buildModeCards() {
  modeGridContainers.forEach((container) => {
    if (!container) return;
    container.innerHTML = "";
    Object.values(GAME_MODES).forEach((def) => {
      const card = document.createElement("article");
      card.className = "mode-card";
      card.dataset.modeCard = def.key;
      if (!def.available) card.classList.add("coming-soon");
      const context = container.dataset.modeGrid || "lobby";
      const isDialog = context === "dialog";
      const buttonLabel = def.available
        ? (isDialog ? (currentLang === "my" ? "ကြည့်ရှုမည်" : "Preview") : getModeText(def, "cta"))
        : (currentLang === "my" ? "မရနိုင်သေးပါ" : "Locked");
      card.innerHTML = `
        <span class="mode-badge">${getModeText(def, "badge")}</span>
        <div class="mode-card__body">
          <p class="mode-card__tagline">${getModeText(def, "tagline")}</p>
          <h3>${getModeText(def, "title")}</h3>
          <p class="mode-card__summary">${getModeText(def, "summary")}</p>
        </div>
        <div class="mode-card__actions">
          <button type="button" ${def.available ? "" : "disabled"}>${buttonLabel}</button>
        </div>
      `;

      const activateMode = () => {
        if (!def.available) return;
        if (isDialog) {
          pendingGameMode = def.key;
          syncModeDialogState();
        } else {
          selectGameMode(def.key);
        }
      };

      const cardButton = card.querySelector("button");
      if (cardButton) {
        cardButton.addEventListener("click", (event) => {
          event.preventDefault();
          activateMode();
        });
      }
      if (!isDialog) {
        card.addEventListener("click", (event) => {
          if (event.target && event.target.closest("button")) return;
          activateMode();
        });
      }
      container.appendChild(card);
    });
  });
  updateModeCards();
}

function updateModeCards() {
  const active = lobbyState.gameMode;
  document.querySelectorAll("[data-mode-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.modeCard === active);
  });
}

function selectGameMode(key) {
  const playableKey = ensurePlayableMode(key);
  const def = getModeDefinition(playableKey);
  lobbyState.gameMode = playableKey;
  gameState.gameMode = playableKey;
  shared.activeGameMode = playableKey;
  pendingGameMode = playableKey;
  updateModeUI();
  if (lobbyState.roomId) {
    socket.emit("host:mode", { roomId: lobbyState.roomId, mode: lobbyState.gameMode });
  }
  persistState();
  return def;
}

function updateModeUI() {
  const def = getModeDefinition(lobbyState.gameMode);
  if (modeChipLabelEl) modeChipLabelEl.textContent = getModeText(def, "title");
  if (modeHeadlineEl) modeHeadlineEl.textContent = getModeText(def, "title");
  if (modeSubcopyEl) modeSubcopyEl.textContent = getModeText(def, "description");
  if (roomModeEl) roomModeEl.textContent = getModeText(def, "title");
  if (startRaceBtn) startRaceBtn.textContent = getModeText(def, "startLabel") || "Launch Mode";
  if (modeHintEl) {
    const needsCoop = Boolean(def.requiresControllers);
    let actionCopy = t("lobbyHintDefault");
    if (lobbyState.mode === "single") {
      actionCopy = needsCoop ? t("coopOnly") : t("lobbyHintSingle");
    } else if (lobbyState.mode === "multi") {
      actionCopy = lobbyState.connected.size >= 2
        ? t("lobbyHintMultiReady")
        : t("lobbyHintMultiWait");
    }
    modeHintEl.textContent = `${getModeText(def, "title")}: ${actionCopy}`;
  }
  updateModeCards();
  updateLobbyUI();
}

function openModeDialog() {
  if (!modeDialogEl) return;
  modeDialogEl.classList.remove("hidden");
  modeDialogEl.classList.add("show");
  syncModeDialogState();
}

function closeModeDialog() {
  if (!modeDialogEl) return;
  modeDialogEl.classList.add("hidden");
  modeDialogEl.classList.remove("show");
}

function syncModeDialogState() {
  const def = getModeDefinition(pendingGameMode);
  if (modeDialogCopyEl) modeDialogCopyEl.textContent = getModeText(def, "description");
  if (modeConfirmBtn) modeConfirmBtn.textContent = getModeText(def, "startLabel") || "Activate";
  document.querySelectorAll(".mode-grid-dialog [data-mode-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.modeCard === pendingGameMode);
  });
}

function updateLobbyUI() {
  if (!roomPanelEl || !roomCodeEl || !connectedCountEl) return;
  roomPanelEl.classList.toggle("hidden", !lobbyState.roomId);
  roomCodeEl.textContent = lobbyState.roomId || "----";
  connectedCountEl.textContent = lobbyState.connected.size;
  const hasMode = lobbyState.mode !== null;
  const modeDef = getModeDefinition(lobbyState.gameMode);
  const modePlayable = Boolean(modeDef.available);
  const needsCoop = Boolean(modeDef.requiresControllers);
  const coopReady = lobbyState.mode === "multi" && lobbyState.connected.size >= 2;
  if (startRaceBtn) {
    startRaceBtn.textContent = getModeText(modeDef, "startLabel") || "Launch";
    startRaceBtn.disabled = !hasMode
      || (lobbyState.mode === "multi" && lobbyState.connected.size < 2)
      || (needsCoop && !coopReady)
      || !modePlayable;
    startRaceBtn.title = startRaceBtn.disabled && !modePlayable ? "This mode is still brewing." : "";
  }

  if (lobbyState.roomId) {
    const origin = lobbyState.hostUrl || window.location.origin;
    const nextUrl = `${origin}/controller.html?room=${lobbyState.roomId}&mode=${lobbyState.gameMode}`;
    if (nextUrl !== lobbyState.roomUrl) {
      lobbyState.roomUrl = nextUrl;
      if (window.QRCode && roomQrEl) {
        roomQrEl.innerHTML = "";
        window.QRCode.toCanvas(roomQrEl, lobbyState.roomUrl, { width: 140 }, () => {});
      }
    }
  }

  if (lobbyState.roomUrl) {
    roomLinkEl.textContent = lobbyState.roomUrl;
    roomLinkEl.href = lobbyState.roomUrl;
  }

  const needsControllers = lobbyState.mode === "multi" && lobbyState.connected.size < 2;
  if (controllerHintEl) {
    controllerHintEl.classList.toggle("hidden", !needsControllers);
    if (needsControllers) {
      const missing = Math.max(1, 2 - lobbyState.connected.size);
      if (hintTitleEl) hintTitleEl.textContent = t("hintTitle");
      if (hintCopyEl) hintCopyEl.textContent = t("hintCopy", missing);
      if (hintStepsPrefixEl) hintStepsPrefixEl.textContent = t("hintStepsPrefix");
      if (hintStepsMidEl) hintStepsMidEl.textContent = t("hintStepsMid");
      if (hintMissingCountEl) hintMissingCountEl.textContent = missing;
      if (hintRoomIdEl) hintRoomIdEl.textContent = lobbyState.roomId || "----";
      if (hintRoomLinkEl) {
        const linkText = lobbyState.roomUrl ? lobbyState.roomUrl.replace(/^https?:\/\//, "") : "waiting for room...";
        hintRoomLinkEl.textContent = linkText;
        hintRoomLinkEl.href = lobbyState.roomUrl || "#";
        hintRoomLinkEl.rel = lobbyState.roomUrl ? "noopener" : "nofollow noopener";
      }
    }
  }

  let statusSuffix = "Lobby ready";
  if (lobbyState.mode === "single") {
    statusSuffix = needsCoop ? t("coopOnly") : t("statusSingle");
  } else if (lobbyState.mode === "multi") {
    statusSuffix = t("statusMulti");
  }
  setStatus(`${getModeText(modeDef, "title")} • ${statusSuffix}`);
}

function showLobby() {
  lobbyEl.classList.add("show");
  resultEl.classList.remove("show");
  resultEl.classList.add("hidden");
  gameState.status = "lobby";
  stopBabylonMode();
}

function showResult(title, copy) {
  initWinnerLottie();
  resultTitleEl.textContent = title;
  resultCopyEl.textContent = copy;
  resultEl.classList.remove("hidden");
  resultEl.classList.add("show");
}

function prepareRoom() {
  lobbyState.waitingForRoom = true;
  lobbyState.connected.clear();
  socket.emit("host:create");
  updateLobbyUI();
}

if (startSingleBtn) {
  startSingleBtn.addEventListener("click", () => {
    lobbyState.mode = "single";
    prepareRoom();
    persistState();
  });
}

if (startMultiBtn) {
  startMultiBtn.addEventListener("click", () => {
    lobbyState.mode = "multi";
    prepareRoom();
    persistState();
  });
}

if (startRaceBtn) {
  startRaceBtn.addEventListener("click", () => {
    const modeDef = getModeDefinition(lobbyState.gameMode);
    const needsCoop = Boolean(modeDef.requiresControllers);
    const coopReady = lobbyState.mode === "multi" && lobbyState.connected.size >= 2;
    if (lobbyState.mode === "multi" && lobbyState.connected.size < 2) return;
    if (needsCoop && !coopReady) return;
    lobbyEl.classList.remove("show");
    gameState.mode = lobbyState.mode;
    gameState.status = "countdown";
    gameState.gameMode = lobbyState.gameMode;
    shared.activeGameMode = lobbyState.gameMode;
    triggerGameStart(lobbyState.mode, lobbyState.gameMode);
  });
}

if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    showLobby();
  });
}

if (rematchBtn) {
  rematchBtn.addEventListener("click", () => {
    resultEl.classList.remove("show");
    resultEl.classList.add("hidden");
    const mode = gameState.mode || lobbyState.mode || "single";
    const gameMode = shared.activeGameMode || lobbyState.gameMode;
    gameState.mode = mode;
    gameState.gameMode = gameMode;
    gameState.status = "countdown";
    triggerGameStart(mode, gameMode);
  });
}

if (modeChipEl) {
  modeChipEl.addEventListener("click", () => {
    openModeDialog();
  });
}
if (openModeDialogBtn) {
  openModeDialogBtn.addEventListener("click", () => {
    openModeDialog();
  });
}
if (modeDialogCloseBtn) {
  modeDialogCloseBtn.addEventListener("click", () => closeModeDialog());
}
if (modeCancelBtn) {
  modeCancelBtn.addEventListener("click", () => closeModeDialog());
}
if (modeConfirmBtn) {
  modeConfirmBtn.addEventListener("click", () => {
    selectGameMode(pendingGameMode);
    closeModeDialog();
  });
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (data.lastMode) savedState.lastMode = data.lastMode;
    if (data.lastGameMode) savedState.lastGameMode = data.lastGameMode;
    if (data.wins) {
      savedState.wins[1] = Number(data.wins[1] || 0);
      savedState.wins[2] = Number(data.wins[2] || 0);
    }
  } catch (err) {
    console.warn("Failed to load saved state", err);
  }
}

function persistState() {
  const payload = {
    lastMode: lobbyState.mode || savedState.lastMode || "",
    lastGameMode: lobbyState.gameMode || savedState.lastGameMode || "treasure-zawgyi",
    wins: savedState.wins,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

socket.on("host:ready", ({ roomId }) => {
  lobbyState.roomId = roomId;
  const origin = lobbyState.hostUrl || window.location.origin;
  lobbyState.roomUrl = `${origin}/controller.html?room=${roomId}&mode=${lobbyState.gameMode}`;
  lobbyState.waitingForRoom = false;
  updateLobbyUI();
  socket.emit("host:mode", { roomId, mode: lobbyState.gameMode });

  if (window.QRCode && roomQrEl) {
    roomQrEl.innerHTML = "";
    window.QRCode.toCanvas(roomQrEl, lobbyState.roomUrl, { width: 140 }, () => {});
  }
});

socket.on("controller:connected", ({ slot }) => {
  lobbyState.connected.add(slot);
  updateLobbyUI();
});

socket.on("controller:disconnected", ({ slot }) => {
  lobbyState.connected.delete(slot);
  updateLobbyUI();
});

socket.on("room:closed", () => {
  lobbyState.connected.clear();
  lobbyState.roomId = null;
  lobbyState.roomUrl = "";
  updateLobbyUI();
  setStatus("Room closed");
});

socket.on("controller:input", ({ slot, action, pressed, value }) => {
  const normalizedAction = normalizeAction(action);
  if (normalizedAction === "move" && value) {
    setAxis(slot, value.x, value.y);
    return;
  }
  if (pressed) queueInput(slot, normalizedAction);
});

function triggerGameStart(playMode, gameModeKey) {
  const payload = {
    playMode: playMode || "single",
    gameMode: gameModeKey || "treasure-zawgyi",
  };
  shared.pendingStart = payload;
  shared.activeGameMode = payload.gameMode;
  if (!game) return;

  const def = getModeDefinition(payload.gameMode);
  if (def.engine === "babylon") {
    const otherKeys = Object.values(GAME_MODES)
      .map((mode) => mode.sceneKey)
      .filter((key) => key);
    otherKeys.forEach((key) => {
      if (game.scene.isActive(key)) {
        game.scene.stop(key);
      }
    });
    stopBabylonMode();
    startBabylonMode(payload.playMode);
    return;
  }
  stopBabylonMode();
  const targetKey = def.sceneKey;
  const otherKeys = Object.values(GAME_MODES)
    .map((mode) => mode.sceneKey)
    .filter((key) => key && key !== targetKey);

  otherKeys.forEach((key) => {
    if (game.scene.isActive(key)) {
      game.scene.stop(key);
    }
  });

  const targetScene = game.scene.getScene(targetKey);
  const startCallback = () => {
    if (!targetScene) return;
    if (typeof targetScene.startHunt === "function") {
      targetScene.startHunt(payload.playMode);
      return;
    }
    if (typeof targetScene.startRound === "function") {
      targetScene.startRound(payload.playMode);
      return;
    }
    if (typeof targetScene.startMatch === "function") {
      targetScene.startMatch(payload.playMode);
    }
  };

  if (targetScene) {
    targetScene.events.once(Phaser.Scenes.Events.CREATE, startCallback);
  }

  if (targetScene && targetScene.scene.isActive()) {
    targetScene.scene.restart();
  } else {
    game.scene.start(targetKey);
  }
}

let game = null;
let babylonGame = null;
const BABYLON_SCRIPTS = [
  "https://cdn.babylonjs.com/babylon.js",
  "https://cdn.babylonjs.com/gui/babylon.gui.min.js",
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src=\"${src}\"]`);
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureBabylonLoaded() {
  if (window.BABYLON && window.BABYLON.GUI) return true;
  try {
    for (const src of BABYLON_SCRIPTS) {
      await loadScript(src);
    }
  } catch (err) {
    return false;
  }
  return Boolean(window.BABYLON && window.BABYLON.GUI);
}

function showBabylonCanvas(show) {
  if (game3dEl) {
    game3dEl.classList.toggle("show", show);
    game3dEl.classList.toggle("hidden", !show);
  }
  if (document.getElementById("game")) {
    document.getElementById("game").style.display = show ? "none" : "block";
  }
}

async function startBabylonMode(playMode) {
  if (!babylonCanvasEl) return;
  const ready = await ensureBabylonLoaded();
  if (!ready) {
    showBabylonCanvas(false);
    showResult("3D mode failed to load", "Babylon.js could not be loaded. Check your internet or CDN access.");
    return;
  }
  try {
    const { AlchemistRace3D } = await import("./game/alchemist-race-3d.js");
    if (!babylonGame) {
      babylonGame = new AlchemistRace3D({
        canvas: babylonCanvasEl,
        consumeInput,
        gameState,
        showResult,
        shared,
        getLang: () => currentLang,
      });
    }
    showBabylonCanvas(true);
    babylonGame.start(playMode || "multi");
  } catch (err) {
    console.error("Failed to start 3D mode", err);
    showBabylonCanvas(false);
    showResult("3D mode failed to load", "The 3D module failed to start. Check console for details.");
  }
}

function stopBabylonMode() {
  if (babylonGame) {
    babylonGame.stop();
  }
  showBabylonCanvas(false);
}

async function bootGame() {
  window.GameContext = {
    CONFIG,
    gameState,
    savedState,
    consumeInput,
    persistState,
    showResult,
    winnerDancerEl,
    shared,
    language: currentLang,
  };

  const [{ TreasureHuntScene }, { FlyingZawgyiScene }, { HiddenPagodaScene }, { HiddenSoulsScene }] = await Promise.all([
    import("./game/scene.js"),
    import("./game/flying.js"),
    import("./game/hidden.js"),
    import("./game/hidden-souls.js"),
  ]);

  const treasureScene = new TreasureHuntScene();
  const flyingScene = new FlyingZawgyiScene();
  const hiddenScene = new HiddenPagodaScene();
  const hiddenSoulsScene = new HiddenSoulsScene();
  shared.treasureScene = treasureScene;
  shared.flyingScene = flyingScene;
  shared.hiddenScene = hiddenScene;
  shared.hiddenSoulsScene = hiddenSoulsScene;

  const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: "game",
    backgroundColor: "#0f1712",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: CONFIG.gravity },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [treasureScene, flyingScene, hiddenScene, hiddenSoulsScene],
  };

  game = new Phaser.Game(config);
}

window.render_game_to_text = () => {
  const activeMode = shared.activeGameMode || lobbyState.gameMode || "treasure-zawgyi";
  if (activeMode === "flying-zawgyi") {
    const scene = shared.flyingScene;
    const players = scene
      ? scene.players.map((player) => ({
          id: player.id,
          x: Math.round(player.sprite.x),
          y: Math.round(player.sprite.y),
          vx: Math.round(player.sprite.body.velocity.x),
          vy: Math.round(player.sprite.body.velocity.y),
          roots: player.roots,
          potionReady: player.potionReady,
          flying: player.flying,
          alchemyActive: player.alchemyActive,
        }))
      : [];

    return JSON.stringify({
      note: "origin top-left, x right, y down",
      status: gameState.status,
      mode: gameState.mode,
      gameMode: gameState.gameMode,
      roomId: lobbyState.roomId,
      connectedControllers: Array.from(lobbyState.connected),
      players,
      winner: gameState.winner,
    });
  }

  if (activeMode === "hidden-pagoda") {
    const scene = shared.hiddenScene;
    const players = scene
      ? scene.players.map((player) => ({
          id: player.id,
          x: Math.round(player.sprite.x),
          y: Math.round(player.sprite.y),
          vx: Math.round(player.sprite.body.velocity.x),
          vy: Math.round(player.sprite.body.velocity.y),
          found: player.found,
        }))
      : [];

    return JSON.stringify({
      note: "origin top-left, x right, y down",
      status: gameState.status,
      mode: gameState.mode,
      gameMode: gameState.gameMode,
      roomId: lobbyState.roomId,
      connectedControllers: Array.from(lobbyState.connected),
      players,
      winner: gameState.winner,
    });
  }

  if (activeMode === "hidden-souls") {
    const scene = shared.hiddenSoulsScene;
    const players = scene
      ? scene.players.map((player) => ({
          id: player.id,
          x: Math.round(player.sprite.x),
          y: Math.round(player.sprite.y),
          vx: Math.round(player.sprite.body.velocity.x),
          vy: Math.round(player.sprite.body.velocity.y),
          tether: scene.tetherState || "unknown",
        }))
      : [];

    return JSON.stringify({
      note: "origin top-left, x right, y down",
      status: gameState.status,
      mode: gameState.mode,
      gameMode: gameState.gameMode,
      roomId: lobbyState.roomId,
      connectedControllers: Array.from(lobbyState.connected),
      players,
      relics: scene?.relicsCaught || 0,
      bossHits: scene?.bossHits || 0,
      winner: gameState.winner,
    });
  }

  if (activeMode === "alchemist-race-3d" && shared.alchemistRace3D) {
    return JSON.stringify(shared.alchemistRace3D.getDebugState());
  }

  const scene = shared.treasureScene;
  const players = scene
    ? scene.players.map((player) => ({
        id: player.id,
        x: Math.round(player.sprite.x),
        y: Math.round(player.sprite.y),
        vx: Math.round(player.sprite.body.velocity.x),
        vy: Math.round(player.sprite.body.velocity.y),
        treasure: player.treasures,
        crabs: player.crabs,
        dragons: player.dragons,
        levitate: scene.time.now < player.levitateUntil,
        dash: scene.time.now < player.dashUntil,
      }))
    : [];

  const treasures = scene
    ? scene.treasures.getChildren().map((treasure) => ({
        x: Math.round(treasure.x),
        y: Math.round(treasure.y),
      }))
    : [];

  return JSON.stringify({
    note: "origin top-left, x right, y down",
    status: gameState.status,
    mode: gameState.mode,
    gameMode: gameState.gameMode,
    roomId: lobbyState.roomId,
    connectedControllers: Array.from(lobbyState.connected),
    goals: {
      treasures: CONFIG.treasuresToWin,
      crabs: CONFIG.crabsToWin,
      dragons: CONFIG.dragonsToWin,
    },
    players,
    treasures,
    winner: gameState.winner,
  });
};

window.advanceTime = (ms) => {
  const step = 1000 / 60;
  const frames = Math.max(1, Math.round(ms / step));
  if (typeof game?.step === "function") {
    for (let i = 0; i < frames; i += 1) {
      game.step(game.loop.now + step, step);
    }
  }
};

loadState();
if (savedState.lastGameMode) {
  lobbyState.gameMode = ensurePlayableMode(savedState.lastGameMode);
  shared.activeGameMode = lobbyState.gameMode;
  pendingGameMode = lobbyState.gameMode;
}
if (savedState.lastMode) {
  lobbyState.mode = savedState.lastMode;
}

buildModeCards();
updateModeUI();
resolveHostUrl();
bootGame();
initWinnerLottie();
applyLanguage();

if (langToggleEl) {
  langToggleEl.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "my" : "en";
    localStorage.setItem(LANG_KEY, currentLang);
    buildModeCards();
    applyLanguage();
  });
}
