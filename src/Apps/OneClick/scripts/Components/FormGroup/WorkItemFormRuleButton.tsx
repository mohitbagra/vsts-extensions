import "./WorkItemFormRuleButton.scss";

import * as React from "react";

import { Color } from "Common/Components/ColorPicker";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { getCurrentUserName } from "Common/Utilities/Identity";
import { css } from "OfficeFabric/Utilities";
import { RuleFieldNames } from "OneClick/Constants";
import { IActionError } from "OneClick/Interfaces";
import { trackEvent } from "OneClick/Telemetry";
import { Rule } from "OneClick/ViewModels/Rule";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

export interface IWorkItemFormRuleButtonProps extends IBaseFluxComponentProps {
    rule: Rule;
    onExecute(error: IActionError): void;
}

export interface IWorkItemFormRuleButtonState extends IBaseFluxComponentState {
    disabled?: boolean;
}

export class WorkItemFormRuleButton extends BaseFluxComponent<IWorkItemFormRuleButtonProps, IWorkItemFormRuleButtonState> {
    public render(): JSX.Element {
        const {rule} = this.props;

        const name = rule.getFieldValue<string>(RuleFieldNames.Name);
        const color = rule.getFieldValue<string>(RuleFieldNames.Color);
        const hideButton = rule.getFieldValue<boolean>(RuleFieldNames.HideOnForm);
        const triggersTooltipText = rule.hasTriggers ? `\nTriggers: ${rule.triggers.map(t => t.getFriendlyName()).join(", ")}` : "";
        const tooltip = `${name}.\nActions: ${rule.actions.map(a => a.getFriendlyName()).join(", ")}${triggersTooltipText}`;
        const disabled = this.state.disabled;

        return (
            <div
                className={css("rule-button", { disabled: disabled })}
                onClick={this._onRuleClick}
                title={tooltip}
                style={{
                    backgroundColor: color,
                    color: new Color(color).toBlackOrWhite().invert().asHex(),
                    display: hideButton ? "none" : undefined
                }}
            >
                {rule.hasTriggers && <VssIcon iconName="LightningBolt" iconType={VssIconType.fabric} />}
                <div className="rule-button-text">{name}</div>
            </div>
        );
    }

    private _onRuleClick = async () => {
        if (!this.state.disabled) {
            this.setState({disabled: true});

            const error = await this.props.rule.run();
            this.props.onExecute(error);

            // log event
            trackEvent("RuleClicked", {
                ruleId: this.props.rule.id,
                workItemType: this.props.rule.getFieldValue<string>(RuleFieldNames.WorkItemType),
                projectId: this.props.rule.getFieldValue<string>(RuleFieldNames.ProjectId),
                user: getCurrentUserName()
            });

            this.setState({disabled: false});
        }
    }
}
