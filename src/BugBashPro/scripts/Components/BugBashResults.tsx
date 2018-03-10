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
import { navigate } from "Library/Utilities/Navigation";
import { getQueryUrl } from "Library/Utilities/UrlHelper";
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

        switch (this.props.view) {
            case BugBashViewActions.AcceptedItemsOnly:
                items = this.state.acceptedBugBashItems;
                break;
            case BugBashViewActions.RejectedItemsOnly:
                items = this.state.rejectedBugBashItems;
                break;
            case BugBashViewActions.PendingItemsOnly:
                items = this.state.pendingBugBashItems;
                break;
            default:
                items = this.state.bugBashItems;
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
                    columns={this._getBugBashItemGridColumns()}
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
                    actionsColumnKey={this.props.view === BugBashViewActions.AcceptedItemsOnly ? BugBashItemFieldNames.Title : undefined}
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

    private _getColumn(key: string, name: string, minWidth: number, maxWidth: number): IColumn {
        return {
            key: key,
            fieldName: key,
            name: name,
            minWidth: minWidth,
            maxWidth: maxWidth,
            isResizable: true,
            isSorted: (StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.sortKey) === key,
            isSortedDescending: !!(StoresHub.bugBashItemStore.sortState && StoresHub.bugBashItemStore.sortState.isSortedDescending)
        };
    }

    private _getBugBashItemGridColumns(): IColumn[] {
        const view = this.props.view;
        let columns: IColumn[];
        if (view === BugBashViewActions.AcceptedItemsOnly) {
            columns = [
                this._getColumn(BugBashItemFieldNames.Title, "Title", 150, 420),
                this._getColumn(WorkItemFieldNames.State, "State", 50, 100),
                this._getColumn(WorkItemFieldNames.AssignedTo, "Assigned To", 100, 200),
                this._getColumn(WorkItemFieldNames.AreaPath, "Area Path", 150, 250),
                this._getColumn(BugBashItemFieldNames.CreatedBy, "Item Created By", 100, 200),
                this._getColumn(BugBashItemFieldNames.CreatedDate, "Item Created Date", 100, 200)
            ];
        }
        else if (view === BugBashViewActions.PendingItemsOnly || view === BugBashViewActions.RejectedItemsOnly) {
            const isRejectedGrid = view === BugBashViewActions.RejectedItemsOnly;
            columns = [
                this._getColumn(BugBashItemFieldNames.Title, "Title", 200, isRejectedGrid ? 600 : 800),
                this._getColumn(BugBashItemFieldNames.TeamId, "Assigned to team", isRejectedGrid ? 100 : 200, isRejectedGrid ? 200 : 300),
                this._getColumn(BugBashItemFieldNames.CreatedBy, "Created By", isRejectedGrid ? 100 : 200, isRejectedGrid ? 200 : 300),
                this._getColumn(BugBashItemFieldNames.CreatedDate, "Created Date", isRejectedGrid ? 100 : 200, isRejectedGrid ? 200 : 300)
            ];

            if (isRejectedGrid) {
                columns.push(
                    this._getColumn(BugBashItemFieldNames.RejectedBy, "Rejected By", 100, 200),
                    this._getColumn(BugBashItemFieldNames.RejectReason, "Reject Reason", 200, 800)
                );
            }
        }
        else {
            columns = [
                {
                    key: BugBashItemFieldNames.Status,
                    fieldName: BugBashItemFieldNames.Status,
                    name: "Status",
                    minWidth: 30,
                    maxWidth: 30,
                    isResizable: false
                },
                this._getColumn(BugBashItemFieldNames.Title, "Title", 300, 800),
                this._getColumn(BugBashItemFieldNames.CreatedBy, "Created By", 200, 300),
                this._getColumn(BugBashItemFieldNames.CreatedDate, "Created Date", 200, 300)
            ];
        }

        return columns;
    }

    @autobind
    private _getBugBashItemId(item: BugBashItem): string {
        return item.id;
    }

    @autobind
    private _getGridContextMenuItems(item: BugBashItem): IContextualMenuItem[] {
        if (this.props.view === BugBashViewActions.AcceptedItemsOnly) {
            let selectedItems = this._selection.getSelection() as BugBashItem[];
            if (!selectedItems || selectedItems.length === 0) {
                selectedItems = [item];
            }

            return [
                {
                    key: "openinquery", name: "Open selected items in Queries", iconProps: {iconName: "ReplyMirrored"},
                    href: getQueryUrl(selectedItems.map(i => i.workItem), [
                        WorkItemFieldNames.ID,
                        WorkItemFieldNames.Title,
                        WorkItemFieldNames.State,
                        WorkItemFieldNames.AssignedTo,
                        WorkItemFieldNames.AreaPath
                    ]),
                    target: "_blank"
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

    @autobind
    private _onSortChange(_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) {
        if (column.key === BugBashItemFieldNames.Status) {
            return;
        }

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
