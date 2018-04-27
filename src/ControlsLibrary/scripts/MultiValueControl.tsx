import "../css/MultiValueControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { findIndex } from "Library/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { getFormService } from "Library/Utilities/WorkItemFormHelpers";
import { ValidationState } from "OfficeFabric/components/pickers/BasePicker.types";
import { ITag } from "OfficeFabric/components/pickers/TagPicker/TagPicker";
import { Fabric } from "OfficeFabric/Fabric";
import { autobind, css } from "OfficeFabric/Utilities";
import { CustomTagPicker } from "./CustomTagPicker";

interface IMultiValueControlInputs {
    FieldName: string;
    Values: string;
}

interface IMultiValueControlProps extends IWorkItemFieldControlProps {
    suggestedValues: string[];
}

interface IMultiValueControlState extends IWorkItemFieldControlState<string> {
    hovered?: boolean;
    focussed?: boolean;
}

export class MultiValueControl extends WorkItemFieldControl<string, IMultiValueControlProps, IMultiValueControlState> {
    private _isCalloutOpen: boolean = false;

    public render(): JSX.Element {
        const values = this._parseFieldValue();
        const {hovered, focussed} = this.state;
        const isActive = hovered || focussed;
        return (
            <Fabric>
                <CustomTagPicker
                    className={css("multi-value-control", {borderless: !isActive})}
                    suggestionsListClassName="suggestions-list"
                    onToggleCallout={this._onToggleCallout}
                    selectedItems={(values || []).map(this._getTag)}
                    onResolveSuggestions={this._onTagFilterChanged}
                    getTextFromItem={this._getTagText}
                    onChange={this._onChange}
                    createGenericItem={this._createGenericItem}
                    onValidateInput={this._onValidateInput}
                    inputProps={{
                        style: {
                            height: "26px"
                        },
                        onKeyDown: this._onInputKeyDown,
                        onMouseOver: this._onMouseOver,
                        onMouseOut: this._onMouseOut,
                        onFocus: this._onFocus,
                        onBlur: this._onBlur
                    }}
                    pickerSuggestionsProps={
                        {
                            suggestionsHeaderText: "Suggested values",
                            noResultsFoundText: "No suggested values. Press enter to select current input."
                        }
                    }
                />
            </Fabric>
        );
    }

    @autobind
    private async _onInputKeyDown(e: React.KeyboardEvent<any>) {
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            const formService = await getFormService();
            formService.save();
        }
    }

    @autobind
    private _onMouseOver() {
        this.setState({hovered: true});
    }

    @autobind
    private _onMouseOut() {
        this.setState({hovered: false});
    }

    @autobind
    private _onFocus() {
        this.setState({focussed: true});
    }

    @autobind
    private _onBlur() {
        this.setState({focussed: false});
    }

    @autobind
    private _onValidateInput(value: string): ValidationState {
        return isNullOrWhiteSpace(value) ? ValidationState.invalid : ValidationState.valid;
    }

    @autobind
    private _createGenericItem(input: string): any {
        return {
            key: input,
            name: input
        };
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
            setTimeout(
                () => {
                    this.resize();
                },
                100
            );
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
