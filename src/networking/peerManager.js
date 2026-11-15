import { ROOM_PREFIX, MAX_PLAYERS } from "../config/gameConfig.js?v=pubg-aim-v1";
import { createRoomCode } from "../utils/roomCode.js";
import { setMessage } from "../utils/dom.js";

export class PeerManager {
  constructor(state, Peer, callbacks) {
    this.state = state;
    this.Peer = Peer;
    this.callbacks = callbacks;
  }

  startHost(playerName, retryCount = 0) {
    const state = this.state;
    state.room = createRoomCode();
    setMessage("Creating room...");

    const peer = new this.Peer(ROOM_PREFIX + state.room);
    state.peer = peer;

    peer.on("open", peerId => {
      state.isHost = true;
      state.myId = peerId;
      this.callbacks.setMap(Number(document.getElementById("map").value) || 0);
      this.callbacks.addPlayer(peerId, playerName);
      state.players[peerId].cheatGun = document.getElementById("cheat").checked;
      this.callbacks.enterGame();
      this.callbacks.logDebug(`host peer open, id=${peerId}, room=${state.room}`);

      let previousTime = performance.now();
      let broadcastAccumulator = 0;
      state.tickTimer = window.setInterval(() => {
        const currentTime = performance.now();
        let remaining = Math.min(0.25, (currentTime - previousTime) / 1000);
        previousTime = currentTime;
        broadcastAccumulator += remaining;

        state.inputs[state.myId] = this.callbacks.localInput();
        while (remaining > 0) {
          const stepSeconds = Math.min(remaining, 1 / 60);
          this.callbacks.step(stepSeconds);
          remaining -= stepSeconds;
        }

        if (broadcastAccumulator >= 1 / 30) {
          broadcastAccumulator = 0;
          this.callbacks.broadcast();
        }
      }, 16);

      state.diagnosticsTimer = window.setInterval(() => {
        for (const playerId of Object.keys(state.connections)) {
          if (playerId === state.myId) continue;
          const connection = state.connections[playerId];
          const playerNameForLog = (state.players[playerId] && state.players[playerId].name) || playerId.slice(0, 6);
          const channelState = connection?.dataChannel
            ? connection.dataChannel.readyState
            : "(none)";
          this.callbacks.logDebug(
            `${playerNameForLog}: ${(state.inputCounts[playerId] || 0)} 'in' msgs/3s, open=${!!connection?.open}, channel=${channelState}`
          );
          state.inputCounts[playerId] = 0;
        }
      }, 3000);

      this.callbacks.startRenderLoop();
    });

    peer.on("connection", connection => {
      this.callbacks.logDebug(`incoming connection from ${connection.peer}`);
      connection.on("open", () => this.callbacks.logDebug(`connection open: ${connection.peer}`));
      connection.on("error", error => {
        this.callbacks.logDebug(`connection ERROR (${connection.peer}): ${error?.message || error}`);
      });

      connection.on("data", data => {
        state.lastInputAt[connection.peer] = performance.now();

        if (data && data.t === "join") {
          this.callbacks.logDebug(`join from ${connection.peer} name=${data.name} v=${data.v}`);
          if (data.v !== state.version) {
            state.warning = `${data.name || "A player"} has a different game version. Both of you press Ctrl+Shift+R, then join again.`;
            state.warningTime = performance.now();
            this.callbacks.logDebug(`VERSION MISMATCH: them=${data.v} us=${state.version}`);
          }

          if (state.connections[connection.peer]) return;
          if (Object.keys(state.players).length >= MAX_PLAYERS) {
            connection.send(JSON.stringify({ full: 1 }));
            window.setTimeout(() => connection.close(), 300);
            return;
          }

          state.connections[connection.peer] = connection;
          const player = this.callbacks.addPlayer(connection.peer, data.name);
          player.cheatGun = !!data.ch;
        } else if (data && data.t === "in") {
          state.inputCounts[connection.peer] = (state.inputCounts[connection.peer] || 0) + 1;
          if (
            !state.players[connection.peer]
            && connection.open
            && Object.keys(state.players).length < MAX_PLAYERS
          ) {
            state.connections[connection.peer] = connection;
            const player = this.callbacks.addPlayer(connection.peer, `Player${Math.floor(Math.random() * 100)}`);
            player.cheatGun = false;
            this.callbacks.logDebug(`late-added player for ${connection.peer} from an 'in' message`);
          }
          if (state.players[connection.peer]) state.inputs[connection.peer] = data;
        }
      });

      connection.on("close", () => {
        this.callbacks.logDebug(`connection closed: ${connection.peer}`);
        delete state.connections[connection.peer];
        delete state.players[connection.peer];
        delete state.inputs[connection.peer];
      });
    });

    peer.on("error", error => {
      this.callbacks.logDebug(`peer ERROR: ${error.type}`);
      if (error.type === "unavailable-id" && retryCount < 5) {
        peer.destroy();
        this.startHost(playerName, retryCount + 1);
      } else {
        setMessage(`Could not start: ${error.type}`);
      }
    });
  }

  startJoin(playerName, roomCode) {
    const state = this.state;
    state.room = roomCode.toUpperCase();
    setMessage("Connecting...");

    const peer = new this.Peer();
    state.peer = peer;
    let sentCount = 0;
    let receivedCount = 0;

    peer.on("open", peerId => {
      state.myId = peerId;
      this.callbacks.logDebug(`joiner peer open, id=${peerId}, connecting to room ${state.room}`);
      const hostConnection = peer.connect(ROOM_PREFIX + state.room, {
        reliable: false,
        serialization: "json"
      });
      state.hostConnection = hostConnection;

      const connectionTimeout = window.setTimeout(() => {
        setMessage("Room not found. Check the code.");
      }, 8000);

      hostConnection.on("error", error => {
        this.callbacks.logDebug(`hostConn ERROR: ${error?.message || error}`);
      });

      hostConnection.on("open", () => {
        window.clearTimeout(connectionTimeout);
        this.callbacks.enterGame();
        this.callbacks.logDebug(
          `hostConn open, dataChannel=${hostConnection.dataChannel ? hostConnection.dataChannel.readyState : "(none)"}`
        );

        const joinMessage = {
          t: "join",
          name: playerName,
          ch: document.getElementById("cheat").checked,
          v: state.version
        };
        hostConnection.send(joinMessage);

        const retryJoinTimer = window.setInterval(() => {
          if (state.snapshots.length) {
            window.clearInterval(retryJoinTimer);
          } else if (hostConnection.open) {
            hostConnection.send(joinMessage);
          }
        }, 400);

        window.setInterval(() => {
          if (
            hostConnection.open
            && !(hostConnection.dataChannel && hostConnection.dataChannel.bufferedAmount > 100000)
          ) {
            const localPosition = state.localPlayer
              ? { x: Math.round(state.localPlayer.x * 10) / 10, y: Math.round(state.localPlayer.y * 10) / 10 }
              : {};
            hostConnection.send(Object.assign(
              { t: "in" },
              this.callbacks.localInput(),
              localPosition
            ));
            sentCount += 1;
          }
        }, 1000 / 60);

        window.setInterval(() => {
          this.callbacks.logDebug(
            `sent ${sentCount} 'in'/3s, recv ${receivedCount} snapshots/3s, dc=${hostConnection.dataChannel ? hostConnection.dataChannel.readyState : "?"}, open=${hostConnection.open}`
          );
          sentCount = 0;
          receivedCount = 0;
        }, 3000);

        this.callbacks.startRenderLoop();
      });

      hostConnection.on("data", rawData => {
        receivedCount += 1;
        const snapshot = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
        if (snapshot.full) {
          window.alert("Room is full.");
          window.location.reload();
          return;
        }

        if (snapshot.v !== state.version && !state.warnedAboutVersion) {
          state.warnedAboutVersion = true;
          this.callbacks.logDebug(`VERSION MISMATCH: host=${snapshot.v} us=${state.version}`);
          window.setTimeout(() => {
            window.alert("You and the host have different game versions, so your moves will not show for the host. Both of you press Ctrl+Shift+R (hard refresh), then join again.");
          }, 100);
        }

        if (typeof snapshot.m === "number") this.callbacks.setMap(snapshot.m);
        const now = performance.now() / 1000;
        const measuredOffset = now - snapshot.t;
        state.offset = state.offset === null
          ? measuredOffset
          : state.offset * 0.95 + measuredOffset * 0.05;
        snapshot.rt = now;
        state.snapshots.push(snapshot);
        if (state.snapshots.length > 12) state.snapshots.shift();
      });

      hostConnection.on("close", () => {
        this.callbacks.logDebug("hostConn closed");
        window.alert("Host left the game.");
        window.location.reload();
      });
    });

    peer.on("error", error => {
      this.callbacks.logDebug(`joiner peer ERROR: ${error.type}`);
      setMessage(error.type === "peer-unavailable"
        ? "Room not found. Check the code."
        : `Connection error: ${error.type}`);
    });
  }
}
