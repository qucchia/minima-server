export type Author = {
  username: string;
  id: number;
}

export type User = Author & { status: UserStatus };

export type Message = {
  content?: string;
  image?: string;
  author: Author;
  id: number;
}

export enum UserStatus {
  ONLINE,
  OFFLINE,
  IDLE,
  DO_NOT_DISTURB,
}

export type ClientMessage = {
  type: "message",
  message: Message,
} | {
  type: "fetch",
  after: number,
} | {
  type: "fetch",
  before: number,
} | {
  type: "fetch",
  last: true,
} | {
  type: "fetch",
  after: number,
  before: number,
} | {
  type: "delete",
  deleteType: "message",
  id: number,
} | {
  type: "user",
  user: User,
};

export type ServerMessage = {
  type: "messages",
  messages: Message[],
  start: boolean,
} | {
  type: "users",
  users: User[]
};
