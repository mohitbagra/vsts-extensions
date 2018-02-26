import "./BugBashResults.scss";

import * as React from "react";

import { BugBashClientActionsHub } from "BugBashPro/Actions/ActionsHub";
import { BugBashItemActions } from "BugBashPro/Actions/BugBashItemActions";
import { BugBashItemEditor } from "BugBashPro/Components/BugBashItemEditor";
import {
    BugBashFieldNames, BugBashItemFieldNames, BugBashViewActions, UrlActions, WorkItemFieldNames
} from "BugBashPro/Constants";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { BugBashItem } from "BugBashPro/ViewModels/BugBashItem";
import { Loading } from "Library/Components/Loading";
import { SplitterLayout } from "Library/Components/SplitterLayout";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { TeamActions } from "Library/Flux/Actions/TeamActions";
import { WorkItemActions } from "Library/Flux/Actions/WorkItemActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { delay, DelayedFunction } from "Library/Utilities/Core";
import {
    readLocalSetting, WebSettingsScope, writeLocalSetting
} from "Library/Utilities/LocalSettingsService";
import { getQueryUrl, navigate } from "Library/Utilities/Navigation";
import { openWorkItemDialog } from "Library/Utilities/WorkItemFormHelpers";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import {
    CheckboxVisibility, ConstrainMode, DetailsListLayoutMode, IColumn
} from "OfficeFabric/DetailsList";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { autobind } from "OfficeFabric/Utilities";
import { ISelection, Selection, SelectionMode } from "OfficeFabric/utilities/selection";
import { VssDetailsList } from "VSSUI/VssDetailsList";
import { ZeroData } from "VSSUI/ZeroData";

interface IBugBashResultsState extends IBaseFluxComponentState {
    bugBashItems: BugBashItem[];
    pendingBugBashItems: BugBashItem[];
    rejectedBugBashItems: BugBashItem[];
    acceptedBugBashItems: BugBashItem[];
    selectedBugBashItem?: BugBashItem;
    gridKeyCounter: number;
}

interface IBugBashResultsProps extends IBaseFluxComponentProps {
    bugBash: BugBash;
    bugBashItemId?: string;
    view?: string;
}

export class BugBashResults extends BaseFluxComponent<IBugBashResultsProps, IBugBashResultsState> {
    private _itemInvokedDelayedFunction: DelayedFunction;
    private _selection: ISelection;

    constructor(props: IBugBashResultsProps, context?: any) {
        super(props, context);
        this._selection = new Selection({
            getKey: (item: any) => item.id,
            onSelectionChanged: () => {
                this._onBugBashItemSelectionChanged(this._selection.getSelection() as BugBashItem[]);
            }
        });
    }

    public componentDidMount() {
        super.componentDidMount();

        BugBashClientActionsHub.SelectedBugBashItemChanged.addListener(this._setSelectedItem);

        TeamActions.initializeTeams();
        BugBashItemActions.initializeItems(this.props.bugBash.id);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        if (this._itemInvokedDelayedFunction) {
            this._itemInvokedDelayedFunction.cancel();
        }
        BugBashClientActionsHub.SelectedBugBashItemChanged.removeListener(this._setSelectedItem);
    }

    public componentWillReceiveProps(nextProps: Readonly<IBugBashResultsProps>) {
        if (this.props.bugBash.id !== nextProps.bugBash.id) {
            if (StoresHub.bugBashItemStore.isLoaded(nextProps.bugBash.id)) {
                const bugBashItems = StoresHub.bugBashItemStore.getFilteredItems();
                this.setState({
                    bugBashItems: bugBashItems,
                    pendingBugBashItems: (bugBashItems || []).filter(item => !item.isAccepted && !item.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)),
                    rejectedBugBashItems: (bugBashItems || []).filter(item => !item.isAccepted && item.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)),
                    acceptedBugBashItems: (bugBashItems || []).filter(item => item.isAccepted),
                    loading: false,
                    bugBashItemEditorError: null,
                    selectedBugBashItem: StoresHub.bugBashItemStore.getNewBugBashItem(),
                    gridKeyCounter: this.state.gridKeyCounter + 1
                } as IBugBashResultsState);
            }
            else {
                this.setState({
                    loading: true,
                    bugBashItems: null,
                    pendingBugBashItems: null,
                    rejectedBugBashItems: null,
                    acceptedBugBashItems: null,
                    bugBashItemEditorError: null,
                    selectedBugBashItem: StoresHub.bugBashItemStore.getNewBugBashItem(),
                    gridKeyCounter: this.state.gridKeyCounter + 1
                } as IBugBashResultsState);

                BugBashItemActions.initializeItems(nextProps.bugBash.id);
            }
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }
        return (
            <div className="bugbash-results">
                {this._renderContents()}
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            bugBashItems: null,
            pendingBugBashItems: null,
            rejectedBugBashItems: null,
            acceptedBugBashItems: null,
            selectedBugBashItem: StoresHub.bugBashItemStore.getNewBugBashItem(),
            loading: true,
            gridKeyCounter: 0
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashItemStore, StoresHub.teamStore, StoresHub.workItemStore];
    }

    protected getStoresState(): IBugBashResultsState {
        const bugBashItems = StoresHub.bugBashItemStore.getFilteredItems();

        let selectedBugBashItem = null;
        if (this.state.selectedBugBashItem && !this.state.selectedBugBashItem.isNew()) {
            selectedBugBashItem = StoresHub.bugBashItemStore.getItem(this.state.selectedBugBashItem.id);
        }
        if (selectedBugBashItem == null) {
            selectedBugBashItem = StoresHub.bugBashItemStore.getNewBugBashItem();
        }

        return {
            bugBashItems: bugBashItems,
            pendingBugBashItems: (bugBashItems || []).filter(item => !item.isAccepted && !item.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)),
            rejectedBugBashItems: (bugBashItems || []).filter(item => !item.isAccepted && item.getFieldValue<boolean>(BugBashItemFieldNames.Rejected, true)),
            acceptedBugBashItems: (bugBashItems || []).filter(item => item.isAccepted),
            selectedBugBashItem: selectedBugBashItem,
            loading: StoresHub.teamStore.isLoading() || StoresHub.bugBashItemStore.isLoading()
        } as IBugBashResultsState;
    }

    private _renderContents(): JSX.Element {
        if (this.state.bugBashItems && StoresHub.teamStore.isLoaded()) {
            if (!this.props.bugBashItemId) {
                return (
                    <SplitterLayout
                        primaryIndex={0}
                        primaryMinSize={500}
                        secondaryMinSize={400}
                        secondaryInitialSize={parseInt(readLocalSetting("itemeditorinitialsize", WebSettingsScope.User, "500"), 10)}
                        onChange={this._onSplitterChange}
                    >
                        {this._renderGrid()}
                        <BugBashItemEditor bugBashId={this.props.bugBash.id} bugBashItem={this.state.selectedBugBashItem} />
                    </SplitterLayout>
                );
            }
            else {
                const bugBashItem = StoresHub.bugBashItemStore.getItem(this.props.bugBashItemId);
                if (bugBashItem) {
                    return <BugBashItemEditor bugBashId={this.props.bugBash.id} bugBashItem={bugBashItem} />;
                }
                else {
                    return <MessageBar messageBarType={MessageBarType.error}>This bug bash item does not exist</MessageBar>;
                }
            }
        }
    }

    @autobind
    private _onSplitterChange(itemEditorSize: number) {
        const evt = document.createEvent("UIEvents");
        evt.initUIEvent("resize", true, false, window, 0);
        window.dispatchEvent(evt);

        writeLocalSetting("itemeditorinitialsize", `${itemEditorSize}`, WebSettingsScope.User);
    }

    private _renderGrid(): JSX.Element {
        let items = [];
        let columns = [];

        switch (this.props.view) {
            case BugBashViewActions.AcceptedItemsOnly:
                items = this.state.acceptedBugBashItems;
                columns = this._getAcceptedGridColumns();
                break;
            case BugBashViewActions.RejectedItemsOnly:
                items = this.state.rejectedBugBashItems;
                columns = this._getBugBashItemGridColumns(true);
                break;
            default:
                items = this.state.pendingBugBashItems;
                columns = this._getBugBashItemGridColumns(false);
                break;
        }

        if (items.length === 0) {
            return (
                <ZeroData
                    imagePath={`${VSS.getExtensionContext().baseUri}/images/nodata.png`}
                    imageAltText=""
                    primaryText="No results found"
                />
            );
        }

        return (
            <div className="grid-container">
                <VssDetailsList
                    items={items}
                    columns={columns}
                    selectionPreservedOnEmptyClick={true}
                    layoutMode={DetailsListLayoutMode.justified}
                    constrainMode={ConstrainMode.horizontalConstrained}
                    onColumnHeaderClick={this._onSortChange}
                    checkboxVisibility={CheckboxVisibility.hidden}
                    selectionMode={this.props.view === BugBashViewActions.AcceptedItemsOnly ? SelectionMode.multiple : SelectionMode.single}
                    className="bugbash-item-grid"
                    selection={this._selection}
                    getKey={this._getBugBashItemId}
                    setKey={`bugbash-item-grid-${this.state.gridKeyCounter}`}
                    onItemInvoked={this._onItemInvoked}
                    actionsColumnKey={this.props.view === BugBashViewActions.AcceptedItemsOnly ? WorkItemFieldNames.Title : undefined}
                    getMenuItems={this._getGridContextMenuItems}
                    onRenderItemColumn={this._onRenderColumn}
                />
            </div>
        );
    }

    @autobind
    private _onRenderColumn(item: BugBashItem, _index: number, column: IColumn): JSX.Element {
        return item.onRenderPropertyCell(column.key as BugBashItemFieldNames | WorkItemFieldNames);
    }

    @autobind
    private _getBugBashItemId(item: BugBashItem): string {
        return item.id;
    }

    @autobind
    private _getGridContextMenuItems(item: BugBashItem): IContextualMenuItem[] {
        if (this.props.view === BugBashViewActions.AcceptedItemsOnly) {
            return [
                {
                    key: "openinquery", name: "Open selected items in Queries", iconProps: {iconName: "ReplyMirrored"},
                    onClick: () => {
                        let selectedItems = this._selection.getSelection() as BugBashItem[];
                        if (!selectedItems || selectedItems.length === 0) {
                            selectedItems = [item];
                        }

                        const url = getQueryUrl(selectedItems.map(i => i.workItem), [
                            WorkItemFieldNames.ID,
                            WorkItemFieldNames.Title,
                            WorkItemFieldNames.State,
                            WorkItemFieldNames.AssignedTo,
                            WorkItemFieldNames.AreaPath
                        ]);
                        window.open(url, "_blank");
                    }
                }
            ];
        }
        else {
            return null;
        }
    }

    @autobind
    private async _onItemInvoked(bugBashItem: BugBashItem) {
        if (bugBashItem.isAccepted) {
            const updatedWorkItem = await openWorkItemDialog(null, bugBashItem.workItem);
            if (updatedWorkItem) {
                WorkItemActions.refreshWorkItemInStore([updatedWorkItem]);
            }
        }
        else {
            navigate({view: UrlActions.ACTION_RESULTS, id: this.props.bugBash.id, itemId: bugBashItem.id});
        }
    }

    private _getAcceptedGridColumns(): IColumn[] {
        return [
            {
                key: WorkItemFieldNames.Title,
                fieldName: WorkItemFieldNames.Title,
                name: "Title",
                minWidth: 150,
                maxWidth: 420,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === WorkItemFieldNames.Title,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: WorkItemFieldNames.State,
                fieldName: WorkItemFieldNames.State,
                name: "State",
                minWidth: 50,
                maxWidth: 100,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === WorkItemFieldNames.State,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: WorkItemFieldNames.AssignedTo,
                fieldName: WorkItemFieldNames.AssignedTo,
                name: "Assigned To",
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === WorkItemFieldNames.AssignedTo,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: WorkItemFieldNames.AreaPath,
                fieldName: WorkItemFieldNames.AreaPath,
                name: "Area path",
                minWidth: 150,
                maxWidth: 250,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === WorkItemFieldNames.AreaPath,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: BugBashItemFieldNames.CreatedBy,
                fieldName: BugBashItemFieldNames.CreatedBy,
                name: "Item created by",
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.CreatedBy,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: BugBashItemFieldNames.CreatedDate,
                fieldName: BugBashItemFieldNames.CreatedDate,
                name: "Item created date",
                minWidth: 100,
                maxWidth: 200,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.CreatedDate,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            }
        ];
    }

    private _getBugBashItemGridColumns(isRejectedGrid: boolean): IColumn[] {
        const columns: IColumn[] = [
            {
                key: BugBashItemFieldNames.Title,
                fieldName: BugBashItemFieldNames.Title,
                name: "Title",
                minWidth: 200,
                maxWidth: isRejectedGrid ? 600 : 800,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.Title,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: BugBashItemFieldNames.TeamId,
                fieldName: BugBashItemFieldNames.TeamId,
                name: "Assigned to team",
                minWidth: isRejectedGrid ? 100 : 200,
                maxWidth: isRejectedGrid ? 200 : 300,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.TeamId,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: BugBashItemFieldNames.CreatedBy,
                fieldName: BugBashItemFieldNames.CreatedBy,
                name: "Created By",
                minWidth: isRejectedGrid ? 100 : 200,
                maxWidth: isRejectedGrid ? 200 : 300,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.CreatedBy,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            },
            {
                key: BugBashItemFieldNames.CreatedDate,
                fieldName: BugBashItemFieldNames.CreatedDate,
                name: "Created Date",
                minWidth: isRejectedGrid ? 100 : 200,
                maxWidth: isRejectedGrid ? 200 : 300,
                isResizable: true,
                isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.CreatedDate,
                isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
            }
        ];

        if (isRejectedGrid) {
            columns.push(
                {
                    key: BugBashItemFieldNames.RejectedBy,
                    fieldName: BugBashItemFieldNames.RejectedBy,
                    name: "Rejected By",
                    minWidth: 100,
                    maxWidth: 200,
                    isResizable: true,
                    isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.RejectedBy,
                    isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
                },
                {
                    key: BugBashItemFieldNames.RejectReason,
                    fieldName: BugBashItemFieldNames.RejectReason,
                    name: "Reject Reason",
                    minWidth: 200,
                    maxWidth: 800,
                    isResizable: true,
                    isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === BugBashItemFieldNames.RejectReason,
                    isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
                }
            );
        }

        return columns;
    }

    @autobind
    private _onSortChange(_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) {
        BugBashItemActions.applySort({
            sortKey: column.key as BugBashFieldNames | WorkItemFieldNames,
            isSortedDescending: !column.isSortedDescending
        });
    }

    private _onBugBashItemSelectionChanged(bugBashItems: BugBashItem[]) {
        if (this._itemInvokedDelayedFunction) {
            this._itemInvokedDelayedFunction.cancel();
        }

        if (this.state.selectedBugBashItem.isNew()) {
            this.state.selectedBugBashItem.reset(false);
        }

        this._itemInvokedDelayedFunction = delay(this, 200, () => {
            if (bugBashItems == null || bugBashItems.length !== 1) {
                this.setState({selectedBugBashItem: StoresHub.bugBashItemStore.getNewBugBashItem()} as IBugBashResultsState);
            }
            else {
                this.setState({selectedBugBashItem: bugBashItems[0]} as IBugBashResultsState);
            }
        });
    }

    @autobind
    private _setSelectedItem(bugBashItemId: string) {
        let selectedItem: BugBashItem = null;

        if (this._itemInvokedDelayedFunction) {
            this._itemInvokedDelayedFunction.cancel();
        }

        if (bugBashItemId) {
            selectedItem = StoresHub.bugBashItemStore.getItem(bugBashItemId);
        }

        if (selectedItem) {
            if ((this._selection as any)._keyToIndexMap[selectedItem.id] >= 0) {
                this._selection.setKeySelected(selectedItem.id, true, true);
            }
            else {
                this.setState({
                    selectedBugBashItem: selectedItem,
                    gridKeyCounter: this.state.gridKeyCounter + 1
                } as IBugBashResultsState);
            }
        }
        else {
            this._selection.setAllSelected(false);
            this.setState({
                selectedBugBashItem: StoresHub.bugBashItemStore.getNewBugBashItem(),
                gridKeyCounter: this.state.gridKeyCounter + 1
            } as IBugBashResultsState);
        }
    }
}
