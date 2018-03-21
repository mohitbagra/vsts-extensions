import "../css/PatternControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { Fabric } from "OfficeFabric/Fabric";
import { autobind } from "OfficeFabric/Utilities";
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";

interface IPatternControlInputs {
    FieldName: string;
    Pattern: string;
    ErrorMessage?: string;
}

interface IPatternControlProps extends IWorkItemFieldControlProps {
    pattern: string;
    errorMessage: string;
}

export class PatternControl extends WorkItemFieldControl<string, IPatternControlProps, IWorkItemFieldControlState<string>> {
    public render(): JSX.Element {
        let className = "pattern-control";
        if (this.state.error) {
            className += " invalid-value";
        }

        return (
            <Fabric className="fabric-container">
                <input
                    type="text"
                    spellCheck={false}
                    autoComplete="off"
                    className={className}
                    value={this.state.value}
                    onChange={this._onChange}
                />
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
    private _onChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.onValueChanged(e.target.value);
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
    const inputs = WorkItemFieldControl.getInputs<IPatternControlInputs>();

    ReactDOM.render(
        <PatternControl
            fieldName={inputs.FieldName}
            pattern={inputs.Pattern}
            errorMessage={inputs.ErrorMessage && inputs.ErrorMessage.trim() || "The entered value does not match the control's pattern."}
        />,
        document.getElementById("ext-container"));
}
