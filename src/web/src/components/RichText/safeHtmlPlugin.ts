import {
  $createGenericHTMLNode,
  addImportVisitor$,
  isMdastHTMLNode,
  realmPlugin,
  type MdastHTMLNode,
  type MdastImportVisitor,
} from "@mdxeditor/editor";

/**
 * MDXEditor renders inline HTML found in markdown as real DOM elements with every attribute
 * copied verbatim (`GenericHTMLNode.createDOM` → `setAttribute`), so stored markdown such as
 * `<div onmouseover="…">` or `<iframe src="…">` would execute for everyone who views the
 * description. The API's HTML→Markdown conversion is not a sanitizer and imported or older
 * content may carry such markup. This visitor sits between the editor's formatting visitors
 * (which turn `<u>`, `<sup>`… into text formats) and its own HTML visitor, and rebuilds the HTML
 * node with only harmless attributes; script-bearing elements are dropped with their content.
 * Everything else — ordinary formatting, spans with styles, links to http(s) — renders as before.
 */

type MdxAttribute = Parameters<typeof $createGenericHTMLNode>[2][number];

// Removed together with their content.
const DROPPED_TAGS: Record<string, true> = {
  script: true,
  style: true,
  iframe: true,
  object: true,
  embed: true,
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
  html: true,
  head: true,
  body: true,
};

// Attributes that take a URL; only http(s), mailto and tel values are kept.
const URL_ATTRIBUTES: Record<string, true> = {
  href: true,
  src: true,
  action: true,
  formaction: true,
  "xlink:href": true,
  data: true,
  poster: true,
  background: true,
};

const SAFE_URL = /^(https?:|mailto:|tel:)/i;

const isSafeAttribute = (
  attribute: MdastHTMLNode["attributes"][number],
): attribute is MdxAttribute => {
  // `{...spread}` attributes and `{expression}` values are JSX, never plain HTML.
  if (attribute.type !== "mdxJsxAttribute") return false;
  if (attribute.value != null && typeof attribute.value !== "string")
    return false;

  const name = attribute.name.toLowerCase();
  if (name.startsWith("on") || name === "srcdoc") return false;
  if (URL_ATTRIBUTES[name])
    return SAFE_URL.test((attribute.value ?? "").trim());
  return true;
};

const safeHtmlVisitor: MdastImportVisitor<MdastHTMLNode> = {
  testNode: (node) => isMdastHTMLNode(node),
  // Formatting visitors run at 0, the editor's own MdastHTMLVisitor at -100.
  priority: -50,
  visitNode({ mdastNode, actions, lexicalParent }) {
    if (DROPPED_TAGS[mdastNode.name]) return;

    const attributes = mdastNode.attributes.filter(isSafeAttribute);
    const [only] = attributes;

    // Same special case as the editor's own visitor: a styled span becomes text styling.
    if (
      mdastNode.name === "span" &&
      attributes.length === 1 &&
      only?.name === "style" &&
      typeof only.value === "string"
    ) {
      actions.addStyle(only.value, mdastNode);
      actions.visitChildren(mdastNode, lexicalParent);
      return;
    }

    actions.addAndStepInto(
      $createGenericHTMLNode(mdastNode.name, mdastNode.type, attributes),
    );
  },
};

export const safeHtmlPlugin = realmPlugin({
  init(realm) {
    realm.pub(addImportVisitor$, safeHtmlVisitor);
  },
});
