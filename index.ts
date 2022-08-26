import WebSocket, { WebSocketServer } from "ws";
import Database from "@replit/database";
import readline from "readline";
import {
  ClientMessage,
  ServerMessage,
  Message,
  User,
  UserStatus
} from "./types";
import fetchRemixicons from "./remixicon";

const wss = new WebSocketServer({ port: 8080 });
const db = new Database();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

type UserConnection = {
  webSocket: WebSocket;
  user?: User;
}

let onlineUsers: UserConnection[] = [];
let messages: Message[] = [];
const MAX_MESSAGES = 1000;
const MESSAGES_PER_PAGE = 10;

function send(message: ServerMessage, ws: WebSocket) {
  ws.send(JSON.stringify(message));
}

function sendToAll(message: ServerMessage, author: WebSocket) {
  onlineUsers
    .filter((user) => user.webSocket !== author)
    .forEach((user) => user.webSocket.send(JSON.stringify(message)));
}

function sendMessages(to: number, ws: WebSocket) {
  const from = Math.max(0, to - MESSAGES_PER_PAGE);
  send({
    type: "messages",
    messages: messages.slice(from, to),
    start: !from,
  }, ws);
}

function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let l = array.length;
    while (l--) {
      if (predicate(array[l], l, array)) return l;
    }
    return -1;
}

function prompt() {
  rl.question("> ", function (command) {
    switch (command) {
      case "clear":
        db.set("messages", []);
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
  messages = await db.get("messages") as Message[] || [];
  const remixicons = await fetchRemixicons();

  wss.on("connection", (ws: WebSocket) => {
    const user: UserConnection = { webSocket: ws };
    onlineUsers.push(user);
    send({
      type: "users",
      users: onlineUsers.map((u) => u.user).filter((u) => u),
    }, ws);
    
    ws.on("message", (data: Buffer) => {
      const wsMessage = JSON.parse(data.toString()) as ClientMessage;

      switch (wsMessage.type) {
        case "message":
          messages.push(wsMessage.message);
          messages = messages.slice(0, MAX_MESSAGES)
          db.set("messages", messages);
          sendToAll({
            type: "messages",
            messages: [wsMessage.message],
            start: false
          }, ws);
          break;
        case "fetch":
          if ("last" in wsMessage) {
            sendMessages(messages.length, ws);
          } else if ("before" in wsMessage) {
            const i = findLastIndex(
              messages,
              (m) => m.id <= wsMessage.before
            );
            sendMessages(i, ws);
          } else {
            const i = messages.findIndex(
              (m) => m.id >= wsMessage.after
            );
            sendMessages(i + MESSAGES_PER_PAGE, ws);
          }
          break;
        case "delete":
          switch (wsMessage.deleteType) {
            case "message":
              messages = messages.filter(
                (message) => message.id !== wsMessage.id
              );
              break;
          }
          break;
        case "user":
          user.user = wsMessage.user;
          sendToAll({
            type: "users",
            users: [wsMessage.user],
          }, ws);
          break;
      }
    });
    
    ws.on("close", () => {
      if (user.user) {
        user.user.status = UserStatus.OFFLINE;
        sendToAll({
          type: "users",
          users: [user.user],
        }, ws);
      }
      onlineUsers = onlineUsers.filter((s) => s.webSocket !== ws);
    });
  });
  
  prompt();
}

init();