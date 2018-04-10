import * as React from "react";

import { IconNames } from "@uifabric/icons";
import {
    IRichEditorToolbarButton, RichEditorToolbarButtonState
} from "Library/Components/RichEditor/Toolbar/Interfaces";
import { FontNamePicker, FontSizePicker } from "Library/Components/RichEditor/Toolbar/Pickers";
import {
    RichEditorToolbarButtonNames
} from "Library/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import {
    clearFormat, removeLink, setAlignment, setFontName, setFontSize, setIndentation,
    toggleBlockQuote, toggleBold, toggleBullet, toggleItalic, toggleNumbering, toggleStrikethrough,
    toggleSubscript, toggleSuperscript, toggleUnderline
} from "roosterjs-editor-api";
import Alignment from "roosterjs-editor-types/lib/format/Alignment";
import Indentation from "roosterjs-editor-types/lib/format/Indentation";
import { closest } from "VSSUI/Utilities/Internal";

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
    buttonState: formatState =>
        formatState.isBold ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleBold
};
export const italic: IRichEditorToolbarButton = {
    iconName: IconNames.Italic,
    title: "Italic (Ctrl + I)",
    buttonState: formatState =>
        formatState.isItalic ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleItalic
};
export const underline:  IRichEditorToolbarButton = {
    iconName: IconNames.Underline,
    title: "Underline (Ctrl + U)",
    buttonState: formatState =>
        formatState.isUnderline ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleUnderline
};
export const bullets: IRichEditorToolbarButton = {
    iconName: IconNames.BulletedList,
    title: "Bulletted list (Ctrl + .)",
    buttonState: formatState =>
        formatState.isBullet ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleBullet
};
export const numbering: IRichEditorToolbarButton = {
    iconName: IconNames.NumberedList,
    title: "Numbered list (Ctrl + /)",
    buttonState: formatState =>
        formatState.isNumbering ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
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
export const quote: IRichEditorToolbarButton = {
    iconName: IconNames.RightDoubleQuote,
    title: "Place under quotes",
    onClick: toggleBlockQuote,
    buttonState: formatState =>
        formatState.isBlockQuote ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal
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
    buttonState: formatState =>
        formatState.canUnlink ? RichEditorToolbarButtonState.Normal : RichEditorToolbarButtonState.Disabled,
    onClick: removeLink
};
export const subscript: IRichEditorToolbarButton = {
    iconName: IconNames.Subscript,
    title: "Subscript",
    buttonState: formatState =>
        formatState.isSubscript ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleSubscript
};
export const superscript: IRichEditorToolbarButton = {
    iconName: IconNames.Superscript,
    title: "Superscript",
    buttonState: formatState =>
        formatState.isSuperscript ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleSuperscript
};
export const strikethrough: IRichEditorToolbarButton = {
    iconName: IconNames.Strikethrough,
    title: "Strike through",
    buttonState: formatState =>
        formatState.isStrikeThrough ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleStrikethrough
};
export const undo: IRichEditorToolbarButton = {
    iconName: IconNames.Undo,
    title: "Undo",
    buttonState: formatState =>
        formatState.canUndo ? RichEditorToolbarButtonState.Normal : RichEditorToolbarButtonState.Disabled,
    onClick: editor => editor.undo()
};
export const redo: IRichEditorToolbarButton = {
    iconName: IconNames.Redo,
    title: "Redo",
    buttonState: formatState =>
        formatState.canRedo ? RichEditorToolbarButtonState.Normal : RichEditorToolbarButtonState.Disabled,
    onClick: editor => editor.redo()
};
export const removeformat: IRichEditorToolbarButton = {
    iconName: IconNames.ClearFormatting,
    title: "Remove formatting",
    onClick: clearFormat
};
// export const backColor: IRichEditorToolbarButton = {
//     iconName: IconNames.EraseTool,
//     dropdown: (target, editor, dismiss, format) => (
//         <ColorPicker
//             menuTargetElement={target}
//             onDismissMenu={dismiss}
//             selectedColor={format.backgroundColor}
//             // tslint:disable-next-line:jsx-no-lambda
//             onSelectColor={color => setBackgroundColor(editor, color.code)}
//         />
//     )
// };
// export const textColor: IRichEditorToolbarButton = {
//     iconName: IconNames.FontColor,
//     dropdown: (target, editor, dismiss, format) => (
//         <ColorPicker
//             menuTargetElement={target}
//             onDismissMenu={dismiss}
//             selectedColor={format.textColor}
//             // tslint:disable-next-line:jsx-no-lambda
//             onSelectColor={color => setTextColor(editor, color.code)}
//         />
//     )
// };
export const fontSize: IRichEditorToolbarButton = {
    iconName: IconNames.FontSize,
    title: "Font size",
    dropdown: (target, editor, dismiss, format) => (
        <FontSizePicker
            menuTargetElement={target}
            onDismissMenu={dismiss}
            // tslint:disable-next-line:jsx-no-lambda
            onSelectSize={fs => setFontSize(editor, `${fs}pt`)}
            selectedSize={format.fontSize}
        />
    )
};
export const fontName: IRichEditorToolbarButton = {
    iconName: IconNames.Font,
    title: "Font name",
    dropdown: (target, editor, dismiss, format) => (
        <FontNamePicker
            menuTargetElement={target}
            onDismissMenu={dismiss}
            // tslint:disable-next-line:jsx-no-lambda
            onSelectName={font => setFontName(editor, font.family)}
            selectedName={format.fontName}
        />
    )
};

export const ButtonMap: IDictionaryStringTo<IRichEditorToolbarButton> = {
    [RichEditorToolbarButtonNames.btnBold]: bold,
    [RichEditorToolbarButtonNames.btnItalic]: italic,
    [RichEditorToolbarButtonNames.btnUnderline]: underline,
    [RichEditorToolbarButtonNames.btnBullets]: bullets,
    [RichEditorToolbarButtonNames.btnNumbering]: numbering,
    [RichEditorToolbarButtonNames.btnIndent]: indent,
    [RichEditorToolbarButtonNames.btnOutdent]: outdent,
    [RichEditorToolbarButtonNames.btnQuote]: quote,
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
    // [RichEditorToolbarButtonNames.btnBkColor]: backColor,
    // [RichEditorToolbarButtonNames.btnFontColor]: textColor,
    [RichEditorToolbarButtonNames.btnFontSize]: fontSize,
    [RichEditorToolbarButtonNames.btnFontName]: fontName,
    [RichEditorToolbarButtonNames.btnFullscreen]: fullscreen
};
