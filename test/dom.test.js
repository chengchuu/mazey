/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  genStyleString, getDomain, getBrowserInfo,
  setClass, setImgSizeBySrc, addClass,
  newLine, hasClass, removeClass, addStyle,
} from "../lib/index.esm";

test("newLine: Transfer 'a\nb\nc' to 'a<br />b<br />c'?", () => {
  expect(newLine("a\nb\nc")).toBe("a<br />b<br />c");
});

test("newLine: Transfer 'a\n\nbc' to 'a<br /><br />bc'?", () => {
  expect(newLine("a\n\nbc")).toBe("a<br /><br />bc");
});

test("Can get Domain's params correctly? 'http://example.com/test'?", async () => {
  const res = await getDomain("http://example.com/test/thanks?t1=1&t2=2&t3=3&t4=4", [ "hostname", "pathname" ]); // example.com/test/thanks
  expect(res).toBe("example.com/test/thanks");
});

// Simulate the async.
function wasteTime (ms) {
  return new Promise(resolve => setTimeout(() => {
    resolve(ms);
  }, ms));
}

test("Can run async test?", async () => {
  const res = await wasteTime(1000);
  expect(res).toBe(1000);
});

test("Can get browser info correctly?", () => {
  const res = getBrowserInfo();
  expect(res).toHaveProperty("engine");
  expect(res).toHaveProperty("engineVs");
  expect(res).toHaveProperty("platform");
  expect(res).toHaveProperty("supporter");
  expect(res).toHaveProperty("supporterVs");
  expect(res).toHaveProperty("system");
  expect(res).toHaveProperty("systemVs");
});

describe("genStyleString", () => {
  it("should generate the correct style string for a class selector and one style property", () => {
    const selector = ".a";
    const styleArray = [ "color:red" ];
    const expected = ".a{color:red;}";
    const result = genStyleString(selector, styleArray);
    expect(result).toEqual(expected);
  });

  it("should generate the correct style string for an ID selector and multiple style properties", () => {
    const selector = "#b";
    const styleArray = [ "color:red", "font-size:12px" ];
    const expected = "#b{color:red;font-size:12px;}";
    const result = genStyleString(selector, styleArray);
    expect(result).toEqual(expected);
  });

  it("should return an empty string if no style properties are provided", () => {
    const selector = ".c";
    const styleArray = [];
    const expected = ".c{}";
    const result = genStyleString(selector, styleArray);
    expect(result).toEqual(expected);
  });

  it("should handle selectors with multiple classes", () => {
    const selector = ".d.e.f";
    const styleArray = [ "color:blue", "font-weight:bold" ];
    const expected = ".d.e.f{color:blue;font-weight:bold;}";
    const result = genStyleString(selector, styleArray);
    expect(result).toEqual(expected);
  });
});

// Test case 1: Object has the specified class
test("Object has the specified class", () => {
  const obj = document.createElement("div");
  obj.className = "foo bar baz";
  const cls = "bar";
  expect(hasClass(obj, cls)).toBe(true);
});

// Test case 2: Object does not have the specified class
test("Object does not have the specified class", () => {
  const obj = document.createElement("div");
  obj.className = "foo baz";
  const cls = "bar";
  expect(hasClass(obj, cls)).toBe(false);
});

// Test case 3: Object has multiple classes and one of them matches the specified class
test("Object has multiple classes and one of them matches the specified class", () => {
  const obj = document.createElement("div");
  obj.className = "foo bar baz";
  const cls = "baz";
  expect(hasClass(obj, cls)).toBe(true);
});

// Test case 4: Object has no classes
test("Object has no classes", () => {
  const obj = document.createElement("div");
  const cls = "bar";
  expect(hasClass(obj, cls)).toBe(false);
});

describe("setClass", () => {
  it("should add a class to the element", () => {
    // Arrange
    const element = document.createElement("div");
    const className = "test-class";

    // Act
    setClass(element, className);

    // Assert
    expect(element.className).toContain(className);
  });

  it("should not add duplicate classes", () => {
    // Arrange
    const element = document.createElement("div");
    const className = "test-class";

    // Act
    setClass(element, className);
    setClass(element, className);

    // Assert
    expect(element.className.split(" ")).toEqual([ className ]);
  });

  it("should handle elements with existing classes", () => {
    // Arrange
    const element = document.createElement("div");
    element.className = "existing-class";
    const className = "test-class";

    // Act
    setClass(element, className);

    // Assert
    expect(element.className).toContain(className);
    expect(element.className).toContain("existing-class");
  });
});

describe("removeClass", () => {
  it("should remove the specified class from the element", () => {
    // Create a dummy element with a class
    const element = document.createElement("div");
    element.className = "foo bar baz";

    // Call the removeClass function
    removeClass(element, "bar");

    // Assert that the class has been removed
    expect(element.className).toBe("foo baz");
  });

  it("should not modify the class if the specified class is not present", () => {
    // Create a dummy element with a class
    const element = document.createElement("div");
    element.className = "foo bar baz";

    // Call the removeClass function with a class that is not present
    removeClass(element, "qux");

    // Assert that the class remains unchanged
    expect(element.className).toBe("foo bar baz");
  });
});

describe("addStyle", () => {
  beforeEach(() => {
    // Clear the document head before each test
    document.head.innerHTML = "";
  });

  it("should add style to the document head without an ID", () => {
    const style = "body { background-color: red; }";
    const result = addStyle(style);
    
    expect(result).toBe(true);
    expect(document.head.innerHTML).toContain(style);
  });

  it("should add style to the document head with a new ID", () => {
    const style = "body { background-color: blue; }";
    const options = { id: "custom-style" };
    const result = addStyle(style, options);
    
    expect(result).toBe(true);
    expect(document.head.innerHTML).toContain(style);
    expect(document.getElementById(options.id)?.innerHTML).toBe(style);
  });

  it("should update existing style with the same ID", () => {
    const style1 = "body { background-color: green; }";
    const style2 = "body { background-color: yellow; }";
    const options = { id: "custom-style" };

    // Add initial style
    addStyle(style1, options);

    // Update style
    const result = addStyle(style2, options);

    expect(result).toBe(true);
    expect(document.head.innerHTML).toContain(style2);
    expect(document.getElementById(options.id)?.innerHTML).toBe(style2);
  });

  it("should return false if style is empty", () => {
    const style = "";
    const result = addStyle(style);
    
    expect(result).toBe(false);
    expect(document.head.innerHTML).toBe("");
  });
});

describe("setImgSizeBySrc", () => {
  beforeEach(() => {
    // Setup a mock document body for each test
    document.body.innerHTML = `
      <img src="image1.jpg?width=100px&height=200px" />
      <img src="image2.jpg?width=50%&height=75%" />
      <img src="image3.jpg" />
    `;
  });

  it("should set image sizes using vanilla JavaScript if jQuery is not available", () => {
    expect(setImgSizeBySrc()).toBe(true);
    const images = document.getElementsByTagName("img");
    expect(images[0].style.width).toBe("100px");
    expect(images[0].style.height).toBe("200px");
    expect(images[1].style.width).toBe("50%");
    expect(images[1].style.height).toBe("75%");
  });

  it("should return false if no images are present", () => {
    document.body.innerHTML = ""; // Clear the body
    expect(setImgSizeBySrc()).toBe(false);
  });

  it("should handle images without width and height parameters in their src", () => {
    document.body.innerHTML = "<img src=\"image3.jpg\" />";
    expect(setImgSizeBySrc()).toBe(true);
    const image = document.getElementsByTagName("img")[0];
    expect(image.style.width).toBeFalsy();
    expect(image.style.height).toBeFalsy();
  });
});

describe("addClass", () => {
  let mockElement;

  beforeEach(() => {
    mockElement = document.createElement("div");
  });

  test("adds a single class to the element", () => {
    addClass(mockElement, "test");
    expect(mockElement.className).toBe("test");
  });

  test("adds multiple classes to the element", () => {
    addClass(mockElement, [ "test1", "test2" ]);
    expect(mockElement.className).toBe("test1 test2");
  });

  test("does not add duplicate classes", () => {
    mockElement.className = "test";
    addClass(mockElement, "test");
    expect(mockElement.className).toBe("test");
  });

  test("adds a class to an element with existing classes", () => {
    mockElement.className = "existing-class";
    addClass(mockElement, "test");
    expect(mockElement.className).toBe("existing-class test");
  });

  test("adds multiple classes to an element with existing classes", () => {
    mockElement.className = "existing-class";
    addClass(mockElement, [ "test1", "test2" ]);
    expect(mockElement.className).toBe("existing-class test1 test2");
  });

  test("does not add duplicate classes when adding multiple classes", () => {
    mockElement.className = "test1 test2";
    addClass(mockElement, [ "test1", "test3" ]);
    expect(mockElement.className).toBe("test1 test2 test3");
  });
});
