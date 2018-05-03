import "./AllBugBashes.scss";

import * as React from "react";

import { BugBashActions } from "BugBashPro/Actions/BugBashActions";
import * as SettingsPanel_Async from "BugBashPro/Components/SettingsPanel";
import {
    BugBashFieldNames, DirectoryPagePivotKeys, ErrorKeys, UrlActions
} from "BugBashPro/Constants";
import { getBugBashUrl } from "BugBashPro/Helpers";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import * as format from "date-fns/format";
import { Loading } from "Library/Components/Loading";
import { getAsyncLoadedComponent } from "Library/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ErrorMessageActions } from "Library/Flux/Actions/ErrorMessageActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { confirmAction, delegate } from "Library/Utilities/Core";
import { defaultDateComparer } from "Library/Utilities/Date";
import {
    readLocalSetting, WebSettingsScope, writeLocalSetting
} from "Library/Utilities/LocalSettingsService";
import { navigate } from "Library/Utilities/Navigation";
import { stringEquals } from "Library/Utilities/String";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import { ConstrainMode, DetailsListLayoutMode, IColumn } from "OfficeFabric/DetailsList";
import { Link } from "OfficeFabric/Link";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Panel, PanelType } from "OfficeFabric/Panel";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { SelectionMode } from "OfficeFabric/utilities/selection";
import { FilterBar, IFilterBar, KeywordFilterBarItem } from "VSSUI/FilterBar";
import { Hub } from "VSSUI/Hub";
import { HubHeader, HubTextTile, HubTileRegion } from "VSSUI/HubHeader";
import { PivotBarItem } from "VSSUI/PivotBar";
import { FILTER_CHANGE_EVENT, IFilterState } from "VSSUI/Utilities/Filter";
import { HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { VssDetailsList } from "VSSUI/VssDetailsList";
import { VssIconType } from "VSSUI/VssIcon";
import { ZeroData } from "VSSUI/ZeroData";

interface IAllBugBashesViewState extends IBaseFluxComponentState {
    allBugBashes: BugBash[];
    pastBugBashes: BugBash[];
    ongoingBugBashes: BugBash[];
    upcomingBugBashes: BugBash[];
    settingsPanelOpen: boolean;
    error?: string;
}

const AsyncSettingsPanel = getAsyncLoadedComponent(
    ["scripts/SettingsPanel"],
    (m: typeof SettingsPanel_Async) => m.SettingsPanel,
    () => <Loading />);

export class AllBugBashesView extends BaseFluxComponent<IBaseFluxComponentProps, IAllBugBashesViewState> {
    private _hubViewState: IHubViewState;
    private _filterBar: IFilterBar;

    constructor(props: IBaseFluxComponentProps, context?: any) {
        super(props, context);

        this._hubViewState = new HubViewState();
        this._hubViewState.selectedPivot.value = readLocalSetting("directorypivotkey", WebSettingsScope.User, DirectoryPagePivotKeys.Ongoing) as DirectoryPagePivotKeys;
    }

    public componentDidMount() {
        super.componentDidMount();

        BugBashActions.initializeAllBugBashes();
        this._hubViewState.selectedPivot.subscribe(this._onPivotChanged);
        this._hubViewState.filter.subscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        document.addEventListener("keydown", this._focusFilterBar, false);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        this._dismissErrorMessage();
        BugBashActions.clearSortAndFilter();
        this._hubViewState.selectedPivot.unsubscribe(this._onPivotChanged);
        this._hubViewState.filter.unsubscribe(this._onFilterChange, FILTER_CHANGE_EVENT);
        document.removeEventListener("keydown", this._focusFilterBar);
    }

    public render(): JSX.Element {
        return (
            <div className="all-view">
                { this.state.error &&
                    <MessageBar
                        className="bugbash-error"
                        messageBarType={MessageBarType.error}
                        onDismiss={this._dismissErrorMessage}
                    >
                        {this.state.error}
                    </MessageBar>
                }
                <Hub
                    className="bugbashes-hub"
                    hideFullScreenToggle={true}
                    hubViewState={this._hubViewState}
                    commands={[
                        {
                            key: "new", name: "New Bug Bash", important: true,
                            iconProps: { iconName: "Add", iconType: VssIconType.fabric },
                            onClick: () => navigate({ view: UrlActions.ACTION_EDIT})
                        },
                        {
                            key: "refresh", name: "Refresh", important: true,
                            iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                            onClick: () => BugBashActions.refreshAllBugBashes()
                        },
                        {
                            key: "settings", name: "Settings", important: true,
                            iconProps: { iconName: "Settings", iconType: VssIconType.fabric },
                            onClick: () => this.setState({settingsPanelOpen: !(this.state.settingsPanelOpen)} as IAllBugBashesViewState)
                        }
                    ]}
                >
                    <HubHeader title="Bug Bashes" />
                    <HubTileRegion>
                        <HubTextTile
                            text={this.state.loading ? "Loading..." : `${this.state.allBugBashes.length} bug bashes`}
                            secondaryText={this.state.loading
                                ? ""
                                : `${this.state.ongoingBugBashes.length} Ongoing, ${this.state.upcomingBugBashes.length} Upcoming, ${this.state.pastBugBashes.length} Ended`}
                        />
                    </HubTileRegion>
                    <FilterBar componentRef={this._resolveFilterBar}>
                        <KeywordFilterBarItem filterItemKey={BugBashFieldNames.Title} />
                    </FilterBar>
                    <PivotBarItem
                        name={"Ongoing"}
                        itemKey={DirectoryPagePivotKeys.Ongoing}
                        badgeCount={this.state.ongoingBugBashes ? this.state.ongoingBugBashes.length : null}
                    >
                        {this._getContents(DirectoryPagePivotKeys.Ongoing)}
                    </PivotBarItem>
                    <PivotBarItem
                        name={"Upcoming"}
                        itemKey={DirectoryPagePivotKeys.Upcoming}
                        badgeCount={this.state.upcomingBugBashes ? this.state.upcomingBugBashes.length : null}
                    >
                        {this._getContents(DirectoryPagePivotKeys.Upcoming)}
                    </PivotBarItem>
                    <PivotBarItem
                        name={"Past"}
                        itemKey={DirectoryPagePivotKeys.Past}
                        badgeCount={this.state.pastBugBashes ? this.state.pastBugBashes.length : null}
                    >
                        {this._getContents(DirectoryPagePivotKeys.Past)}
                    </PivotBarItem>
                </Hub>

                {
                    this.state.settingsPanelOpen &&
                    <Panel
                        isOpen={true}
                        type={PanelType.smallFixedFar}
                        isLightDismiss={true}
                        onDismiss={this._dismissSettingsPanel}
                    >

                        <AsyncSettingsPanel />
                    </Panel>
                }
            </div>
        );
    }

    protected getStoresState(): IAllBugBashesViewState {
        const allBugBashes = StoresHub.bugBashStore.getFilteredItems() || [];
        const currentTime = new Date();

        return {
            allBugBashes: allBugBashes,
            pastBugBashes: this._getPastBugBashes(allBugBashes, currentTime),
            ongoingBugBashes: this._getOngoingBugBashes(allBugBashes, currentTime),
            upcomingBugBashes: this._getUpcomingBugBashes(allBugBashes, currentTime),
            loading: StoresHub.bugBashStore.isLoading(),
            error: StoresHub.errorMessageStore.getItem(ErrorKeys.DirectoryPageError)
        } as IAllBugBashesViewState;
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashStore, StoresHub.errorMessageStore];
    }

    protected initializeState() {
        this.state = {
            allBugBashes: [],
            pastBugBashes: [],
            ongoingBugBashes: [],
            upcomingBugBashes: [],
            loading: true,
            settingsPanelOpen: false,
            error: StoresHub.errorMessageStore.getItem(ErrorKeys.DirectoryPageError)
        };
    }

    private _getContents(key: string): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        let bugBashes: BugBash[];
        let missingItemsMsg = "";

        if (key === DirectoryPagePivotKeys.Past) {
            bugBashes = this.state.pastBugBashes;
            missingItemsMsg = "No past bug bashes";
        }
        else if (key === DirectoryPagePivotKeys.Ongoing) {
            bugBashes = this.state.ongoingBugBashes;
            missingItemsMsg = "No ongoing bug bashes";
        }
        else {
            bugBashes = this.state.upcomingBugBashes;
            missingItemsMsg = "No upcoming bug bashes";
        }

        if (bugBashes.length === 0) {
            return (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText={missingItemsMsg}
                />
            );
        }

        return (
            <div className="grid-container">
                <VssDetailsList
                    className="bugbashes-grid"
                    items={bugBashes}
                    layoutMode={DetailsListLayoutMode.justified}
                    constrainMode={ConstrainMode.horizontalConstrained}
                    onColumnHeaderClick={this._onSortChange}
                    columns={this._getGridColumns()}
                    actionsColumnKey="title"
                    selectionMode={SelectionMode.single}
                    getMenuItems={this._getGridContextMenuItems}
                />
            </div>
        );
    }

    private _getGridColumns(): IColumn[] {
        return [
            {
                key: BugBashFieldNames.Title,
                fieldName: BugBashFieldNames.Title,
                name: "Title",
                minWidth: 300,
                maxWidth: Infinity,
                isSorted: (StoresHub.bugBashStore.sortState && StoresHub.bugBashStore.sortState.sortKey) === BugBashFieldNames.Title,
                isSortedDescending: !!(StoresHub.bugBashStore.sortState && StoresHub.bugBashStore.sortState.isSortedDescending),
                onRender: (bugBash: BugBash) => {
                    const title = bugBash.getFieldValue<string>(BugBashFieldNames.Title, true);

                    return (
                        <div className="overflow-ellipsis title-link">
                            <TooltipHost
                                content={title}
                                delay={TooltipDelay.medium}
                                overflowMode={TooltipOverflowMode.Parent}
                                directionalHint={DirectionalHint.bottomLeftEdge}
                            >
                                <Link
                                    href={getBugBashUrl(bugBash.id, UrlActions.ACTION_RESULTS)}
                                    onClick={delegate(this, this._onRowClick, bugBash)}
                                >
                                    {title}
                                </Link>
                            </TooltipHost>
                        </div>
                    );
                }
            },
            {
                key: BugBashFieldNames.StartTime,
                fieldName: BugBashFieldNames.StartTime,
                name: "Start Date",
                minWidth: 400,
                maxWidth: 600,
                isSorted: (StoresHub.bugBashStore.sortState && StoresHub.bugBashStore.sortState.sortKey) === BugBashFieldNames.StartTime,
                isSortedDescending: !!(StoresHub.bugBashStore.sortState && StoresHub.bugBashStore.sortState.isSortedDescending),
                onRender: (bugBash: BugBash) => {
                    const startTime = bugBash.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
                    const label = startTime ? format(startTime, "dddd, MMMM DD, YYYY") : "N/A";
                    return (
                        <TooltipHost
                            content={label}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomLeftEdge}
                        >
                            {label}
                        </TooltipHost>
                    );
                }
            },
            {
                key: BugBashFieldNames.EndTime,
                fieldName: BugBashFieldNames.EndTime,
                name: "End Date",
                minWidth: 400,
                maxWidth: 600,
                isSorted: (StoresHub.bugBashStore.sortState && StoresHub.bugBashStore.sortState.sortKey) === BugBashFieldNames.EndTime,
                isSortedDescending: !!(StoresHub.bugBashStore.sortState && StoresHub.bugBashStore.sortState.isSortedDescending),
                onRender: (bugBash: BugBash) => {
                    const endTime = bugBash.getFieldValue<Date>(BugBashFieldNames.EndTime, true);
                    const label = endTime ? format(endTime, "dddd, MMMM DD, YYYY") : "N/A";
                    return (
                        <TooltipHost
                            content={label}
                            delay={TooltipDelay.medium}
                            overflowMode={TooltipOverflowMode.Parent}
                            directionalHint={DirectionalHint.bottomLeftEdge}
                        >
                            {label}
                        </TooltipHost>
                    );
                }
            }
        ];
    }

    private _onRowClick(e: React.MouseEvent<HTMLElement>, bugBash: BugBash) {
        if (!e.ctrlKey) {
            e.preventDefault();
            navigate({ view: UrlActions.ACTION_RESULTS, id: bugBash.id});
        }
    }

    private _getPastBugBashes(list: BugBash[], currentTime: Date): BugBash[] {
        const pastBugBashes = list.filter((bugBash: BugBash) => {
            const endTime = bugBash.getFieldValue<Date>(BugBashFieldNames.EndTime, true);
            return endTime && defaultDateComparer(endTime, currentTime) < 0;
        });

        if (!StoresHub.bugBashStore.sortState) {
            pastBugBashes.sort((b1: BugBash, b2: BugBash) => {
                const endTime1 = b1.getFieldValue<Date>(BugBashFieldNames.EndTime, true);
                const endTime2 = b2.getFieldValue<Date>(BugBashFieldNames.EndTime, true);
                return -1 * defaultDateComparer(endTime1, endTime2); // most latest past bug bash first
            });
        }
        return pastBugBashes;
    }

    private _getOngoingBugBashes(list: BugBash[], currentTime: Date): BugBash[] {
        const ongoingBugBashes = list.filter((bugBash: BugBash) => {
            const startTime = bugBash.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
            const endTime = bugBash.getFieldValue<Date>(BugBashFieldNames.EndTime, true);

            if (!startTime && !endTime) {
                return true;
            }
            else if  (!startTime && endTime) {
                return defaultDateComparer(endTime, currentTime) >= 0;
            }
            else if (startTime && !endTime) {
                return defaultDateComparer(startTime, currentTime) <= 0;
            }
            else {
                return defaultDateComparer(startTime, currentTime) <= 0 && defaultDateComparer(endTime, currentTime) >= 0;
            }
        });

        if (!StoresHub.bugBashStore.sortState) {
            ongoingBugBashes.sort((b1: BugBash, b2: BugBash) => {
                const startTime1 = b1.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
                const startTime2 = b2.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
                return -1 * defaultDateComparer(startTime1, startTime2);
            });
        }
        return ongoingBugBashes;
    }

    private _getUpcomingBugBashes(list: BugBash[], currentTime: Date): BugBash[] {
        const upcomingBugBashes = list.filter((bugBash: BugBash) => {
            const startTime = bugBash.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
            return startTime && defaultDateComparer(startTime, currentTime) > 0;
        });

        if (!StoresHub.bugBashStore.sortState) {
            upcomingBugBashes.sort((b1: BugBash, b2: BugBash) => {
                const startTime1 = b1.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
                const startTime2 = b2.getFieldValue<Date>(BugBashFieldNames.StartTime, true);
                return defaultDateComparer(startTime1, startTime2);
            });
        }
        return upcomingBugBashes;
    }

    private _getGridContextMenuItems = (bugBash: BugBash): IContextualMenuItem[] => {
        return [
            {
                key: "open", name: "View results", iconProps: {iconName: "ShowResults"},
                onClick: () => {
                    navigate({ view: UrlActions.ACTION_RESULTS, id: bugBash.id});
                }
            },
            {
                key: "edit", name: "Edit", iconProps: {iconName: "Edit"},
                onClick: () => {
                    navigate({ view: UrlActions.ACTION_EDIT, id: bugBash.id});
                }
            },
            {
                key: "delete", name: "Delete", iconProps: {iconName: "Cancel", style: { color: "#da0a00", fontWeight: "bold" }},
                onClick: async () => {
                    const confirm = await confirmAction(true, "Are you sure you want to delete this bug bash instance?");
                    if (confirm) {
                        bugBash.delete();
                    }
                }
            }
        ];
    }

    private _dismissSettingsPanel = () => {
        this.setState({settingsPanelOpen: false} as IAllBugBashesViewState);
    }

    private _dismissErrorMessage = () => {
        ErrorMessageActions.dismissErrorMessage(ErrorKeys.DirectoryPageError);
    }

    private _onPivotChanged = (pivotKey: string) => {
        if (pivotKey) {
            writeLocalSetting("directorypivotkey", pivotKey, WebSettingsScope.User);
        }
    }

    private _onFilterChange = (filterState: IFilterState) => {
        BugBashActions.applyFilter(filterState);
    }

    private _onSortChange = (_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
        BugBashActions.applySort({
            sortKey: column.key as BugBashFieldNames,
            isSortedDescending: !column.isSortedDescending
        });
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
