import "./InfoLabel.scss";

import * as React from "react";

import { IBaseFluxComponentProps } from "Common/Components/Utilities/BaseFluxComponent";
import { Label } from "OfficeFabric/Label";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { css } from "OfficeFabric/Utilities";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

export interface IInfoLabelProps extends IBaseFluxComponentProps {
    label: string;
    info?: string;
}

export const InfoLabel: React.StatelessComponent<IInfoLabelProps> =
    (props: IInfoLabelProps): JSX.Element => {
        return (
            <div className={css("info-label", props.className)}>
                <Label className="info-label-text">{props.label}</Label>
                { props.info &&
                    <TooltipHost
                        content={props.info}
                        delay={TooltipDelay.zero}
                        directionalHint={DirectionalHint.bottomCenter}
                    >
                        <VssIcon iconType={VssIconType.fabric} className="info-icon" iconName="Info" />
                    </TooltipHost>
                }
            </div>
        );
};
