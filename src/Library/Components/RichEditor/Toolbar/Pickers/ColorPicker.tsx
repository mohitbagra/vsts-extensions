import * as React from "react";

import { Button, ButtonType } from "OfficeFabric/Button";
import { ContextualMenu, DirectionalHint, IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import { FocusZoneDirection } from "OfficeFabric/FocusZone";
import { ColorStringKey, getString, Strings } from "../strings/colorStrings";
import * as Styles from "./Picker.scss.g";

export interface IColorPickerItem {
    name: ColorStringKey;
    code: string;
    borderColor?: string;
}

export const textColors = [
    { name: "clrLightBlue", code: "#51a7f9" },
    { name: "clrLightGreen", code: "#6fc040" },
    { name: "clrLightYellow", code: "#f5d427" },
    { name: "clrLightOrange", code: "#f3901d" },
    { name: "clrLightRed", code: "#ed5c57" },
    { name: "clrLightPurple", code: "#b36ae2" },
    { name: "clrBlue", code: "#0c64c0" },
    { name: "clrGreen", code: "#0c882a" },
    { name: "clrYellow", code: "#dcbe22" },
    { name: "clrOrange", code: "#de6a19" },
    { name: "clrRed", code: "#c82613" },
    { name: "clrPurple", code: "#763e9b" },
    { name: "clrDarkBlue", code: "#174e86" },
    { name: "clrDarkGreen", code: "#0f5c1a" },
    { name: "clrDarkYellow", code: "#c3971d" },
    { name: "clrDarkOrange", code: "#be5b17" },
    { name: "clrDarkRed", code: "#861106" },
    { name: "clrDarkPurple", code: "#5e327c" },
    { name: "clrDarkerBlue", code: "#002451" },
    { name: "clrDarkerGreen", code: "#06400c" },
    { name: "clrDarkerYellow", code: "#a37519" },
    { name: "clrDarkerOrange", code: "#934511" },
    { name: "clrDarkerRed", code: "#570606" },
    { name: "clrDarkerPurple", code: "#3b204d" },
    { name: "clrWhite", code: "#ffffff", borderColor: "#bebebe" },
    { name: "clrLightGray", code: "#cccccc" },
    { name: "clrGray", code: "#999999" },
    { name: "clrDarkGray", code: "#666666" },
    { name: "clrDarkerGray", code: "#333333" },
    { name: "clrBlack", code: "#000000" },
] as IColorPickerItem[];

export const blackColors = [
    { name: "clrCyan", code: "#00ffff" },
    { name: "clrGreen", code: "#00ff00" },
    { name: "clrYellow", code: "#ffff00" },
    { name: "clrOrange", code: "#ff8000" },
    { name: "clrRed", code: "#ff0000" },
    { name: "clrMagenta", code: "#ff00ff" },
    { name: "clrLightCyan", code: "#80ffff" },
    { name: "clrLightGreen", code: "#80ff80" },
    { name: "clrLightYellow", code: "#ffff80" },
    { name: "clrLightOrange", code: "#ffc080" },
    { name: "clrLightRed", code: "#ff8080" },
    { name: "clrLightMagenta", code: "#ff80ff" },
    { name: "clrWhite", code: "#ffffff", borderColor: "#bebebe" },
    { name: "clrLightGray", code: "#cccccc" },
    { name: "clrGray", code: "#999999" },
    { name: "clrDarkGray", code: "#666666" },
    { name: "clrDarkerGray", code: "#333333" },
    { name: "clrBlack", code: "#000000" },
] as IColorPickerItem[];

export interface IColorPickerProps {
    menuTargetElement: HTMLElement;
    colors: IColorPickerItem[];
    strings?: Strings;
    onDismissMenu(): void;
    onSelectColor(value: IColorPickerItem): void;
}

export class ColorPicker extends React.Component<IColorPickerProps, {}> {
    public render() {
        const { onDismissMenu, menuTargetElement } = this.props;
        const pickerStyle = Styles.ribbonColorPicker;
        return (
            <ContextualMenu
                className={pickerStyle}
                target={menuTargetElement}
                directionalHint={DirectionalHint.bottomLeftEdge}
                onDismiss={onDismissMenu}
                arrowDirection={FocusZoneDirection.bidirectional}
                shouldFocusOnMount={true}
                items={this.props.colors.map((color: IColorPickerItem) => {
                    return {
                        key: color.name,
                        name: color.name,
                        onRender: this._renderColorMenuItem,
                        data: color,
                        className: Styles.ribbonColorItem,
                    };
                })}
            />
        );
    }

    private _renderColorMenuItem = (item: IContextualMenuItem): JSX.Element => {
        const color = item.data as IColorPickerItem;
        const inlineStyles: React.CSSProperties = { backgroundColor: color.code };
        const title = getString(color.name, this.props.strings);
        if (color.borderColor) {
            inlineStyles.borderColor = color.borderColor;
        }

        return (
            <Button
                buttonType={ButtonType.normal}
                data-is-focusable={true}
                title={title}
                // tslint:disable-next-line:jsx-no-lambda
                onClick={() => this._onSelectColor(color)}
                key={item.key}
            >
                <div className={Styles.ribbonColor} style={inlineStyles} />
            </Button>
        );
    }

    private _onSelectColor = (color: IColorPickerItem) => {
        this.props.onDismissMenu();
        this.props.onSelectColor(color);
    }
}
