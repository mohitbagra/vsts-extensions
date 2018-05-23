import "./ChecklistItem.scss";

import * as React from "react";

import { ChecklistItemState, ChecklistItemStates, IChecklistItem } from "Checklist/Interfaces";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { IconButton } from "OfficeFabric/Button";
import { Checkbox } from "OfficeFabric/Checkbox";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { css } from "OfficeFabric/Utilities";

export interface IChecklistItemProps extends IBaseFluxComponentProps {
    checklistItem: IChecklistItem;
    disabled?: boolean;
    disableStateChange?: boolean;
    allowEditDefaultItems?: boolean;
    onEdit(checklistItem: IChecklistItem): void;
    onDelete(checklistItem: IChecklistItem): void;
    onToggleCheck?(checklistItem: IChecklistItem, checked: boolean): void;
}

export class ChecklistItem extends BaseFluxComponent<IChecklistItemProps, IBaseFluxComponentState> {
    public render(): JSX.Element {
        const {checklistItem, disabled, disableStateChange, allowEditDefaultItems} = this.props;
        const isCompleted = checklistItem.state === ChecklistItemState.Completed;
        const isDefaultItem = checklistItem.isDefault;
        const checklistItemState = ChecklistItemStates[checklistItem.state];
        const labelStyle: React.CSSProperties = disableStateChange ? undefined : { cursor: "pointer"};
        return (
            <div
                className="checklist-item"
                key={checklistItem.id}
            >
                { !disableStateChange &&
                    <Checkbox
                        className={css("checklist-checkbox", { checked: isCompleted })}
                        checked={isCompleted}
                        disabled={disabled}
                        styles={{
                            checkbox: {borderRadius: "10px"}
                        }}
                        onChange={this._onChecklistItemChange}
                    />
                }

                {checklistItem.required &&
                    <div className="required-item">*</div>
                }
                {checklistItem.state && checklistItem.state !== ChecklistItemState.Completed && checklistItem.state !== ChecklistItemState.New &&
                    <div className="checklist-item-state" style={{backgroundColor: checklistItemState.backgroundColor, color: checklistItemState.foregroundColor}}>
                        {checklistItem.state}
                    </div>
                }
                <div className={css("checklist-item-label", { checked: isCompleted })} onClick={this._onLabelClick} style={labelStyle}>
                    <TooltipHost
                        content={checklistItem.text}
                        delay={TooltipDelay.medium}
                        overflowMode={TooltipOverflowMode.Parent}
                        directionalHint={DirectionalHint.topCenter}
                    >
                        {checklistItem.text}
                    </TooltipHost>
                </div>

                {isDefaultItem && !allowEditDefaultItems &&
                    <TooltipHost
                        content="This is a default item. To update or delete it, please go to the settings page by clicking the gear icon above."
                        delay={TooltipDelay.medium}
                        directionalHint={DirectionalHint.bottomRightEdge}
                    >
                        <IconButton
                            className="checklist-item-button info-button"
                            disabled={disabled}
                            iconProps={{iconName: "Info"}}
                        />
                    </TooltipHost>
                }
                {(!isDefaultItem || allowEditDefaultItems) &&
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
                }
                {(!isDefaultItem || allowEditDefaultItems) &&
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
                }
            </div>
        );
    }

    private _onChecklistItemChange = (_ev: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        if (this.props.onToggleCheck && !this.props.disableStateChange && !this.props.disabled) {
            this.props.onToggleCheck(this.props.checklistItem, checked);
        }
    }

    private _onLabelClick = () => {
        const isCompleted = this.props.checklistItem.state === ChecklistItemState.Completed;
        this._onChecklistItemChange(null, !isCompleted);
    }

    private _onDeleteItemButtonClick = () => {
        this.props.onDelete(this.props.checklistItem);
    }

    private _onEditItemButtonClick = () => {
        this.props.onEdit(this.props.checklistItem);
    }
}
