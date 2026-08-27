import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisConnection } from "@notify/queue";

// ============================================================================
// Real-time In-App Notification WebSocket Service
// Powers live in-app notifications for end-users across distributed nodes using
// Socket.IO and Redis Pub/Sub.
//
// Architecture:
// - Redis Adapter: Enables horizontal scaling across multiple WebSocket server replicas.
// - Subscriber Pattern: Listens to `inapp:*` channels published by the background worker.
// - Room Architecture: Sockets join rooms formatted as `<projectId>:<externalId>`.
// ============================================================================

const PORT = process.env.WS_PORT || 3002;

// Dedicated Redis clients for Socket.IO multi-node clustering adapter
const pubClient = createRedisConnection();
const subClient = createRedisConnection();

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Attach Redis adapter for cross-node socket broadcasting
io.adapter(createAdapter(pubClient, subClient));

// Dedicated Redis client for application-level Pub/Sub listening
const subscriber = createRedisConnection();

// ─── Redis Pub/Sub Inbound Listener ─────────────────────────

// Subscribe to all in-app notification publish channels
subscriber.psubscribe("inapp:*", (err) => {
  if (err) {
    console.error("Failed to subscribe to in-app channel", err);
    process.exit(1);
  } else {
    console.log("Subscribed to in-app channel");
  }
});

// When worker publishes a message, forward it to the specific subscriber's room
subscriber.on("pmessage", (_pattern, channel, message) => {
  const room = channel.replace("inapp:", "");
  io.to(room).emit("notification", JSON.parse(message));
});

// ─── Socket.IO Client Connection & Handshake ────────────────

io.on("connection", (socket) => {
  // Extract authentication parameters from client handshake
  const { projectId, externalId } = socket.handshake.auth as {
    projectId: string;
    externalId: string;
  };

  // Reject connections missing mandatory project or subscriber identity
  if (!projectId || !externalId) {
    socket.disconnect(true);
    return;
  }

  // Join targeted room partitioned by project and subscriber
  const room = `${projectId}:${externalId}`;
  socket.join(room);

  console.log(`Socket connected — room: ${room}`);

  // Fetch unread notification backlog stored in Redis list
  const redisKey = `inapp:${projectId}:${externalId}`;

  pubClient
    .lrange(redisKey, 0, -1)
    .then((items) => {
      if (items.length === 0) return;

      const notifications = items.map((item) => JSON.parse(item));
      socket.emit("unread", notifications);
    })
    .catch(console.error);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected — room: ${room}`);
  });
});

// ─── Server Bootstrap ───────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});

// ─── Graceful Process Shutdown ──────────────────────────────

async function shutdown() {
  console.log("Shutting down ws server...");
  await pubClient.quit();
  await subClient.quit();
  await subscriber.quit();
  io.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
