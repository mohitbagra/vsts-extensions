import "./DateTimePicker.scss";

import * as React from "react";

import { Calendar } from "OfficeFabric/Calendar";
import { DayOfWeek, IDatePickerStrings } from "OfficeFabric/DatePicker";
import { autobind, css } from "OfficeFabric/Utilities";
import { ITimeStrings, Time } from "./Time";

export interface IDateTimePickerProps {
    today: Date;
    value: Date;
    className?: string;
    dateTimePickerCulture: IDateTimePickerCulture;
    onSelectDate?(date: Date): void;
}

export interface IDateTimePickerState {
    selectedDate: Date;
}

export interface IDateTimePickerCulture {
    calendarStrings: IDatePickerStrings;
    timeStrings: ITimeStrings;
    firstDayOfWeek?: DayOfWeek;
    use24HourFormat: boolean;
    renderAmPmBeforeTime: boolean;
}

export class DateTimePicker extends React.Component<IDateTimePickerProps, IDateTimePickerState> {
    constructor(props: IDateTimePickerProps) {
        super(props);

        const { today, value } = props;

        let initialDate: Date = null;
        if (value) {
            initialDate = new Date(value.getTime());
        }
        else {
            initialDate = new Date(today.getTime());
            initialDate.setHours(0, 0, 0, 0);
        }

        this.state = {
            selectedDate: initialDate
        };
    }

    public render(): JSX.Element {
        const { dateTimePickerCulture, today, className } = this.props;
        const { selectedDate } = this.state;

        return (
            <div className={css("date-time-picker", className)}>
                <div className="date-time-picker-calendar">
                    <Calendar
                        onSelectDate={this._onSelectDate}
                        isMonthPickerVisible={true}
                        today={today}
                        value={selectedDate}
                        strings={dateTimePickerCulture.calendarStrings}
                    />
                </div>
                <div className="date-time-picker-time">
                    <Time
                        onSelectTime={this._onSelectTime}
                        hour={selectedDate ? selectedDate.getHours() : 12}
                        minute={selectedDate ? selectedDate.getMinutes() : 0}
                        timeStrings={dateTimePickerCulture.timeStrings}
                        use24HourFormat={dateTimePickerCulture.use24HourFormat}
                        renderAmPmBeforeTime={dateTimePickerCulture.renderAmPmBeforeTime}
                    />
                </div>
            </div >
        );
    }

    @autobind
    private _onSelectDate(date: Date) {
        const { onSelectDate } = this.props;
        const newDate = new Date(date.getTime());
        const hour = this.state.selectedDate.getHours();
        const minute = this.state.selectedDate.getMinutes();
        newDate.setHours(hour);
        newDate.setMinutes(minute);

        this.setState({
            selectedDate: newDate
        });

        if (onSelectDate) {
            onSelectDate(new Date(newDate.getTime()));
        }
    }

    @autobind
    private _onSelectTime(hour: number, minute: number) {
        const { onSelectDate } = this.props;
        const { selectedDate } = this.state;

        selectedDate.setHours(hour);
        selectedDate.setMinutes(minute);

        this.setState({
            selectedDate
        });

        if (onSelectDate) {
            onSelectDate(new Date(selectedDate.getTime()));
        }
    }
}
