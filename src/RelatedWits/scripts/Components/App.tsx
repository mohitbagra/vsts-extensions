import "./App.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { IdentityView } from "Library/Components/IdentityView";
import { InfoLabel } from "Library/Components/InfoLabel";
import { Loading } from "Library/Components/Loading";
import { getAsyncLoadedComponent } from "Library/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { WorkItemStateView } from "Library/Components/VSTS/WorkItemStateView";
import { WorkItemTitleView } from "Library/Components/VSTS/WorkItemTitleView";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { delegate } from "Library/Utilities/Core";
import * as ExtensionDataManager from "Library/Utilities/ExtensionDataManager";
import { parseUniquefiedIdentityName } from "Library/Utilities/Identity";
import { stringEquals } from "Library/Utilities/String";
import { getQueryUrl } from "Library/Utilities/UrlHelper";
import { getFormService, openWorkItemDialog } from "Library/Utilities/WorkItemFormHelpers";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import {
    CheckboxVisibility, ConstrainMode, DetailsListLayoutMode, IColumn
} from "OfficeFabric/DetailsList";
import { Fabric } from "OfficeFabric/Fabric";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Panel, PanelType } from "OfficeFabric/Panel";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { autobind } from "OfficeFabric/Utilities";
import { ISelection, Selection, SelectionMode } from "OfficeFabric/utilities/selection";
import { RelatedWorkItemsActions } from "RelatedWits/Actions/RelatedWorkItemsActions";
import * as SettingsPanel_Async from "RelatedWits/Components/SettingsPanel";
import { Constants, ISettings, WorkItemFieldNames } from "RelatedWits/Models";
import { StoresHub } from "RelatedWits/Stores/StoresHub";
import { WorkItem, WorkItemRelation, WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";
import {
    IWorkItemChangedArgs, IWorkItemLoadedArgs, IWorkItemNotificationListener
} from "TFS/WorkItemTracking/ExtensionContracts";
import { FilterBar, IFilterBar, KeywordFilterBarItem } from "VSSUI/FilterBar";
import { Hub } from "VSSUI/Hub";
import { HubHeader } from "VSSUI/HubHeader";
import { IPickListItem, PickListFilterBarItem } from "VSSUI/PickList";
import { PivotBarItem } from "VSSUI/PivotBar";
import { FILTER_CHANGE_EVENT, IFilterState } from "VSSUI/Utilities/Filter";
import { HubViewOptionKeys, HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { VssDetailsList } from "VSSUI/VssDetailsList";
import { VssIconType } from "VSSUI/VssIcon";
import { ZeroData } from "VSSUI/ZeroData";

const AsyncSettingsPanel = getAsyncLoadedComponent(
    ["scripts/SettingsPanel"],
    (m: typeof SettingsPanel_Async) => m.SettingsPanel,
    () => <Loading />);

export interface IRelatedWitsState extends IBaseFluxComponentState {
    isWorkItemLoaded?: boolean;
    isNew?: boolean;
    workItems: WorkItem[];
    settings?: ISettings;
    settingsPanelOpen?: boolean;
    relationsMap?: IDictionaryStringTo<boolean>;
    relationTypes?: WorkItemRelationType[];
}

export class RelatedWits extends BaseFluxComponent<IBaseFluxComponentProps, IRelatedWitsState> {
    private _hubViewState: IHubViewState;
    private _filterBar: IFilterBar;
    private _selection: ISelection;

    constructor(props: IBaseFluxComponentProps, context?: any) {
        super(props, context);

        this._hubViewState = new HubViewState();
        this._hubViewState.viewOptions.setViewOption(HubViewOptionKeys.fullScreen, true);
        this._selection = new Selection({
            getKey: (item: any) => item.id
        });
    }

    public componentDidMount() {
        super.componentDidMount();
        this._hubViewState.filter.subscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        document.addEventListener("keydown", this._focusFilterBar, false);

        VSS.register(VSS.getContribution().id, {
            onLoaded: (args: IWorkItemLoadedArgs) => {
                if (args.isNew) {
                    this.setState({isWorkItemLoaded: true, isNew: true, workItems: null, settingsPanelOpen: false});
                }
                else {
                    this.setState({isWorkItemLoaded: true, isNew: false, settingsPanelOpen: false});
                    this._refreshList();
                }
            },
            onUnloaded: (_args: IWorkItemChangedArgs) => {
                this.setState({isWorkItemLoaded: false, workItems: null, settingsPanelOpen: false});
            },
            onSaved: (_args: IWorkItemChangedArgs) => {
                this.setState({isNew: false, settingsPanelOpen: false});
                this._refreshList();
            },
            onRefreshed: (_args: IWorkItemChangedArgs) => {
                this.setState({settingsPanelOpen: false});
                this._refreshList();
            }
        } as IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        this._hubViewState.filter.unsubscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        document.removeEventListener("keydown", this._focusFilterBar);
        VSS.unregister(VSS.getContribution().id);
        RelatedWorkItemsActions.clean();
    }

    public render(): JSX.Element {
        if (!this.state.isWorkItemLoaded) {
            return null;
        }
        else {
            return (
                <Fabric className="fabric-container">
                    <Panel
                        isOpen={this.state.settingsPanelOpen}
                        type={PanelType.custom}
                        customWidth="450px"
                        isLightDismiss={true}
                        onDismiss={this._closeSettingsPanel}
                    >
                        <AsyncSettingsPanel
                            settings={this.state.settings}
                            onSave={this._saveSettings}
                        />
                    </Panel>
                    <Hub
                        className="related-wits-hub"
                        hideFullScreenToggle={true}
                        hubViewState={this._hubViewState}
                        commands={[
                            {
                                key: "refresh",
                                name: "Refresh",
                                disabled: this.state.workItems == null || this.state.isNew,
                                important: true,
                                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                                onClick: this._refreshList
                            },
                            {
                                key: "settings",
                                name: "Settings",
                                disabled: this.state.workItems == null || this.state.isNew,
                                important: true,
                                iconProps: { iconName: "Settings", iconType: VssIconType.fabric },
                                onClick: () => this.setState({settingsPanelOpen: !(this.state.settingsPanelOpen)})
                            }
                        ]}
                    >
                        <HubHeader title="Related work items" />
                        <FilterBar componentRef={this._resolveFilterBar}>
                            <KeywordFilterBarItem filterItemKey={"keyword"} />
                            {this._getPickListFilterBarItem("Work Item Type", WorkItemFieldNames.WorkItemType)}
                            {this._getPickListFilterBarItem("State", WorkItemFieldNames.State)}
                            {this._getPickListFilterBarItem("Assigned To", WorkItemFieldNames.AssignedTo)}
                            {this._getPickListFilterBarItem("Area Path", WorkItemFieldNames.AreaPath)}
                        </FilterBar>

                        <PivotBarItem
                            name={"Related Work items"}
                            itemKey={"list"}
                            viewActions={[
                                {
                                    key: "status",
                                    name: this.state.isNew ? "" : (!this.state.workItems ? "Loading..." : `${this.state.workItems.length} results`),
                                    important: true
                                }]}
                        >
                            {this._renderContent()}
                        </PivotBarItem>
                    </Hub>
                </Fabric>
            );
        }
    }

    protected initializeState(): void {
        this.state = {
            isWorkItemLoaded: false,
            workItems: null,
            settings: null
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.relatedWorkItemsStore];
    }

    protected getStoresState(): IRelatedWitsState {
        return {
            workItems: StoresHub.relatedWorkItemsStore.isLoading() ? null : StoresHub.relatedWorkItemsStore.getFilteredItems()
        };
    }

    private _renderContent(): React.ReactNode {
        if (this.state.isNew) {
            return <MessageBar messageBarType={MessageBarType.info}>Please save the workitem to get the list of related work items.</MessageBar>;
        }
        else if (!this.state.workItems) {
            return <Loading />;
        }
        else if (this.state.workItems.length === 0) {
            return (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No results found"
                />
            );
        }
        else {
            return (
                <div className="grid-container">
                    <VssDetailsList
                        items={this.state.workItems}
                        columns={this._getColumns()}
                        selectionPreservedOnEmptyClick={true}
                        layoutMode={DetailsListLayoutMode.justified}
                        constrainMode={ConstrainMode.horizontalConstrained}
                        onColumnHeaderClick={this._onSortChange}
                        checkboxVisibility={CheckboxVisibility.onHover}
                        selectionMode={SelectionMode.multiple}
                        className="work-item-grid"
                        selection={this._selection}
                        getKey={this._getWorkitemId}
                        onItemInvoked={this._onItemInvoked}
                        actionsColumnKey={WorkItemFieldNames.Title}
                        getMenuItems={this._getGridContextMenuItems}
                    />
                </div>
            );
        }
    }

    private _getColumns(): IColumn[] {
        return [
            {
                key: "linked",
                name: "Linked",
                fieldName: "linked",
                minWidth: 60,
                maxWidth: 100,
                isResizable: false,
                isSorted: false,
                isSortedDescending: false,
                onRender: this._renderStatusColumnCell
            },
            {
                key: WorkItemFieldNames.ID,
                fieldName: WorkItemFieldNames.ID,
                name: "ID",
                minWidth: 40,
                maxWidth: 70,
                isResizable: true,
                isSorted: (StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.sortKey) === WorkItemFieldNames.ID,
                isSortedDescending: !!(StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.isSortedDescending),
                onRender: (workItem: WorkItem) => {
                    const id = workItem.id.toString();
                    return (
                        <TooltipHost
                            content={id}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomLeftEdge}
                        >
                            {id}
                        </TooltipHost>
                    );
                }
            },
            {
                key: WorkItemFieldNames.Title,
                fieldName: WorkItemFieldNames.Title,
                name: "Title",
                minWidth: 300,
                maxWidth: 600,
                isResizable: true,
                isSorted: (StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.sortKey) === WorkItemFieldNames.Title,
                isSortedDescending: !!(StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.isSortedDescending),
                onRender: (workItem: WorkItem) => {
                    const title = workItem.fields[WorkItemFieldNames.Title];
                    return (
                        <WorkItemTitleView
                            className="item-grid-cell"
                            workItemId={workItem.id}
                            onClick={delegate(this, this._openWorkItemDialog, workItem)}
                            title={title}
                            workItemType={workItem.fields[WorkItemFieldNames.WorkItemType]}
                        />
                    );
                }
            },
            {
                key: WorkItemFieldNames.State,
                fieldName: WorkItemFieldNames.State,
                name: "State",
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                isSorted: (StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.sortKey) === WorkItemFieldNames.State,
                isSortedDescending: !!(StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.isSortedDescending),
                onRender: (workItem: WorkItem) => {
                    const state = workItem.fields[WorkItemFieldNames.State];
                    return (
                        <WorkItemStateView
                            className="item-grid-cell"
                            state={state}
                            workItemType={workItem.fields[WorkItemFieldNames.WorkItemType]}
                        />
                    );
                }
            },
            {
                key: WorkItemFieldNames.AssignedTo,
                fieldName: WorkItemFieldNames.AssignedTo,
                name: "Assigned To",
                minWidth: 150,
                maxWidth: 250,
                isResizable: true,
                isSorted: (StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.sortKey) === WorkItemFieldNames.AssignedTo,
                isSortedDescending: !!(StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.isSortedDescending),
                onRender: (workItem: WorkItem) => {
                    const assignedTo = workItem.fields[WorkItemFieldNames.AssignedTo] || "";
                    return <IdentityView identityDistinctName={assignedTo} />;
                }
            },
            {
                key: WorkItemFieldNames.AreaPath,
                fieldName: WorkItemFieldNames.AreaPath,
                name: "Area path",
                minWidth: 250,
                maxWidth: 400,
                isResizable: true,
                isSorted: (StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.sortKey) === WorkItemFieldNames.AreaPath,
                isSortedDescending: !!(StoresHub.relatedWorkItemsStore.sortState && StoresHub.relatedWorkItemsStore.sortState.isSortedDescending),
                onRender: (workItem: WorkItem) => {
                    const area = workItem.fields[WorkItemFieldNames.AreaPath];
                    return (
                        <TooltipHost
                            content={area}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomLeftEdge}
                        >
                            {area}
                        </TooltipHost>
                    );
                }
            }
        ];
    }

    @autobind
    private _closeSettingsPanel() {
        this.setState({settingsPanelOpen: false});
    }

    @autobind
    private _saveSettings(settings: ISettings) {
        this.setState({settings: settings, settingsPanelOpen: false});
        this._refreshList();
    }

    @autobind
    private _getWorkitemId(workItem: WorkItem): string {
        return workItem.id.toString();
    }

    @autobind
    private async _onItemInvoked(workItem: WorkItem) {
        this._openWorkItemDialog(null, workItem);
    }

    @autobind
    private async _openWorkItemDialog(e: React.MouseEvent<HTMLElement>, workItem: WorkItem) {
        const updatedWorkItem = await openWorkItemDialog(e, workItem);
        RelatedWorkItemsActions.updateWorkItemInStore(updatedWorkItem);
    }

    private _getPickListFilterBarItem(
        placeholder: string,
        filterItemKey: WorkItemFieldNames
    ): JSX.Element {
        return (
            <PickListFilterBarItem
                key={filterItemKey}
                filterItemKey={filterItemKey}
                selectionMode={SelectionMode.multiple}
                getPickListItems={delegate(this, this._getPicklistItems, filterItemKey)}
                getListItem={delegate(this, this._getListItem, filterItemKey)}
                placeholder={placeholder}
                noItemsText="No items"
                showSelectAll={false}
                isSearchable={true}
                searchTextPlaceholder="Search"
                minItemsForSearchBox={4}
                indicators={[
                    {
                        getItemIndicator: ((value: string) => {
                            if (!value) {
                                return null;
                            }
                            return { title: `${StoresHub.relatedWorkItemsStore.propertyMap[filterItemKey][value]}` };
                        })
                    }
                ]}
            />
        );
    }

    @autobind
    private _getPicklistItems(fieldName: WorkItemFieldNames): string[] {
        return Object.keys(StoresHub.relatedWorkItemsStore.propertyMap[fieldName]);
    }

    @autobind
    private _getListItem(key: string, fieldName: WorkItemFieldNames): IPickListItem {
        if (fieldName === WorkItemFieldNames.AssignedTo) {
            const identity = parseUniquefiedIdentityName(key);
            return {
                name: identity.displayName,
                key: key,
                iconProps: identity.imageUrl ? {
                    iconType: VssIconType.image,
                    imageProps: {
                        src: identity.imageUrl
                    }
                } : null
            };
        }
        else if (fieldName === WorkItemFieldNames.AreaPath) {
            return {
                name: key.substr(key.lastIndexOf("\\") + 1),
                key: key
            };
        }
        else {
            return {
                name: key,
                key: key
            };
        }
    }

    @autobind
    private _renderStatusColumnCell(item: WorkItem): JSX.Element {
        if (this.state.relationTypes && this.state.relationsMap) {
            const availableLinks: string[] = [];
            this.state.relationTypes.forEach(r => {
                if (this.state.relationsMap[`${item.url}_${r.referenceName}`]) {
                    availableLinks.push(r.name);
                }
            });

            if (availableLinks.length > 0) {
                return (
                    <InfoLabel
                        className="linked-cell"
                        label="Linked"
                        info={`Linked to this workitem as ${availableLinks.join("; ")}`}
                    />
                );
            }
            else {
                return (
                    <InfoLabel
                        label="Not linked"
                        className="unlinked-cell"
                        info="This workitem is not linked to the current work item. You can add a link to this workitem by right clicking on the row"
                    />
                );
            }
        }
        return null;
    }

    @autobind
    private _getGridContextMenuItems(item: WorkItem): IContextualMenuItem[] {
        let selectedItems = this._selection.getSelection() as WorkItem[];
        if (!selectedItems || selectedItems.length === 0) {
            selectedItems = [item];
        }

        return [
            {
                key: "openinquery", name: "Open selected items in Queries", iconProps: {iconName: "ReplyMirrored"},
                href: getQueryUrl(selectedItems, [
                    WorkItemFieldNames.ID,
                    WorkItemFieldNames.Title,
                    WorkItemFieldNames.State,
                    WorkItemFieldNames.AssignedTo,
                    WorkItemFieldNames.AreaPath
                ]),
                target: "_blank"
            },
            {
                key: "add-link", name: "Add Link", title: "Add as a link to the current workitem", iconProps: {iconName: "Link"},
                items: this.state.relationTypes.filter(r => r.name != null && r.name.trim() !== "").map(relationType => {
                    return {
                        key: relationType.referenceName,
                        name: relationType.name,
                        onClick: async () => {
                            const workItemFormService = await getFormService();
                            const workItemRelations = selectedItems.filter(wi => !this.state.relationsMap[`${wi.url}_${relationType.referenceName}`]).map(w => {
                                return {
                                    rel: relationType.referenceName,
                                    attributes: {
                                        isLocked: false
                                    },
                                    url: w.url
                                } as WorkItemRelation;
                            });

                            if (workItemRelations) {
                                workItemFormService.addWorkItemRelations(workItemRelations);
                            }
                        }
                    };
                })
            }
        ];
    }

    @autobind
    private async _refreshList(): Promise<void> {
        if (!this.state.settings) {
            await this._initializeSettings();
        }

        if (!this.state.relationTypes) {
            this._initializeWorkItemRelationTypes();
        }

        this._initializeLinksData();

        const query = await this._createQuery(this.state.settings.fields, this.state.settings.sortByField);
        RelatedWorkItemsActions.refresh(query, this.state.settings.top);
    }

    private async _createQuery(fieldsToSeek: string[], sortByField: string): Promise<{project: string, wiql: string}> {
        const workItemFormService = await getFormService();
        const fieldValues = await workItemFormService.getFieldValues(fieldsToSeek, true);
        const witId = await workItemFormService.getId();
        const project = await workItemFormService.getFieldValue("System.TeamProject") as string;

        // Generate fields to retrieve part
        const fieldsToRetrieveString = Constants.DEFAULT_FIELDS_TO_RETRIEVE.map(fieldRefName => `[${fieldRefName}]`).join(",");

        // Generate fields to seek part
        const fieldsToSeekString = fieldsToSeek.map(fieldRefName => {
            const fieldValue = fieldValues[fieldRefName] == null ? "" : fieldValues[fieldRefName];
            if (stringEquals(fieldRefName, "System.Tags", true)) {
                if (fieldValue) {
                    const tagStr = fieldValue.toString().split(";").map(v => {
                        return `[System.Tags] CONTAINS '${v}'`;
                    }).join(" OR ");

                    return `(${tagStr})`;
                }
            }
            else if (Constants.ExcludedFields.indexOf(fieldRefName) === -1) {
                if (fieldValue !== "" && fieldValue != null) {
                    if (stringEquals(typeof(fieldValue), "string", true)) {
                        return `[${fieldRefName}] = '${fieldValue}'`;
                    }
                    else {
                        return `[${fieldRefName}] = ${fieldValue}`;
                    }
                }
            }

            return null;
        }).filter(e => e != null).join(" AND ");

        const fieldsToSeekPredicate = fieldsToSeekString ? `AND ${fieldsToSeekString}` : "";
        const wiql = `SELECT ${fieldsToRetrieveString} FROM WorkItems
         where [System.TeamProject] = '${project}' AND [System.ID] <> ${witId}
         ${fieldsToSeekPredicate} order by [${sortByField}] desc`;

        return {
            project: project,
            wiql: wiql
        };
    }

    private async _initializeSettings() {
        const workItemFormService = await getFormService();
        const workItemType = await workItemFormService.getFieldValue("System.WorkItemType") as string;
        const project = await workItemFormService.getFieldValue("System.TeamProject") as string;
        const settings = await ExtensionDataManager.readSetting<ISettings>(`${Constants.StorageKey}_${project}_${workItemType}`, Constants.DEFAULT_SETTINGS, true);
        if (settings.top == null || settings.top <= 0) {
            settings.top = Constants.DEFAULT_RESULT_SIZE;
        }

        this.setState({settings: settings});
    }

    private async _initializeWorkItemRelationTypes() {
        const workItemFormService = await getFormService();
        const relationTypes = await workItemFormService.getWorkItemRelationTypes();
        this.setState({relationTypes: relationTypes});
    }

    private async _initializeLinksData() {
        const workItemFormService = await getFormService();
        const relations = await workItemFormService.getWorkItemRelations();

        const relationsMap = {};
        relations.forEach(relation => {
            relationsMap[`${relation.url}_${relation.rel}`] = true;
        });

        this.setState({relationsMap: relationsMap});
    }

    @autobind
    private _onFilterChange(filterState: IFilterState) {
        RelatedWorkItemsActions.applyFilter(filterState);
    }

    @autobind
    private _onSortChange(_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) {
        if (column.key !== "linked") {
            RelatedWorkItemsActions.applySort({
                sortKey: column.key as WorkItemFieldNames,
                isSortedDescending: !column.isSortedDescending
            });
        }
    }

    @autobind
    private _focusFilterBar(ev: KeyboardEvent) {
        if (this._filterBar && ev.ctrlKey && ev.shiftKey && stringEquals(ev.key, "f", true)) {
            this._filterBar.focus();
        }
    }

    @autobind
    private _resolveFilterBar(filterBar: IFilterBar) {
        this._filterBar = filterBar;
    }
}

export function init() {
    initializeIcons();

    const container = document.getElementById("ext-container");
    ReactDOM.render(<RelatedWits />, container);
}
