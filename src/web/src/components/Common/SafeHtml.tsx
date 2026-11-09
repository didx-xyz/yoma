import React, {
  createElement,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Renders HTML that arrives from outside the app (marketplace item descriptions, voucher
 * instructions) without handing it to the browser as markup. The string is parsed with DOMParser
 * and rebuilt as React elements from an allowlist: only these tags survive, every attribute is
 * dropped except an http(s)/mailto/tel `href` on links, and script-bearing elements are removed
 * with their content. Nothing is serialised back to a string, so there is no mXSS surface.
 *
 * DOMParser only exists in the browser; the server render (and the first client render, to keep
 * hydration consistent) shows the text with the tags stripped.
 */

// Kept, with their children. Anything neither kept nor dropped is unwrapped to its children.
const ALLOWED_TAGS: Record<string, true> = {
  p: true,
  br: true,
  hr: true,
  b: true,
  strong: true,
  i: true,
  em: true,
  u: true,
  s: true,
  ul: true,
  ol: true,
  li: true,
  a: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  span: true,
  div: true,
  blockquote: true,
};

// Removed together with their content.
const DROPPED_TAGS: Record<string, true> = {
  script: true,
  style: true,
  iframe: true,
  object: true,
  embed: true,
  svg: true,
  math: true,
  template: true,
  noscript: true,
  link: true,
  meta: true,
  base: true,
  form: true,
  input: true,
  textarea: true,
  select: true,
  button: true,
};

const VOID_TAGS: Record<string, true> = { br: true, hr: true };

const SAFE_HREF = /^(https?:|mailto:|tel:)/i;

// Keys are unique across the whole tree: an unwrapped element's children join their parent's
// sibling list, so a per-level index would collide.
const toReactNodes = (
  parent: Node,
  nextKey: { value: number },
): ReactNode[] => {
  const nodes: ReactNode[] = [];

  parent.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      nodes.push(child.textContent);
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const element = child as Element;
    const tag = element.tagName.toLowerCase();

    if (DROPPED_TAGS[tag]) return;

    if (!ALLOWED_TAGS[tag]) {
      nodes.push(...toReactNodes(element, nextKey));
      return;
    }

    if (VOID_TAGS[tag]) {
      nodes.push(createElement(tag, { key: nextKey.value++ }));
      return;
    }

    const props: Record<string, string | number> = { key: nextKey.value++ };
    if (tag === "a") {
      const href = element.getAttribute("href")?.trim() ?? "";
      if (SAFE_HREF.test(href)) {
        props.href = href;
        props.target = "_blank";
        props.rel = "noopener noreferrer nofollow";
      }
    }

    nodes.push(createElement(tag, props, ...toReactNodes(element, nextKey)));
  });

  return nodes;
};

export const sanitizeHtmlToReact = (html: string): ReactNode[] => {
  const document = new DOMParser().parseFromString(html, "text/html");
  return toReactNodes(document.body, { value: 0 });
};

/**
 * Pre-hydration fallback text. The result is rendered as a React text node — never as markup — so
 * this is about not showing stray tags, not about safety. Still, strip until nothing changes:
 * a single pass leaves `<scr<b>ipt>` reading `<script>`.
 */
const stripHtmlTags = (html: string): string => {
  let text = html;
  for (;;) {
    const next = text.replace(/<[^>]*>/g, "");
    if (next === text) return text;
    text = next;
  }
};

export const SafeHtml: React.FC<{
  html: string | null | undefined;
  className?: string;
}> = ({ html, className }) => {
  const [nodes, setNodes] = useState<ReactNode[] | null>(null);

  useEffect(() => {
    setNodes(html ? sanitizeHtmlToReact(html) : []);
  }, [html]);

  return (
    <div className={className}>
      {nodes ?? (html ? stripHtmlTags(html) : null)}
    </div>
  );
};
