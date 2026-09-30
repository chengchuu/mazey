import type { DefineListeners, MazeyFn, MazeyObject } from "./typing";

/**
 * Prevent bubbling.
 *
 * Usage:
 *
 * ```javascript
 * import { cancelBubble } from "mazey";
 *
 * const ret1 = cancelBubble(e);
 * ```
 *
 * @category Event
 */
export function cancelBubble(e: Event): void {
  e.stopPropagation();
}

/**
 * Get the defined listeners.
 *
 * Usage:
 *
 * ```javascript
 * import { getDefineListeners } from "mazey";
 *
 * const ret = getDefineListeners();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * {}
 * ```
 *
 * @category Event
 * @hidden
 */
export function getDefineListeners(): DefineListeners {
  const defineListeners = window.MAZEY_DEFINE_LISTENERS;
  if (defineListeners && typeof defineListeners === "object") {
    return defineListeners;
  }
  const newListeners: DefineListeners = Object.create(null);
  window.MAZEY_DEFINE_LISTENERS = newListeners;
  return newListeners;
}

/**
 * Add event.
 *
 * Usage:
 *
 * ```javascript
 * import { addEvent } from "mazey";
 *
 * addEvent("test", (e) => {
 *  console.log("test event:", e);
 * });
 * fireEvent("test");
 * ```
 *
 * Output:
 *
 * ```javascript
 * test event: { type: "test" }
 * ```
 *
 * @param type
 * @param fn
 * @category Event
 */
export function addEvent(type: string, fn: MazeyFn): void {
  const defineListeners = getDefineListeners();
  if (!Array.isArray(defineListeners[type])) {
    Object.defineProperty(defineListeners, type, {
      configurable: true,
      enumerable: true,
      value: [],
      writable: true,
    });
  }
  if (typeof fn === "function") {
    defineListeners[type].push(fn);
  }
}

/**
 * Fire/Invoke event.
 *
 * Usage:
 *
 * ```javascript
 * import { fireEvent } from "mazey";
 *
 * fireEvent("test");
 * ```
 *
 * @param type The event type.
 * @param params The event parameters.
 * @category Event
 */
export function fireEvent(type: string, params?: MazeyObject): void {
  const defineListeners = getDefineListeners();
  const arrayEvent = defineListeners[type];
  if (Array.isArray(arrayEvent)) {
    const eventQueue = arrayEvent.slice();
    for (let i = 0, length = eventQueue.length; i < length; i++) {
      if (typeof eventQueue[i] === "function") {
        params === undefined ? eventQueue[i]() : eventQueue[i](params);
      }
    }
  }
}

/**
 * Alias of `fireEvent`.
 *
 * @hidden
 */
export function invokeEvent(type: string, params?: MazeyObject): void {
  fireEvent(type, params);
}

/**
 * Remove event.
 *
 * Usage:
 *
 * ```javascript
 * import { removeEvent } from "mazey";
 *
 * removeEvent("test");
 * ```
 *
 * @param type
 * @param fn
 * @category Event
 */
export function removeEvent(type: string, fn?: MazeyFn): void {
  const defineListeners = getDefineListeners();
  const arrayEvent = defineListeners[type];
  if (typeof type === "string" && Array.isArray(arrayEvent)) {
    if (typeof fn === "function") {
      for (let i = 0, length = arrayEvent.length; i < length; i++) {
        if (arrayEvent[i] === fn) {
          defineListeners[type].splice(i, 1);
          break;
        }
      }
    } else {
      delete defineListeners[type];
    }
  }
}
