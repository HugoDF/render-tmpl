// render-tmpl
// Use `<template>` as a rendering engine, [< 100 lines of code](./render-tmpl.js).
/**
 * Render a `<template data-s-tmpl="name">` element including use of `data-s-{text,attr,slot,tmpl}` directives.
 *
 * @param {HTMLTemplateElement} tmplEl
 * @param {Record<string, string>} state - note: nested objects are not supported.
 * @param {(tmpl: HTMLTemplateElement, state: Record<string, string>) => HTMLElement | Array<HTMLElement>} [subTmpl]
 * @returns {Node}
 */
export function renderTmpl(tmplEl, state, subTmpl) {
  // @todo Should we support tmplEl: Element | string and "document.querySelector(`[data-s-tmpl=${tmplEl}]`)" in here?
  const tmpl = tmplEl.content.cloneNode(true);
  // Since `subTmpl` outputs a fully formed Node/Element,
  // run parent "state" directive injections before adding child templates.
  replaceStateDirectives(tmpl, state);
  // @todo subTmpl vs childTmpl naming?
  if (subTmpl) {
    const slot = tmpl.querySelector("[data-s-slot]");
    if (!slot) {
      // should this throw?
      console.warn(
        "[renderTmpl]: subTmpl used without `data-s-slot` attr in parent template",
      );
    }
    const sub = subTmpl(tmpl, state);
    if (Array.isArray(sub)) {
      for (const s of sub) {
        slot.appendChild(s);
      }
    } else if (sub) {
      slot.appendChild(sub);
    }
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
  // We could have: registerDirective(selector, (el, state) => {});
  // `$ctx.query` vs `$state.query` vs `$s.query` vs `$query`?
  const clearPrefix = (str) => str.replace("$ctx.", "");
  tmpl.querySelectorAll("[data-s-show]").forEach((el) => {
    let valueExpr = clearPrefix(el.dataset.sShow);
    // Currently handles arbitrary number of negations eg. `var`, `!var`, `!!var`, `![...]!var`
    let negationsCount = 0;
    for (const char of valueExpr) {
      if (char === "!") {
        negationsCount += 1;
      } else {
        break; // this is we we use a loop and not eg. reduce, loops can break when we stop seeing "!"
      }
    }
    valueExpr = valueExpr.slice(negationsCount); // Removes leading `!` characters
    const evalValue = Boolean(state[valueExpr]);
    if (negationsCount % 2 === 0 ? !evalValue : evalValue) {
      el.style.display = "none";
    } else {
      // not strictly necessary since we always build from a fresh cloned template (ie. no re-renders)
      el.style.display = "";
    }
  });
  tmpl.querySelectorAll("[data-s-text]").forEach((el) => {
    el.textContent = state[clearPrefix(el.dataset.sText)];
  });
  tmpl.querySelectorAll("[data-s-attr],[data-s-attrs]").forEach((el) => {
    for (const pair of (el.dataset.sAttr || el.dataset.sAttrs).split(",")) {
      const [attrName, attrValueExpr] = pair.split("=");
      el.setAttribute(attrName, state[clearPrefix(attrValueExpr)]);
    }
  });
}
