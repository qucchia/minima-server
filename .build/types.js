var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
__export(exports, {
  UserStatus: () => UserStatus
});
var UserStatus;
(function(UserStatus2) {
  UserStatus2[UserStatus2["ONLINE"] = 0] = "ONLINE";
  UserStatus2[UserStatus2["OFFLINE"] = 1] = "OFFLINE";
  UserStatus2[UserStatus2["IDLE"] = 2] = "IDLE";
  UserStatus2[UserStatus2["DO_NOT_DISTURB"] = 3] = "DO_NOT_DISTURB";
})(UserStatus || (UserStatus = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserStatus
});
//# sourceMappingURL=types.js.map
