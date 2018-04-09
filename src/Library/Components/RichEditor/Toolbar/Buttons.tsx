import * as React from "react";

import { IconNames } from "@uifabric/icons";
import {
    IRichEditorToolbarButton, RichEditorToolbarButtonNames, RichEditorToolbarButtonState
} from "Library/Components/RichEditor/Toolbar/Interfaces";
import {
    blackColors, ColorPicker, FontNamePicker, FontSizePicker, textColors
} from "Library/Components/RichEditor/Toolbar/Pickers";
import {
    clearFormat, removeLink, setAlignment, setBackgroundColor, setFontName, setFontSize,
    setIndentation, setTextColor, toggleBlockQuote, toggleBold, toggleBullet, toggleItalic,
    toggleNumbering, toggleStrikethrough, toggleSubscript, toggleSuperscript, toggleUnderline
} from "roosterjs-editor-api";
import Alignment from "roosterjs-editor-types/lib/format/Alignment";
import Indentation from "roosterjs-editor-types/lib/format/Indentation";

export const bold: IRichEditorToolbarButton = {
    iconName: IconNames.Bold,
    buttonState: formatState =>
        formatState.isBold ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleBold
};
export const italic: IRichEditorToolbarButton = {
    iconName: IconNames.Italic,
    buttonState: formatState =>
        formatState.isItalic ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleItalic
};
export const underline:  IRichEditorToolbarButton = {
    iconName: IconNames.Underline,
    buttonState: formatState =>
        formatState.isUnderline ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleUnderline
};
export const bullets: IRichEditorToolbarButton = {
    iconName: IconNames.BulletedList,
    buttonState: formatState =>
        formatState.isBullet ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleBullet
};
export const numbering: IRichEditorToolbarButton = {
    iconName: IconNames.NumberedList,
    buttonState: formatState =>
        formatState.isNumbering ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleNumbering
};
export const indent: IRichEditorToolbarButton = {
    iconName: IconNames.IncreaseIndentLegacy,
    onClick: editor => setIndentation(editor, Indentation.Increase)
};
export const outdent: IRichEditorToolbarButton = {
    iconName: IconNames.DecreaseIndentLegacy,
    onClick: editor => setIndentation(editor, Indentation.Decrease)
};
export const quote: IRichEditorToolbarButton = {
    iconName: IconNames.RightDoubleQuote,
    onClick: toggleBlockQuote,
    buttonState: formatState =>
        formatState.isBlockQuote ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal
};
export const alignLeft: IRichEditorToolbarButton = {
    iconName: IconNames.AlignLeft,
    onClick: editor => setAlignment(editor, Alignment.Left)
};
export const alignCenter: IRichEditorToolbarButton = {
    iconName: IconNames.AlignCenter,
    onClick: editor => setAlignment(editor, Alignment.Center)
};
export const alignRight: IRichEditorToolbarButton = {
    iconName: IconNames.AlignRight,
    onClick: editor => setAlignment(editor, Alignment.Right)
};
export const unlink: IRichEditorToolbarButton = {
    iconName: IconNames.RemoveLink,
    buttonState: formatState =>
        formatState.canUnlink ? RichEditorToolbarButtonState.Normal : RichEditorToolbarButtonState.Disabled,
    onClick: removeLink
};
export const subscript: IRichEditorToolbarButton = {
    iconName: IconNames.Subscript,
    buttonState: formatState =>
        formatState.isSubscript ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleSubscript
};
export const superscript: IRichEditorToolbarButton = {
    iconName: IconNames.Superscript,
    buttonState: formatState =>
        formatState.isSuperscript ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleSuperscript
};
export const strikethrough: IRichEditorToolbarButton = {
    iconName: IconNames.Strikethrough,
    buttonState: formatState =>
        formatState.isStrikeThrough ? RichEditorToolbarButtonState.Checked : RichEditorToolbarButtonState.Normal,
    onClick: toggleStrikethrough
};
export const undo: IRichEditorToolbarButton = {
    iconName: IconNames.Undo,
    buttonState: formatState =>
        formatState.canUndo ? RichEditorToolbarButtonState.Normal : RichEditorToolbarButtonState.Disabled,
    onClick: editor => editor.undo()
};
export const redo: IRichEditorToolbarButton = {
    iconName: IconNames.Redo,
    buttonState: formatState =>
        formatState.canRedo ? RichEditorToolbarButtonState.Normal : RichEditorToolbarButtonState.Disabled,
    onClick: editor => editor.redo()
};
export const removeformat: IRichEditorToolbarButton = {
    iconName: IconNames.ClearFormatting,
    onClick: clearFormat
};
export const backColor: IRichEditorToolbarButton = {
    iconName: IconNames.EraseTool,
    dropdown: (target, editor, dismiss, strings) => (
        <ColorPicker
            menuTargetElement={target}
            onDismissMenu={dismiss}
            colors={blackColors}
            strings={strings}
            // tslint:disable-next-line:jsx-no-lambda
            onSelectColor={color => setBackgroundColor(editor, color.code)}
        />
    )
};
export const textColor: IRichEditorToolbarButton = {
    iconName: IconNames.FontColor,
    dropdown: (target, editor, dismiss, strings) => (
        <ColorPicker
            menuTargetElement={target}
            onDismissMenu={dismiss}
            colors={textColors}
            strings={strings}
            // tslint:disable-next-line:jsx-no-lambda
            onSelectColor={color => setTextColor(editor, color.code)}
        />
    )
};
export const fontSize: IRichEditorToolbarButton = {
    iconName: IconNames.FontSize,
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
    [RichEditorToolbarButtonNames.btnBkColor]: backColor,
    [RichEditorToolbarButtonNames.btnFontColor]: textColor,
    [RichEditorToolbarButtonNames.btnFontSize]: fontSize,
    [RichEditorToolbarButtonNames.btnFontName]: fontName
};
