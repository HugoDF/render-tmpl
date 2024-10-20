import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTmpl } from "./render-tmpl.js";

import { parseHTML } from "linkedom";

test("renderTmpl - data-s-state - simple template with state", () => {
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <div data-s-text="greeting"></div>
  </template>`);

  assert.strictEqual(document.querySelectorAll("template").length, 1);

  document.appendChild(
    renderTmpl(document.querySelector("[data-s-tmpl=tmpl]"), {
      greeting: "hello",
    }),
  );

  assert.strictEqual(document.querySelector("div").textContent, "hello");
});

test("renderTmpl - data-s-attr - setting multiple attributes template with state", () => {
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <img data-s-attr="src=url,alt=greeting">
    <img data-s-attrs="src=url,alt=greeting">
  </template>`);

  assert.strictEqual(document.querySelectorAll("template").length, 1);

  document.appendChild(
    renderTmpl(document.querySelector("[data-s-tmpl=tmpl]"), {
      greeting: "hello",
      url: "my-url",
    }),
  );

  assert.strictEqual(document.querySelector("[data-s-attr]").src, "my-url");
  assert.strictEqual(document.querySelector("[data-s-attr]").alt, "hello");
  assert.strictEqual(document.querySelector("[data-s-attrs]").src, "my-url");
  assert.strictEqual(document.querySelector("[data-s-attrs]").alt, "hello");
});

test("renderTmpl - data-s-attr - setting input value", () => {
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <input type="text" data-s-attr="value=greeting" />
  </template>`);

  document.appendChild(
    renderTmpl(document.querySelector("[data-s-tmpl=tmpl]"), {
      greeting: "hello",
    }),
  );

  assert.strictEqual(document.querySelector("input").value, "hello");
});

test("renderTmpl - data-s-show", () => {
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <div data-testid="output">
      <div data-s-show="truthyVal">truthyVal</div>
      <div data-s-show="!truthyVal">!truthyVal</div>
      <div data-s-show="!!truthyVal">!falsyVal</div>
      <div data-s-show="falsyVal">falsyVal</div>
      <div data-s-show="!falsyVal">!falsyVal</div>
    </div>
  </template>`);

  assert.strictEqual(document.querySelectorAll("template").length, 1);

  document.appendChild(
    renderTmpl(document.querySelector("[data-s-tmpl=tmpl]"), {
      truthyVal: "1234",
      falsyVal: "",
    }),
  );

  assert.strictEqual(
    document.querySelector("[data-s-show=truthyVal]").style.display,
    "",
  );
  assert.strictEqual(
    document.querySelector("[data-s-show=!truthyVal]").style.display,
    "none",
  );
  assert.strictEqual(
    document.querySelector("[data-s-show=!!truthyVal]").style.display,
    "",
  );
  assert.strictEqual(
    document.querySelector("[data-s-show=falsyVal]").style.display,
    "none",
  );
  assert.strictEqual(
    document.querySelector("[data-s-show=!falsyVal]").style.display,
    "",
  );
});

test("renderTmpl - data-s-slot - nested template with subTmpl parameter", () => {
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <div data-s-slot></div>
    <template data-s-tmpl="no-results">
      No Results <span data-s-text="requestId"></span>
    </template>
  </template>`);

  document.appendChild(
    renderTmpl(
      document.querySelector("[data-s-tmpl=tmpl]"),
      { greeting: "hello" },
      (tmpl) =>
        renderTmpl(tmpl.querySelector("[data-s-tmpl=no-results]"), {
          requestId: "1234",
        }),
    ),
  );

  assert.strictEqual(
    document.querySelector("div[data-s-slot]").textContent.trim(),
    "No Results 1234",
  );
  assert.strictEqual(
    document.querySelector("div[data-s-slot]").innerHTML.trim(),
    'No Results <span data-s-text="requestId">1234</span>',
  );
});

test("renderTmpl - no data-s-slot - nested template with subTmpl parameter", (t) => {
  const warnMock = t.mock.method(console, "warn");
  warnMock.mock.mockImplementationOnce(() => {});
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <template data-s-tmpl="no-results">
      No Results <span data-s-text="requestId"></span>
    </template>
  </template>`);

  assert.throws(() => {
    renderTmpl(
      document.querySelector("[data-s-tmpl=tmpl]"),
      { greeting: "hello" },
      (tmpl) =>
        renderTmpl(tmpl.querySelector("[data-s-tmpl=no-results]"), {
          requestId: "1234",
        }),
    );
  });

  assert.deepStrictEqual(warnMock.mock.calls[0].arguments, [
    "[renderTmpl]: subTmpl used without `data-s-slot` attr in parent template",
  ]);
});

test("renderTmpl - data-s-slot - nested template with subTmpl outputting list", () => {
  const { document } = parseHTML(`<template data-s-tmpl="tmpl">
    <div data-s-slot></div>
    <template data-s-tmpl="result-item">
      <div data-testid="result-item">
        Result ref: <span data-s-text="$ctx.reference"></span>, id: <span data-s-text="$ctx.id"></span>
      </div>
    </template>
  </template>`);

  const results = [
    { id: 1, reference: "abc" },
    { id: 2, reference: "def" },
    { id: 3, reference: "hig" },
  ];
  document.appendChild(
    renderTmpl(
      document.querySelector("[data-s-tmpl=tmpl]"),
      { greeting: "hello" },
      (tmpl) => {
        const subTmpl = tmpl.querySelector("[data-s-tmpl=result-item]");
        return results.map((result) => renderTmpl(subTmpl, result));
      },
    ),
  );

  assert.strictEqual(
    document.querySelector("div[data-s-slot]").childElementCount,
    3,
  );
  document.querySelectorAll("[data-testid=result-item]").forEach((el, i) => {
    assert.strictEqual(
      el.textContent.trim(),
      `Result ref: ${results[i].reference}, id: ${results[i].id}`,
    );
    assert.strictEqual(
      el.innerHTML.trim(),
      `Result ref: <span data-s-text="$ctx.reference">${results[i].reference}</span>, id: <span data-s-text="$ctx.id">${results[i].id}</span>`,
    );
  });
});

test.skip("renderTmpl - load & display list of posts", async () => {
  const { document } = parseHTML(`<template data-s-tmpl="posts-list">
    <h2>Posts</h2>
    <div data-s-slot></div>
    <template data-s-tmpl="no-results">
      No results
    </template>
    <template data-s-tmpl="loading">
      Loading...
    </template>
    <template data-s-tmpl="post-item">
      <div data-testid="post-item">
        <h3 data-s-text="$ctx.title"></h3>
        <p data-s-text="$ctx.body"></p>
      </div>
    </template>
  </template>`);

  const state = {
    isLoading: false,
    posts: [],
  };
  function render() {
    return renderTmpl(
      document.querySelector("[data-s-tmpl=posts-list]"),
      state,
      (tmpl) => {
        if (state.isLoading) {
          return renderTmpl(tmpl.querySelector("[data-s-tmpl=loading]"));
        }
        if (state.posts.length === 0) {
          return renderTmpl(tmpl.querySelector("[data-s-tmpl=no-results]"));
        }
        const itemTmpl = tmpl.querySelector("[data-s-tmpl=post-item]");
        return state.posts.map((el) => {
          return renderTmpl(itemTmpl, el);
        });
      },
    );
  }

  const app = document.createElement("div");

  document.appendChild(app);

  app.innerHTML = "";
  app.appendChild(render());

  // assert.equal(app.textContent, 'No results');

  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const data = await res.json();

  document.appendChild(
    renderTmpl(
      document.querySelector("[data-s-tmpl=posts-list]"),
      {},
      (tmpl) => {
        if (data.length === 0) {
          return renderTmpl(tmpl.querySelector("[data-s-tmpl=no-results]"));
        }
      },
    ),
  );
});
