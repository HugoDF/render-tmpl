/**
 * # `render-tmpl`
 *
 * Use `<template>` as a rendering engine in < 50 lines of code.
 *
 * - Alpine/Vue-like directive notation `data-s-{text,attr}` for use with `<template>` elements.
 * - No reactivity, pairs well with web components/custom elements.
 * - copy-paste onto your page (< 50 lines of code @todo link to unmin.js file) or ESM import (633B minified, 412B brotlied, 480B gzipped).
 *
 * ## Quickstart
 *
 * ```html
 * <template data-s-tmpl="tmpl">
 *  <div data-s-text="greeting"></div>
 *  <img data-s-attr="src=url,alt=greeting" />
 * </template>
 * <script type="module">
 *  import { renderTmpl } from 'render-tmpl.js';
 *  document.appendChild(
 *    renderTmpl(
 *      document.querySelector('[data-s-tmpl=tmpl]'),
 *      {greeting: 'hello', url: 'my-url'}
 *    )
 *  );
 * </script>
 * ```
 *
 * @todo package name `render-tmpl` vs `render-tmpl.js`.
 */

// Build with `npx esbuild --minify ./static/render-tmpl.js --outfile=static/render-tmpl.min.js`
// For brotli/gzip sizes, copy-paste minified into -> https://facia.dev/tools/compress-decompress/gzip-compress/
// Strip comments with `npx esbuild ./static/render-tmpl.js --outfile=static/render-tmpl.unmin.js`
/*
The MIT License (MIT)
Copyright(c) 2024 Hugo Di Francesco
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files(the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and / or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Render a `<template data-s-tmpl="name">` element including use of `data-s-{text,attr,slot,tmpl}` directives.
 *
 * @param {HTMLTemplateElement} tmplEl
 * @param {Record<string, string>} state - note: nested objects are not supported.
 * @param {(tmpl: HTMLTemplateElement, state: Record<string, string>) => HTMLElement | Array<HTMLElement>} [subTmpl]
 * @returns {Node}
 *
 * @example Render simple template with state
 * ```html
 * <template data-s-tmpl="tmpl">
 *  <div data-s-text="greeting"></div>
 * </template>
 * <script type="module">
 *  import { renderTmpl } from 'render-tmpl.js';
 *  document.appendChild(
 *    renderTmpl(
 *      document.querySelector('[data-s-tmpl=tmpl]'),
 *      {greeting: 'hello'}
 *    )
 *  );
 * </script>
 * ```
 * @example Set multiple HTML attributes
 * ```html
 * <template data-s-tmpl="tmpl">
 *  <div data-s-text="greeting"></div>
 *  <img data-s-attr="src=url,alt=greeting" />
 * </template>
 * <script type="module">
 *  import { renderTmpl } from 'render-tmpl.js';
 *  renderTmpl(
 *    document.querySelector('[data-s-tmpl=tmpl]'),
 *    {greeting: 'hello', url: 'my-url'}
 *  )
 * </script>
 * ```
 * @example Render nested template using `subTmpl` param
 * * ```html
 * <template data-s-tmpl="tmpl">
 *  <div data-s-slot></div>
 *  <template data-s-tmpl="no-results">
 *    No Results <span data-s-text="requestId"></span>
 *  </template>
 * </template>
 * <script type="module">
 *  import { renderTmpl } from 'render-tmpl.js';
 *  document.appendChild(
 *    renderTmpl(
 *      document.querySelector('[data-s-tmpl=tmpl]'),
 *      {greeting: 'hello'},
 *      (tmpl) => renderTmpl(
 *        tmpl.querySelector('[data-s-tmpl=no-results]'),
 *        { requestId: '1234' }
 *      )
 *    )
 *  );
 * </script>
 * ```
 * @example Render nested template list items using `subTmpl` param
 * ```html
 * <template data-s-tmpl="tmpl">
 *  <div data-s-slot></div>
 *  <template data-s-tmpl="result-item">
 *    <div data-testid="result-item">
 *      Result ref: <span data-s-text="$ctx.reference"></span>, id: <span data-s-text="$ctx.id"></span>
 *    </div>
 *  </template>
 * </template>
 * <script type="module">
 *  import { renderTmpl } from 'render-tmpl.js';
 *  const results = [
 *    { id: 1, reference: 'abc' },
 *    { id: 2, reference: 'def' },
 *    { id: 3, reference: 'hig' },
 *  ];
 *  document.appendChild(
 *    renderTmpl(
 *      document.querySelector('[data-s-tmpl=tmpl]'),
 *      { greeting: 'hello' },
 *      (tmpl) => {
 *        const subTmpl = tmpl.querySelector('[data-s-tmpl=result-item]');
 *        return results.map((result) => renderTmpl(subTmpl, result));
 *      }
 *    )
 *  );
 * </script>
 */
export function renderTmpl(tmplEl, state, subTmpl) {
  // @todo Should we support tmplEl: Element | string and "document.querySelector(`[data-s-tmpl=${tmplEl}]`)" in here?
  const tmpl = tmplEl.content.cloneNode(true);
  // Since `subTmpl` outputs a fully formed Node/Element,
  // run parent "state" directive injections before adding child templates.
  replaceStateDirectives(tmpl, state);
  // @todo subTmpl vs childTmpl naming?
  if (subTmpl) {
    const sub = subTmpl(tmpl, state);
    // @todo Is "slot" correct per common usage? (eg. Vue/web components?)
    // Alternative `data-s-child(ren)`?
    const slot = tmpl.querySelector("[data-s-slot]");
    if (!slot) {
      // @todo should we just throw first thing inside of `if (subTmpl)` if there's no slot in the current template?
      console.warn(
        "[renderTmpl]: subTmpl used without `data-s-slot` attr in parent template",
      );
    }
    if (Array.isArray(sub)) {
      for (const s of sub) {
        slot.appendChild(s);
      }
    } else if (sub) {
      slot.appendChild(sub);
    }
    // @todo Does the API preclude future support for named slots? Seems not, an interface would be as follows:
    // subTmpl() -> { something: el1, else: el2 }
    // <div data-s-slot="something">{{ el1 }}</div>
    // <div data-s-slot="else">{{ el2 }}</div>
  }
  return tmpl;
}

/**
 * Inject content for `data-s-text` and `data-s-attr(s)` directives.
 *
 * Supports `$ctx.{property}` as alias for `{property}`, useful when looping through templates to reflect that it's not accessing "state".
 *
 * @param {HTMLElement} tmpl
 * @param {Record<string, string>} state
 * @returns {void}
 */
function replaceStateDirectives(tmpl, state) {
  // @todo should there be a directive registration system?
  // registerDirective(selector, (el, state) => {});
  // @todo `$ctx.query` vs `$state.query` vs `$s.query` vs `$query`
  const clearMagic = (str) => str.replace("$ctx.", "");
  tmpl.querySelectorAll("[data-s-show]").forEach((el) => {
    let valueExpr = clearMagic(el.dataset.sShow);

    // handle all of `var`, `!var`, `!!var`, `!...!var`
    let negationsCount = 0;
    for (const char of valueExpr) {
      if (char === "!") {
        negationsCount += 1;
      } else {
        // not using a reduce, since a loop can break when it stops seeing "!"
        break;
      }
    }
    // Remove the leading `!` characters
    valueExpr = valueExpr.slice(negationsCount);
    const evalValue = Boolean(state[valueExpr]);
    if (negationsCount % 2 === 0 ? !evalValue : evalValue) {
      el.style.display = "none";
    } else {
      el.style.display = "";
    }
  });
  tmpl.querySelectorAll("[data-s-text]").forEach((el) => {
    const valueExpr = clearMagic(el.dataset.sText);
    el.textContent = state[valueExpr];
  });
  tmpl.querySelectorAll("[data-s-attr],[data-s-attrs]").forEach((el) => {
    for (const pair of (el.dataset.sAttr || el.dataset.sAttrs).split(",")) {
      let [attrName, attrValueExpr] = pair.split("=");
      attrValueExpr = clearMagic(attrValueExpr);
      el.setAttribute(attrName, state[attrValueExpr]);
    }
  });
}
