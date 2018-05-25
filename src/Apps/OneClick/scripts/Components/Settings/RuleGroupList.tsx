import "./RuleGroupList.scss";

import * as React from "react";

import { IdentityView } from "Common/Components/IdentityView";
import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { confirmAction, delegate } from "Common/Utilities/Core";
import { getDistinctNameFromIdentityRef } from "Common/Utilities/Identity";
import { navigate } from "Common/Utilities/Navigation";
import { caseInsensitiveContains, isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import {
    ConstrainMode, DetailsListLayoutMode, IColumn, SelectionMode
} from "OfficeFabric/DetailsList";
import { Link } from "OfficeFabric/Link";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Panel, PanelType } from "OfficeFabric/Panel";
import { Toggle } from "OfficeFabric/Toggle";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { css } from "OfficeFabric/Utilities";
import { RuleGroupEditor } from "OneClick/Components/Settings/RuleGroupEditor";
import { SettingKey } from "OneClick/Constants";
import { RuleGroupActions } from "OneClick/Flux/Actions/RuleGroupActions";
import { SettingsActions } from "OneClick/Flux/Actions/SettingsActions";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { getRuleGroupUrl, isPersonalOrGlobalRuleGroup } from "OneClick/Helpers";
import { IRuleGroup } from "OneClick/Interfaces";
import { FilterBar, IFilterBar, KeywordFilterBarItem } from "VSSUI/Components/FilterBar";
import { Hub } from "VSSUI/Components/Hub";
import { HubHeader } from "VSSUI/Components/HubHeader";
import { IPivotBarAction, IPivotBarViewAction, PivotBarItem } from "VSSUI/Components/PivotBar";
import { IconToggleButton } from "VSSUI/IconToggleButton";
import { FILTER_CHANGE_EVENT, IFilterState } from "VSSUI/Utilities/Filter";
import { HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { VssDetailsList } from "VSSUI/VssDetailsList";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";
import { ZeroData } from "VSSUI/ZeroData";

export interface IRuleGroupListProps extends IBaseFluxComponentProps {
    workItemTypeName: string;
    refresh(): void;
    toggleSubscription(subscribe: boolean, ruleGroup: IRuleGroup): void;
}

export interface IRuleGroupListState extends IBaseFluxComponentState {
    ruleGroups?: IRuleGroup[];
    isGroupPanelOpen?: boolean;
    isSettingsPanelOpen?: boolean;
    selectedRuleGroupForEdit?: IRuleGroup;
    filterText?: string;
    subscribedRuleGroupMap?: IDictionaryStringTo<boolean>;
    personalRulesEnabled?: boolean;
    globalRulesEnabled?: boolean;
    workItemTypeEnabled?: boolean;
}

export class RuleGroupList extends BaseFluxComponent<IRuleGroupListProps, IRuleGroupListState> {
    private _hubViewState: IHubViewState;
    private _filterBar: IFilterBar;

    constructor(props: IRuleGroupListProps, context?: any) {
        super(props, context);
        this._hubViewState = new HubViewState();
        this._hubViewState.selectedPivot.value = "Favorites";
    }

    public componentDidMount() {
        super.componentDidMount();

        this._hubViewState.filter.subscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        document.addEventListener("keydown", this._focusFilterBar, false);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        this._hubViewState.filter.unsubscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        document.removeEventListener("keydown", this._focusFilterBar);
    }

    public render(): JSX.Element {
        return (
            <div className="rule-group-list-container">
                <Hub
                    className="rule-group-list-hub"
                    hubViewState={this._hubViewState}
                    commands={this._getHubCommands()}
                >
                    <HubHeader title={`Rule groups for "${this.props.workItemTypeName}"`} />

                    <FilterBar componentRef={this._resolveFilterBar}>
                        <KeywordFilterBarItem filterItemKey={"keyword"} />
                    </FilterBar>

                    <PivotBarItem name="Favorites" itemKey="Favorites" viewActions={this._getHubViewActions(true)}>
                        {this._renderGroups(true)}
                    </PivotBarItem>
                    <PivotBarItem name="All" itemKey="All" viewActions={this._getHubViewActions()}>
                        {this._renderGroups()}
                    </PivotBarItem>
                </Hub>
                { this.state.isGroupPanelOpen &&
                    <RuleGroupEditor
                        ruleGroupModel={this.state.selectedRuleGroupForEdit}
                        onDismiss={this._hideGroupPanel}
                        workItemTypeName={this.props.workItemTypeName}
                    />
                }
                <Panel
                    isOpen={this.state.isSettingsPanelOpen}
                    headerText={`"${this.props.workItemTypeName}" Settings`}
                    type={PanelType.custom}
                    customWidth="450px"
                    isLightDismiss={false}
                    onDismiss={this._hideSettingsPanel}
                >
                    <MessageBar messageBarType={MessageBarType.info}>
                        {`
                        Note: These settings would be globally applied for "${this.props.workItemTypeName}" work item type in the current project.
                        Please consult your administrator before changing these settings.
                        `}
                    </MessageBar>
                    <Toggle
                        styles={{root: {margin: "20px 0"}}}
                        checked={this.state.personalRulesEnabled}
                        label="Enable personal rules"
                        onText="Enabled"
                        offText="Disabled"
                        onChanged={this._togglePersonalRules}
                    />
                    <Toggle
                        styles={{root: {margin: "20px 0"}}}
                        defaultChecked={false}
                        checked={this.state.globalRulesEnabled}
                        label="Enable global rules"
                        onText="Enabled"
                        offText="Disabled"
                        onChanged={this._toggleGlobalRules}
                    />
                    <Toggle
                        defaultChecked={false}
                        checked={this.state.workItemTypeEnabled}
                        label={`Enable work item type "${this.props.workItemTypeName}"`}
                        onText="Enabled"
                        offText="Disabled"
                        onChanged={this._toggleWorkItemType}
                    />
                </Panel>
            </div>
        );
    }

    protected getInitialState(): IRuleGroupListState {
        return this._getNewState();
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.ruleGroupStore, StoresHub.settingsStore];
    }

    protected getStoresState(): IRuleGroupListState {
        return this._getNewState();
    }

    private _getNewState(): IRuleGroupListState {
        const userSubscriptions = StoresHub.settingsStore.getItem<string[]>(SettingKey.UserSubscriptions);
        const personalRulesEnabled = StoresHub.settingsStore.getItem<boolean>(SettingKey.PersonalRulesEnabled);
        const globalRulesEnabled = StoresHub.settingsStore.getItem<boolean>(SettingKey.GlobalRulesEnabled);
        const workItemTypeEnabled = StoresHub.settingsStore.getItem<boolean>(SettingKey.WorkItemTypeEnabled);

        const loading = userSubscriptions == null
            || personalRulesEnabled == null
            || globalRulesEnabled == null
            || workItemTypeEnabled == null
            || StoresHub.ruleGroupStore.isLoading(this.props.workItemTypeName);

        return {
            loading: loading,
            personalRulesEnabled: personalRulesEnabled,
            globalRulesEnabled: globalRulesEnabled,
            workItemTypeEnabled: workItemTypeEnabled,
            ruleGroups: loading ? [] : this._filterGroups(this.state && this.state.filterText, personalRulesEnabled, globalRulesEnabled),
            subscribedRuleGroupMap: userSubscriptions ? this._getSubscribedGroupsMap(userSubscriptions) : null,
        } as IRuleGroupListState;
    }

    private _getHubCommands(): IPivotBarAction[] {
        return [
            {
                key: "new",
                name: "New Rule Group",
                disabled: this.state.loading,
                important: true,
                iconProps: { iconName: "Add", iconType: VssIconType.fabric },
                onClick: () => {
                    this._showGroupPanel();
                }
            },
            {
                key: "refresh",
                name: "Refresh",
                disabled: this.state.loading,
                important: true,
                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                onClick: this._refresh
            },
            {
                key: "settings",
                name: "Settings",
                disabled: this.state.loading,
                important: true,
                iconProps: { iconName: "Settings", iconType: VssIconType.fabric },
                onClick: this._showSettingsPanel
            }
        ];
    }

    private _getHubViewActions(favsOnly?: boolean): IPivotBarViewAction[] {
        let text = "Loading...";
        if (!this.state.loading) {
            const ruleGroups = !favsOnly ? this.state.ruleGroups : this.state.ruleGroups.filter(this._isRuleGroupSubscribed);
            text = `${ruleGroups.length} rule groups`;
        }

        return [
            {
                key: "resultcount",
                name: text,
                important: true
            }
        ];
    }

    private _renderGroups(favsOnly?: boolean): React.ReactNode {
        let contents: React.ReactNode;

        if (this.state.loading) {
            contents = <Loading />;
        }
        else {
            const ruleGroups = !favsOnly ? this.state.ruleGroups : this.state.ruleGroups.filter(this._isRuleGroupSubscribed);

            if (ruleGroups.length === 0) {
                let message = "No rule groups found.";
                if (!isNullOrEmpty(this.state.filterText)) {
                    message = `No rule groups found matching the filter "${this.state.filterText}"`;
                }
                contents = (
                    <ZeroData
                        imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                        imageAltText=""
                        primaryText={message}
                    />
                );
            }
            else {
                contents = (
                    <VssDetailsList
                        className="rule-group-list"
                        allocateSpaceForActionsButtonWhileHidden={true}
                        items={ruleGroups}
                        layoutMode={DetailsListLayoutMode.justified}
                        constrainMode={ConstrainMode.horizontalConstrained}
                        columns={this._getGridColumns()}
                        actionsColumnKey="name"
                        selectionMode={SelectionMode.single}
                        getMenuItems={this._getGridContextMenuItems}
                    />
                );
            }
        }

        return (
            <div className="rule-group-list-contents">
                {contents}
            </div>
        );
    }

    private _getGridColumns(): IColumn[] {
        return [
            {
                key: "status",
                fieldName: "status",
                name: "Status",
                minWidth: 35,
                maxWidth: 35,
                isResizable: false,
                onRender: (ruleGroup: IRuleGroup) => {
                    return (
                        <TooltipHost
                            content={ruleGroup.disabled ? "This rule group is disabled" : "This rule group is enabled"}
                            delay={TooltipDelay.medium}
                            directionalHint={DirectionalHint.bottomCenter}
                        >
                            <VssIcon
                                iconType={VssIconType.fabric}
                                iconName={ruleGroup.disabled ? "CircleStopSolid" : "SkypeCheck"}
                                className={css("rule-group-status", { disabled: ruleGroup.disabled })}
                            />
                        </TooltipHost>
                    );
                }
            },
            {
                key: "name",
                fieldName: "name",
                name: "Name",
                minWidth: 200,
                maxWidth: 400,
                isResizable: true,
                onRender: this._renderNameColumn
            },
            {
                key: "description",
                fieldName: "description",
                name: "Description",
                minWidth: 500,
                maxWidth: 700,
                isResizable: true,
                onRender: (ruleGroup: IRuleGroup) => {
                    return (
                        <TooltipHost
                            content={ruleGroup.description}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomCenter}
                        >
                            {ruleGroup.description}
                        </TooltipHost>
                    );
                }
            },
            {
                key: "createdby",
                fieldName: "createdby",
                name: "Created By",
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                onRender: (ruleGroup: IRuleGroup) => {
                    return <IdentityView identityRef={ruleGroup.createdBy} />;
                }
            },
            {
                key: "lastupdatedby",
                fieldName: "lastupdatedby",
                name: "Last Updated By",
                minWidth: 100,
                maxWidth: 200,
                onRender: (ruleGroup: IRuleGroup) => {
                    return <IdentityView identityRef={ruleGroup.lastUpdatedBy} />;
                }
            }
        ];
    }

    private _toggleSubscription(subscribe: boolean, ruleGroup: IRuleGroup) {
        this.props.toggleSubscription(subscribe, ruleGroup);
    }

    private async _deleteRuleGroup(ruleGroup: IRuleGroup) {
        const confirm = await confirmAction(true, "Are you sure you want to delete this shared rule group?");
        if (confirm) {
            RuleGroupActions.deleteRuleGroup(this.props.workItemTypeName, ruleGroup);
        }
    }

    private _onRowClick(e: React.MouseEvent<HTMLElement>, ruleGroup: IRuleGroup) {
        if (!e.ctrlKey) {
            e.preventDefault();
            navigate({witName: this.props.workItemTypeName, ruleGroup: ruleGroup.id});
        }
    }

    private _getSubscribedGroupsMap(groupIds: string[]): IDictionaryStringTo<boolean> {
        if (!groupIds) {
            return null;
        }

        const map: IDictionaryStringTo<boolean> = {};
        for (const id of groupIds) {
            map[id.toLowerCase()] = true;
        }

        return map;
    }

    private _filterGroups(filterText: string, personalRulesEnabled: boolean, globalRulesEnabled: boolean): IRuleGroup[] {
        const ruleGroups = StoresHub.ruleGroupStore.getAll(personalRulesEnabled, globalRulesEnabled);
        if (ruleGroups && !isNullOrEmpty(filterText)) {
            return ruleGroups.filter(rg =>
                caseInsensitiveContains(rg.name, filterText)
                || caseInsensitiveContains(getDistinctNameFromIdentityRef(rg.createdBy), filterText)
                || caseInsensitiveContains(rg.description, filterText));
        }

        return ruleGroups;
    }

    private _renderNameColumn = (ruleGroup: IRuleGroup): React.ReactNode => {
        const isSubscribed = this._isRuleGroupSubscribed(ruleGroup);
        const link = getRuleGroupUrl(this.props.workItemTypeName, ruleGroup.id);
        let iconTooltip: string;
        if (isPersonalOrGlobalRuleGroup(ruleGroup)) {
            iconTooltip = "You can not unsubcribe from personal or global groups.";
        }
        else {
            iconTooltip = isSubscribed ? "Unsubscribe from this rule group" : "Subscribe to this rule group";
        }

        return (
            <div className="name-column-cell">
                <div className="name-part">
                    <Link
                        className="name-link"
                        href={link}
                        onClick={delegate(this, this._onRowClick, ruleGroup)}
                    >
                        <TooltipHost
                            content={ruleGroup.name}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomCenter}
                        >

                            {ruleGroup.name}
                        </TooltipHost>
                    </Link>
                </div>
                <div className={css("subscribe-button", { unsubscribed: !isSubscribed })}>
                    <TooltipHost
                        content={iconTooltip}
                        delay={TooltipDelay.medium}
                        directionalHint={DirectionalHint.bottomAutoEdge}
                    >

                        {isPersonalOrGlobalRuleGroup(ruleGroup) &&
                            <VssIcon
                                iconType={VssIconType.fabric}
                                iconName="Info"
                                className="rule-group-info-icon"
                            />
                        }
                        {!isPersonalOrGlobalRuleGroup(ruleGroup) &&
                            <IconToggleButton
                                toggledOnIconProps={{
                                    iconName: "FavoriteStarFill",
                                    iconType: VssIconType.fabric,
                                    style: { color: "#ffbe00", fontSize: "14px" }
                                }}
                                toggledOffIconProps={{
                                    iconName: "FavoriteStar",
                                    iconType: VssIconType.fabric,
                                    style: { fontSize: "14px" }
                                }}
                                isToggledOn={isSubscribed}
                                onToggle={delegate(this, this._toggleSubscription, ruleGroup)}
                                className="rule-group-subscribe-command"
                            />
                        }
                    </TooltipHost>
                </div>
            </div>
        );
    }

    private _getGridContextMenuItems = (ruleGroup: IRuleGroup): IContextualMenuItem[] => {
        const menuItems: IContextualMenuItem[] = [
            {
                key: "open", name: "Open", iconProps: {iconName: "ReplyMirrored"},
                onClick: () => {
                    navigate({witName: this.props.workItemTypeName, ruleGroup: ruleGroup.id});
                }
            }
        ];
        if (!isPersonalOrGlobalRuleGroup(ruleGroup)) {
            menuItems.push({
                key: "edit", name: "Edit", iconProps: {iconName: "Edit"},
                onClick: () => {
                    this._showGroupPanel(ruleGroup);
                }
            },
                           {
                key: "delete", name: "Delete", iconProps: {iconName: "Delete", style: { color: "#da0a00" }},
                onClick: () => {
                    this._deleteRuleGroup(ruleGroup);
                }
            });
        }

        return menuItems;
    }

    private _refresh = () => {
        this.props.refresh();
    }

    private _isRuleGroupSubscribed = (ruleGroup: IRuleGroup): boolean => {
        return isPersonalOrGlobalRuleGroup(ruleGroup)
            || (this.state.subscribedRuleGroupMap && this.state.subscribedRuleGroupMap[ruleGroup.id.toLowerCase()]);
    }

    private _showGroupPanel = (ruleGroup?: IRuleGroup) => {
        this.setState({isGroupPanelOpen: true, selectedRuleGroupForEdit: ruleGroup});
    }

    private _hideGroupPanel = () => {
        this.setState({isGroupPanelOpen: false, selectedRuleGroupForEdit: null});
    }

    private _showSettingsPanel = () => {
        this.setState({isSettingsPanelOpen: true});
    }

    private _hideSettingsPanel = () => {
        this.setState({isSettingsPanelOpen: false});
    }

    private _togglePersonalRules = (enabled: boolean) => {
        SettingsActions.updateSetting<boolean>(this.props.workItemTypeName, SettingKey.PersonalRulesEnabled, enabled, false);
    }

    private _toggleGlobalRules = (enabled: boolean) => {
        SettingsActions.updateSetting<boolean>(this.props.workItemTypeName, SettingKey.GlobalRulesEnabled, enabled, false);
    }

    private _toggleWorkItemType = (enabled: boolean) => {
        SettingsActions.updateSetting<boolean>(this.props.workItemTypeName, SettingKey.WorkItemTypeEnabled, enabled, false);
    }

    private _onFilterChange = (filterState: IFilterState) => {
        if (filterState && filterState.keyword) {
            const filterText = (filterState.keyword.value || "").trim();
            this.setState({
                filterText: filterText,
                ruleGroups: this._filterGroups(filterText, this.state.personalRulesEnabled, this.state.globalRulesEnabled)
            });
        }
    }

    private _focusFilterBar = (ev: KeyboardEvent) => {
        if (this._filterBar && ev.ctrlKey && ev.shiftKey && stringEquals(ev.key, "f", true)) {
            this._filterBar.focus();
        }
    }

    private _resolveFilterBar = (filterBar: IFilterBar) => {
        this._filterBar = filterBar;
    }
}
