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

  db.run(`
    INSERT INTO visitors (count, time)
    VALUES (${numClients}, datetime('now'))
  `);

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
/** End websocket */

/** Begin Database */
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(":memory:");

db.serialize(function () {
  db.run(
    `CREATE TABLE visitors (
      count INTEGER,
      time TEXT
    )`
  );
});

function getCounts() {
  db.each("SELECT * FROM visitors", function (err, row) {
    console.log(row);
  });
}

function shutdownDB() {
  getCounts();
  console.log("Shutting down DB");
  db.close();
}

/** End Database */

process.on("SIGINT", () => {
  console.log("SIGINT received");
  wss.clients.forEach(function each(client) {
    client.close();
  });
  server.close(() => {
    console.log("Server closed");
    shutdownDB();
  });
});
