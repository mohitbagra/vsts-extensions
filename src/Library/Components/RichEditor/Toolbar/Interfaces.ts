import Editor from "roosterjs-editor-core/lib/editor/Editor";
import FormatState from "roosterjs-editor-types/lib/format/FormatState";

/**
 * State of button on ribbon
 */
export const enum RichEditorToolbarButtonState {
    /**
     * A normal button
     */
    Normal,

    /**
     * A button in checked state
     */
    Checked,

    /**
     * A disabled button
     */
    Disabled,
}

/**
 * Button on ribbon
 */
export interface IRichEditorToolbarButton {
    iconName: string;
    /**
     * A call back to get a drop down UI when click on this button
     */
    dropdown?(
        targetElement: HTMLElement,
        editor: Editor,
        onDismiss: () => void,
        currentFormat: FormatState
    ): JSX.Element;
    /**
     * A callback to get current state of this button
     */
    buttonState?(formatState: FormatState): RichEditorToolbarButtonState;
    /**
     * onClick event handler
     */
    onClick?(editor: Editor): void;
}

export enum RichEditorToolbarButtonNames {
    btnFontName = "Font",
    btnFontSize = "Font size",
    btnBold = "Bold",
    btnItalic = "Italic",
    btnUnderline = "Underline",
    btnBullets = "Bulleted list",
    btnNumbering = "Numbered list",
    btnIndent = "Increase indent",
    btnOutdent = "Decrease indent",
    btnQuote = "Quote",
    btnAlignLeft = "Align left",
    btnAlignCenter = "Align center",
    btnAlignRight = "Align right",
    btnUnlink = "Remove hyperlink",
    btnSubscript = "Subscript",
    btnSuperScript = "Superscript",
    btnStrikethrough = "Strikethrough",
    btnUndo = "Undo",
    btnRedo = "Redo",
    btnUnformat = "Remove formatting",
    btnBkColor = "Highlight",
    btnFontColor = "Font color"
}
