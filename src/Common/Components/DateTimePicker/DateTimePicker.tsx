import "./DateTimePicker.scss";

import * as React from "react";

import { Calendar } from "OfficeFabric/Calendar";
import { IDatePickerStrings } from "OfficeFabric/components/DatePicker/DatePicker.types";
import { css } from "OfficeFabric/Utilities";
import { Time } from "./Time";

export interface IDateTimePickerProps {
    today: Date;
    value: Date;
    className?: string;
    onSelectDate?(date: Date): void;
}

export interface IDateTimePickerState {
    selectedDate: Date;
}

const DEFAULT_STRINGS: IDatePickerStrings = {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],

    shortMonths: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],

    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],

    shortDays: [
      "S",
      "M",
      "T",
      "W",
      "T",
      "F",
      "S"
    ],

    goToToday: "Go to today",
    prevMonthAriaLabel: "Go to previous month",
    nextMonthAriaLabel: "Go to next month",
    prevYearAriaLabel: "Go to previous year",
    nextYearAriaLabel: "Go to next year"
  };

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
        const { today, className } = this.props;
        const { selectedDate } = this.state;

        return (
            <div className={css("date-time-picker", className)}>
                <div className="date-time-picker-calendar">
                    <Calendar
                        onSelectDate={this._onSelectDate}
                        isMonthPickerVisible={true}
                        today={today}
                        value={selectedDate}
                        strings={DEFAULT_STRINGS}
                    />
                </div>
                <div className="date-time-picker-time">
                    <Time
                        onSelectTime={this._onSelectTime}
                        hour={selectedDate ? selectedDate.getHours() : 12}
                        minute={selectedDate ? selectedDate.getMinutes() : 0}
                    />
                </div>
            </div >
        );
    }

    private _onSelectDate = (date: Date) => {
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

    private _onSelectTime = (hour: number, minute: number) => {
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
