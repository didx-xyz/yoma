import React, { useCallback, useState } from "react";
import "@mdxeditor/editor/style.css";
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeAdmonitionType,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  DiffSourceToggleWrapper,
  DirectiveNode,
  EditorInFocus,
  InsertAdmonition,
  InsertCodeBlock,
  InsertFrontmatter,
  InsertImage,
  InsertSandpack,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  ShowSandpackInfo,
  StrikeThroughSupSubToggles,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  directivesPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
// import { AdmonitionKind } from "lexical";
import "./Editor.css";

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

export const KitchenSinkToolbar: React.FC = () => {
  return (
    // <DiffSourceToggleWrapper>
    //   <ConditionalContents
    //     options={[
    //       {
    //         when: (editor) => editor?.editorType === "codeblock",
    //         contents: () => <ChangeCodeMirrorLanguage />,
    //       },
    //       {
    //         when: (editor) => editor?.editorType === "sandpack",
    //         contents: () => <ShowSandpackInfo />,
    //       },
    //       {
    //         fallback: () => (
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

      {/* <Separator /> */}
      {/* <InsertCodeBlock /> */}
      {/* <InsertSandpack /> */}

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

      {/* <Separator />
      <InsertFrontmatter /> */}
    </>
    //         ),
    //       },
    //     ]}
    //   />
    // </DiffSourceToggleWrapper>
  );
};

export const Editor: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const [valueState, setValueState] = useState(value);

  return (
    <MDXEditor
      markdown={value}
      // plugins={[
      //   headingsPlugin(),
      //   listsPlugin(),
      //   quotePlugin(),
      //   thematicBreakPlugin(),
      //   toolbarPlugin({
      //     toolbarContents: () => (
      //       <>
      //         {" "}
      //         <UndoRedo />
      //         <BoldItalicUnderlineToggles />
      //         <BlockTypeSelect />
      //         <ChangeAdmonitionType />
      //         <ChangeCodeMirrorLanguage />
      //         <CodeToggle />
      //         <CreateLink />
      //         {/* <DiffSourceToggleWrapper /> */}
      //         <InsertAdmonition />
      //         <InsertCodeBlock />
      //         <InsertFrontmatter />
      //         <InsertImage />
      //         <InsertSandpack />
      //         <InsertTable />
      //         <InsertThematicBreak />
      //         <ListsToggle />
      //         <ShowSandpackInfo />
      //       </>
      //     ),
      //   }),
      // ]}
      plugins={[
        toolbarPlugin({ toolbarContents: () => <KitchenSinkToolbar /> }),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin({
          imageAutocompleteSuggestions: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
          ],
          imageUploadHandler: async () =>
            Promise.resolve("https://picsum.photos/200/300"),
        }),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
        // codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
        // codeMirrorPlugin({
        //   codeBlockLanguages: {
        //     js: "JavaScript",
        //     css: "CSS",
        //     txt: "Plain Text",
        //     tsx: "TypeScript",
        //     "": "Unspecified",
        //   },
        // }),
        directivesPlugin({
          directiveDescriptors: [
            //  YoutubeDirectiveDescriptor,
            AdmonitionDirectiveDescriptor,
          ],
        }),
        //diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: "boo" }),
        // markdownShortcutPlugin(),
      ]}
      onChange={(val) => {
        setValueState(val);
        onChange && onChange(val);
      }}
    />
  );
};
