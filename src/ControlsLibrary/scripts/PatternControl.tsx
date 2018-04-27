import "../css/PatternControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { getFormService } from "Library/Utilities/WorkItemFormHelpers";
import { Fabric } from "OfficeFabric/Fabric";
import { TextField } from "OfficeFabric/TextField";
import { autobind } from "OfficeFabric/Utilities";

interface IPatternControlInputs {
    FieldName: string;
    Pattern: string;
    ErrorMessage?: string;
}

interface IPatternControlProps extends IWorkItemFieldControlProps {
    pattern: string;
    errorMessage: string;
}

interface IPatternControlState extends IWorkItemFieldControlState<string> {
    hovered?: boolean;
    focussed?: boolean;
}

export class PatternControl extends WorkItemFieldControl<string, IPatternControlProps, IPatternControlState> {
    public render(): JSX.Element {
        const {value, hovered, focussed, error} = this.state;
        const isActive = hovered || focussed || error;
        return (
            <Fabric className="fabric-container">
                <TextField
                    className="pattern-control"
                    value={value || ""}
                    borderless={!isActive}
                    onChanged={this._onChange}
                    onMouseOver={this._onMouseOver}
                    onMouseOut={this._onMouseOut}
                    onFocus={this._onFocus}
                    onBlur={this._onBlur}
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
    private _onChange(value: string) {
        this.onValueChanged(value);
    }

    private async _setWorkItemFormError(error: string) {
        const service: any = await getFormService();
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
