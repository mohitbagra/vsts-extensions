import "./WorkItemRulesGroup.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { arrayMove, SortableContainer, SortableElement } from "react-sortable-hoc";

import { initializeIcons } from "@uifabric/icons";
import { Loading } from "Common/Components/Loading";
import { AutoResizableComponent } from "Common/Components/Utilities/AutoResizableComponent";
import {
    IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { contains, subtract } from "Common/Utilities/Array";
import { getCurrentUserName } from "Common/Utilities/Identity";
import {
    readLocalSetting, WebSettingsScope, writeLocalSetting
} from "Common/Utilities/LocalSettingsService";
import { stringEquals } from "Common/Utilities/String";
import { getMarketplaceUrl, getWorkItemTypeSettingsUrl } from "Common/Utilities/UrlHelper";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IconButton } from "OfficeFabric/Button";
import { Fabric } from "OfficeFabric/Fabric";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { WorkItemFormRuleButton } from "OneClick/Components/FormGroup/WorkItemFormRuleButton";
import {
    Constants, CoreFieldRefNames, FormEvents, RuleFieldNames, SettingKey
} from "OneClick/Constants";
import { RuleGroupsDataService } from "OneClick/DataServices/RuleGroupsDataService";
import { RulesDataService } from "OneClick/DataServices/RulesDataService";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";
import { IActionError, ILocalStorageRulesData, IRule } from "OneClick/Interfaces";
import { resetSession, trackEvent } from "OneClick/Telemetry";
import { Rule } from "OneClick/ViewModels/Rule";
import { TeamProject } from "TFS/Core/Contracts";
import * as CoreClient from "TFS/Core/RestClient";
import {
    IWorkItemChangedArgs, IWorkItemFieldChangedArgs, IWorkItemLoadedArgs,
    IWorkItemNotificationListener
} from "TFS/WorkItemTracking/ExtensionContracts";
import { ZeroData, ZeroDataActionType } from "VSSUI/ZeroData";

export interface IWorkItemRulesGroupState extends IBaseFluxComponentState {
    rules?: Rule[];
    workItemTypeEnabled?: boolean;
    ruleExecutionError?: IActionError;
}

const SortableItem: any = SortableElement(({ value }) => {
    return <div className="rule-list-item">{value}</div>;
});

const SortableList: any = SortableContainer(({ items }) => {
    return <div className="rules-list-container">{items.map((value, index) => <SortableItem key={`item-${index}`} index={index} value={value} />)}</div>;
});

export class WorkItemRulesGroup extends AutoResizableComponent<IBaseFluxComponentProps, IWorkItemRulesGroupState> {
    private _project: TeamProject;
    private _workItemTypeName: string;
    private _cacheStamp: number;
    private _ruleOrder: IDictionaryStringTo<number>;

    public componentDidMount() {
        super.componentDidMount();

        VSS.register(VSS.getContribution().id, {
            onLoaded: async (args: IWorkItemLoadedArgs) => {
                // load data only if its not already loaded and not currently being loaded
                resetSession(); // reset telemetry session id
                let rules = this.state.rules;
                if (!this.state.loading && !this.state.rules) {
                    rules = await this._initializeRules(false);
                }

                this._fireRulesTrigger(FormEvents.onLoaded, args, rules);
            },
            onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
                this._fireRulesTrigger(FormEvents.onFieldChanged, args);
            },
            onSaved: (args: IWorkItemChangedArgs) => {
                this._fireRulesTrigger(FormEvents.onSaved, args);
            },
            onRefreshed: (args: IWorkItemChangedArgs) => {
                this._fireRulesTrigger(FormEvents.onRefreshed, args);
            },
            onReset: (args: IWorkItemChangedArgs) => {
                this._fireRulesTrigger(FormEvents.onReset, args);
            },
            onUnloaded: (args: IWorkItemChangedArgs) => {
                this._fireRulesTrigger(FormEvents.onUnloaded, args);
            }
        } as IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        VSS.unregister(VSS.getContribution().id);
    }

    public render(): JSX.Element {
        const iconsDisabled = this.state.loading || !this.state.rules;
        return (
            <Fabric className="fabric-container">
                <div className="rules-content-container" tabIndex={-1} onKeyDown={this._onKeyDown}>
                    <div className="rules-command-bar">
                        <TooltipHost content={"Configure rules"} delay={TooltipDelay.medium} directionalHint={DirectionalHint.bottomLeftEdge}>
                            <IconButton
                                className="rules-command"
                                iconProps={{
                                    iconName: "Settings"
                                }}
                                disabled={iconsDisabled}
                                href={this._project ? getWorkItemTypeSettingsUrl(this._workItemTypeName, this._project.name) : undefined}
                                target="_blank"
                            />
                        </TooltipHost>
                        <TooltipHost content={"Refresh"} delay={TooltipDelay.medium} directionalHint={DirectionalHint.bottomLeftEdge}>
                            <IconButton
                                className="rules-command"
                                iconProps={{
                                    iconName: "Refresh"
                                }}
                                disabled={iconsDisabled}
                                onClick={this._refresh}
                            />
                        </TooltipHost>
                        <TooltipHost content={"How to use the extension"} delay={TooltipDelay.medium} directionalHint={DirectionalHint.bottomLeftEdge}>
                            <IconButton
                                className="info-button"
                                iconProps={{
                                    iconName: "InfoSolid"
                                }}
                                disabled={iconsDisabled}
                                href={getMarketplaceUrl()}
                                target="_blank"
                            />
                        </TooltipHost>
                        {this._renderErrors()}
                    </div>
                    {this._renderRules()}
                </div>
            </Fabric>
        );
    }

    protected getInitialState(): IWorkItemRulesGroupState {
        return {
            loading: false,
            workItemTypeEnabled: true,
            ruleExecutionError: null
        };
    }

    private _renderErrors(): JSX.Element {
        if (this.state.ruleExecutionError) {
            return (
                <a href="javascript:void();" onClick={this._showErrorsDialog} className="error-link">
                    error
                </a>
            );
        }
        return null;
    }

    private _renderRules(): JSX.Element {
        if (this.state.loading || !this.state.rules) {
            return <Loading />;
        }

        if (!this.state.workItemTypeEnabled) {
            return (
                <ZeroData
                    actionText="Configure Rules"
                    actionType={ZeroDataActionType.ctaButton}
                    onActionClick={this._openSettingsPage}
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/blocked.png`}
                    imageAltText=""
                    primaryText="This work item type has been disabled."
                />
            );
        }

        if (this.state.rules.length === 0) {
            return (
                <ZeroData
                    actionText="Configure Rules"
                    actionType={ZeroDataActionType.ctaButton}
                    onActionClick={this._openSettingsPage}
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No rules found"
                />
            );
        }

        const items = this.state.rules.map(this._renderRuleButton);

        return <SortableList items={items} axis="xy" lockAxis="xy" distance={10} onSortEnd={this._reorderRules} />;
    }

    private async _initializeRules(forceFromServer: boolean): Promise<Rule[]> {
        this.setState({ loading: true });

        if (!this._project) {
            // read work item type and project from current workitem
            const formService = await getFormService();
            const fieldValues = await formService.getFieldValues([CoreFieldRefNames.WorkItemType, CoreFieldRefNames.TeamProject]);
            this._workItemTypeName = fieldValues[CoreFieldRefNames.WorkItemType] as string;
            const projectName = fieldValues[CoreFieldRefNames.TeamProject] as string;
            this._project = await CoreClient.getClient().getProject(projectName);

            // read current cache stamp and user's rule ordering setting
            const [ruleOrder, cacheStamp] = await Promise.all([
                SettingsDataService.loadSetting<IDictionaryStringTo<number>>(SettingKey.UserRulesOrdering, {}, this._workItemTypeName, this._project.id, true),
                SettingsDataService.readCacheStamp(this._workItemTypeName, this._project.id)
            ]);

            this._cacheStamp = cacheStamp;
            this._ruleOrder = ruleOrder;
        }

        // load data from localstorage if its valid
        let ruleModels: IRule[];
        if (!forceFromServer) {
            ruleModels = this._loadFromLocalStorage(this._cacheStamp);
        }

        // if rules dont exist in local storage or are expired, read from server
        if (!ruleModels) {
            ruleModels = await this._refreshFromServer();

            if (this._cacheStamp) {
                // set new data to local storage
                const newLocalRules: ILocalStorageRulesData = {
                    cacheStamp: this._cacheStamp,
                    projectId: this._project.id,
                    workItemType: this._workItemTypeName,
                    rules: ruleModels
                };
                writeLocalSetting(this._getLocalStorageKey(), JSON.stringify(newLocalRules), WebSettingsScope.User);
            }
        }

        if (this._ruleOrder) {
            ruleModels.sort((rm1, rm2) => {
                const rm1Order = this._ruleOrder[rm1.id.toLowerCase()];
                const rm2Order = this._ruleOrder[rm2.id.toLowerCase()];
                if (rm1Order == null && rm2Order == null) {
                    return 0;
                } else if (rm1Order != null && rm2Order == null) {
                    return -1;
                } else if (rm1Order == null && rm2Order != null) {
                    return 1;
                } else {
                    return rm1Order > rm2Order ? 1 : -1;
                }
            });
        }
        const rules = ruleModels.map(r => new Rule(r));
        this.setState({ loading: false, rules: rules });

        return rules;
    }

    private _loadFromLocalStorage(currentCacheStamp: number): IRule[] {
        if (!currentCacheStamp) {
            return null;
        }

        const localRulesStr = readLocalSetting(this._getLocalStorageKey(), WebSettingsScope.User, null);
        if (localRulesStr) {
            try {
                const localRules: ILocalStorageRulesData = JSON.parse(localRulesStr);
                if (!localRules || localRules.cacheStamp !== currentCacheStamp) {
                    return null;
                } else {
                    return localRules.rules;
                }
            } catch {
                return null;
            }
        }

        return null;
    }

    private async _filterExistingRuleGroups(ruleGroupIds: string[]): Promise<{ existingRuleGroupIds: string[]; deletedRuleGroupIds: string[] }> {
        const workItemTypeName = this._workItemTypeName;
        const projectId = this._project.id;
        const allRuleGroups = await RuleGroupsDataService.loadRuleGroups(workItemTypeName, projectId);
        const deletedRuleGroupIds = subtract(ruleGroupIds, allRuleGroups.map(rg => rg.id), (s1, s2) => stringEquals(s1, s2, true));

        // return all groups with required ids which are not disabled
        return {
            existingRuleGroupIds: allRuleGroups.filter(sg => !sg.disabled && contains(ruleGroupIds, sg.id, (s1, s2) => stringEquals(s1, s2, true))).map(sg => sg.id),
            deletedRuleGroupIds: deletedRuleGroupIds
        };
    }

    private _getLocalStorageKey(): string {
        return `${this._project.id}/${this._workItemTypeName}`.toLowerCase();
    }

    private async _saveWorkItem() {
        const formService = await getFormService();
        formService.save();
    }

    private async _fireRulesTrigger(eventName: FormEvents, args: any, rulesToEvaluate?: Rule[]) {
        const rules = rulesToEvaluate || this.state.rules;
        if (rules) {
            for (const rule of rules) {
                const shouldRunOnEvent = await rule.shouldRunOnEvent(eventName, args);
                if (shouldRunOnEvent) {
                    const errors = await rule.run();
                    this._setError(errors);

                    // log event
                    trackEvent("RuleTrigger", {
                        ruleId: rule.id,
                        triggerEvent: eventName,
                        workItemType: rule.getFieldValue<string>(RuleFieldNames.WorkItemType),
                        projectId: rule.getFieldValue<string>(RuleFieldNames.ProjectId),
                        user: getCurrentUserName()
                    });
                }
            }
        }
    }

    private _showErrorsDialog = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const { ruleExecutionError } = this.state;
        alert(`${ruleExecutionError.actionName.toUpperCase()} : ${ruleExecutionError.error}`);
    };

    private _renderRuleButton = (rule: Rule): JSX.Element => {
        return <WorkItemFormRuleButton rule={rule} onExecute={this._setError} />;
    };

    private _setError = (ruleExecutionError: IActionError) => {
        this.setState({ ruleExecutionError: ruleExecutionError });
    };

    private _reorderRules = (data: { oldIndex: number; newIndex: number }) => {
        const { oldIndex, newIndex } = data;
        if (oldIndex !== newIndex) {
            let newRules = [...this.state.rules];
            newRules = arrayMove(newRules, oldIndex, newIndex);
            this.setState({ rules: newRules });

            const newRuleOrder: IDictionaryStringTo<number> = {};
            for (let i = 0; i < newRules.length; i++) {
                newRuleOrder[newRules[i].id] = i;
            }

            this._ruleOrder = newRuleOrder;
            SettingsDataService.updateSetting<IDictionaryStringTo<number>>(SettingKey.UserRulesOrdering, newRuleOrder, this._workItemTypeName, this._project.id, true);
        }
    };

    private _openSettingsPage = () => {
        const url = getWorkItemTypeSettingsUrl(this._workItemTypeName, this._project.name);
        window.open(url, "_blank");
    };

    private _refresh = async () => {
        this._cacheStamp = await SettingsDataService.readCacheStamp(this._workItemTypeName, this._project.id);
        this._initializeRules(true);
    };

    private _onKeyDown = (e: React.KeyboardEvent<any>) => {
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            this._saveWorkItem();
        }
    };

    private _refreshFromServer = async (): Promise<IRule[]> => {
        const workItemTypeName = this._workItemTypeName;
        const projectId = this._project.id;

        // read user subscriptions and global settings
        const [userSubscriptions, personalRulesEnabled, globalRulesEnabled, workItemTypeEnabled] = await Promise.all([
            SettingsDataService.loadSetting<string[]>(SettingKey.UserSubscriptions, [], workItemTypeName, projectId, true),
            SettingsDataService.loadSetting<boolean>(SettingKey.PersonalRulesEnabled, true, workItemTypeName, projectId, false),
            SettingsDataService.loadSetting<boolean>(SettingKey.GlobalRulesEnabled, true, workItemTypeName, projectId, false),
            SettingsDataService.loadSetting<boolean>(SettingKey.WorkItemTypeEnabled, true, workItemTypeName, projectId, false)
        ]);

        if (!workItemTypeEnabled) {
            this.setState({ workItemTypeEnabled: false });
            return [];
        }

        const ruleGroupIdsToLoad: string[] = [];

        // add personal and global groups if they are enabled in global settings for this workitemtype and project
        if (personalRulesEnabled) {
            ruleGroupIdsToLoad.push(Constants.PersonalRuleGroupId);
        }
        if (globalRulesEnabled) {
            ruleGroupIdsToLoad.push(Constants.GlobalRuleGroupId);
        }

        if (userSubscriptions && userSubscriptions.length > 0) {
            // verify existence of rule groups and only load those which exists currently
            const { existingRuleGroupIds, deletedRuleGroupIds } = await this._filterExistingRuleGroups(userSubscriptions);
            if (existingRuleGroupIds && existingRuleGroupIds.length > 0) {
                ruleGroupIdsToLoad.push(...existingRuleGroupIds);
            }

            // unsubscribe from all non-existent groups
            if (deletedRuleGroupIds && deletedRuleGroupIds.length > 0) {
                SettingsDataService.updateSetting<string[]>(
                    SettingKey.UserSubscriptions,
                    subtract(userSubscriptions, deletedRuleGroupIds, (s1, s2) => stringEquals(s1, s2, true)),
                    workItemTypeName,
                    projectId,
                    true
                );
            }
        }

        let rules: IRule[] = [];
        if (ruleGroupIdsToLoad.length > 0) {
            rules = await RulesDataService.loadRulesForGroups(ruleGroupIdsToLoad, projectId);
            rules = rules.filter(r => !r.disabled && stringEquals(r.workItemType, workItemTypeName, true));
        }

        return rules;
    };
}

export function init() {
    initializeIcons();

    const container = document.getElementById("ext-container");
    ReactDOM.render(<WorkItemRulesGroup />, container);
}
