import {
  AdmonitionDirectiveDescriptor,
  MDXEditor,
  type MDXEditorMethods,
  directivesPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import React, { useEffect, useRef } from "react";
import { Toolbar } from "./Toolbar";

export const Editor: React.FC<{
  value: string;
  readonly: boolean;
  placeholder?: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
}> = ({ value, readonly, placeholder, onBlur, onChange }) => {
  const editorRef = useRef<MDXEditorMethods | null>(null);

  useEffect(() => {
    const nextValue = value ?? "";
    const currentValue = editorRef.current?.getMarkdown();

    if (editorRef.current && currentValue !== nextValue) {
      editorRef.current.setMarkdown(nextValue);
    }
  }, [value]);

  return (
    <div className={`editor ${readonly ? "readonly" : "editable"}`}>
      <MDXEditor
        ref={editorRef}
        markdown={value}
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (readonly ? <></> : <Toolbar />),
          }),
          listsPlugin(),
          quotePlugin(),
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          directivesPlugin({
            directiveDescriptors: [AdmonitionDirectiveDescriptor],
          }),
        ]}
        onBlur={() => {
          if (onBlur) {
            onBlur();
          }
        }}
        onChange={(val) => {
          if (onChange) {
            onChange(val);
          }
        }}
        readOnly={readonly}
        placeholder={placeholder}
      />
    </div>
  );
};
