import "../css/DateTimeControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { DateTimePicker } from "Library/Components/DateTimePicker";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { formatDate, isValidDate, parseDateString } from "Library/Utilities/Date";
import { IconButton } from "OfficeFabric/Button";
import { Fabric } from "OfficeFabric/Fabric";
import { autobind, css } from "OfficeFabric/Utilities";

interface IDateTimeControlInputs {
    FieldName: string;
}

interface IDateTimeControlState extends IWorkItemFieldControlState<Date> {
    expanded?: boolean;
    textValue?: string;
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
        let className = "date-time-control";
        if (this.state.error) {
            className += " invalid-value";
        }

        const todayInUserTimeZone = new Date();
        todayInUserTimeZone.setHours(0, 0, 0, 0);
        const {value, expanded, hovered, focussed, error} = this.state;
        let textValue = this.state.textValue;
        const isActive = hovered || focussed || expanded || error;

        if (!textValue && value) {
            textValue = formatDate(value, "M/D/YYYY hh:mm A");
        }
        return (
            <Fabric className={className}>
                <div
                    className={css("date-time-picker-input-container", {borderless: !isActive})}
                    onMouseOver={this._onMouseOver}
                    onMouseOut={this._onMouseOut}
                >
                    <input
                        type="text"
                        spellCheck={false}
                        autoComplete="off"
                        className="date-time-picker-input"
                        value={textValue || ""}
                        onFocus={this._onFocus}
                        onBlur={this._onBlur}
                        onChange={this._onInputChange}
                    />
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
                            today={todayInUserTimeZone}
                            value={isValidDate(value) ? value : todayInUserTimeZone}
                        />
                    </div>
                }
                {expanded && <div style={{clear: "both"}} />}
            </Fabric>
        );
    }

    protected getErrorMessage(value: Date): string {
        return value && !isValidDate(value) ? "Not a valid date" : "";
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
    private _onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        this.setState({textValue: value});
        this.onValueChanged(parseDateString(value));
    }

    @autobind
    private _onSelectDate(newDate: Date) {
        this.setState({textValue: formatDate(newDate, "M/D/YYYY hh:mm A")});
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
