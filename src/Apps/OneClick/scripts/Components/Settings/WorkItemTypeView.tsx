import * as React from "react";

import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { confirmAction } from "Common/Utilities/Core";
import { getCurrentUserName } from "Common/Utilities/Identity";
import { stringEquals } from "Common/Utilities/String";
import { RuleGroupList } from "OneClick/Components/Settings/RuleGroupList";
import { RuleGroupView } from "OneClick/Components/Settings/RuleGroupView";
import { SettingKey } from "OneClick/Constants";
import { RuleGroupActions } from "OneClick/Flux/Actions/RuleGroupActions";
import { SettingsActions } from "OneClick/Flux/Actions/SettingsActions";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { isPersonalOrGlobalRuleGroup } from "OneClick/Helpers";
import { IRuleGroup } from "OneClick/Interfaces";
import { trackEvent } from "OneClick/Telemetry";
import { ZeroData, ZeroDataActionType } from "VSSUI/ZeroData";

export interface IWorkItemTypeViewProps extends IBaseFluxComponentProps {
    workItemTypeName: string;
    ruleGroupId?: string;
}

export interface IWorkItemTypeViewState extends IBaseFluxComponentState {
    workItemTypeEnabled?: boolean;
}

export class WorkItemTypeView extends BaseFluxComponent<IWorkItemTypeViewProps, IWorkItemTypeViewState> {
    public componentDidMount() {
        super.componentDidMount();
        this._refresh();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._clearStores();
    }

    public componentWillReceiveProps(nextProps: IWorkItemTypeViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(this.props.workItemTypeName, nextProps.workItemTypeName, true)) {
            this._refresh(nextProps.workItemTypeName);
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }
        if (!this.state.workItemTypeEnabled) {
            return (
                <ZeroData
                    actionText="Enable"
                    actionType={ZeroDataActionType.ctaButton}
                    onActionClick={this._toggleWorkItemType}
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/blocked.png`}
                    imageAltText=""
                    primaryText={"This work item type has been disabled."}
                />
            );
        }

        if (this.props.ruleGroupId) {
            return (
                <RuleGroupView
                    refresh={this._refresh}
                    toggleSubscription={this._toggleSubscription}
                    workItemTypeName={this.props.workItemTypeName}
                    ruleGroupId={this.props.ruleGroupId}
                />
            );
        } else {
            return <RuleGroupList refresh={this._refresh} toggleSubscription={this._toggleSubscription} workItemTypeName={this.props.workItemTypeName} />;
        }
    }

    protected getStoresState(): IWorkItemTypeViewState {
        const workItemTypeEnabled = StoresHub.settingsStore.getItem<boolean>(SettingKey.WorkItemTypeEnabled);
        return {
            loading: workItemTypeEnabled == null,
            workItemTypeEnabled: workItemTypeEnabled
        } as IWorkItemTypeViewState;
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.settingsStore];
    }

    protected getInitialState(): IWorkItemTypeViewState {
        return {
            loading: true,
            workItemTypeEnabled: null
        };
    }

    private _clearStores(currentWorkItemType?: string) {
        StoresHub.ruleGroupStore.clear();
        StoresHub.settingsStore.clear();
        StoresHub.ruleStore.clear();

        StoresHub.ruleGroupStore.setCurrentWorkItemType(currentWorkItemType);
        StoresHub.settingsStore.setCurrentWorkItemType(currentWorkItemType);
    }

    private _toggleWorkItemType = async () => {
        const confirm = await confirmAction(
            true,
            `This setting would be globally applied for "${this.props.workItemTypeName}" work item type in the current project.
        Are you sure you still want to enable this work item type? If you are unsure, please consult your administrator first.`
        );

        if (confirm) {
            SettingsActions.updateSetting<boolean>(this.props.workItemTypeName, SettingKey.WorkItemTypeEnabled, true, false);
        }
    };

    private _refresh = (workItemType?: string) => {
        const workItemTypeName = workItemType || this.props.workItemTypeName;
        this._clearStores(workItemTypeName);

        RuleGroupActions.initializeRuleGroups(workItemTypeName);
        SettingsActions.initializeSetting<string[]>(workItemTypeName, SettingKey.UserSubscriptions, true, []);
        SettingsActions.initializeSetting<boolean>(workItemTypeName, SettingKey.PersonalRulesEnabled, false, true);
        SettingsActions.initializeSetting<boolean>(workItemTypeName, SettingKey.GlobalRulesEnabled, false, true);
        SettingsActions.initializeSetting<boolean>(workItemTypeName, SettingKey.WorkItemTypeEnabled, false, true);
    };

    private _toggleSubscription = (subscribe: boolean, ruleGroup: IRuleGroup) => {
        if (isPersonalOrGlobalRuleGroup(ruleGroup)) {
            return;
        }

        const currentSubscriptions = StoresHub.settingsStore.getItem<string[]>(SettingKey.UserSubscriptions);
        if (currentSubscriptions) {
            let updatedSubscriptions = [...currentSubscriptions];

            if (subscribe) {
                // subscribe
                updatedSubscriptions.push(ruleGroup.id);
            } else {
                // unsubscribe
                updatedSubscriptions = updatedSubscriptions.filter(srgId => !stringEquals(srgId, ruleGroup.id, true));
            }

            SettingsActions.updateSetting<string[]>(this.props.workItemTypeName, SettingKey.UserSubscriptions, updatedSubscriptions, true);

            // log event
            if (subscribe) {
                trackEvent("SubscribeToRuleGroup", {
                    user: getCurrentUserName(),
                    ruleGroupId: ruleGroup.id,
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            } else {
                trackEvent("UnsubscribeFromRuleGroup", {
                    user: getCurrentUserName(),
                    ruleGroupId: ruleGroup.id,
                    workItemTypeName: ruleGroup.workItemType,
                    project: ruleGroup.projectId
                });
            }
        }
    };
}
