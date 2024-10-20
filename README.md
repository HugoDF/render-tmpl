# `render-tmpl`

Use `<template>` as a rendering engine, [< 100 lines of code](./render-tmpl.js).

- Alpine/Vue-like directive notation `data-s-{text,attr,show}` for use with `<template>` elements.
- No reactivity, pairs well with web components/custom elements.
- copy-paste onto your page ([< 100 lines of code](./render-tmpl.js) or ESM import).

## Quickstart

```html
<template data-s-tmpl="tmpl">
  <div data-s-text="greeting"></div>
  <img data-s-attr="src=url,alt=greeting" />
</template>
<script type="importmap">
  { "imports": { "render-tmpl": "https://esm.sh/render-tmpl" } }
</script>
<script type="module">
  import { renderTmpl } from "render-tmpl";
  document.appendChild(
    renderTmpl(document.querySelector("[data-s-tmpl=tmpl]"), {
      greeting: "hello",
      url: "my-url",
    }),
  );
</script>
```

## Directives

### `data-s-tmpl`

`data-s-tmpl` is a convention to denote templates that will be used with `render-tmpl`.

Usage: `<template data-s-tmpl="loading"></template>`.

### `data-s-show`

`data-s-show` will set `display: none;` if the expression is false and will unset `display` if it's true.

Usage: `<div data-s-show="isShown"></div>`

Use of negation is allowed with `!`, eg. `<div data-s-show="!isLoading"></div>`, **note**: any arbitrary number of `!` works, but other boolean logic (`&&`, `||`, `()`) will **not work**, this is because the value is not `eval`-ed as JavaScript.

### `data-s-text`

Set the `textContent` of the node to the value of the referenced variable.

Usage: `<p data-s-text="message"></p>`

### `data-s-attr`

Set attributes on the element based on provided key-value `attr1=value1,attr2=value2` pairs.

Aliases: `data-s-attrs`

Usage: `<img data-s-attr="src=url,alt=greeting" />` sets `src` and `alt` attributes to the values contained in `url` and `greeting` variables.

### `data-s-slot`

Used as the element into which sub-templates are injected.

Usage:

```html
<template data-s-tmpl="tmpl">
  <div data-s-slot></div>
  <template data-s-tmpl="no-results">
    No Results <span data-s-text="requestId"></span>
  </template>
</template>
<script type="module">
  import { renderTmpl } from "render-tmpl";
  document.appendChild(
    renderTmpl(document.querySelector("[data-s-tmpl=tmpl]"), {}, (tmpl) =>
      renderTmpl(tmpl.querySelector("[data-s-tmpl=no-results]"), {
        requestId: "1234",
      }),
    ),
  );
</script>
```

<!-- @todo
- `$ctx.query` vs `$state.query` vs `$s.query` vs `$query`?
- should there be a directive registration system? (would allow for increased modularity)?
-->

## Requirements

- Node 20
- npm v8+

## Setup

1. Clone the repository
2. Run `npm install` installs all required dependencies.

## npm scripts

- `npm test` will run tests using the [Node.js test runner](https://nodejs.org/api/test.html#running-tests-from-the-command-line) and the `node:test` module.
- `npm run format` will run prettier on all the examples files (and tests).

## LICENSE

Code is licensed under the [MIT License](./LICENSE).
