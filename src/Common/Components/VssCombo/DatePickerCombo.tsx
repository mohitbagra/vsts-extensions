import "./VssCombo.scss";

import * as React from "react";

import { InfoLabel } from "Common/Components/InfoLabel";
import { InputError } from "Common/Components/InputError";
import { IFocussable } from "Common/Components/Interfaces";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { delay, DelayedFunction } from "Common/Utilities/Core";
import { isNullOrEmpty } from "Common/Utilities/String";
import { css } from "OfficeFabric/Utilities";
import { Control } from "VSS/Controls";
import { Combo, IComboOptions } from "VSS/Controls/Combos";

export interface IDatePickerComboProps extends IBaseFluxComponentProps {
    value?: string;
    error?: string;
    label?: string;
    info?: string;
    disabled?: boolean;
    required?: boolean;
    delay?: number;
    onChange(value: string): void;
}

export interface IDatePickerComboState extends IBaseFluxComponentState {
    internalValue?: string;
}

export class DatePickerCombo extends BaseFluxComponent<IDatePickerComboProps, IDatePickerComboState> implements IFocussable {
    private _control: Combo;
    private _delayedFunction: DelayedFunction;
    private _container: HTMLDivElement;

    public focus() {
        if (this._control) {
            this._control.focus();
        }
    }

    public render(): JSX.Element {
        const error = this.props.error || this._getDefaultError();

        return (
            <div className={css("vss-combobox", "datetime-combo", this.props.className)}>
                {this.props.label && <InfoLabel className="vss-combo-label" label={this.props.label} info={this.props.info} />}
                <div ref={this._containerRefCallback} />
                {error && <InputError className="vss-combo-error" error={error} />}
            </div>
        );
    }

    public componentDidMount(): void {
        super.componentDidMount();

        const comboOptions = {
            type: "date-time",
            value: this.state.internalValue || "",
            allowEdit: true,
            enabled: !this.props.disabled,
            change: this._onChange
        } as IComboOptions;

        this._control = Control.create(Combo, $(this._container), comboOptions);
    }

    public componentWillUnmount(): void {
        super.componentWillUnmount();
        this._dispose();
    }

    public componentWillReceiveProps(nextProps: IDatePickerComboProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        this._disposeDelayedFunction();

        if (nextProps.value !== this.state.internalValue) {
            this._control.setInputText(nextProps.value || "");
            this.setState({
                internalValue: nextProps.value
            });
        }

        if (nextProps.disabled !== this.props.disabled) {
            this._control.setEnabled(!nextProps.disabled);
        }
    }

    protected initializeState(): void {
        this.state = {
            internalValue: this.props.value || ""
        };
    }

    private _dispose(): void {
        if (this._control) {
            this._control.dispose();
            this._control = null;
        }

        this._disposeDelayedFunction();
    }

    private _getDefaultError(): string {
        if (this.props.required && isNullOrEmpty(this.state.internalValue)) {
            return "A value is required";
        }
    }

    private _disposeDelayedFunction() {
        if (this._delayedFunction) {
            this._delayedFunction.cancel();
            this._delayedFunction = null;
        }
    }

    private _containerRefCallback = (container: HTMLDivElement) => { this._container = container; };

    private _onChange = () => {
        this._disposeDelayedFunction();

        const fireChange = () => {
            const value = this._control.getText();
            this.setState(
                {
                    internalValue: value
                },
                () => {
                    this.props.onChange(value);
                });
        };

        if (this.props.delay == null) {
            fireChange();
        }
        else {
            this._delayedFunction = delay(this, this.props.delay, () => {
                fireChange();
            });
        }
    }
}
