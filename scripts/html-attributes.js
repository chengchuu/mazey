/* eslint-env node */

function parseHtmlAttributes(tag) {
  return Object.fromEntries(
    [
      ...tag.matchAll(
        /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
      ),
    ].map((attribute) => [
      attribute[1].toLowerCase(),
      attribute[2] ?? attribute[3] ?? attribute[4] ?? "",
    ])
  );
}

module.exports = { parseHtmlAttributes };
