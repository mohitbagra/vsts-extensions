import { BugBashItemActionsHub } from "BugBashPro/Actions/ActionsHub";
import { BugBashItemFieldNames, WorkItemFieldNames } from "BugBashPro/Constants";
import { IBugBashItem, ISortState } from "BugBashPro/Interfaces";
import { BugBashItem } from "BugBashPro/ViewModels/BugBashItem";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { findIndex } from "Common/Utilities/Array";
import { getDistinctNameFromIdentityRef, IdentityRef } from "Common/Utilities/Identity";
import { stringEquals } from "Common/Utilities/String";
import { IFilterState } from "VSSUI/Utilities/Filter";

export class BugBashItemStore extends BaseStore<BugBashItem[], BugBashItem, string> {
    private _itemsIdMap: IDictionaryStringTo<BugBashItem>;
    private _filteredItems: BugBashItem[];
    private _newBugBashItem: BugBashItem;
    private _filterState: IFilterState;
    private _sortState: ISortState;
    private _propertyMap: IDictionaryStringTo<IDictionaryStringTo<number>>;
    private _defaultTeamId: string;

    get filterState(): IFilterState {
        return this._filterState;
    }

    get sortState(): ISortState {
        return this._sortState;
    }

    get propertyMap(): IDictionaryStringTo<IDictionaryStringTo<number>> {
        return this._propertyMap;
    }

    constructor() {
        super();
        this._itemsIdMap = {};
        this._propertyMap = {
            [BugBashItemFieldNames.TeamId]: {},
            [BugBashItemFieldNames.CreatedBy]: {},
            [BugBashItemFieldNames.RejectedBy]: {},
            [WorkItemFieldNames.AreaPath]: {},
            [WorkItemFieldNames.AssignedTo]: {},
            [WorkItemFieldNames.State]: {}
        };
        this._newBugBashItem = new BugBashItem();
    }

    public getNewBugBashItem(): BugBashItem {
        return this._newBugBashItem;
    }

    public getItem(bugBashItemId: string): BugBashItem {
         return this._itemsIdMap[bugBashItemId.toLowerCase()];
    }

    public getFilteredItems(): BugBashItem[] {
        return this._filteredItems;
    }

    public getKey(): string {
        return "BugBashItemStore";
    }

    public setDefaultTeam(teamId: string) {
        this._defaultTeamId = teamId;
    }

    protected initializeActionListeners() {
        BugBashItemActionsHub.FireStoreChange.addListener(() => {
            this.emitChanged();
        });

        BugBashItemActionsHub.ApplyFilter.addListener((filterState: IFilterState) => {
            this._filterState = filterState;
            this._filteredItems = this._applyFilterAndSort(this.items);
            this.emitChanged();
        });

        BugBashItemActionsHub.ClearSortAndFilter.addListener(() => {
            this._filterState = null;
            this._sortState = null;
            this._filteredItems = this.items ? [...this.items] : null;
            this.emitChanged();
        });

        BugBashItemActionsHub.ApplySort.addListener((sortState: ISortState) => {
            this._sortState = sortState;
            this._filteredItems = this._applyFilterAndSort(this.items);
            this.emitChanged();
        });

        BugBashItemActionsHub.Clean.addListener(() => {
            const items = this.items || [];
            for (const item of items) {
                item.reset(false);
            }

            this._filterState = null;
            this._sortState = null;
            this._filteredItems = null;
            this.items = null;
            this._itemsIdMap = {};
            this._refreshPropertyMap();
            this.emitChanged();
        });

        BugBashItemActionsHub.InitializeBugBashItems.addListener(items => {
            if (items) {
                this._newBugBashItem = new BugBashItem(BugBashItem.getNewBugBashItemModel(null, this._defaultTeamId));
            }
            this._refreshBugBashItems(items);
            this.emitChanged();
        });

        BugBashItemActionsHub.InitializeBugBashItem.addListener(item => {
            this._addOrUpdateBugBashItem(item);
            this.emitChanged();
        });

        BugBashItemActionsHub.CreateBugBashItem.addListener(item => {
            this._newBugBashItem.reset(false);
            this._addOrUpdateBugBashItem(item);
            this.emitChanged();
        });

        BugBashItemActionsHub.UpdateBugBashItem.addListener(item => {
            this._addOrUpdateBugBashItem(item);
            this.emitChanged();
        });

        BugBashItemActionsHub.DeleteBugBashItem.addListener(itemId => {
            this._removeBugBashItem(itemId);
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _applyFilterAndSort(bugBashItems: BugBashItem[]): BugBashItem[] {
        if (bugBashItems == null) {
            return null;
        }

        let filteredItems = [...bugBashItems];
        if (this._filterState) {
            filteredItems = this.items.filter(b => b.matches(this._filterState));
        }

        if (this._sortState) {
            filteredItems.sort((b1, b2) => BugBashItem.compare(b1, b2, this._sortState));
        }

        return filteredItems;
    }

    private _refreshBugBashItems(bugBashItemModels: IBugBashItem[]) {
        if (!bugBashItemModels) {
            return;
        }

        this.items = [];
        this._filteredItems = [];
        this._itemsIdMap = {};

        for (const bugBashItemModel of bugBashItemModels) {
            const bugBashItem = new BugBashItem(bugBashItemModel);
            this.items.push(bugBashItem);
            this._itemsIdMap[bugBashItemModel.id.toLowerCase()] = bugBashItem;
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
        this._refreshPropertyMap();
    }

    private _addOrUpdateBugBashItem(bugBashItemModel: IBugBashItem): void {
        if (!bugBashItemModel) {
            return;
        }

        if (this.items == null) {
            this.items = [];
        }
        if (this._itemsIdMap == null) {
            this._itemsIdMap = {};
        }

        const bugBashItem = new BugBashItem(bugBashItemModel);
        this._itemsIdMap[bugBashItemModel.id.toLowerCase()] = bugBashItem;

        // add in all items
        const existingIndex = findIndex(this.items, (existingBugBashItem: BugBashItem) => stringEquals(bugBashItemModel.id, existingBugBashItem.id, true));
        if (existingIndex !== -1) {
            this.items[existingIndex] = bugBashItem;
        }
        else {
            this.items.push(bugBashItem);
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
        this._refreshPropertyMap();
    }

    private _removeBugBashItem(bugBashItemId: string): void {
        if (!bugBashItemId || this.items == null || this.items.length === 0) {
            return;
        }

        if (this._itemsIdMap != null) {
            delete this._itemsIdMap[bugBashItemId.toLowerCase()];
        }

        // remove from all items
        let existingIndex = findIndex(this.items, (existingBugBashItem: BugBashItem) => stringEquals(bugBashItemId, existingBugBashItem.id, true));
        if (existingIndex !== -1) {
            this.items.splice(existingIndex, 1);
        }

        // remove from filtered items
        existingIndex = findIndex(this._filteredItems || [], (existingBugBashItem: BugBashItem) => stringEquals(bugBashItemId, existingBugBashItem.id, true));
        if (existingIndex !== -1) {
            this._filteredItems.splice(existingIndex, 1);
        }

        this._refreshPropertyMap();
    }

    private _refreshPropertyMap() {
        this._propertyMap = {
            [BugBashItemFieldNames.TeamId]: {},
            [BugBashItemFieldNames.CreatedBy]: {},
            [BugBashItemFieldNames.RejectedBy]: {},
            [WorkItemFieldNames.AreaPath]: {},
            [WorkItemFieldNames.AssignedTo]: {},
            [WorkItemFieldNames.State]: {}
        };

        if (!this.items) {
            return;
        }

        for (const bugBashItem of this.items) {
            if (!bugBashItem.isAccepted) {
                const teamId = bugBashItem.getFieldValue<string>(BugBashItemFieldNames.TeamId, true);
                const createdBy = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.CreatedBy, true);
                const createdByStr = getDistinctNameFromIdentityRef(createdBy);

                this._propertyMap[BugBashItemFieldNames.TeamId][teamId] = (this._propertyMap[BugBashItemFieldNames.TeamId][teamId] || 0) + 1;
                this._propertyMap[BugBashItemFieldNames.CreatedBy][createdByStr] = (this._propertyMap[BugBashItemFieldNames.CreatedBy][createdByStr] || 0) + 1;

                if (bugBashItem.isRejected) {
                    const rejectedBy = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.RejectedBy, true);
                    const rejectedByStr = getDistinctNameFromIdentityRef(rejectedBy);
                    this._propertyMap[BugBashItemFieldNames.RejectedBy][rejectedByStr] = (this._propertyMap[BugBashItemFieldNames.RejectedBy][rejectedByStr] || 0) + 1;
                }
            }
            else {
                const workItem = bugBashItem.workItem;
                const areaPath = workItem.fields[WorkItemFieldNames.AreaPath];
                const assignedTo = workItem.fields[WorkItemFieldNames.AssignedTo] || "Unassigned";
                const state = workItem.fields[WorkItemFieldNames.State];
                const itemCreatedBy = bugBashItem.getFieldValue<IdentityRef>(BugBashItemFieldNames.CreatedBy, true);
                const itemCreatedByStr = getDistinctNameFromIdentityRef(itemCreatedBy);

                this._propertyMap[BugBashItemFieldNames.CreatedBy][itemCreatedByStr] = (this._propertyMap[BugBashItemFieldNames.CreatedBy][itemCreatedByStr] || 0) + 1;
                this._propertyMap[WorkItemFieldNames.AreaPath][areaPath] = (this._propertyMap[WorkItemFieldNames.AreaPath][areaPath] || 0) + 1;
                this._propertyMap[WorkItemFieldNames.State][state] = (this._propertyMap[WorkItemFieldNames.State][state] || 0) + 1;
                this._propertyMap[WorkItemFieldNames.AssignedTo][assignedTo] = (this._propertyMap[WorkItemFieldNames.AssignedTo][assignedTo] || 0) + 1;
            }
        }
    }
}
