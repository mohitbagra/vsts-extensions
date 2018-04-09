import * as React from "react";

import { ButtonMap } from "Library/Components/RichEditor/Toolbar/Buttons";
import {
    RichEditorToolbarButtonNames
} from "Library/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import { CommandBar } from "OfficeFabric/CommandBar";
import { ContextualMenuItemType, IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import { autobind } from "OfficeFabric/Utilities";
import Editor from "roosterjs-editor-core/lib/editor/Editor";

export interface IRichEditorToolbarProps {
    buttons: RichEditorToolbarButtonNames[];
    getEditor(): Editor;
}

export class RichEditorToolbar extends React.Component<IRichEditorToolbarProps, {}> {
    public render(): JSX.Element {
        return (
            <CommandBar
                items={this.props.buttons.map(this._getCommandButton)}
            />
        );
    }

    @autobind
    private _getCommandButton(button: RichEditorToolbarButtonNames): IContextualMenuItem {
        if (button === RichEditorToolbarButtonNames.seperator) {
            return {
                key: button,
                itemType: ContextualMenuItemType.Divider
            };
        }

        const buttonObj = ButtonMap[button];
        return {
            key: button,
            onClick: buttonObj.onClick ? () => buttonObj.onClick(this.props.getEditor()) : null
        };
    }
}
