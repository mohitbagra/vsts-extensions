import "./ChecklistItem.scss";

import * as React from "react";

import { ChecklistItemState, ChecklistItemStates, IChecklistItem } from "Checklist/Interfaces";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { IconButton } from "OfficeFabric/Button";
import { Checkbox } from "OfficeFabric/Checkbox";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { autobind, css } from "OfficeFabric/Utilities";

export interface IChecklistItemProps extends IBaseFluxComponentProps {
    checklistItem: IChecklistItem;
    disabled?: boolean;
    onEdit(checklistItem: IChecklistItem): void;
    onDelete(checklistItem: IChecklistItem): void;
    onToggleCheck(checklistItem: IChecklistItem, checked: boolean): void;
}

export class ChecklistItem extends BaseFluxComponent<IChecklistItemProps, IBaseFluxComponentState> {
    public render(): JSX.Element {
        const {checklistItem, disabled} = this.props;
        const isCompleted = checklistItem.state === ChecklistItemState.Completed;
        const checklistItemState = ChecklistItemStates[checklistItem.state];

        return (
            <div className="checklist-item" key={checklistItem.id}>
                <Checkbox
                    className={css("checklist-checkbox", { checked: isCompleted })}
                    checked={isCompleted}
                    disabled={disabled}
                    onChange={this._onChecklistItemChange}
                />
                {checklistItem.required &&
                    <div className="required-item">*</div>
                }
                {checklistItem.state && checklistItem.state !== ChecklistItemState.Completed && checklistItem.state !== ChecklistItemState.New &&
                    <div className="checklist-item-state" style={{backgroundColor: checklistItemState.backgroundColor, color: checklistItemState.foregroundColor}}>
                        {checklistItem.state}
                    </div>
                }
                <div className={css("checklist-item-label", { checked: isCompleted })}>
                    <TooltipHost
                        content={checklistItem.text}
                        delay={TooltipDelay.medium}
                        overflowMode={TooltipOverflowMode.Parent}
                        directionalHint={DirectionalHint.topCenter}
                    >
                        {checklistItem.text}
                    </TooltipHost>
                </div>
                <TooltipHost
                    content={"Edit item"}
                    delay={TooltipDelay.medium}
                    directionalHint={DirectionalHint.bottomRightEdge}
                >
                    <IconButton
                        className="checklist-item-button edit-item-button"
                        disabled={disabled}
                        iconProps={{iconName: "Edit"}}
                        onClick={this._onEditItemButtonClick}
                    />
                </TooltipHost>
                <TooltipHost
                    content={"Delete item"}
                    delay={TooltipDelay.medium}
                    directionalHint={DirectionalHint.bottomRightEdge}
                >
                    <IconButton
                        className="checklist-item-button delete-item-button"
                        disabled={disabled}
                        iconProps={{iconName: "Trash"}}
                        onClick={this._onDeleteItemButtonClick}
                    />
                </TooltipHost>
            </div>
        );
    }

    @autobind
    private _onChecklistItemChange(_ev: React.FormEvent<HTMLInputElement>, checked: boolean) {
        this.props.onToggleCheck(this.props.checklistItem, checked);
    }

    @autobind
    private _onDeleteItemButtonClick() {
        this.props.onDelete(this.props.checklistItem);
    }

    @autobind
    private _onEditItemButtonClick() {
        this.props.onEdit(this.props.checklistItem);
    }
}
