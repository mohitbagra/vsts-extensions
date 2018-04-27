import "../css/DateTimeControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import * as format from "date-fns/format";
import { DateTimePicker } from "Library/Components/DateTimePicker";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { IconButton } from "OfficeFabric/Button";
import { Fabric } from "OfficeFabric/Fabric";
import { autobind, css } from "OfficeFabric/Utilities";

interface IDateTimeControlInputs {
    FieldName: string;
}

interface IDateTimeControlState extends IWorkItemFieldControlState<Date> {
    expanded?: boolean;
    hovered?: boolean;
    focussed?: boolean;
}

export class DateTimeControl extends WorkItemFieldControl<Date, IWorkItemFieldControlProps, IDateTimeControlState> {
    constructor(props: IWorkItemFieldControlProps) {
        super(props);

        this.state = {
            expanded: false
        };
    }

    public render(): JSX.Element {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const {value, expanded, hovered, focussed} = this.state;
        const isActive = hovered || focussed || expanded;

        return (
            <Fabric className="date-time-control">
                <div
                    className={css("date-time-picker-input-container", {borderless: !isActive})}
                    onMouseOver={this._onMouseOver}
                    onMouseOut={this._onMouseOut}
                >
                    <input
                        type="text"
                        spellCheck={false}
                        autoComplete="off"
                        readOnly={true}
                        className="date-time-picker-input"
                        value={value ? format(value, "M/D/YYYY hh:mm A") : ""}
                        onFocus={this._onFocus}
                        onBlur={this._onBlur}
                    />
                    { value &&
                        <IconButton
                            iconProps={{
                                iconName: "Cancel",
                            }}
                            className="date-time-picker-icon clear-icon"
                            onClick={this._clearValue}
                        />
                    }
                    <IconButton
                        iconProps={{
                            iconName: "Calendar"
                        }}
                        className="date-time-picker-icon"
                        onClick={this._toggleCalendar}
                    />
                </div>
                { expanded &&
                    <div className="arrow-box">
                        <DateTimePicker
                            onSelectDate={this._onSelectDate}
                            today={today}
                            value={value || today}
                        />
                    </div>
                }
                {expanded && <div style={{clear: "both"}} />}
            </Fabric>
        );
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
    private _toggleCalendar() {
        this.setState({expanded: !this.state.expanded});
    }

    @autobind
    private _clearValue() {
        this.onValueChanged(null);
    }

    @autobind
    private _onSelectDate(newDate: Date) {
        this.onValueChanged(newDate);
    }
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
