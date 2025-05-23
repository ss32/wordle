import seedRandom from "seedrandom";
import { GameMode, ms } from "./enums";
import wordList from "./words_5";
export const ROWS = 6;
export const COLS = 5;
export const words = {
    ...wordList,
    contains: (word) => {
        return wordList.words.includes(word) || wordList.valid.includes(word);
    },
};
class Tile {
    value;
    notSet;
    constructor() {
        this.notSet = new Set();
    }
    not(char) {
        this.notSet.add(char);
    }
}
class WordData {
    letterCounts;
    notSet;
    word;
    constructor() {
        this.notSet = new Set();
        this.letterCounts = new Map();
        this.word = [];
        for (let col = 0; col < COLS; ++col) {
            this.word.push(new Tile());
        }
    }
    confirmCount(char) {
        let c = this.letterCounts.get(char);
        if (!c) {
            this.not(char);
        }
        else {
            c[1] = true;
        }
    }
    countConfirmed(char) {
        const val = this.letterCounts.get(char);
        return val ? val[1] : false;
    }
    setCount(char, count) {
        let c = this.letterCounts.get(char);
        if (!c) {
            this.letterCounts.set(char, [count, false]);
        }
        else {
            c[0] = count;
        }
    }
    incrementCount(char) {
        ++this.letterCounts.get(char)[0];
    }
    not(char) {
        this.notSet.add(char);
    }
    inGlobalNotList(char) {
        return this.notSet.has(char);
    }
    lettersNotAt(pos) {
        return new Set([...this.notSet, ...this.word[pos].notSet]);
    }
}
export function getRowData(n, board) {
    const wd = new WordData();
    for (let row = 0; row < n; ++row) {
        const occurred = new Set();
        for (let col = 0; col < COLS; ++col) {
            const state = board.state[row][col];
            const char = board.words[row][col];
            if (state === "⬛") {
                wd.confirmCount(char);
                // if char isn't in the global not list add it to the not list for that position
                if (!wd.inGlobalNotList(char)) {
                    wd.word[col].not(char);
                }
                continue;
            }
            // If this isn't the first time this letter has occurred in this row
            if (occurred.has(char)) {
                wd.incrementCount(char);
            }
            else if (!wd.countConfirmed(char)) {
                occurred.add(char);
                wd.setCount(char, 1);
            }
            if (state === "🟩") {
                wd.word[col].value = char;
            }
            else { // if (state === "🟨")
                wd.word[col].not(char);
            }
        }
    }
    let exp = "";
    for (let pos = 0; pos < wd.word.length; ++pos) {
        exp += wd.word[pos].value ? wd.word[pos].value : `[^${[...wd.lettersNotAt(pos)].join(" ")}]`;
    }
    return (word) => {
        if (new RegExp(exp).test(word)) {
            const chars = word.split("");
            for (const e of wd.letterCounts) {
                const occurrences = countOccurrences(chars, e[0]);
                if (!occurrences || (e[1][1] && occurrences !== e[1][0]))
                    return false;
            }
            return true;
        }
        return false;
    };
}
function countOccurrences(arr, val) {
    return arr.reduce((count, v) => v === val ? count + 1 : count, 0);
}
export function contractNum(n) {
    switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
    }
}
export const keys = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
/**
 * Return a deterministic number based on the given mode and current or given time.
 * @param mode - The mode
 * @param time - The time. If omitted current time is used
 */
export function newSeed(mode, time) {
    const now = time ?? Date.now();
    switch (mode) {
        case GameMode.daily:
            // Adds time zone offset to UTC time, calculates how many days that falls after 1/1/1970
            // and returns the unix time for the beginning of that day.
            return Date.UTC(1970, 0, 1 + Math.floor((now - (new Date().getTimezoneOffset() * ms.MINUTE)) / ms.DAY));
        case GameMode.hourly:
            return now - (now % ms.HOUR);
        // case GameMode.minutely:
        // 	return now - (now % ms.MINUTE);
        case GameMode.infinite:
            return now - (now % ms.SECOND);
    }
}
export const modeData = {
    default: GameMode.daily,
    modes: [
        {
            name: "Daily",
            unit: ms.DAY,
            start: 1642370400000,
            seed: newSeed(GameMode.daily),
            historical: false,
            streak: true,
            useTimeZone: true,
        },
        {
            name: "Hourly",
            unit: ms.HOUR,
            start: 1642528800000,
            seed: newSeed(GameMode.hourly),
            historical: false,
            icon: "m50,7h100v33c0,40 -35,40 -35,60c0,20 35,20 35,60v33h-100v-33c0,-40 35,-40 35,-60c0,-20 -35,-20 -35,-60z",
            streak: true,
        },
        {
            name: "Infinite",
            unit: ms.SECOND,
            start: 1642428600000,
            seed: newSeed(GameMode.infinite),
            historical: false,
            icon: "m7,100c0,-50 68,-50 93,0c25,50 93,50 93,0c0,-50 -68,-50 -93,0c-25,50 -93,50 -93,0z",
        },
        // {
        // 	name: "Minutely",
        // 	unit: ms.MINUTE,
        // 	start: 1642528800000,	// 18/01/2022 8:00pm
        // 	seed: newSeed(GameMode.minutely),
        // 	historical: false,
        // 	icon: "m7,200v-200l93,100l93,-100v200",
        // 	streak: true,
        // },
    ]
};
/**
 * Return the word number for the given mode at the time that that mode's seed was set.
 * @param mode - The game mode
 * @param current - If true the word number will be for the current time rather than for the current
 * seed for the given mode. Useful if you want the current game number during a historical game.
 */
export function getWordNumber(mode, current) {
    const seed = current ? newSeed(mode) : modeData.modes[mode].seed;
    return Math.round((seed - modeData.modes[mode].start) / modeData.modes[mode].unit) + 1;
}
export function seededRandomInt(min, max, seed) {
    const rng = seedRandom(`${seed}`);
    return Math.floor(min + (max - min) * rng());
}
export const DELAY_INCREMENT = 200;
export const PRAISE = [
    "Genius",
    "Magnificent",
    "Impressive",
    "Splendid",
    "Great",
    "Phew",
];
class Storable {
    toString() { return JSON.stringify(this); }
}
export class GameState extends Storable {
    active;
    guesses;
    validHard;
    time;
    wordNumber;
    board;
    #valid = false;
    #mode;
    constructor(mode, data) {
        super();
        this.#mode = mode;
        if (data) {
            this.parse(data);
        }
        if (!this.#valid) {
            this.active = true;
            this.guesses = 0;
            this.validHard = true;
            this.time = modeData.modes[mode].seed;
            this.wordNumber = getWordNumber(mode);
            this.board = {
                words: Array(ROWS).fill(""),
                state: Array.from({ length: ROWS }, () => (Array(COLS).fill("🔳"))),
            };
            this.#valid = true;
        }
    }
    get latestWord() {
        return this.board.words[this.guesses];
    }
    get lastState() {
        return this.board.state[this.guesses - 1];
    }
    get lastWord() {
        return this.board.words[this.guesses - 1];
    }
    /**
    * Returns an object containing the position of the character in the latest word that violates
    * hard mode, and what type of violation it is, if there is a violation.
    */
    checkHardMode() {
        for (let i = 0; i < COLS; ++i) {
            if (this.board.state[this.guesses - 1][i] === "🟩" && this.board.words[this.guesses - 1][i] !== this.board.words[this.guesses][i]) {
                return { pos: i, char: this.board.words[this.guesses - 1][i], type: "🟩" };
            }
        }
        for (let i = 0; i < COLS; ++i) {
            if (this.board.state[this.guesses - 1][i] === "🟨" && !this.board.words[this.guesses].includes(this.board.words[this.guesses - 1][i])) {
                return { pos: i, char: this.board.words[this.guesses - 1][i], type: "🟨" };
            }
        }
        return { pos: -1, char: "", type: "⬛" };
    }
    guess(word) {
        const characters = word.split("");
        const result = Array(COLS).fill("⬛");
        for (let i = 0; i < COLS; ++i) {
            if (characters[i] === this.latestWord.charAt(i)) {
                result[i] = "🟩";
                characters[i] = "$";
            }
        }
        for (let i = 0; i < COLS; ++i) {
            const pos = characters.indexOf(this.latestWord[i]);
            if (result[i] !== "🟩" && pos >= 0) {
                characters[pos] = "$";
                result[i] = "🟨";
            }
        }
        return result;
    }
    parse(str) {
        const parsed = JSON.parse(str);
        if (parsed.wordNumber !== getWordNumber(this.#mode))
            return;
        this.active = parsed.active;
        this.guesses = parsed.guesses;
        this.validHard = parsed.validHard;
        this.time = parsed.time;
        this.wordNumber = parsed.wordNumber;
        this.board = parsed.board;
        this.#valid = true;
    }
}
export class Settings extends Storable {
    hard = new Array(modeData.modes.length).fill(false);
    dark = true;
    colorblind = false;
    tutorial = 3;
    constructor(settings) {
        super();
        if (settings) {
            const parsed = JSON.parse(settings);
            this.hard = parsed.hard;
            this.dark = parsed.dark;
            this.colorblind = parsed.colorblind;
            this.tutorial = parsed.tutorial;
        }
    }
}
export class Stats extends Storable {
    played = 0;
    lastGame = 0;
    guesses = {
        fail: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
    };
    streak;
    maxStreak;
    #hasStreak = false;
    constructor(param) {
        super();
        if (typeof param === "string") {
            this.parse(param);
        }
        else if (modeData.modes[param].streak) {
            this.streak = 0;
            this.maxStreak = 0;
            this.#hasStreak = true;
        }
    }
    parse(str) {
        const parsed = JSON.parse(str);
        this.played = parsed.played;
        this.lastGame = parsed.lastGame;
        this.guesses = parsed.guesses;
        if (parsed.streak != undefined) {
            this.streak = parsed.streak;
            this.maxStreak = parsed.maxStreak;
            this.#hasStreak = true;
        }
    }
    /**
     * IMPORTANT: When this method is called svelte will not register the update, so you need to set
     * the variable that this object is assigned to equal to itself to force an update.
     * Example: `states = states;`.
     */
    addWin(guesses, mode) {
        ++this.guesses[guesses];
        ++this.played;
        if (this.#hasStreak) {
            this.streak = mode.seed - this.lastGame > mode.unit ? 1 : this.streak + 1;
            this.maxStreak = Math.max(this.streak, this.maxStreak);
        }
        this.lastGame = mode.seed;
    }
    /**
     * IMPORTANT: When this method is called svelte will not register the update, so you need to set
     * the variable that this object is assigned to equal to itself to force an update.
     * Example: `states = states;`.
     */
    addLoss(mode) {
        ++this.guesses.fail;
        ++this.played;
        if (this.#hasStreak)
            this.streak = 0;
        this.lastGame = mode.seed;
    }
    get hasStreak() { return this.#hasStreak; }
}
export class LetterStates {
    a = "🔳";
    b = "🔳";
    c = "🔳";
    d = "🔳";
    e = "🔳";
    f = "🔳";
    g = "🔳";
    h = "🔳";
    i = "🔳";
    j = "🔳";
    k = "🔳";
    l = "🔳";
    m = "🔳";
    n = "🔳";
    o = "🔳";
    p = "🔳";
    q = "🔳";
    r = "🔳";
    s = "🔳";
    t = "🔳";
    u = "🔳";
    v = "🔳";
    w = "🔳";
    x = "🔳";
    y = "🔳";
    z = "🔳";
    constructor(board) {
        if (board) {
            for (let row = 0; row < ROWS; ++row) {
                for (let col = 0; col < board.words[row].length; ++col) {
                    if (this[board.words[row][col]] === "🔳" || board.state[row][col] === "🟩") {
                        this[board.words[row][col]] = board.state[row][col];
                    }
                }
            }
        }
    }
    ;
    /**
     * IMPORTANT: When this method is called svelte will not register the update, so you need to set
     * the variable that this object is assigned to equal to itself to force an update.
     * Example: `states = states;`.
     */
    update(state, word) {
        state.forEach((e, i) => {
            const ls = this[word[i]];
            if (ls === "🔳" || e === "🟩") {
                this[word[i]] = e;
            }
        });
    }
}
export function timeRemaining(m) {
    if (m.useTimeZone) {
        return m.unit - (Date.now() - (m.seed + new Date().getTimezoneOffset() * ms.MINUTE));
    }
    return m.unit - (Date.now() - m.seed);
}
export function failed(s) {
    return !(s.active || (s.guesses > 0 && s.board.state[s.guesses - 1].join("") === "🟩".repeat(COLS)));
}
//# sourceMappingURL=utils.js.map