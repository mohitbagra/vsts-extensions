import "./RuleGroupEditor.scss";

import * as React from "react";

import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ThrottledTextField } from "Common/Components/Utilities/ThrottledTextField";
import { DefaultButton, PrimaryButton } from "OfficeFabric/Button";
import { Checkbox } from "OfficeFabric/Checkbox";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Overlay } from "OfficeFabric/Overlay";
import { Panel, PanelType } from "OfficeFabric/Panel";
import { RuleGroupFieldNames, SizeLimits } from "OneClick/Constants";
import { RuleGroupActions } from "OneClick/Flux/Actions/RuleGroupActions";
import { IRuleGroup } from "OneClick/Interfaces";
import { RuleGroup } from "OneClick/ViewModels/RuleGroup";

export interface IRuleGroupEditorProps extends IBaseFluxComponentProps {
    workItemTypeName: string;
    ruleGroupModel?: IRuleGroup;
    onDismiss?(): void;
}

export interface IRuleGroupEditorState extends IBaseFluxComponentState {
    ruleGroup: RuleGroup;
    saving?: boolean;
    error?: string;
}

export class RuleGroupEditor extends BaseFluxComponent<IRuleGroupEditorProps, IRuleGroupEditorState> {
    public componentDidMount() {
        super.componentDidMount();
        this.state.ruleGroup.addChangedListener(this._onModelChanged);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this.state.ruleGroup.removeChangedListener(this._onModelChanged);
        this.state.ruleGroup.dispose();
    }

    public render(): JSX.Element {
        return (
            <Panel
                isOpen={true}
                headerText={this.state.ruleGroup.isNew ? "Add Rule Group" : "Edit Rule Group"}
                type={PanelType.custom}
                customWidth="450px"
                isLightDismiss={false}
                isFooterAtBottom={true}
                onRenderFooterContent={this._onRenderFooter}
                onDismiss={this.props.onDismiss}
            >
                <div className="rule-group-editor" onKeyDown={this._onKeyDown}>
                    {this.state.error && <MessageBar className="rule-group-editor-error" messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>}
                    {this.state.saving && <Overlay className="loading-overlay"><Loading /></Overlay>}
                    <ThrottledTextField
                        className="form-control"
                        label="Name"
                        autoFocus={true}
                        delay={200}
                        required={true}
                        maxLength={SizeLimits.TitleMaxLength}
                        onChanged={this._onNameChange}
                        value={this.state.ruleGroup.getFieldValue<string>(RuleGroupFieldNames.Name)}
                    />
                    <ThrottledTextField
                        delay={200}
                        className="form-control"
                        maxLength={SizeLimits.DescriptionMaxLength}
                        label="Description"
                        style={{height: "200px"}}
                        multiline={true}
                        resizable={false}
                        onChanged={this._onDescriptionChange}
                        value={this.state.ruleGroup.getFieldValue<string>(RuleGroupFieldNames.Description)}
                    />
                    <Checkbox
                        className="form-control"
                        checked={this.state.ruleGroup.getFieldValue<boolean>(RuleGroupFieldNames.Disabled)}
                        label="Disabled"
                        onChange={this._onToggleDisable}
                    />
                </div>
            </Panel>
        );
    }

    protected initializeState() {
        this.state = {
            ruleGroup: this.props.ruleGroupModel ? new RuleGroup(this.props.ruleGroupModel) : RuleGroup.getNewRuleGroup(this.props.workItemTypeName)
        };
    }

    private _onRenderFooter = (): JSX.Element => {
        return (
            <div style={{ textAlign: "right" }}>
                <PrimaryButton
                    ariaLabel={"OK"}
                    disabled={!this.state.ruleGroup.isDirty() || !this.state.ruleGroup.isValid() || this.state.saving}
                    onClick={this._saveRuleGroup}
                    style={{ marginRight: "8px" }}
                >
                    OK
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
        this.state.ruleGroup.setFieldValue<string>(RuleGroupFieldNames.Name, value);
    }

    private _onDescriptionChange = (value: string) => {
        this.state.ruleGroup.setFieldValue<string>(RuleGroupFieldNames.Description, value);
    }

    private _onToggleDisable = (_ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
        this.state.ruleGroup.setFieldValue<boolean>(RuleGroupFieldNames.Disabled, isChecked);
    }

    private _onKeyDown = (e: React.KeyboardEvent<any>) => {
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            this._saveRuleGroup();
        }
    }

    private _saveRuleGroup = async () => {
        if (!this.state.ruleGroup.isDirty() || !this.state.ruleGroup.isValid() || this.state.saving) {
            return;
        }

        try {
            this.setState({saving: true});
            if (this.state.ruleGroup.isNew) {
                await RuleGroupActions.createRuleGroup(this.props.workItemTypeName, this.state.ruleGroup.updatedModel);
            }
            else {
                await RuleGroupActions.updateRuleGroup(this.props.workItemTypeName, this.state.ruleGroup.updatedModel);
            }

            this.setState({saving: false});
            this.props.onDismiss();
        }
        catch (e) {
            this.setState({saving: false, error: e});
        }
    }

    private _onModelChanged = () => {
        this.setState({ruleGroup: this.state.ruleGroup});
    }
}
