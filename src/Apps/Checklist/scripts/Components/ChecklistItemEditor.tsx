import "./ChecklistItemEditor.scss";

import * as React from "react";

import { ChecklistItemState, ChecklistItemStates, IChecklistItem } from "Checklist/Interfaces";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { isNullOrWhiteSpace } from "Common/Utilities/String";
import { DefaultButton, IconButton } from "OfficeFabric/Button";
import { Checkbox } from "OfficeFabric/Checkbox";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import { TextField } from "OfficeFabric/TextField";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { css, KeyCodes } from "OfficeFabric/Utilities";

export interface IChecklistItemEditorProps extends IBaseFluxComponentProps {
    checklistItem?: IChecklistItem;
    disabled?: boolean;
    inputPlaceholder?: string;
    showStatePicker?: boolean;
    autoFocus?: boolean;
    onSubmit(item: IChecklistItem): void;
    onCancel?(): void;
}

export interface IChecklistItemEditorState extends IBaseFluxComponentState {
    checklistItem: IChecklistItem;
}

export class ChecklistItemEditor extends BaseFluxComponent<IChecklistItemEditorProps, IChecklistItemEditorState> {
    public componentWillReceiveProps(nextProps: IChecklistItemEditorProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        this.setState({
            checklistItem: nextProps.checklistItem ? {...nextProps.checklistItem} : this._getDefaultItem()
        });
    }

    public render(): JSX.Element {
        const {disabled, inputPlaceholder, showStatePicker, autoFocus} = this.props;
        const {checklistItem} = this.state;
        const checklistItemState = ChecklistItemStates[checklistItem.state];

        return (
            <div className="checklist-item-editor">
                <TextField
                    className="checklist-item-editor-text-field"
                    inputClassName={css("checklist-item-editor-input", { disabled: disabled })}
                    autoFocus={autoFocus}
                    placeholder={inputPlaceholder}
                    readOnly={disabled}
                    value={checklistItem.text}
                    onChanged={this._onItemTextChange}
                    maxLength={128}
                    onKeyUp={this._onInputKeyUp}
                />
                <div className="checklist-item-editor-bottom-section">
                    <div className="checklist-item-editor-properties">
                        <Checkbox
                            disabled={disabled}
                            className="checklist-item-editor-mandatory"
                            label="Mandatory?"
                            checked={checklistItem.required}
                            onChange={this._onItemMandatoryChange}
                        />
                        {showStatePicker &&
                            <DefaultButton
                                className="checklist-item-editor-state-picker"
                                text={checklistItemState.name}
                                disabled={disabled}
                                styles={{
                                    root: {
                                        backgroundColor: checklistItemState.backgroundColor,
                                        color: checklistItemState.foregroundColor
                                    },
                                    rootHovered: {
                                        backgroundColor: checklistItemState.backgroundColor,
                                        color: checklistItemState.foregroundColor
                                    },
                                    rootPressed: {
                                        backgroundColor: checklistItemState.backgroundColor,
                                        color: checklistItemState.foregroundColor
                                    },
                                    rootExpanded: {
                                        backgroundColor: checklistItemState.backgroundColor,
                                        color: checklistItemState.foregroundColor
                                    }
                                }}
                                menuProps={{
                                    items: this._getStates(),
                                    onItemClick: this._onStateChange
                                }}
                            />
                        }
                    </div>
                    <div className="checklist-item-editor-buttons">
                        <TooltipHost
                            content={"Save"}
                            delay={TooltipDelay.medium}
                            directionalHint={DirectionalHint.topCenter}
                        >
                            <IconButton
                                className="checklist-item-editor-button save-button"
                                iconProps={{iconName: "SkypeCircleCheck"}}
                                disabled={disabled}
                                onClick={this._submitItem}
                            />
                        </TooltipHost>
                        <TooltipHost
                            content={"Cancel"}
                            delay={TooltipDelay.medium}
                            directionalHint={DirectionalHint.topCenter}
                        >
                            <IconButton
                                className="checklist-item-editor-button cancel-button"
                                iconProps={{iconName: "StatusErrorFull"}}
                                disabled={disabled}
                                onClick={this._cancelEdit}
                            />
                        </TooltipHost>
                    </div>
                </div>
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            checklistItem: this.props.checklistItem ? {...this.props.checklistItem} : this._getDefaultItem()
        };
    }

    private _getDefaultItem(): IChecklistItem {
        return {
            text: "",
            id: null,
            required: true,
            state: ChecklistItemState.New
        };
    }

    private _getStates(): IContextualMenuItem[] {
        return Object.keys(ChecklistItemStates).map(state => ({
            key: ChecklistItemStates[state].name,
            name: ChecklistItemStates[state].name,
            data: ChecklistItemStates[state]
        }));
    }

    private _onStateChange = (_ev: React.MouseEvent<HTMLElement>, item: IContextualMenuItem) => {
        const checklistItem = {...this.state.checklistItem};
        checklistItem.state = item.key as ChecklistItemState;
        this.setState({checklistItem: checklistItem});
    }

    private _onInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === KeyCodes.enter) {
            e.preventDefault();
            e.stopPropagation();
            this._submitItem();
        }
        else if (e.keyCode === KeyCodes.escape) {
            e.preventDefault();
            e.stopPropagation();
            this._cancelEdit();
        }
    }

    private _onItemTextChange = (value: string) => {
        const checklistItem = {...this.state.checklistItem};
        checklistItem.text = value;
        this.setState({checklistItem: checklistItem});
    }

    private _onItemMandatoryChange = (_ev: React.FormEvent<HTMLInputElement>, checked: boolean) => {
        const checklistItem = {...this.state.checklistItem};
        checklistItem.required = checked;
        this.setState({checklistItem: checklistItem});
    }

    private _submitItem = () => {
        const {checklistItem} = this.state;
        if (!isNullOrWhiteSpace(checklistItem.text)) {
            this.props.onSubmit(this.state.checklistItem);
        }
    }

    private _cancelEdit = () => {
        this.setState(
            {
                checklistItem: this.props.checklistItem ? {...this.props.checklistItem} : this._getDefaultItem()
            },
            () => {
                const {onCancel} = this.props;
                if (onCancel) {
                    onCancel();
                }
            }
        );
    }
}
