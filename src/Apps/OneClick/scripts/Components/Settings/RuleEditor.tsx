import "./RuleEditor.scss";

import * as React from "react";

import { ColorPicker } from "Common/Components/ColorPicker";
import { InfoLabel } from "Common/Components/InfoLabel";
import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ThrottledTextField } from "Common/Components/Utilities/ThrottledTextField";
import { CommandBarButton, DefaultButton, PrimaryButton } from "OfficeFabric/Button";
import { Checkbox } from "OfficeFabric/Checkbox";
import { Label } from "OfficeFabric/Label";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Overlay } from "OfficeFabric/Overlay";
import { Panel, PanelType } from "OfficeFabric/Panel";
import { css } from "OfficeFabric/Utilities";
import { RuleFieldNames, SizeLimits } from "OneClick/Constants";
import { RuleActions } from "OneClick/Flux/Actions/RuleActions";
import { registeredActions, registeredTriggers } from "OneClick/ImportRegisteredArtifacts";
import { IRule } from "OneClick/Interfaces";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { BaseTrigger } from "OneClick/RuleTriggers/BaseTrigger";
import { Rule } from "OneClick/ViewModels/Rule";
import { ZeroData } from "VSSUI/ZeroData";

export interface IRuleEditorProps extends IBaseFluxComponentProps {
    ruleModel?: IRule;
    workItemTypeName: string;
    ruleGroupId: string;
    onDismiss?(): void;
}

export interface IRuleEditorState extends IBaseFluxComponentState {
    rule: Rule;
    saving?: boolean;
    error?: string;
    showTriggers?: boolean;
}

export class RuleEditor extends BaseFluxComponent<IRuleEditorProps, IRuleEditorState> {
    public componentDidMount() {
        super.componentDidMount();
        this.state.rule.addChangedListener(this._onModelChanged);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        this.state.rule.removeChangedListener(this._onModelChanged);
        this.state.rule.dispose();
    }

    public render(): JSX.Element {
        return (
            <Panel
                isOpen={true}
                type={PanelType.custom}
                onRenderHeader={this._onRenderHeader}
                className="rule-editor-panel"
                customWidth="850px"
                isLightDismiss={false}
                isFooterAtBottom={true}
                onRenderFooterContent={this._onRenderFooter}
                onDismiss={this.props.onDismiss}
            >
                <div className="rule-editor-container" onKeyDown={this._onKeyDown}>
                    {this.state.error && <MessageBar className="rule-editor-error" messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>}
                    {this.state.saving && <Overlay className="loading-overlay"><Loading /></Overlay>}
                    <div className="rule-editor">
                        <div className="left-section">
                            <ThrottledTextField
                                label="Name"
                                className="form-control"
                                required={true}
                                autoFocus={true}
                                maxLength={SizeLimits.TitleMaxLength}
                                delay={200}
                                onChanged={this._onNameChange}
                                value={this.state.rule.getFieldValue<string>(RuleFieldNames.Name)}
                            />
                            <ThrottledTextField
                                maxLength={SizeLimits.DescriptionMaxLength}
                                className="form-control"
                                label="Description"
                                style={{height: "200px"}}
                                delay={200}
                                resizable={false}
                                multiline={true}
                                onChanged={this._onDescriptionChange}
                                value={this.state.rule.getFieldValue<string>(RuleFieldNames.Description)}
                            />
                            <ColorPicker
                                className="form-control"
                                label="Color"
                                selectedColor={this.state.rule.getFieldValue<string>(RuleFieldNames.Color)}
                                onChange={this._onColorChange}
                            />
                            <Checkbox
                                className="form-control"
                                checked={this.state.rule.getFieldValue<boolean>(RuleFieldNames.Disabled)}
                                label="Disabled"
                                onChange={this._onToggleDisable}
                            />
                            <div className="form-control checkbox-label-control">
                                <Checkbox
                                    checked={this.state.rule.getFieldValue<boolean>(RuleFieldNames.HideOnForm)}
                                    onChange={this._onToggleFormVisibility}
                                />
                                <InfoLabel
                                    label="Hide on form"
                                    info={"If you have triggers configured in this rule, then you can choose to hide the rule button in your form, " +
                                        "as the rule will automatically fire when the trigger is fired"}
                                />
                            </div>
                        </div>
                        <div className="right-section">
                            {this.state.showTriggers && this._renderTriggers()}
                            {!this.state.showTriggers && this._renderActions()}
                        </div>
                    </div>
                </div>
            </Panel>
        );
    }

    protected initializeState() {
        this.state = {
            rule: this.props.ruleModel ? new Rule(this.props.ruleModel) : Rule.getNewRule(this.props.workItemTypeName),
            showTriggers: false
        };
    }

    private _renderTriggers(): React.ReactNode {
        if (!this.state.rule.hasTriggers) {
            return (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No triggers added yet"
                />
            );
        }
        return this.state.rule.renderTriggers();
    }

    private _renderActions(): React.ReactNode {
        if (this.state.rule.actions.length === 0) {
            return (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No actions added yet"
                />
            );
        }
        return this.state.rule.renderActions();
    }

    private _onRenderHeader = (): JSX.Element => {
        return (
            <div className="rule-editor-panel-header">
                <Label className="rule-editor-header-text">
                    {this.state.rule.isNew ? "Add Rule" : "Edit Rule"}
                </Label>
                <div className="rule-header-tabs">
                    <CommandBarButton
                        className={css("rule-editor-header-tab", { selected: !this.state.showTriggers })}
                        text="Actions"
                        onClick={this._showActions}
                    />
                    <CommandBarButton
                        className={css("rule-editor-header-tab", { selected: this.state.showTriggers })}
                        text="Triggers"
                        onClick={this._showTriggers}
                    />
                </div>
                {
                    !this.state.showTriggers &&
                    <CommandBarButton
                        iconProps={{ iconName: "Add" }}
                        className="rule-editor-header-add-button"
                        text="Add action"
                        menuProps={{
                            items: Object.keys(registeredActions).map(actionName => {
                                const actionType = registeredActions[actionName];
                                const action = BaseAction.getNewAction(actionType, actionName);
                                return {
                                    key: action.getFriendlyName(),
                                    name: action.getFriendlyName(),
                                    title: action.getDescription(),
                                    iconProps: action.getIcon(),
                                    disabled: action.isDisabled(),
                                    onClick: () => this.state.rule.addAction(BaseAction.getNewAction(actionType, actionName))
                                };
                            })
                        }}
                    />
                }
                {
                    this.state.showTriggers &&
                    <CommandBarButton
                        iconProps={{ iconName: "Add" }}
                        className="rule-editor-header-add-button"
                        text="Add trigger"
                        menuProps={{
                            items: Object.keys(registeredTriggers).map(triggerName => {
                                const triggerType = registeredTriggers[triggerName];
                                const trigger = BaseTrigger.getNewTrigger(triggerType, triggerName);
                                return {
                                    key: trigger.getFriendlyName(),
                                    name: trigger.getFriendlyName(),
                                    title: trigger.getDescription(),
                                    iconProps: trigger.getIcon(),
                                    onClick: () => this.state.rule.addTrigger(BaseTrigger.getNewTrigger(triggerType, triggerName))
                                };
                            })
                        }}
                    />
                }
            </div>
        );
    }

    private _showTriggers = () => {
        if (!this.state.showTriggers) {
            this.setState({showTriggers: true});
        }
    }

    private _showActions = () => {
        if (this.state.showTriggers) {
            this.setState({showTriggers: false});
        }
    }

    private _onRenderFooter = (): JSX.Element => {
        return (
            <div style={{ textAlign: "right" }}>
                <PrimaryButton
                    ariaLabel={"OK"}
                    disabled={!this.state.rule.isDirty() || !this.state.rule.isValid() || this.state.saving}
                    onClick={this._saveRule}
                    style={{ marginRight: "8px" }}
                >
                    Save
                </PrimaryButton>
                <DefaultButton
                    onClick={this.props.onDismiss}
                >
                    Cancel
                </DefaultButton>
            </div>
        );
    }

    private _onNameChange = (value: string) => {
        this.state.rule.setFieldValue<string>(RuleFieldNames.Name, value);
    }

    private _onDescriptionChange = (value: string) => {
        this.state.rule.setFieldValue<string>(RuleFieldNames.Description, value);
    }

    private _onToggleDisable = (_ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
        this.state.rule.setFieldValue<boolean>(RuleFieldNames.Disabled, isChecked);
    }

    private _onToggleFormVisibility = (_ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
        this.state.rule.setFieldValue<boolean>(RuleFieldNames.HideOnForm, isChecked);
    }

    private _onColorChange = (value: string) => {
        this.state.rule.setFieldValue<string>(RuleFieldNames.Color, value);
    }

    private _onKeyDown = (e: React.KeyboardEvent<any>) => {
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            this._saveRule();
        }
    }

    private _saveRule = async () => {
        if (!this.state.rule.isDirty() || !this.state.rule.isValid() || this.state.saving) {
            return;
        }

        try {
            this.setState({saving: true});
            if (this.state.rule.isNew) {
                await RuleActions.createRule(this.props.ruleGroupId, this.state.rule.updatedModel);
            }
            else {
                await RuleActions.updateRule(this.props.ruleGroupId, this.state.rule.updatedModel);
            }

            this.setState({saving: false});
            this.props.onDismiss();
        }
        catch (e) {
            this.setState({saving: false, error: e});
        }
    }

    private _onModelChanged = () => {
        this.setState({rule: this.state.rule});
    }
}
