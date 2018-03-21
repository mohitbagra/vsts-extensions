import "../css/DateTimeControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { InputError } from "Library/Components/InputError";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";

// import { autobind } from "OfficeFabric/Utilities";

interface IDateTimeControlInputs {
    FieldName: string;
}

export class DateTimeControl extends WorkItemFieldControl<Date, IWorkItemFieldControlProps, IWorkItemFieldControlState<Date>> {

    public render(): JSX.Element {
        let className = "datetime-control-container";
        if (this.state.error) {
            className += " invalid-value";
        }

        return (
            <div className={className}>
                {/* <DateTimePicker
                    duration={0}
                    value={this.state.value}
                    onChange={this._onChange}
                    onToggle={this._onToggle}
                /> */}

                {this.state.error && (<InputError error={this.state.error} />)}
            </div>
        );
    }

    // @autobind
    // private _onChange(newDate: Date) {
    //     this.onValueChanged(newDate);
    // }

    // @autobind
    // private _onToggle(on: any) {
    //     if (on === "calendar") {
    //         $("#ext-container").height(450);
    //     }
    //     else if (on === "time") {
    //         $("#ext-container").height(250);
    //     }
    //     else {
    //         $("#ext-container").css("height", "auto");
    //     }

    //     this.resize();
    // }
}

export function init() {
    initializeIcons();
    const inputs = WorkItemFieldControl.getInputs<IDateTimeControlInputs>();

    ReactDOM.render(
        <DateTimeControl
            fieldName={inputs.FieldName}
        />,
        document.getElementById("ext-container"));
}
