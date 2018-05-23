import * as React from "react";
import { render, unmountComponentAtNode } from "react-dom";

import { IconNames } from "@uifabric/icons";
import * as FileUploadDialog_Async from "Common/Components/FileUploadDialog";
import { IRichEditorToolbarButton } from "Common/Components/RichEditor/Toolbar/Interfaces";
import {
    RichEditorToolbarButtonNames
} from "Common/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import clearFormat from "roosterjs-editor-api/lib/format/clearFormat";
import removeLink from "roosterjs-editor-api/lib/format/removeLink";
import setAlignment from "roosterjs-editor-api/lib/format/setAlignment";
import setIndentation from "roosterjs-editor-api/lib/format/setIndentation";
import toggleBold from "roosterjs-editor-api/lib/format/toggleBold";
import toggleBullet from "roosterjs-editor-api/lib/format/toggleBullet";
import toggleItalic from "roosterjs-editor-api/lib/format/toggleItalic";
import toggleNumbering from "roosterjs-editor-api/lib/format/toggleNumbering";
import toggleStrikethrough from "roosterjs-editor-api/lib/format/toggleStrikethrough";
import toggleSubscript from "roosterjs-editor-api/lib/format/toggleSubscript";
import toggleSuperscript from "roosterjs-editor-api/lib/format/toggleSuperscript";
import toggleUnderline from "roosterjs-editor-api/lib/format/toggleUnderline";
import Editor from "roosterjs-editor-core/lib/editor/Editor";
import Alignment from "roosterjs-editor-types/lib/format/Alignment";
import Indentation from "roosterjs-editor-types/lib/format/Indentation";
import { FileInputResult } from "VSSUI/FileInput";
import { closest } from "VSSUI/Utilities/Internal";

const AsyncFileUploadDialog = getAsyncLoadedComponent(
    ["scripts/FileUploadDialog"],
    (m: typeof FileUploadDialog_Async) => m.FileUploadDialog,
    () => null);

export const fullscreen: IRichEditorToolbarButton = {
    iconName: IconNames.FullScreen,
    title: "Toggle fullscreen",
    onClick: editor => {
        const container = closest((editor as any).core.contentDiv, ".rich-editor-container");
        if (container.classList.contains("fullscreen")) {
            container.classList.remove("fullscreen");
        }
        else {
            container.classList.add("fullscreen");
        }
    }
};
export const bold: IRichEditorToolbarButton = {
    iconName: IconNames.Bold,
    title: "Bold (Ctrl + B)",
    onClick: toggleBold
};
export const italic: IRichEditorToolbarButton = {
    iconName: IconNames.Italic,
    title: "Italic (Ctrl + I)",
    onClick: toggleItalic
};
export const underline:  IRichEditorToolbarButton = {
    iconName: IconNames.Underline,
    title: "Underline (Ctrl + U)",
    onClick: toggleUnderline
};
export const bullets: IRichEditorToolbarButton = {
    iconName: IconNames.BulletedList,
    title: "Bulletted list (Ctrl + .)",
    onClick: toggleBullet
};
export const numbering: IRichEditorToolbarButton = {
    iconName: IconNames.NumberedList,
    title: "Numbered list (Ctrl + /)",
    onClick: toggleNumbering
};
export const indent: IRichEditorToolbarButton = {
    iconName: IconNames.IncreaseIndentLegacy,
    title: "Increase indent",
    onClick: editor => setIndentation(editor, Indentation.Increase)
};
export const outdent: IRichEditorToolbarButton = {
    iconName: IconNames.DecreaseIndentLegacy,
    title: "Decrease indent",
    onClick: editor => setIndentation(editor, Indentation.Decrease)
};
export const alignLeft: IRichEditorToolbarButton = {
    iconName: IconNames.AlignLeft,
    title: "Align to left",
    onClick: editor => setAlignment(editor, Alignment.Left)
};
export const alignCenter: IRichEditorToolbarButton = {
    iconName: IconNames.AlignCenter,
    title: "Align to center",
    onClick: editor => setAlignment(editor, Alignment.Center)
};
export const alignRight: IRichEditorToolbarButton = {
    iconName: IconNames.AlignRight,
    title: "Align to right",
    onClick: editor => setAlignment(editor, Alignment.Right)
};
export const unlink: IRichEditorToolbarButton = {
    iconName: IconNames.RemoveLink,
    title: "Unlink",
    onClick: removeLink
};
export const subscript: IRichEditorToolbarButton = {
    iconName: IconNames.Subscript,
    title: "Subscript",
    onClick: toggleSubscript
};
export const superscript: IRichEditorToolbarButton = {
    iconName: IconNames.Superscript,
    title: "Superscript",
    onClick: toggleSuperscript
};
export const strikethrough: IRichEditorToolbarButton = {
    iconName: IconNames.Strikethrough,
    title: "Strike through",
    onClick: toggleStrikethrough
};
export const undo: IRichEditorToolbarButton = {
    iconName: IconNames.Undo,
    title: "Undo",
    onClick: editor => editor.undo()
};
export const redo: IRichEditorToolbarButton = {
    iconName: IconNames.Redo,
    title: "Redo",
    onClick: editor => editor.redo()
};
export const removeformat: IRichEditorToolbarButton = {
    iconName: IconNames.ClearFormatting,
    title: "Remove formatting",
    onClick: clearFormat
};
export const uploadImage: IRichEditorToolbarButton = {
    iconName: IconNames.PictureFill,
    title: "Upload image",
    onClick: (editor, options) => {
        const dialogContainer = closest((editor as any).core.contentDiv, ".rich-editor-container").querySelector(".rich-editor-dialog-container");
        const closeDialog = () => {
            unmountComponentAtNode(dialogContainer);
        };
        const addImages = (files: FileInputResult[]) => {
            onImageAdd(editor, files[0].file, options.getImageUrl);
        };

        render(
            <AsyncFileUploadDialog
                title="Upload image"
                onDialogClose={closeDialog}
                allowedFileExtensions={["png", "jpg", "gif"]}
                onOkClick={addImages}
            />,
            dialogContainer
        );
    }
};

export function onImageAdd(editor: Editor, imageFile: File, getImageUrl: (data: string) => Promise<string>) {
    if (!editor || !imageFile || !getImageUrl) {
        return;
    }

    editor.addUndoSnapshot();
    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent) => {
        if (!editor.isDisposed()) {
            const imageData = (event.target as any).result;
            try {
                const imageUrl = await getImageUrl(imageData);

                if (imageUrl && !editor.isDisposed()) {
                    const image = editor.getDocument().createElement("img");
                    image.src = imageUrl;
                    editor.insertNode(image);
                    editor.triggerContentChangedEvent();
                    editor.addUndoSnapshot();
                }
            }
            catch {
                // no op
            }
        }
    };
    reader.readAsDataURL(imageFile);
}

export const ButtonMap: IDictionaryStringTo<IRichEditorToolbarButton> = {
    [RichEditorToolbarButtonNames.btnBold]: bold,
    [RichEditorToolbarButtonNames.btnItalic]: italic,
    [RichEditorToolbarButtonNames.btnUnderline]: underline,
    [RichEditorToolbarButtonNames.btnBullets]: bullets,
    [RichEditorToolbarButtonNames.btnNumbering]: numbering,
    [RichEditorToolbarButtonNames.btnIndent]: indent,
    [RichEditorToolbarButtonNames.btnOutdent]: outdent,
    [RichEditorToolbarButtonNames.btnAlignLeft]: alignLeft,
    [RichEditorToolbarButtonNames.btnAlignCenter]: alignCenter,
    [RichEditorToolbarButtonNames.btnAlignRight]: alignRight,
    [RichEditorToolbarButtonNames.btnUnlink]: unlink,
    [RichEditorToolbarButtonNames.btnSuperScript]: superscript,
    [RichEditorToolbarButtonNames.btnSubscript]: subscript,
    [RichEditorToolbarButtonNames.btnStrikethrough]: strikethrough,
    [RichEditorToolbarButtonNames.btnUndo]: undo,
    [RichEditorToolbarButtonNames.btnRedo]: redo,
    [RichEditorToolbarButtonNames.btnUnformat]: removeformat,
    [RichEditorToolbarButtonNames.btnFullscreen]: fullscreen,
    [RichEditorToolbarButtonNames.btnUploadImage]: uploadImage
};
