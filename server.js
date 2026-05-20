const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map();
const socketIndex = new Map();
let activeRoomId = null;

const PROJECT_ROOT = __dirname;
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

function loadEnvFile() {
  const envPath = path.join(PROJECT_ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const entry of interfaces[name]) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }
  return "127.0.0.1";
}

function buildHostUrl(hostHeader) {
  if (process.env.HOST_URL) return process.env.HOST_URL.replace(/\/$/, "");
  const [host, port] = (hostHeader || "").split(":");
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || !host;
  const resolvedHost = isLocal ? getLanIp() : host;
  const resolvedPort = port || process.env.PORT || 3000;
  return `http://${resolvedHost}:${resolvedPort}`;
}

loadEnvFile();

function createRoomId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  if (rooms.has(id)) return createRoomId();
  return id;
}

function releaseRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit("room:closed");
  room.controllers.forEach((socketId) => socketIndex.delete(socketId));
  rooms.delete(roomId);
  if (activeRoomId === roomId) {
    activeRoomId = null;
  }
}

app.use(express.static(PUBLIC_DIR));
app.use("/vendor", express.static(path.join(PROJECT_ROOT, "node_modules")));

app.get("/host-info", (req, res) => {
  res.json({ hostUrl: buildHostUrl(req.headers.host) });
});

app.get("/active-room", (req, res) => {
  if (!activeRoomId || !rooms.has(activeRoomId)) {
    res.json({ roomId: null, mode: null });
    return;
  }
  const room = rooms.get(activeRoomId);
  res.json({ roomId: activeRoomId, mode: room?.mode || null });
});

io.on("connection", (socket) => {
  socket.on("host:create", () => {
    const roomId = createRoomId();
    rooms.set(roomId, {
      hostId: socket.id,
      controllers: new Map(),
      mode: null,
    });
    socketIndex.set(socket.id, { type: "host", roomId });
    socket.join(roomId);
    activeRoomId = roomId;
    socket.emit("host:ready", { roomId });
  });

  socket.on("host:mode", ({ roomId, mode }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    room.mode = mode || null;
  });

  socket.on("controller:join", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("controller:error", { message: "Room not found" });
      return;
    }
    if (room.controllers.size >= 2) {
      socket.emit("controller:error", { message: "Room full" });
      return;
    }
    const slot = room.controllers.has(1) ? 2 : 1;
    room.controllers.set(slot, socket.id);
    socketIndex.set(socket.id, { type: "controller", roomId, slot });
    socket.join(roomId);
    socket.emit("controller:assigned", { roomId, slot });
    io.to(room.hostId).emit("controller:connected", { slot });
  });

  socket.on("controller:input", ({ roomId, slot, action, pressed, value }) => {
    const room = rooms.get(roomId);
    if (!room || room.hostId == null) return;
    io.to(room.hostId).emit("controller:input", {
      slot,
      action,
      pressed: Boolean(pressed),
      value,
    });
  });

  socket.on("disconnect", () => {
    const record = socketIndex.get(socket.id);
    if (!record) return;

    if (record.type === "host") {
      releaseRoom(record.roomId);
    }

    if (record.type === "controller") {
      const room = rooms.get(record.roomId);
      if (room) {
        room.controllers.delete(record.slot);
        io.to(room.hostId).emit("controller:disconnected", { slot: record.slot });
      }
    }

    socketIndex.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`Flying Zawgyi server running on http://localhost:${PORT}`);
});
