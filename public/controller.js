const roomIdEl = document.getElementById("room-id");
const playerSlotEl = document.getElementById("player-slot");
const statusEl = document.getElementById("status");
const buttons = document.querySelectorAll(".action-btn");
const joystick = document.getElementById("joystick");
const joystickStick = document.getElementById("joystick-stick");
const roomInput = document.getElementById("room-input");
const joinBtn = document.getElementById("join-btn");
const joinPanel = document.querySelector(".join-panel");
const langToggle = document.getElementById("lang-toggle");
const controllerTitle = document.getElementById("controller-title");
const roomLabel = document.getElementById("room-label");
const playerLabel = document.getElementById("player-label");
const roomInputLabel = document.getElementById("room-input-label");
const joinHint = document.getElementById("join-hint");
const joystickLabel = document.getElementById("joystick-label");
const i18nTargets = document.querySelectorAll("[data-i18n]");
const syncBtn = document.getElementById("sync-btn");
const actionLabels = {
  a: document.querySelector('[data-action="a"] .btn-name'),
  b: document.querySelector('[data-action="b"] .btn-name'),
  x: document.querySelector('[data-action="x"] .btn-name'),
  y: document.querySelector('[data-action="y"] .btn-name'),
};

const LANG_KEY = "zmr-controller-lang";
const MODE_KEY = "zmr-controller-mode";
const LAST_ROOM_KEY = "zmr-controller-room";
const ACTIVE_ROOM_KEY = "zmr-controller-active-room";
const translations = {
  en: {
    titleTreasure: "Treasure Zawgyi",
    titleFlying: "Flying Zawgyi",
    titleHidden: "Hidden Pagoda",
    titleHiddenSouls: "Hidden Souls",
    titleAlchemist: "Alchemist's Race 3D",
    toggle: "MM",
    room: "Room",
    player: "Player",
    roomInput: "Enter Room ID",
    connect: "Connect",
    hint: "Scan QR or enter the room ID above.",
    joystickTreasure: "Move / Levitate",
    joystickFlying: "Move / Fly",
    joystickHidden: "Move / Explore",
    joystickHiddenSouls: "Move / Tether",
    joystickAlchemist: "Move / Brew",
    treasureA: "Levitate",
    treasureB: "Staff Strike",
    treasureX: "Alchemic Pill",
    treasureY: "Dash",
    flyingA: "Confirm",
    flyingB: "Brew",
    flyingX: "Alchemy",
    flyingY: "Smoke Bomb",
    hiddenA: "Jump",
    hiddenB: "Staff Light",
    hiddenX: "Lantern Pulse",
    hiddenY: "Dash",
    soulsA: "Jump",
    soulsB: "Staff Light",
    soulsX: "Twin Fire",
    soulsY: "Dash",
    alchemistA: "Interact",
    alchemistB: "Brew",
    alchemistX: "QTE X",
    alchemistY: "Dash",
    statusMissing: "Enter a room ID.",
    statusConnecting: "Connecting…",
    statusConnected: "Connected. Ready to run.",
    statusClosed: "Room closed by host.",
    statusError: "Unable to join room.",
    statusNoHost: "Waiting for host room…",
  },
  my: {
    titleTreasure: "ရတနာ ဇော်ဂျီ",
    titleFlying: "ပျံသန်းမည့် ဇော်ဂျီ",
    titleHidden: "ပျောက်ကွယ်သော စေတီ",
    titleHiddenSouls: "ဝိညာဉ်အဖော်",
    titleAlchemist: "အလယ်မစ် ပြိုင်ပွဲ 3D",
    toggle: "EN",
    room: "အခန်း",
    player: "ကစားသမား",
    roomInput: "အခန်း ID ရိုက်ထည့်ပါ",
    connect: "ချိတ်ဆက်",
    hint: "QR စကန်ပါ၊ သို့မဟုတ် အခန်း ID ရိုက်ထည့်ပါ။",
    joystickTreasure: "လှုပ်ရှား / လေထဲပျံ",
    joystickFlying: "လှုပ်ရှား / ပျံသန်း",
    joystickHidden: "လှုပ်ရှား / စူးစမ်း",
    joystickHiddenSouls: "လှုပ်ရှား / ကြိုးတန်း",
    joystickAlchemist: "လှုပ်ရှား / ဆေးဖျော်",
    treasureA: "လေထဲပျံ",
    treasureB: "တုတ်နဲ့ထိုး",
    treasureX: "ဆေးလုံးပစ်",
    treasureY: "မြန်တက်",
    flyingA: "အတည်ပြု",
    flyingB: "ဖျော်",
    flyingX: "ဓာတ်ပေါင်း",
    flyingY: "မီးခိုးဗုံး",
    hiddenA: "ခုန်",
    hiddenB: "တုတ်မီး",
    hiddenX: "မီးအိမ်ပြင်း",
    hiddenY: "မြန်တက်",
    soulsA: "ခုန်",
    soulsB: "တုတ်မီး",
    soulsX: "တပြိုင်နက်မီး",
    soulsY: "မြန်တက်",
    alchemistA: "ထိန်းညှိ",
    alchemistB: "ဆေးဖျော်",
    alchemistX: "QTE X",
    alchemistY: "မြန်တက်",
    statusMissing: "အခန်း ID ရိုက်ထည့်ပါ။",
    statusConnecting: "ချိတ်ဆက်နေသည်…",
    statusConnected: "ချိတ်ဆက်ပြီးပါပြီ။",
    statusClosed: "အခန်းပိတ်သွားပါပြီ။",
    statusError: "အခန်းဝင်မရပါ။",
    statusNoHost: "Host အခန်းကို စောင့်နေပါသည်…",
  },
};

let currentLang = localStorage.getItem(LANG_KEY) || "en";

const applyLanguage = () => {
  const dict = translations[currentLang];
  const isFlying = controllerMode === "flying-zawgyi";
  const isHidden = controllerMode === "hidden-pagoda";
  const isSouls = controllerMode === "hidden-souls";
  const isAlchemist = controllerMode === "alchemist-race-3d";
  if (controllerTitle) {
    controllerTitle.textContent = isFlying
      ? dict.titleFlying
      : isSouls
        ? dict.titleHiddenSouls
        : isAlchemist
          ? dict.titleAlchemist
          : isHidden
            ? dict.titleHidden
            : dict.titleTreasure;
  }
  if (langToggle) langToggle.textContent = dict.toggle;
  if (roomLabel) roomLabel.textContent = dict.room;
  if (playerLabel) playerLabel.textContent = dict.player;
  if (roomInputLabel) roomInputLabel.textContent = dict.roomInput;
  if (joinBtn) joinBtn.textContent = dict.connect;
  if (joinHint) joinHint.textContent = dict.hint;
  if (joystickLabel) {
    joystickLabel.textContent = isFlying
      ? dict.joystickFlying
      : isSouls
        ? dict.joystickHiddenSouls
        : isAlchemist
          ? dict.joystickAlchemist
          : isHidden
            ? dict.joystickHidden
            : dict.joystickTreasure;
  }
  if (actionLabels.a) actionLabels.a.textContent = isFlying ? dict.flyingA : isSouls ? dict.soulsA : isAlchemist ? dict.alchemistA : isHidden ? dict.hiddenA : dict.treasureA;
  if (actionLabels.b) actionLabels.b.textContent = isFlying ? dict.flyingB : isSouls ? dict.soulsB : isAlchemist ? dict.alchemistB : isHidden ? dict.hiddenB : dict.treasureB;
  if (actionLabels.x) actionLabels.x.textContent = isFlying ? dict.flyingX : isSouls ? dict.soulsX : isAlchemist ? dict.alchemistX : isHidden ? dict.hiddenX : dict.treasureX;
  if (actionLabels.y) actionLabels.y.textContent = isFlying ? dict.flyingY : isSouls ? dict.soulsY : isAlchemist ? dict.alchemistY : isHidden ? dict.hiddenY : dict.treasureY;
  i18nTargets.forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });

  if (syncBtn) {
    const roomId = localStorage.getItem(ACTIVE_ROOM_KEY) || localStorage.getItem(LAST_ROOM_KEY);
    syncBtn.disabled = !roomId;
    syncBtn.title = roomId ? `Sync to room ${roomId}` : "No recent room";
  }
};

if (langToggle) {
  langToggle.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "my" : "en";
    localStorage.setItem(LANG_KEY, currentLang);
    applyLanguage();
  });
}

document.addEventListener("gesturestart", (event) => event.preventDefault());
document.addEventListener("gesturechange", (event) => event.preventDefault());
document.addEventListener("gestureend", (event) => event.preventDefault());
document.addEventListener("dblclick", (event) => event.preventDefault(), { passive: false });

const blockTouchDefaults = (event) => {
  const target = event.target;
  if (target.closest(".action-btn") || target.closest(".joystick") || target.closest(".joystick-label")) {
    event.preventDefault();
  }
};

document.addEventListener("touchstart", blockTouchDefaults, { passive: false });
document.addEventListener("touchmove", blockTouchDefaults, { passive: false });
document.addEventListener("touchend", blockTouchDefaults, { passive: false });

const params = new URLSearchParams(window.location.search);
const roomIdFromUrl = params.get("room");
const modeFromUrl = params.get("mode");
roomInput.value = roomIdFromUrl || "";
roomIdEl.textContent = roomIdFromUrl || "----";

let controllerMode = modeFromUrl || localStorage.getItem(MODE_KEY) || "treasure-zawgyi";
if (modeFromUrl) {
  localStorage.setItem(MODE_KEY, modeFromUrl);
  controllerMode = modeFromUrl;
}

let socket = null;
let assignedSlot = null;
let activeRoomId = roomIdFromUrl || "";
const pressedState = {};
const lastSend = {};
const joystickState = {
  active: false,
  pointerId: null,
  x: 0,
  y: 0,
  lastSent: 0,
};

const sendInput = (action, pressed, value) => {
  if (!assignedSlot || !socket) return;
  socket.emit("controller:input", {
    roomId: activeRoomId,
    slot: assignedSlot,
    action,
    pressed,
    value,
  });
};

const connectToRoom = (roomId) => {
  const trimmed = (roomId || "").trim().toUpperCase();
  if (!trimmed) {
    statusEl.textContent = translations[currentLang].statusMissing;
    return;
  }
  activeRoomId = trimmed;
  roomIdEl.textContent = trimmed;
  roomInput.value = trimmed;
  statusEl.textContent = translations[currentLang].statusConnecting;
  localStorage.setItem(LAST_ROOM_KEY, trimmed);
  localStorage.setItem(ACTIVE_ROOM_KEY, trimmed);
  if (syncBtn) {
    syncBtn.disabled = false;
    syncBtn.title = `Sync to room ${trimmed}`;
  }

  if (socket) {
    socket.disconnect();
  }
  socket = io();
  assignedSlot = null;

  socket.emit("controller:join", { roomId: trimmed });

  socket.on("controller:assigned", ({ slot }) => {
    assignedSlot = slot;
    playerSlotEl.textContent = slot;
    statusEl.textContent = translations[currentLang].statusConnected;
    if (joinPanel) joinPanel.style.display = "none";
  });

  socket.on("controller:error", ({ message }) => {
    statusEl.textContent = message || translations[currentLang].statusError;
  });

  socket.on("room:closed", () => {
    statusEl.textContent = translations[currentLang].statusClosed;
  });
};

if (joinBtn) {
  joinBtn.addEventListener("click", () => {
    connectToRoom(roomInput.value);
  });
}

roomInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    connectToRoom(roomInput.value);
  }
});

applyLanguage();

const syncToActiveRoom = async (force) => {
  try {
    const res = await fetch("/active-room");
    if (!res.ok) throw new Error("No host");
    const data = await res.json();
    if (data?.roomId) {
      localStorage.setItem(ACTIVE_ROOM_KEY, data.roomId);
      if (data.mode) {
        controllerMode = data.mode;
        localStorage.setItem(MODE_KEY, data.mode);
        applyLanguage();
      }
      connectToRoom(data.roomId);
      if (joinPanel) joinPanel.style.display = "none";
      return true;
    }
  } catch (err) {
    if (force) {
      statusEl.textContent = translations[currentLang].statusNoHost;
    }
  }
  return false;
};

if (roomIdFromUrl) {
  connectToRoom(roomIdFromUrl);
  if (joinPanel) joinPanel.style.display = "none";
} else {
  statusEl.textContent = translations[currentLang].statusNoHost;
  if (joinPanel) joinPanel.style.display = "none";
  syncToActiveRoom(false);
  const poll = setInterval(async () => {
    if (assignedSlot) {
      clearInterval(poll);
      return;
    }
    const ok = await syncToActiveRoom(false);
    if (ok) clearInterval(poll);
  }, 2500);
}

if (syncBtn) {
  syncBtn.addEventListener("click", () => {
    syncToActiveRoom(true);
  });
}

buttons.forEach((button) => {
  const action = button.dataset.action;
  pressedState[action] = false;
  lastSend[action] = 0;

  const press = (event) => {
    event.preventDefault();
    const now = performance.now();
    if (pressedState[action]) return;
    if (now - lastSend[action] < 80) return;
    pressedState[action] = true;
    lastSend[action] = now;
    sendInput(action, true);
  };
  const release = (event) => {
    event.preventDefault();
    if (!pressedState[action]) return;
    pressedState[action] = false;
    sendInput(action, false);
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

const updateJoystick = (clientX, clientY) => {
  const rect = joystick.getBoundingClientRect();
  const radius = rect.width / 2 - 12;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.min(Math.hypot(dx, dy), radius);
  const angle = Math.atan2(dy, dx);
  const clampedX = Math.cos(angle) * distance;
  const clampedY = Math.sin(angle) * distance;

  joystickStick.style.transform = `translate(-50%, -50%) translate(${clampedX}px, ${clampedY}px)`;

  const normX = Math.max(-1, Math.min(1, clampedX / radius));
  const normY = Math.max(-1, Math.min(1, clampedY / radius));

  joystickState.x = normX;
  joystickState.y = normY;

  const now = performance.now();
  if (now - joystickState.lastSent > 40) {
    sendInput("move", true, { x: normX, y: normY });
    joystickState.lastSent = now;
  }

  // Flying Zawgyi uses the joystick only for movement.
};

const resetJoystick = () => {
  joystickStick.style.transform = "translate(-50%, -50%)";
  joystickState.x = 0;
  joystickState.y = 0;
  sendInput("move", true, { x: 0, y: 0 });
};

joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (joystickState.active) return;
  joystickState.active = true;
  joystickState.pointerId = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event.clientX, event.clientY);
});

joystick.addEventListener("pointermove", (event) => {
  if (!joystickState.active || joystickState.pointerId !== event.pointerId) return;
  updateJoystick(event.clientX, event.clientY);
});

joystick.addEventListener("pointerup", (event) => {
  if (!joystickState.active || joystickState.pointerId !== event.pointerId) return;
  joystickState.active = false;
  joystick.releasePointerCapture(event.pointerId);
  joystickState.pointerId = null;
  resetJoystick();
});

joystick.addEventListener("pointercancel", () => {
  joystickState.active = false;
  joystickState.pointerId = null;
  resetJoystick();
});
