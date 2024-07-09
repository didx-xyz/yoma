import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeAdmonitionType,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  DirectiveNode,
  EditorInFocus,
  InsertAdmonition,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  StrikeThroughSupSubToggles,
  UndoRedo,
  directivesPlugin,
  headingsPlugin,
  //imagePlugin,
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

export type AdmonitionKind = "note" | "tip" | "danger" | "info" | "caution";

function whenInAdmonition(editorInFocus: EditorInFocus | null) {
  const node = editorInFocus?.rootNode;
  if (!node || node.getType() !== "directive") {
    return false;
  }

  return ["note", "tip", "danger", "info", "caution"].includes(
    (node as DirectiveNode).getMdastNode().name as AdmonitionKind,
  );
}

export const Toolbar: React.FC = () => {
  return (
    <>
      <UndoRedo />
      <Separator />
      <BoldItalicUnderlineToggles />
      <CodeToggle />
      <Separator />
      <StrikeThroughSupSubToggles />
      <Separator />
      <ListsToggle />
      <Separator />

      <ConditionalContents
        options={[
          {
            when: whenInAdmonition,
            contents: () => <ChangeAdmonitionType />,
          },
          { fallback: () => <BlockTypeSelect /> },
        ]}
      />

      <Separator />

      <CreateLink />
      <InsertImage />

      <Separator />

      <InsertTable />
      <InsertThematicBreak />

      <ConditionalContents
        options={[
          {
            when: (editorInFocus) => !whenInAdmonition(editorInFocus),
            contents: () => (
              <>
                <Separator />
                <InsertAdmonition />
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export const Editor: React.FC<{
  value: string;
  readonly: boolean;
  onChange?: (value: string) => void;
}> = ({ value, readonly, onChange }) => {
  const [valueState, setValueState] = useState(value);

  return (
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
        // imagePlugin({
        //   imageAutocompleteSuggestions: [
        //     "https://via.placeholder.com/150",
        //     "https://via.placeholder.com/150",
        //   ],
        //   imageUploadHandler: async () =>
        //     Promise.resolve("https://picsum.photos/200/300"),
        // }),
        tablePlugin(),
        thematicBreakPlugin(),
        directivesPlugin({
          directiveDescriptors: [AdmonitionDirectiveDescriptor],
        }),
      ]}
      onChange={(val) => {
        setValueState(val);
        onChange && onChange(val);
      }}
      readOnly={readonly}
    />
  );
};
