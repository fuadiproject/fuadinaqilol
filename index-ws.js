const express = require("express");
const server = require("http").createServer();
const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);

server.listen(3000, function () {
  console.log("Listening on 3000");
});

/** Begin websocket */
const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ server: server });

wss.on("connection", function connection(ws) {
  const numClients = wss.clients.size;
  console.log("Client connected ", numClients);

  wss.broadcast(`Current visitor count: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send("Welcome to the server!");
  }

  ws.on("close", function close() {
    console.log("Client disconnected");
    const numClients = wss.clients.size;
    wss.broadcast(`Current visitor count: ${numClients}`);
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};

wss.on("error", function error(error) {
  console.log("WebSocket error:", error);
});

wss.on("close", function close() {
  console.log("WebSocket closed");
});
