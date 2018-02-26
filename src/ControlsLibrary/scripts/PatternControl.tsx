import "../css/PatternControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { InputError } from "Library/Components/InputError";
import {
    FieldControl, IFieldControlProps, IFieldControlState
} from "Library/Components/VSTS/WorkItemFieldControl";
import { Fabric } from "OfficeFabric/Fabric";
import { TextField } from "OfficeFabric/TextField";
import { autobind } from "OfficeFabric/Utilities";
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";

interface IPatternControlInputs {
    FieldName: string;
    Pattern: string;
    ErrorMessage?: string;
}

interface IPatternControlProps extends IFieldControlProps {
    pattern: string;
    errorMessage: string;
}

export class PatternControl extends FieldControl<IPatternControlProps, IFieldControlState> {
    public render(): JSX.Element {
        let className = "pattern-control-input";
        if (this.state.error) {
            className += " invalid-value";
        }

        return (
            <Fabric className="fabric-container">
                <TextField
                    className="pattern-control"
                    inputClassName={className}
                    value={this.state.value}
                    onChanged={this._onChange}
                />

                {this.state.error && (<InputError error={this.state.error} />)}
            </Fabric>
        );
    }

    protected getErrorMessage(value: string): string {
        let error = "";
        if (value) {
            const patt = new RegExp(this.props.pattern);
            error = patt.test(value) ? "" : this.props.errorMessage;
        }
        this._setWorkItemFormError(error);
        return error;
    }

    @autobind
    private _onChange(newValue: string) {
        this.onValueChanged(newValue);
    }

    private async _setWorkItemFormError(error: string) {
        const service: any = await WorkItemFormService.getService();
        if (error) {
            service.setError(error);
        }
        else {
            service.clearError();
        }
    }
}

export function init() {
    initializeIcons();
    const inputs = FieldControl.getInputs<IPatternControlInputs>();

    ReactDOM.render(
        <PatternControl
            fieldName={inputs.FieldName}
            pattern={inputs.Pattern}
            errorMessage={inputs.ErrorMessage && inputs.ErrorMessage.trim() || "The entered value does not match the control's pattern."}
        />,
        document.getElementById("ext-container"));
}
