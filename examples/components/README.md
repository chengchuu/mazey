# Playground Components

- `core/` contains framework-neutral calculation and validation logic.
- `hooks/` contains stateful React hooks that do not depend on React DOM.
- `web/` contains React DOM components styled with Bootstrap.

React Native applications can reuse `core/` and suitable hooks. Components in
`web/` render HTML and use Bootstrap classes, so they are not directly portable
to React Native.

The playground is a website-only application and is not part of Mazey's public
npm API.
