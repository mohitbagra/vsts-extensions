import "../css/RatingControl.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import {
    IWorkItemFieldControlProps, IWorkItemFieldControlState, WorkItemFieldControl
} from "Common/Components/VSTS/WorkItemFieldControl";
import { Fabric } from "OfficeFabric/Fabric";
import { Rating, RatingSize } from "OfficeFabric/Rating";

interface IRatingControlInputs {
    FieldName: string;
    MinValue: string;
    MaxValue: string;
}

interface IRatingControlProps extends IWorkItemFieldControlProps {
    minValue: number;
    maxValue: number;
}

export class RatingControl extends WorkItemFieldControl<number, IRatingControlProps, IWorkItemFieldControlState<number>> {

    public render(): JSX.Element {
        const className = "rating-control";

        return (
            <Fabric className="fabric-container">
                <Rating
                    className={className}
                    rating={this.state.value}
                    min={this.props.minValue}
                    max={this.props.maxValue}
                    size={RatingSize.Large}
                    onChanged={this._onChange}
                />
            </Fabric>
        );
    }

    private _onChange = (newValue: number) => {
        this.onValueChanged(newValue);
    }
}

export function init() {
    initializeIcons();
    const inputs = WorkItemFieldControl.getInputs<IRatingControlInputs>();

    ReactDOM.render(
        <RatingControl
            fieldName={inputs.FieldName}
            minValue={parseInt(inputs.MinValue, 10)}
            maxValue={parseInt(inputs.MaxValue, 10)}
        />,
        document.getElementById("ext-container"));
}
