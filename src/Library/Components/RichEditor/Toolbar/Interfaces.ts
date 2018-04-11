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
    title: string;
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
    onClick?(editor: Editor, options?: IRichEditorToolbarButtonOptions): void;
}

export interface IRichEditorToolbarButtonOptions {
    getImageUrl?(data: string): Promise<string>;
}
