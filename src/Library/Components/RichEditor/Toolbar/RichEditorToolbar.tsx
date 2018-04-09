import * as React from "react";

import { RichEditorToolbarButtonNames } from "Library/Components/RichEditor/Toolbar/Interfaces";
import Editor from "roosterjs-editor-core/lib/editor/Editor";

export interface IRichEditorToolbarProps {
    buttons: RichEditorToolbarButtonNames[];
    getEditor(): Editor;
}

export class RichEditorToolbar extends React.Component<IRichEditorToolbarProps, {}> {
    public render(): JSX.Element {
        return null;
    }
}
