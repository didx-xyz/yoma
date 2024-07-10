import {
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
  Separator,
  StrikeThroughSupSubToggles,
  UndoRedo,
} from "@mdxeditor/editor";
import React from "react";

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
