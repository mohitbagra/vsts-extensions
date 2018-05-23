import Editor from "roosterjs-editor-core/lib/editor/Editor";

export interface IRichEditorToolbarButton {
    iconName: string;
    title: string;
    onClick(editor: Editor, options?: IRichEditorToolbarButtonOptions): void;
}

export interface IRichEditorToolbarButtonOptions {
    getImageUrl?(data: string): Promise<string>;
}
