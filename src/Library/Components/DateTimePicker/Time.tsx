import * as React from "react";

import { autobind } from "OfficeFabric/Utilities";
import { CategoryRange, NumericValueRange, ValueSpinner } from "./ValueSpinner";

export interface ITimeProps {
    hour: number;
    minute: number;
    use24HourFormat: boolean;
    renderAmPmBeforeTime?: boolean;
    timeStrings: ITimeStrings;
    onSelectTime?(hour: number, minute: number): void;
}

export interface ITimeStrings {
    AMDesignator: string;
    PMDesignator: string;
}

export interface ITimeState {
    /**
     * hour value displayed in the control
     */
    hour: number;

    /**
     * minute value displayed in the control
     */
    minute: number;

    /**
     *  whether AM is rendered or not
     */
    isAM: boolean;
}

type NumberSpinner = new () => ValueSpinner<number>;
type StringSpinner = new () => ValueSpinner<string>;
const NumberSpinner = ValueSpinner as NumberSpinner;
const StringSpinner = ValueSpinner as StringSpinner;

export class Time extends React.Component<ITimeProps, ITimeState> {
    private _minHour: number;
    private _maxHour: number;
    private _hourRange: NumericValueRange;
    private _minuteRange: NumericValueRange;
    private _AMPMRange: CategoryRange;

    constructor(props: ITimeProps) {
        super(props);
        this._initializeTime(props);
    }

    public componentWillReceiveProps(props: ITimeProps) {
        if (this.props && (this.props.hour !== props.hour || this.props.minute !== props.minute)) {
            const newTime = this._calculateTimeRange(props);
            this.setState({
                hour: newTime.hour,
                minute: newTime.minute,
                isAM: newTime.isAM
            });
        }
    }

    public render(): JSX.Element {
        if (this.props.renderAmPmBeforeTime) {
            return (
                <div className="time-control">
                    {this._renderAMPM()}
                    {this._renderHour()}
                    {this._renderMinute()}
                </div>
            );
        }

        return (
            <div className="time-control">
                {this._renderHour()}
                {this._renderMinute()}
                {this._renderAMPM()}
            </div>
        );
    }

    private _renderAMPM(): JSX.Element {
        if (!this.props.use24HourFormat) {
            const { AMDesignator, PMDesignator } = this.props.timeStrings;
            const value = this.state.isAM ? AMDesignator : PMDesignator;

            return (
                <div className="time-ampm">
                    <StringSpinner
                        value={value}
                        valueRange={this._AMPMRange}
                        onValueChange={this._onAMPMChange}
                    />
                </div>
            );
        }

        return null;
    }

    private _renderHour(): JSX.Element {
        return (
            <div className="time-hour">
                <NumberSpinner
                    value={this.state.hour}
                    valueRange={this._hourRange}
                    onValueChange={this._onHourChange}
                />
            </div>
        );
    }

    private _renderMinute(): JSX.Element {
        return (
            <div className="time-minute">
                <NumberSpinner
                    value={this.state.minute}
                    valueRange={this._minuteRange}
                    onValueChange={this._onMinuteChange}
                />
            </div>
        );
    }

    /**
     * Set hour, minute and AM/PM parts based on given hour and minute
     * @param hour hour value in 24 hour format
     * @param minute minute value
     */
    private _initializeTime(props: ITimeProps) {
        const { use24HourFormat } = props;
        const { AMDesignator, PMDesignator } = props.timeStrings;

        this.state = this._calculateTimeRange(props);

        this._minHour = use24HourFormat ? 0 : 1;
        this._maxHour = use24HourFormat ? 23 : 12;
        this._hourRange = new NumericValueRange(this._minHour, this._maxHour);
        this._minuteRange = new NumericValueRange(0, 59, (n: number) => (n < 10) ? `0${n}` : n.toString());
        this._AMPMRange = new CategoryRange([AMDesignator, PMDesignator]);
    }

    private _calculateTimeRange(props: ITimeProps): ITimeState {
        const { hour, minute, use24HourFormat } = props;

        let displayedHour = hour;
        let isAM;

        if (!use24HourFormat) {
            isAM = true;

            if (hour === 0) {
                displayedHour = 12;
            }
            else if (hour >= 12) {
                isAM = false;
                if (hour > 12) {
                    displayedHour = hour - 12;
                }
            }
        }

        return {
            hour: displayedHour,
            minute: minute,
            isAM: isAM
        } as ITimeState;
    }

    private _changeTime(hour: number, minute: number, isAM: boolean) {
        this.setState({
            hour: hour,
            minute: minute,
            isAM: isAM
        });

        if (this.props.onSelectTime) {
            if (!this.props.use24HourFormat) {
                if (!isAM && hour !== 12) {
                    hour = hour + 12;
                }
                else if (isAM && hour === 12) {
                    hour = 0;
                }
            }
            this.props.onSelectTime(hour, minute);
        }
    }

    @autobind
    private _onHourChange(value: number) {
        this._changeTime(value, this.state.minute, this.state.isAM);
    }

    @autobind
    private _onMinuteChange(value: number) {
        this._changeTime(this.state.hour, value, this.state.isAM);
    }

    @autobind
    private _onAMPMChange(value: string) {
        const isAM = this.props.timeStrings.AMDesignator === value;
        this._changeTime(this.state.hour, this.state.minute, isAM);
    }
}
