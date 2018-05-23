import "./Badge.scss";

import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { Callout, DirectionalHint } from "OfficeFabric/Callout";
import { Label } from "OfficeFabric/Label";
import { css } from "OfficeFabric/Utilities";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

export interface IBadgeProps extends IBaseFluxComponentProps {
    notificationCount: number;
    showCalloutOnHover?: boolean;
    directionalHint?: DirectionalHint;
}

export interface IBadgeState extends IBaseFluxComponentState {
    isCalloutVisible: boolean;
}

export class Badge extends BaseFluxComponent<IBadgeProps, IBadgeState> {
    private _calloutTargetElement: HTMLElement;

    public render(): JSX.Element {
        return (
            <div className={css("badge", this.props.className)}>
                <div
                    className="badge-container"
                    onMouseEnter={this._onMouseOver}
                    onMouseLeave={this._onMouseOut}
                    onClick={this._onClickCallout}
                >

                    <div ref={(element) => this._calloutTargetElement = element}>
                        <VssIcon iconType={VssIconType.fabric} iconName="Ringer" className="badge-icon" />
                    </div>
                    <Label className="badge-notification-count">{this.props.notificationCount}</Label>
                </div>
                {
                    this.state.isCalloutVisible &&
                    <Callout
                        gapSpace={0}
                        target={this._calloutTargetElement}
                        onDismiss={this._dismissCallout}
                        setInitialFocus={true}
                        isBeakVisible={true}
                        directionalHint={this.props.directionalHint || DirectionalHint.bottomRightEdge}
                    >
                        <div className="badge-callout-container">
                            {this.props.children}
                        </div>
                    </Callout>
                }
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            isCalloutVisible: false
        };
    }

    private _onMouseOver = () => {
        if (this.props.showCalloutOnHover) {
            this.setState({
                isCalloutVisible: true
            });
        }
    }

    private _onMouseOut = () => {
        if (this.props.showCalloutOnHover) {
            this._dismissCallout();
        }
    }

    private _onClickCallout = () => {
        if (!this.props.showCalloutOnHover) {
            this.setState({
                isCalloutVisible: !this.state.isCalloutVisible
            });
        }
    }

    private _dismissCallout = () => {
        this.setState({
            isCalloutVisible: false
        });
    }
}
