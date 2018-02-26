import "./RuleGroupView.scss";

import * as React from "react";

import { IdentityView } from "Library/Components/IdentityView";
import { Loading } from "Library/Components/Loading";
import { getAsyncLoadedComponent } from "Library/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { confirmAction, delegate } from "Library/Utilities/Core";
import { getCurrentUser } from "Library/Utilities/Identity";
import { navigate } from "Library/Utilities/Navigation";
import { stringEquals } from "Library/Utilities/String";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import {
    ConstrainMode, DetailsListLayoutMode, IColumn, SelectionMode
} from "OfficeFabric/DetailsList";
import { Link } from "OfficeFabric/Link";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { autobind, css } from "OfficeFabric/Utilities";
import * as RuleEditor_Async from "OneClick/Components/Settings/RuleEditor";
import { RuleGroupEditor } from "OneClick/Components/Settings/RuleGroupEditor";
import { Constants, SettingKey } from "OneClick/Constants";
import { RuleActions } from "OneClick/Flux/Actions/RuleActions";
import { RuleGroupActions } from "OneClick/Flux/Actions/RuleGroupActions";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { getRuleGroupUrl, getWorkItemTypeUrl, isPersonalOrGlobalRuleGroup } from "OneClick/Helpers";
import { IRule, IRuleGroup } from "OneClick/Interfaces";
import { Hub } from "VSSUI/Components/Hub";
import { HubHeader } from "VSSUI/Components/HubHeader";
import { IPivotBarViewAction, PivotBarItem } from "VSSUI/Components/PivotBar";
import { IPivotBarAction } from "VSSUI/PivotBar";
import { HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { VssDetailsList } from "VSSUI/VssDetailsList";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";
import { ZeroData } from "VSSUI/ZeroData";

const AsyncRuleEditor = getAsyncLoadedComponent(
    ["scripts/RuleEditor"],
    (m: typeof RuleEditor_Async) => m.RuleEditor,
    () => <Loading />);

export interface IRuleGroupViewProps extends IBaseFluxComponentProps {
    workItemTypeName: string;
    ruleGroupId: string;
    refresh(): void;
    toggleSubscription(subscribe: boolean, ruleGroup: IRuleGroup): void;
}

export interface IRuleGroupViewState extends IBaseFluxComponentState {
    allRuleGroups?: IRuleGroup[];
    ruleGroup?: IRuleGroup;
    isGroupPanelOpen?: boolean;
    isRulePanelOpen?: boolean;
    isSubscribed?: boolean;
    rules?: IRule[];
    selectedRuleForEdit?: IRule;
    targetRuleGroupId?: string;
    isMovedToTargetGroup?: boolean;
}

export class RuleGroupView extends BaseFluxComponent<IRuleGroupViewProps, IRuleGroupViewState> {
    private _hubViewState: IHubViewState;

    constructor(props: IRuleGroupViewProps, context?: any) {
        super(props, context);
        this._hubViewState = new HubViewState();
        this._hubViewState.selectedPivot.value = "RuleGroup";
    }

    public componentDidMount() {
        super.componentDidMount();
        RuleActions.initializeRules(this.props.ruleGroupId);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        StoresHub.ruleStore.clear();
    }

    public componentWillReceiveProps(nextProps: IRuleGroupViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(this.props.ruleGroupId, nextProps.ruleGroupId, true)) {
            StoresHub.ruleStore.clear();
            RuleActions.initializeRules(nextProps.ruleGroupId);
            this.setState({loading: true});
        }
    }

    public render(): JSX.Element {
        const wit = StoresHub.workItemTypeStore.getItem(this.props.workItemTypeName);
        const witIconUrl = wit.icon && wit.icon.url;

        return (
            <div className="rule-group-view-container">
                <Hub
                    className="rule-group-view-hub"
                    hideFullScreenToggle={true}
                    hubViewState={this._hubViewState}
                    commands={this._getHubCommands()}
                >
                    <HubHeader
                        title={this.state.ruleGroup ? this.state.ruleGroup.name : ""}
                        maxBreadcrumbItemWidth="600px"
                        iconProps={isPersonalOrGlobalRuleGroup(this.state.ruleGroup) ? {
                            iconType: VssIconType.fabric,
                            title: this.state.ruleGroup.description,
                            className: "info-button",
                            iconName: "Info"
                        } :
                        {
                            iconType: VssIconType.fabric,
                            onClick: this._toggleSubscription,
                            title: this.state.isSubscribed ? "Unsubscribe" : "Subscribe",
                            className: "subscribe-button",
                            iconName: this.state.isSubscribed ? "FavoriteStarFill" : "FavoriteStar"
                        }}
                        breadcrumbItems={[{
                            text: this.props.workItemTypeName,
                            key: "witname",
                            onClick: this._onHeaderLinkClick,
                            leftIconProps: witIconUrl && {
                                iconType: VssIconType.image,
                                imageProps: {
                                    src: witIconUrl,
                                    width: 16,
                                    height: 16
                                }
                            },
                            href: getWorkItemTypeUrl(this.props.workItemTypeName)
                        }]}
                    />
                    <PivotBarItem name="Rule Group" itemKey="RuleGroup" viewActions={this._getHubViewActions()}>
                        {this._renderRules()}
                    </PivotBarItem>
                </Hub>
                {this.state.isGroupPanelOpen &&
                    <RuleGroupEditor
                        ruleGroupModel={this.state.ruleGroup}
                        onDismiss={this._hidePanel}
                        workItemTypeName={this.props.workItemTypeName}
                    />
                }
                {this.state.isRulePanelOpen &&
                    <AsyncRuleEditor
                        ruleGroupId={this.props.ruleGroupId}
                        ruleModel={this.state.selectedRuleForEdit}
                        workItemTypeName={this.props.workItemTypeName}
                        onDismiss={this._hidePanel}
                    />
                }
                {this._renderToastNotification()}
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            loading: true
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.ruleGroupStore, StoresHub.settingsStore, StoresHub.ruleStore];
    }

    protected getStoresState(): IRuleGroupViewState {
        const userSubscriptions = StoresHub.settingsStore.getItem<string[]>(SettingKey.UserSubscriptions);
        const personalRulesEnabled = StoresHub.settingsStore.getItem<boolean>(SettingKey.PersonalRulesEnabled);
        const globalRulesEnabled = StoresHub.settingsStore.getItem<boolean>(SettingKey.GlobalRulesEnabled);

        const loading = userSubscriptions == null
            || personalRulesEnabled == null
            || globalRulesEnabled == null
            || StoresHub.ruleGroupStore.isLoading(this.props.workItemTypeName)
            || StoresHub.ruleStore.isLoading(this.props.ruleGroupId);

        let isSubscribed = false;
        if (userSubscriptions) {
            isSubscribed = userSubscriptions.some(sgid => stringEquals(sgid, this.props.ruleGroupId, true));
        }

        const rules = StoresHub.ruleStore.getRules(this.props.ruleGroupId, this.props.workItemTypeName);
        const ruleGroup = StoresHub.ruleGroupStore.getItem(this.props.ruleGroupId, personalRulesEnabled, globalRulesEnabled);

        return {
            loading: loading,
            ruleGroup: ruleGroup,
            isSubscribed: isSubscribed,
            rules: rules,
            allRuleGroups: StoresHub.ruleGroupStore.getAll(personalRulesEnabled, globalRulesEnabled)
        } as IRuleGroupViewState;
    }

    @autobind
    private async _onHeaderLinkClick(e: React.MouseEvent<HTMLElement>) {
        if (!e.ctrlKey) {
            e.preventDefault();
            this._goBack();
        }
    }

    private _getHubCommands(): IPivotBarAction[] {
        const menuItems: IPivotBarAction[] = [
            {
                key: "new", name: "New Rule", important: true,
                disabled: this.state.loading || !this.state.ruleGroup,
                iconProps: { iconName: "Add", iconType: VssIconType.fabric }, onClick: () => this._showRulePanel(null)
            },
            {
                key: "refresh", name: "Refresh", important: true,
                disabled: this.state.loading || !this.state.ruleGroup,
                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric }, onClick: this._refresh
            }
        ];

        if (this.state.ruleGroup && !isPersonalOrGlobalRuleGroup(this.state.ruleGroup)) {
            menuItems.push({
                key: "edit", name: "Edit", important: true,
                disabled: this.state.loading || !this.state.ruleGroup,
                iconProps: { iconName: "Edit", iconType: VssIconType.fabric }, onClick: this._showEditGroupPanel
            },             {
                key: "delete", name: "Delete", important: true,
                disabled: this.state.loading || !this.state.ruleGroup,
                iconProps: { iconName: "Delete", iconType: VssIconType.fabric, style: {color: "#da0a00"} },
                onClick: this._deleteRuleGroup
            });
        }

        return menuItems;
    }

    private _getHubViewActions(): IPivotBarViewAction[] {
        if (!this.state.loading && !this.state.ruleGroup) {
            return null;
        }

        return [
            {
                key: "resultcount",
                name: this.state.loading ? "Loading..." : `${this.state.rules.length} rules`,
                important: true
            }
        ];
    }

    private _renderToastNotification() {
        if (this.state.targetRuleGroupId) {
            return (
                <div className="toast-notification">
                    <MessageBar
                        messageBarType={MessageBarType.success}
                        className="toast-message"
                        onDismiss={this._dismissToastNotification}
                    >
                        {`${this.state.isMovedToTargetGroup ? "Moved" : "Copied"} `}
                        <Link
                            href={getRuleGroupUrl(this.props.workItemTypeName, this.state.targetRuleGroupId)}
                            onClick={this._navigateToTargetRuleGroup}
                        >
                            here
                        </Link>
                    </MessageBar>
                </div>
            );
        }
        return null;
    }

    @autobind
    private _navigateToTargetRuleGroup(e: React.MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();
        this._dismissToastNotification();
        navigate({ witName: this.props.workItemTypeName, ruleGroup: this.state.targetRuleGroupId });
    }

    @autobind
    private _dismissToastNotification() {
        this.setState({targetRuleGroupId: null, isMovedToTargetGroup: false});
    }

    private _renderRules(): React.ReactNode {
        let contents: React.ReactNode;
        if (this.state.loading) {
            contents = <Loading />;
        }
        else if (!this.state.ruleGroup) {
            let message = "This rule group does not exist.";
            if (this.props.ruleGroupId === Constants.PersonalRuleGroupId) {
                message = `Personal rules have been disabled for "${this.props.workItemTypeName}" work item type. Please contact your administrator for more details.`;
            }
            else if (this.props.ruleGroupId === Constants.GlobalRuleGroupId) {
                message = `Global rules have been disabled for "${this.props.workItemTypeName}" work item type. Please contact your administrator for more details.`;
            }

            contents = <MessageBar className="rule-group-view-error" messageBarType={MessageBarType.error}>{message}</MessageBar>;
        }
        else if (this.state.rules.length === 0) {
            contents = (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No rules found"
                />
            );
        }
        else {
            contents = (
                <VssDetailsList
                    className="rule-list"
                    allocateSpaceForActionsButtonWhileHidden={true}
                    items={this.state.rules}
                    layoutMode={DetailsListLayoutMode.justified}
                    constrainMode={ConstrainMode.horizontalConstrained}
                    columns={this._getRulesGridColumns()}
                    actionsColumnKey="name"
                    selectionMode={SelectionMode.single}
                    getMenuItems={this._getRulesGridContextMenuItems}
                />
            );
        }

        return (
            <div className="rule-group-view-contents">
                {contents}
            </div>
        );
    }

    private _getRulesGridColumns(): IColumn[] {
        return [
            {
                key: "status",
                fieldName: "status",
                name: "Status",
                minWidth: 45,
                maxWidth: 45,
                isResizable: false,
                onRender: (rule: IRule) => {
                    return (
                        <div>
                            <TooltipHost
                                content={rule.disabled ? "This rule is disabled" : "This rule is enabled"}
                                delay={TooltipDelay.medium}
                                directionalHint={DirectionalHint.bottomCenter}
                            >
                                <VssIcon
                                    iconType={VssIconType.fabric}
                                    iconName={rule.disabled ? "CircleStopSolid" : "SkypeCheck"}
                                    className={css("rule-status", { disabled: rule.disabled })}
                                />
                            </TooltipHost>

                            {rule.triggers.length > 0 &&
                                <TooltipHost
                                    content="This rule has triggers"
                                    delay={TooltipDelay.medium}
                                    directionalHint={DirectionalHint.bottomCenter}
                                >
                                    <VssIcon
                                        className="rule-trigger-icon"
                                        iconType={VssIconType.fabric}
                                        iconName="LightningBolt"
                                    />
                                </TooltipHost>
                            }
                        </div>
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
                onRender: (rule: IRule) => {
                    return (
                        <TooltipHost
                            content={rule.description}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomCenter}
                        >
                            {rule.description}
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
                onRender: (rule: IRule) => {
                    return <IdentityView identityRef={rule.createdBy} />;
                }
            },
            {
                key: "lastupdatedby",
                fieldName: "lastupdatedby",
                name: "Last Updated By",
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                onRender: (rule: IRule) => {
                    return <IdentityView identityRef={rule.lastUpdatedBy} />;
                }
            }
        ];
    }

    @autobind
    private _renderNameColumn(rule: IRule): React.ReactNode {
        return (
            <div className="name-column-cell">
                <TooltipHost
                    content={rule.name}
                    delay={TooltipDelay.medium}
                    overflowMode={TooltipOverflowMode.Parent}
                    directionalHint={DirectionalHint.bottomCenter}
                >
                    <Link
                        className="name-link"
                        style={{borderLeftColor: `${rule.color}`}}
                        href={"#"}
                        onClick={delegate(this, this._onRowClick, rule)}
                    >
                        {rule.name}
                    </Link>
                </TooltipHost>
            </div>
        );
    }

    @autobind
    private _getRulesGridContextMenuItems(rule: IRule): IContextualMenuItem[] {
        return [
            {
                key: "edit", name: "Edit", iconProps: {iconName: "Edit"},
                onClick: () => {
                    this._showRulePanel(rule);
                }
            },
            {
                key: "delete", name: "Delete", iconProps: {iconName: "Delete", style: { color: "#da0a00" }},
                onClick: () => {
                    this._deleteRule(rule);
                }
            },
            {
                key: "move", name: "Move to", iconProps: {iconName: "Assign"},
                title: "Move the selected rule to a different rule group",
                subMenuProps: {
                    items: this._getMoveCopySubMenuItems(true, rule)
                }
            },
            {
                key: "copy", name: "Copy to", iconProps: {iconName: "Copy"},
                title: "Copy the selected rule in a different rule group",
                subMenuProps: {
                    items: this._getMoveCopySubMenuItems(false, rule)
                }
            }
        ];
    }

    private _getMoveCopySubMenuItems(isMove: boolean, rule: IRule) {
        return this.state.allRuleGroups
            .filter(rg => isMove ? !stringEquals(rg.id, this.state.ruleGroup.id, true) : true)
            .map(rg => ({
                key: rg.id,
                name: rg.name,
                title: rg.description,
                data: rule,
                onClick: isMove ? this._moveToRuleGroup : this._copyToRuleGroup
            }));
    }

    @autobind
    private async _moveToRuleGroup(_ev: React.MouseEvent<HTMLElement>, item: IContextualMenuItem) {
        const ruleModel: IRule = {...item.data};
        delete ruleModel.id;
        delete ruleModel.__etag;
        ruleModel.createdBy = getCurrentUser();
        ruleModel.lastUpdatedBy = getCurrentUser();
        await RuleActions.createRule(item.key, ruleModel);
        this.setState({targetRuleGroupId: item.key, isMovedToTargetGroup: true});

        // delete from current rule group
        RuleActions.deleteRule(this.props.ruleGroupId, item.data as IRule);
    }

    @autobind
    private async _copyToRuleGroup(_ev: React.MouseEvent<HTMLElement>, item: IContextualMenuItem) {
        const ruleModel: IRule = {...item.data};
        delete ruleModel.id;
        delete ruleModel.__etag;
        ruleModel.createdBy = getCurrentUser();
        ruleModel.lastUpdatedBy = getCurrentUser();
        const targetRuleGroupId = item.key;
        if (targetRuleGroupId === this.props.ruleGroupId) {
            ruleModel.name = `${ruleModel.name} - Copy`;
        }

        await RuleActions.createRule(targetRuleGroupId, ruleModel);
        this.setState({targetRuleGroupId: targetRuleGroupId, isMovedToTargetGroup: false});
    }

    private _onRowClick(e: React.MouseEvent<HTMLElement>, rule: IRule) {
        e.preventDefault();
        this._showRulePanel(rule);
    }

    @autobind
    private _toggleSubscription() {
        this.props.toggleSubscription(!this.state.isSubscribed, this.state.ruleGroup);
    }

    private async _deleteRule(rule: IRule) {
        const confirm = await confirmAction(true, "Are you sure you want to delete this rule?");
        if (confirm) {
            RuleActions.deleteRule(this.props.ruleGroupId, rule);
        }
    }

    @autobind
    private async _deleteRuleGroup() {
        if (!this.state.ruleGroup) {
            return;
        }

        const confirm = await confirmAction(true, "Are you sure you want to delete this shared rule group?");

        if (confirm) {
            RuleGroupActions.deleteRuleGroup(this.props.workItemTypeName, this.state.ruleGroup);
            this._goBack();
        }
    }

    @autobind
    private _showRulePanel(rule?: IRule) {
        this.setState({isRulePanelOpen: true, isGroupPanelOpen: false, selectedRuleForEdit: rule});
    }

    @autobind
    private _showEditGroupPanel() {
        this.setState({isRulePanelOpen: false, isGroupPanelOpen: true, selectedRuleForEdit: null});
    }

    @autobind
    private _hidePanel() {
        this.setState({isRulePanelOpen: false, isGroupPanelOpen: false, selectedRuleForEdit: null});
    }

    @autobind
    private _refresh() {
        this.props.refresh();
        RuleActions.refreshRules(this.state.ruleGroup.id);
    }

    @autobind
    private _goBack() {
        navigate({ witName: this.props.workItemTypeName });
    }
}
