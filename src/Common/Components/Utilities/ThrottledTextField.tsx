import "./ThrottledTextField.scss";

import * as React from "react";

import { InfoLabel } from "Common/Components/InfoLabel";
import { InputError } from "Common/Components/InputError";
import { IFocussable } from "Common/Components/Interfaces";
import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { delay, DelayedFunction } from "Common/Utilities/Core";
import { isNullOrEmpty } from "Common/Utilities/String";
import { ITextField, ITextFieldProps, TextField } from "OfficeFabric/TextField";
import { css } from "OfficeFabric/Utilities";

export interface IThrottledTextFieldProps extends ITextFieldProps {
    delay?: number;
    info?: string;
    required?: boolean;
}

export interface IThrottledTextFieldState extends IBaseFluxComponentState {
    internalValue?: string;
}

export class ThrottledTextField extends BaseFluxComponent<IThrottledTextFieldProps, IThrottledTextFieldState> implements IFocussable {
    private _delayedFunction: DelayedFunction;
    private _component: ITextField;

    public focus() {
        if (this._component) {
            this._component.focus();
        }
    }

    public render(): JSX.Element {
        const props = {
            ...this.props,
            value: this.state.internalValue,
            onChanged: this._onChange,
            className: "throttled-text-field-text",
            componentRef: this._refCallback
        };

        delete props.delay;
        delete props.info;
        delete props.required;
        delete props.errorMessage;
        delete props.label;

        const error = this.props.errorMessage || this._getDefaultError();

        return (
            <div className={css("throttled-text-field", this.props.className)}>
                {this.props.label && <InfoLabel className="throttled-text-field-label" label={this.props.label} info={this.props.info} />}
                <TextField {...props} />
                {error && <InputError className="throttled-text-field-error" error={error} />}
            </div>
        );
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._disposeDelayedFunction();
    }

    public componentWillReceiveProps(nextProps: IThrottledTextFieldProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        this._disposeDelayedFunction();

        if (nextProps.value !== this.state.internalValue) {
            this.setState({
                internalValue: nextProps.value
            });
        }
    }

    protected initializeState(): void {
        this.state = {
            internalValue: this.props.value
        };
    }

    private _disposeDelayedFunction() {
        if (this._delayedFunction) {
            this._delayedFunction.cancel();
            this._delayedFunction = null;
        }
    }

    private _getDefaultError(): string {
        if (this.props.required && isNullOrEmpty(this.state.internalValue)) {
            return "A value is required";
        }
    }

    private _refCallback = (component: ITextField) => {
        this._component = component;
    }

    private _onChange = (value: string) => {
        this._disposeDelayedFunction();

        const fireChange = () => {
            this.setState(
                {
                    internalValue: value
                },
                () => {
                    if (this.props.onChanged) {
                        this.props.onChanged(value);
                    }
                }
            );
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
