/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  cancelBubble, getDefineListeners,
  addEvent, fireEvent, invokeEvent, removeEvent,
} from "../lib/index.esm";

describe("cancelBubble", () => {
  it("should call stopPropagation if available", () => {
    const eventMock = {
      stopPropagation: jest.fn(),
      cancelBubble: false,
    };

    cancelBubble(eventMock);

    expect(eventMock.stopPropagation).toHaveBeenCalled();
    expect(eventMock.cancelBubble).toBe(false);
  });

  it("should set cancelBubble to true if stopPropagation is not available", () => {
    const eventMock = {
      stopPropagation: undefined,
      cancelBubble: false,
    };

    cancelBubble(eventMock);

    expect(eventMock.cancelBubble).toBe(true);
  });
});

describe("getDefineListeners", () => {
  beforeEach(() => {
    // Reset the global variable before each test
    window.MAZEY_DEFINE_LISTENERS = undefined;
  });

  it("should return an empty object if defineListeners is not defined", () => {
    const defineListeners = getDefineListeners();
    expect(defineListeners).toEqual({});
  });

  it("should return the existing defineListeners object if it is defined", () => {
    const existingListeners = { event1: () => {}, event2: () => {} };
    window.MAZEY_DEFINE_LISTENERS = existingListeners;

    const defineListeners = getDefineListeners();
    expect(defineListeners).toBe(existingListeners);
  });

  it("should create a new defineListeners object if it is not an object", () => {
    window.MAZEY_DEFINE_LISTENERS = "not an object";

    const defineListeners = getDefineListeners();
    expect(defineListeners).toEqual({});
  });
});

describe("Event System", () => {
  // Mock function to use as event handler
  const mockFn = jest.fn();

  // Reset the mock and the MAZEY_DEFINE_LISTENERS before each test
  beforeEach(() => {
    mockFn.mockReset();
    window.MAZEY_DEFINE_LISTENERS = {};
  });

  test("getDefineListeners initializes and retrieves the event listeners object", () => {
    const defineListeners = getDefineListeners();
    expect(defineListeners).toEqual({});
    expect(window.MAZEY_DEFINE_LISTENERS).toBe(defineListeners);
  });

  test("addEvent adds a new event listener", () => {
    addEvent("test", mockFn);
    const defineListeners = getDefineListeners();
    expect(defineListeners["test"]).toEqual([ mockFn ]);
  });

  test("fireEvent invokes the event listeners for an event", () => {
    addEvent("test", mockFn);
    fireEvent("test", { type: "test" });
    expect(mockFn).toHaveBeenCalledWith({ type: "test" });
  });

  test("invokeEvent is an alias for fireEvent and invokes the event listeners", () => {
    addEvent("test", mockFn);
    invokeEvent("test");
    // called with 0 arguments
    expect(mockFn).toHaveBeenCalled();
  });

  test("removeEvent removes a specific event listener", () => {
    addEvent("test", mockFn);
    const anotherMock = jest.fn();
    addEvent("test", anotherMock);

    removeEvent("test", mockFn);
    const defineListeners = getDefineListeners();
    expect(defineListeners["test"]).toEqual([ anotherMock ]);
  });

  test("removeEvent clears all listeners for an event type if no function is provided", () => {
    addEvent("test", mockFn);
    removeEvent("test");
    const defineListeners = getDefineListeners();
    expect(defineListeners["test"]).toBeUndefined();
  });
});

