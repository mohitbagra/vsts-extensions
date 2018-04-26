import "../css/MultiValueControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { findIndex } from "Library/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { ITag } from "OfficeFabric/components/pickers/TagPicker/TagPicker";
import { Fabric } from "OfficeFabric/Fabric";
import { autobind } from "OfficeFabric/Utilities";
import { CustomTagPicker } from "./CustomTagPicker";

interface IMultiValueControlInputs {
    FieldName: string;
    Values: string;
}

interface IMultiValueControlProps extends IWorkItemFieldControlProps {
    suggestedValues: string[];
}

export class MultiValueControl extends WorkItemFieldControl<string, IMultiValueControlProps, IWorkItemFieldControlState<string>> {
    private _isCalloutOpen: boolean = false;

    public render(): JSX.Element {
        const values = this._parseFieldValue();
        return (
            <Fabric>
                <CustomTagPicker
                    className="multi-value-control"
                    onToggleCallout={this._onToggleCallout}
                    selectedItems={(values || []).map(this._getTag)}
                    onResolveSuggestions={this._onTagFilterChanged}
                    getTextFromItem={this._getTagText}
                    onChange={this._onChange}
                    inputProps={{
                        style: {
                            height: "26px"
                        }
                    }}
                    pickerSuggestionsProps={
                        {
                            suggestionsHeaderText: "Suggested values",
                            noResultsFoundText: "No suggested values."
                        }
                    }
                />
            </Fabric>
        );
    }

    @autobind
    private _getTag(tag: string): ITag {
        return {
            key: tag,
            name: tag
        };
    }

    @autobind
    private _getTagText(tag: ITag): string {
        return tag.name;
    }

    @autobind
    private _onTagFilterChanged(filterText: string, tagList: ITag[]): ITag[] {
        if (isNullOrWhiteSpace(filterText)) {
            return [];
        }

        const tags = this.props.suggestedValues.map(this._getTag);

        return tags
            .filter(tag => tag.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0 && findIndex(tagList, (t: ITag) => stringEquals(t.key, tag.name, true)) === -1)
            .map(tag => {
                return { key: tag.name, name: tag.name};
            });
    }

    @autobind
    private _onChange(items: ITag[]) {
        const selectedTags = items.map(i => i.name);
        this.onValueChanged((selectedTags || []).join(";"));
    }

    @autobind
    private _onToggleCallout(on: boolean) {
        if (this._isCalloutOpen !== on) {
            this._isCalloutOpen = on;
            if (on) {
                $("#ext-container").height(260);
            }
            else {
                $("#ext-container").css("height", "auto");
            }

            this.resize();
        }
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
