export var GameMode;
(function (GameMode) {
    GameMode[GameMode["daily"] = 0] = "daily";
    GameMode[GameMode["hourly"] = 1] = "hourly";
    GameMode[GameMode["infinite"] = 2] = "infinite";
    // "minutely",
})(GameMode || (GameMode = {}));
;
export var ms;
(function (ms) {
    ms[ms["SECOND"] = 1000] = "SECOND";
    ms[ms["MINUTE"] = 60000] = "MINUTE";
    ms[ms["HOUR"] = 3600000] = "HOUR";
    ms[ms["DAY"] = 86400000] = "DAY";
})(ms || (ms = {}));
;
//# sourceMappingURL=enums.js.map