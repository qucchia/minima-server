var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var import_ws = __toModule(require("ws"));
var import_database = __toModule(require("@replit/database"));
var import_readline = __toModule(require("readline"));
var import_types = __toModule(require("./types"));
var import_remixicon = __toModule(require("./remixicon"));
const wss = new import_ws.WebSocketServer({ port: 8080 });
const db = new import_database.default();
const rl = import_readline.default.createInterface({
  input: process.stdin,
  output: process.stdout
});
let onlineUsers = [];
let messages = [];
const MAX_MESSAGES = 1e3;
const MESSAGES_PER_PAGE = 10;
function send(message, ws) {
  ws.send(JSON.stringify(message));
}
function sendToAll(message, author) {
  onlineUsers.filter((user) => user.webSocket !== author).forEach((user) => user.webSocket.send(JSON.stringify(message)));
}
function sendMessages(to, ws) {
  const from = Math.max(0, to - MESSAGES_PER_PAGE);
  send({
    type: "messages",
    messages: messages.slice(from, to),
    start: !from
  }, ws);
}
function prompt() {
  rl.question("> ", function(command) {
    switch (command) {
      case "clear":
        db.set("messages", "[]");
        messages = [];
        console.log("Cleared messages");
        break;
      case "count":
        console.log(messages.length);
        break;
      case "messages":
        console.log(messages);
        break;
      default:
        console.log("Command not recognised.");
    }
    prompt();
  });
}
async function init() {
  messages = await db.get("messages") || [];
  const remixicons = await (0, import_remixicon.default)();
  wss.on("connection", (ws) => {
    const user = { webSocket: ws };
    onlineUsers.push(user);
    send({
      type: "users",
      users: onlineUsers.map((u) => u.user).filter((u) => u)
    }, ws);
    ws.on("message", (data) => {
      const wsMessage = JSON.parse(data.toString());
      switch (wsMessage.type) {
        case "message":
          messages.push(wsMessage.message);
          messages = messages.slice(0, MAX_MESSAGES);
          db.set("messages", messages);
          sendToAll({
            type: "messages",
            messages: [wsMessage.message],
            start: false
          }, ws);
          break;
        case "fetch":
          if ("after" in wsMessage) {
            const i = messages.findIndex((m) => m.timestamp >= wsMessage.after);
            sendMessages(i + MESSAGES_PER_PAGE, ws);
          } else {
            const i = messages.findIndexLast((m) => m.timestamp <= wsMessage.before);
            sendMessages(i, ws);
          }
          break;
        case "delete":
          switch (wsMessage.deleteType) {
            case "message":
              messages = messages.filter((message) => message.timestamp !== message.delete.message);
              break;
          }
          break;
        case "user":
          console.log("Set user", wsMessage.user);
          user.user = wsMessage.user;
          sendToAll({
            type: "users",
            users: [wsMessage.user]
          }, ws);
          break;
      }
    });
    ws.on("close", () => {
      if (user.user) {
        user.user.status = import_types.UserStatus.OFFLINE;
        sendToAll({
          type: "users",
          users: [user.user]
        }, ws);
      }
      onlineUsers = onlineUsers.filter((s) => s.webSocket !== ws);
    });
  });
  prompt();
}
init();
//# sourceMappingURL=index.js.map
