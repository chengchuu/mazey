/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require("path");
const scriptsDirectory = path.resolve(__dirname, "..");
const _resolve = (_path) => path.resolve(scriptsDirectory, _path);
const format = require("date-fns/format");
const toc = require("markdown-toc");
const fs = require("fs");
// Generate version: 20210308.072903
const genVersion = () => {
  const d = new Date();
  const version = format(d, "yyyyMMdd.HHmmss");
  return version;
};
const version = genVersion();
const defaultHiddenHeadings = [
  "mazey",
  "Install",
  "Usage",
  "Contributing",
  "License",
  "API Examples",
  "Development Environment",
  "Returns",
  "Scripts",
  "Node.js",
  "TypeScript",
  "Table of Contents",
];

/**
 * Generate table of contents for the markdown file.
 * 
 * @param {string} path Path of markdown file.
 * @param {array} options.hiddenHeadings Hidden headings.
 * @returns {void}
 */
const generateToc = (path = "../README.md", options = {
  hiddenHeadings: defaultHiddenHeadings,
}) => {
  console.log("Generating Table of Contents...");
  options = Object.assign({
    hiddenHeadings: defaultHiddenHeadings,
  }, options);
  const RMFilePath = _resolve(path);
  // https://melvingeorge.me/blog/get-all-the-contents-from-file-as-string-nodejs
  console.log("running...");
  const buffer = fs.readFileSync(RMFilePath);
  const fileContent = buffer.toString();
  // https://github.com/jonschlinkert/markdown-toc
  const removeUnnecessaryHeadings = (str) => {
    return !options.hiddenHeadings.some(v => {
      return str.includes(v);
    });
  };
  let tocContent = toc(fileContent, {
    filter: removeUnnecessaryHeadings,
    bullets: [ "-", "-" ],
  }).content;
  tocContent = tocContent.replace(/[ ]{4}/gm, "");
  tocContent = "<!-- toc - begin -->\n" + "- Generated with ❤️\n" + tocContent;
  tocContent = tocContent + "\n<!-- toc - end -->";
  // Insert to file.
  // https://stackoverflow.com/questions/14177087/replace-a-string-in-a-file-with-nodejs
  let newFileContent = fileContent;
  // https://stackoverflow.com/questions/1979884/how-to-use-javascript-regex-over-multiple-lines
  newFileContent = newFileContent.replace(/<!-- toc - begin -->[\s\S]*<!-- toc - end -->/gm, tocContent);
  console.log("running...");
  fs.writeFileSync(RMFilePath, newFileContent);
  console.log("Generating Table of Contents is done.");
};

module.exports = {
  _resolve,
  version,
  generateToc,
};
