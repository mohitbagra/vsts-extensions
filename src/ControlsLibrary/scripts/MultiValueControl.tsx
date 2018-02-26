import "../css/MultiValueControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { InputError } from "Library/Components/InputError";
import {
    FieldControl, IFieldControlProps, IFieldControlState
} from "Library/Components/VSTS/WorkItemFieldControl";
import { autobind } from "OfficeFabric/Utilities";
import * as Multiselect from "ReactWidgets/Multiselect";

interface IMultiValueControlInputs {
    FieldName: string;
    Values: string;
}

interface IMultiValueControlProps extends IFieldControlProps {
    suggestedValues: string[];
}

export class MultiValueControl extends FieldControl<IMultiValueControlProps, IFieldControlState> {
    public render(): JSX.Element {
        let className = "multivalue-control-container";
        if (this.state.error) {
            className += " invalid-value";
        }

        return (
            <div className={className}>
                <Multiselect
                    duration={0}
                    data={this.props.suggestedValues}
                    value={this._parseFieldValue()}
                    onChange={this._onChange}
                    onToggle={this._onToggle}
                />

                {this.state.error && (<InputError error={this.state.error} />)}
            </div>
        );
    }

    @autobind
    private _onChange(newValues: string[]) {
        this.onValueChanged((newValues || []).join(";"));
    }

    private _parseFieldValue(): string[] {
        const value = this.state.value as string;
        if (value) {
            return value.split(";").map(v => v.trim());
        }
        else {
            return [];
        }
    }

    @autobind
    private _onToggle(on: boolean) {
        if (on) {
            $("#ext-container").height(260);
        }
        else {
            $("#ext-container").css("height", "auto");
        }

        this.resize();
    }
}

export function init() {
    initializeIcons();
    const inputs = FieldControl.getInputs<IMultiValueControlInputs>();

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
