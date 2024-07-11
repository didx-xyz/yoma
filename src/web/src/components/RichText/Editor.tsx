import {
  AdmonitionDirectiveDescriptor,
  MDXEditor,
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
import React, { useState } from "react";
import { Toolbar } from "./Toolbar";

export const Editor: React.FC<{
  value: string;
  readonly: boolean;
  onBlur?: () => void;
  onChange?: (value: string) => void;
}> = ({ value, readonly, onBlur, onChange }) => {
  const [valueState, setValueState] = useState(value);

  return (
    <div className={`editor ${readonly ? "readonly" : "editable"}`}>
      <MDXEditor
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
          onBlur && onBlur();
        }}
        onChange={(val) => {
          setValueState(val);
          onChange && onChange(val);
        }}
        readOnly={readonly}
      />
    </div>
  );
};
