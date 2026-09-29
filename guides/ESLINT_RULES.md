# Common ESLint rules

This guide provides a reusable set of ESLint core rules for frontend projects.
The rules focus on consistent JavaScript formatting and remain independent of a
specific parser, framework, build tool, or runtime environment.

## Rules configuration

Copy the following `rules` object into a legacy ESLint configuration or an
equivalent flat configuration:

```json
{
  "rules": {
    "semi": ["warn", "always"],
    "quotes": ["warn", "double"],
    "indent": ["warn", 2, { "SwitchCase": 1 }],
    "comma-dangle": ["warn", "always-multiline"],
    "eol-last": ["warn", "always"],
    "spaced-comment": ["warn", "always"],
    "object-curly-spacing": ["warn", "always"],
    "array-bracket-spacing": ["warn", "always"],
    "object-curly-newline": [
      "warn",
      {
        "ImportDeclaration": {
          "multiline": true,
          "minProperties": 4
        }
      }
    ]
  }
}
```

All rules use the `warn` severity. A project can promote a rule to `error` after
its existing source conforms to the rule.

## Rule behavior

### `semi`

Require a semicolon at the end of each statement.

```js
const value = 1;
```

### `quotes`

Require double quotes for strings.

```js
const message = "Hello";
```

### `indent`

Use two spaces for each indentation level and indent `case` clauses one level
inside a `switch` statement.

```js
switch (status) {
  case "ready":
    start();
    break;
}
```

### `comma-dangle`

Require trailing commas when a structure spans multiple lines. Do not require a
trailing comma for a single-line structure.

<!-- prettier-ignore -->
```js
const values = [
  "first",
  "second",
];
```

### `eol-last`

Require a newline at the end of each file.

### `spaced-comment`

Require whitespace after a line-comment marker.

```js
// Explain the non-obvious behavior.
```

### `object-curly-spacing`

Require spaces inside object braces.

```js
const options = { enabled: true };
```

### `array-bracket-spacing`

Require spaces inside array brackets.

<!-- prettier-ignore -->
```js
const values = [ "first", "second" ];
```

### `object-curly-newline`

Require multiline imports when an import has at least four members. Also require
line breaks when an import is already multiline.

<!-- prettier-ignore -->
```js
import {
  first,
  second,
  third,
  fourth,
} from "example-package";
```

## Reuse the rules

1. Copy the `rules` object into the target project's ESLint configuration.
2. Configure the target environment and source type separately.
3. Adjust rule severities only when the project requires stricter enforcement.
4. Run the project's ESLint command and resolve existing warnings before
   promoting rules to errors.

Some rules overlap with code formatters. When a project uses a separate
formatter, keep both tools' spacing, quote, indentation, and trailing-comma
settings consistent to avoid conflicting output.
