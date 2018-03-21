import "../css/MultiValueControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { isNullOrWhiteSpace } from "Library/Utilities/String";
import { Fabric } from "OfficeFabric/Fabric";
import { SelectionMode } from "OfficeFabric/Selection";
import { autobind } from "OfficeFabric/Utilities";
import { IPickListSelection, PickList } from "VSSUI/PickList";

interface IMultiValueControlInputs {
    FieldName: string;
    Values: string;
}

interface IMultiValueControlProps extends IWorkItemFieldControlProps {
    suggestedValues: string[];
}

interface IMultiValueControlState extends IWorkItemFieldControlState<string> {
    isPickListOpen?: boolean;
}

export class MultiValueControl extends WorkItemFieldControl<string, IMultiValueControlProps, IMultiValueControlState> {
    public render(): JSX.Element {
        const values = this._parseFieldValue();
        let className = "multi-value-control";
        if (this.state.isPickListOpen) {
            className += " expanded";
        }
        return (
            <Fabric>
                <div className={className} tabIndex={0}>
                    <div onClick={this._togglePicklist} className="selected-values">
                        {values.length === 0 && <label className="no-items-text">No items selected</label>}
                        {values.length > 0 &&
                            <ul className="selected-values-list">
                                {values.map((value: string, index: number) => (
                                    <li
                                        key={index}
                                        title={value.trim()}
                                        className="selected-value"
                                    >
                                        {value.trim()}
                                    </li>
                                ))}
                            </ul>
                        }
                    </div>
                    {this.state.isPickListOpen &&
                        <PickList
                            className="picklist"
                            items={this.props.suggestedValues}
                            selectedItems={values}
                            onSelectionChanged={this._onSelectionChanged}
                            selectionMode={SelectionMode.multiple}
                            noItemsText="No items"
                            showSelectAll={true}
                            isSearchable={true}
                            searchTextPlaceholder="Search"
                            minItemsForSearchBox={4}
                        />
                    }
                </div>
            </Fabric>
        );
    }

    @autobind
    private _togglePicklist() {
        this.setState({isPickListOpen: !this.state.isPickListOpen});
    }

    @autobind
    private _onSelectionChanged(selection: IPickListSelection) {
        const newValues: string[] = selection.selectedItems;
        this.onValueChanged((newValues || []).join(";"));
    }

    private _parseFieldValue(): string[] {
        const value = this.state.value;
        if (!isNullOrWhiteSpace(value)) {
            return value.split(";").map(v => v.trim());
        }
        else {
            return [];
        }
    }
}

export function init() {
    initializeIcons();
    const inputs = WorkItemFieldControl.getInputs<IMultiValueControlInputs>();

    const values = inputs.Values;
    let suggestedValues: string[];
    if (values) {
        suggestedValues = values.split(";").map(v => {
            return v.trim();
        });
    }
    else {
        suggestedValues = [];
    }

    ReactDOM.render(
        <MultiValueControl
            fieldName={inputs.FieldName}
            suggestedValues={suggestedValues}
        />,
        document.getElementById("ext-container"));
}
