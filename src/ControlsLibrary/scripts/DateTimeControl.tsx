import "../css/DateTimeControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    DateTimePicker, IDateTimePickerCulture, ITimeStrings
} from "Library/Components/DateTimePicker";
import { InputError } from "Library/Components/InputError";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { formatDate } from "Library/Utilities/Date";
import { IDatePickerStrings } from "OfficeFabric/components/DatePicker/DatePicker.types";
import { Fabric } from "OfficeFabric/Fabric";
import { autobind } from "OfficeFabric/Utilities";
import * as Culture from "VSS/Utils/Culture";
import * as Utils_Date from "VSS/Utils/Date";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

interface IDateTimeControlInputs {
    FieldName: string;
}

interface IDateTimeControlState extends IWorkItemFieldControlState<Date> {
    expanded?: boolean;
}

export class DateTimeControl extends WorkItemFieldControl<Date, IWorkItemFieldControlProps, IDateTimeControlState> {
    private _dateTimePickerCulture: IDateTimePickerCulture;

    constructor(props: IWorkItemFieldControlProps) {
        super(props);

        this._initializeDateTimePickerCulture();
    }

    public render(): JSX.Element {
        let className = "date-time-control";
        if (this.state.error) {
            className += " invalid-value";
        }

        const todayInUserTimeZone: Date = Utils_Date.convertClientTimeToUserTimeZone(new Date(), true);
        todayInUserTimeZone.setHours(0, 0, 0, 0);
        const {value} = this.state;

        return (
            <Fabric className={className}>
                <div className="date-time-picker-input-container">
                    <input
                        type="text"
                        spellCheck={false}
                        autoComplete="off"
                        className="date-time-picker-input"
                        value={value ? formatDate(value, "M/D/YYYY h:mm aa") : ""}
                        onChange={this._onInputChange}
                    />
                    <VssIcon
                        className="date-time-picker-icon"
                        iconName="Calendar"
                        iconType={VssIconType.fabric}
                    />
                </div>
                <DateTimePicker
                    onSelectDate={this._onChange}
                    today={todayInUserTimeZone}
                    value={this.state.value}
                    dateTimePickerCulture={this._dateTimePickerCulture}
                />
                {this.state.error && (<InputError error={this.state.error} />)}
            </Fabric>
        );
    }

    @autobind
    private _onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.onValueChanged(new Date(e.target.value));
    }

    @autobind
    private _onChange(newDate: Date) {
        this.onValueChanged(newDate);
    }

    private _initializeDateTimePickerCulture() {
        const dateTimeFormat = Culture.getDateTimeFormat();

        // build calendar strings
        const calendarStrings = {
            months: dateTimeFormat.MonthNames,
            days: dateTimeFormat.DayNames,
            shortMonths: dateTimeFormat.AbbreviatedMonthNames,
            shortDays: dateTimeFormat.AbbreviatedDayNames,
            goToToday: "Go to today"
        } as IDatePickerStrings;

        // build time strings
        const timeStrings = {
            AMDesignator: dateTimeFormat.AMDesignator,
            PMDesignator: dateTimeFormat.PMDesignator
        } as ITimeStrings;

        // build time format
        let use24HourFormat = false;
        let renderAmPmBeforeTime = false;
        const ttIndex = dateTimeFormat.ShortTimePattern.indexOf("tt");
        if (ttIndex === -1) {
            use24HourFormat = true;
        }
        else if (ttIndex === 0) {
            renderAmPmBeforeTime = true;
        }

        this._dateTimePickerCulture = {
            calendarStrings: calendarStrings,
            timeStrings: timeStrings,
            use24HourFormat: use24HourFormat,
            renderAmPmBeforeTime: renderAmPmBeforeTime,
            firstDayOfWeek: dateTimeFormat.FirstDayOfWeek
        } as IDateTimePickerCulture;
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
