import "./ValueSpinner.scss";

import * as React from "react";

import { IconButton } from "OfficeFabric/Button";

export class NumericValueRange implements IValueRange<number> {
    constructor(
        private _min: number,
        private _max: number,
        private _valueFormatter: (n: number) => string = (n: number) => n.toString(),
        private _increment: number = 1) {
    }

    public getPreviousValue(value: number): number {
        value -= this._increment;
        if (value < this._min) {
            value = this._max;
        }

        return value;
    }

    public getNextValue(value: number): number {
        value += this._increment;
        if (value > this._max) {
            value = this._min;
        }

        return value;
    }

    public toString(value: number): string {
        return this._valueFormatter(value);
    }
}

export class CategoryRange implements IValueRange<string> {
    constructor(private _values: string[]) {
    }

    public getPreviousValue(value: string): string {
        let index = this._values.indexOf(value);
        index--;

        if (index < 0) {
            index = this._values.length - 1;
        }

        return this._values[index];
    }

    public getNextValue(value: string): string {
        let index = this._values.indexOf(value);
        index++;

        if (index >= this._values.length) {
            index = 0;
        }

        return this._values[index];
    }

    public toString(value: string): string {
        return value;
    }
}

export interface IValueRange<T> {
    getNextValue(value: T): T;
    getPreviousValue(value: T): T;
    toString(value: T): string;
}

export interface IValueSpinnerProp<T> {
    value: T;
    valueRange: IValueRange<T>;
    onValueChange?(value: T): void;
}

export interface IValueSpinnerState<T> {
    value: T;
}

export class ValueSpinner<T> extends React.Component<IValueSpinnerProp<T>, IValueSpinnerState<T>> {
    constructor(props: IValueSpinnerProp<T>) {
        super(props);

        this.state = {
            value: props.value
        };
    }

    public componentWillReceiveProps(props: IValueSpinnerProp<T>) {
        if (this.props && (this.props.value !== props.value)) {
            this.setState({
                value: props.value
            });
        }
    }

    public render(): JSX.Element {
        return (
            <div className="value-spinner">
                <IconButton
                    className="spinner-up"
                    onClick={this._setNextValue}
                    iconProps={{
                        iconName: "ChevronUp"
                    }}
                />
                <div className="spinner-value">{this.props.valueRange.toString(this.state.value)}</div>
                <IconButton
                    className="spinner-down"
                    onClick={this._setPreviousValue}
                    iconProps={{
                        iconName: "ChevronDown"
                    }}
                />
            </div>
        );
    }

    private _onValueChange(value: T) {
        this.setState({ value });

        if (this.props.onValueChange) {
            this.props.onValueChange(value);
        }
    }

    private _setPreviousValue = () => {
        this._onValueChange(this.props.valueRange.getPreviousValue(this.state.value));
    }

    private _setNextValue = () => {
        this._onValueChange(this.props.valueRange.getNextValue(this.state.value));
    }
}
