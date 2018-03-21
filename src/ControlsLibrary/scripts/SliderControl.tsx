import "../css/SliderControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Library/Components/VSTS/WorkItemFieldControl";
import { Fabric } from "OfficeFabric/Fabric";
import { Slider } from "OfficeFabric/Slider";
import { autobind } from "OfficeFabric/Utilities";

interface ISliderControlInputs {
    FieldName: string;
    MinValue: string;
    MaxValue: string;
    StepSize: string;
}

interface ISliderControlProps extends IWorkItemFieldControlProps {
    minValue: number;
    maxValue: number;
    stepSize: number;
}

export class SliderControl extends WorkItemFieldControl<number, ISliderControlProps, IWorkItemFieldControlState<number>> {

    public render(): JSX.Element {
        const className = "slider-control";

        return (
            <Fabric className="fabric-container">
                <div className="slider-container">
                    <Slider
                        className={className}
                        value={this.state.value}
                        min={this.props.minValue}
                        max={this.props.maxValue}
                        step={this.props.stepSize}
                        showValue={false}
                        onChange={this._onChange}
                    />

                    <span className="slider-value" title={`${this.state.value || 0}`}>{this.state.value || 0}</span>
                </div>
            </Fabric>
        );
    }

    @autobind
    private _onChange(newValue: number) {
        this.onValueChanged(parseFloat(newValue.toPrecision(10)));
    }
}

export function init() {
    initializeIcons();
    const inputs = WorkItemFieldControl.getInputs<ISliderControlInputs>();

    ReactDOM.render(
        <SliderControl
            fieldName={inputs.FieldName}
            minValue={parseFloat(inputs.MinValue)}
            maxValue={parseFloat(inputs.MaxValue)}
            stepSize={parseFloat(inputs.StepSize)}
        />,
        document.getElementById("ext-container"));
}
