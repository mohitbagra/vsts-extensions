import "./ColorPicker.scss";

import * as React from "react";

import { AccessibilityColor } from "Common/Components/ColorPicker/Color";
import { InfoLabel } from "Common/Components/InfoLabel";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { stringEquals } from "Common/Utilities/String";
import { DefaultButton } from "OfficeFabric/Button";
import { Callout } from "OfficeFabric/Callout";
import { css } from "OfficeFabric/Utilities";

export interface IColorPickerProps extends IBaseFluxComponentProps {
    selectedColor?: string;
    label?: string;
    info?: string;
    onChange(newColor: string): void;
}

export interface IColorPickerState extends IBaseFluxComponentState {
    selectedColor?: string;
    isCalloutOpen?: boolean;
}

export class ColorPicker extends BaseFluxComponent<IColorPickerProps, IColorPickerState> {
    private _targetElement: HTMLElement;

    public componentWillReceiveProps(nextProps: IColorPickerProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(nextProps.selectedColor, this.state.selectedColor, true)) {
            this.setState({selectedColor: nextProps.selectedColor || "#FFFFFF"});
        }
    }

    public render(): JSX.Element {
        return (
            <div className={css("color-picker", this.props.className)}>
                {this.props.label && <InfoLabel className="color-picker-label" label={this.props.label} info={this.props.info} />}

                <div className="selected-color-container"  ref={(target) => this._targetElement = target}>
                    <div className="selected-color" style={{backgroundColor: this.state.selectedColor}} onClick={this._toggleCallout} />
                    <DefaultButton className="open-callout-button" iconProps={{iconName: "ChevronDown"}} onClick={this._toggleCallout} />
                </div>

                { this.state.isCalloutOpen &&
                    <Callout
                        className="colors-callout"
                        isBeakVisible={false}
                        onDismiss={this._onCalloutDismiss}
                        setInitialFocus={true}
                        target={this._targetElement}
                    >
                        <ul className="colors-list">
                            {AccessibilityColor.FullPaletteColors.map(this._renderColorItem)}
                        </ul>
                    </Callout>
                }
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            selectedColor: this.props.selectedColor || "#FFFFFF",
            isCalloutOpen: false
        };
    }

    private _selectColor(color: string) {
        this.setState({selectedColor: color, isCalloutOpen: false});
        this.props.onChange(color);
    }

    private _renderColorItem = (color: AccessibilityColor, index: number) => {
        const isSelected = stringEquals(this.state.selectedColor, color.asHex(), true);

        const onSelectColor: () => void = () => this._selectColor(color.asHex());

        return (
            <li
                key={index}
                className={isSelected ? "color-list-item selected" : "color-list-item"}
                onClick={onSelectColor}
                style={{backgroundColor: color.asRgb()}}
            >

                {isSelected && <div className="inner" />}
            </li>
        );
    }

    private _toggleCallout = () => {
        this.setState({isCalloutOpen: !this.state.isCalloutOpen});
    }

    private _onCalloutDismiss = () => {
        this.setState({isCalloutOpen: false});
    }
}
