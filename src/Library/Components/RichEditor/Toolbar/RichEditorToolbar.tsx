import "./RichEditorToolbar.scss";

import * as React from "react";

import { ButtonMap } from "Library/Components/RichEditor/Toolbar/Buttons";
import { IRichEditorToolbarButtonOptions } from "Library/Components/RichEditor/Toolbar/Interfaces";
import {
    RichEditorToolbarButtonNames
} from "Library/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import { IconButton } from "OfficeFabric/Button";
import { FocusZone, FocusZoneDirection } from "OfficeFabric/FocusZone";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { autobind, css } from "OfficeFabric/Utilities";
import Editor from "roosterjs-editor-core/lib/editor/Editor";

export interface IRichEditorToolbarProps {
    buttons: RichEditorToolbarButtonNames[];
    options?: IRichEditorToolbarButtonOptions;
    getEditor(): Editor;
}

export class RichEditorToolbar extends React.Component<IRichEditorToolbarProps, {}> {
    public render(): JSX.Element {
        const {buttons} = this.props;

        return (
            <FocusZone className="richeditor-toolbar-focuszone" direction={FocusZoneDirection.horizontal}>
                {buttons.map(this._getCommandButton)}
            </FocusZone>
        );
    }

    @autobind
    private _getCommandButton(button: RichEditorToolbarButtonNames, index: number): JSX.Element {
        const buttonObj = ButtonMap[button];
        if (!buttonObj) {
            return null;
        }

        const onClick = () => {
            buttonObj.onClick(this.props.getEditor(), this.props.options);
        };

        return (
            <TooltipHost
                key={index}
                content={buttonObj.title}
                delay={TooltipDelay.medium}
                directionalHint={DirectionalHint.bottomCenter}
                hostClassName={button}
            >
                <IconButton
                    className={css("toolbar-button")}
                    iconProps={{
                        iconName: buttonObj.iconName
                    }}
                    onClick={onClick}
                />
            </TooltipHost>
        );
    }
}
