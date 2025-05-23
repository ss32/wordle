import { writable } from "svelte/store";
import { Settings, LetterStates } from "./utils";
/**
 * A writable store identical in functionality to the Svelte writable store with an extra parameter
 * in the set function.
 */
class Writable {
    static subscriber_queue = [];
    stop;
    start;
    value;
    subscribers;
    constructor(value, start = Writable.noop) {
        this.subscribers = new Set();
        this.start = start;
        this.value = value;
    }
    /**
     * Set value and inform subscribers. If the new value is the same as the old value subscribers
     * will not be updated unless `always_update` is true.
     * @param new_value - The value to set.
     * @param always_update - If true subscribers will be updated even if the new value is the same
     * as the previous value.
     */
    set(new_value, always_update = false) {
        if (always_update || Writable.safe_not_equal(this.value, new_value)) {
            this.value = new_value;
            if (stop) { // store is ready
                const run_queue = !Writable.subscriber_queue.length;
                for (const subscriber of this.subscribers) {
                    subscriber[1]();
                    Writable.subscriber_queue.push(subscriber, this.value);
                }
                if (run_queue) {
                    for (let i = 0; i < Writable.subscriber_queue.length; i += 2) {
                        Writable.subscriber_queue[i][0](Writable.subscriber_queue[i + 1]);
                    }
                    // empty queue
                    Writable.subscriber_queue.length = 0;
                }
            }
        }
    }
    /**
     * Update value using callback and inform subscribers.
     * @param updater - callback
     */
    update(updater) {
        this.set(updater(this.value));
    }
    /**
     * Subscribe on value changes.
     * @param run - subscription callback
     * @param invalidate - cleanup callback
     */
    subscribe(run, invalidate = Writable.noop) {
        const subscriber = [run, invalidate];
        this.subscribers.add(subscriber);
        if (this.subscribers.size === 1) {
            this.stop = this.start(this.set) || Writable.noop;
        }
        run(this.value);
        return () => {
            this.subscribers.delete(subscriber);
            if (this.subscribers.size === 0) {
                this.stop();
                this.stop = null;
            }
        };
    }
    /**
     * check that two values are not equal to each other while avoiding some of JavaScript's
     * unintuitive comparison nonsense.
     */
    static safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    /** Dummy function to be used as a default value. */
    static noop() {
        return null;
    }
}
export const mode = new Writable();
export const letterStates = writable(new LetterStates());
export const settings = writable(new Settings());
//# sourceMappingURL=stores.js.map