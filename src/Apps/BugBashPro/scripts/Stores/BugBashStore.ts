import { BugBashActionsHub } from "BugBashPro/Actions/ActionsHub";
import { IBugBash, ISortState } from "BugBashPro/Interfaces";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { findIndex } from "Common/Utilities/Array";
import { stringEquals } from "Common/Utilities/String";
import { IFilterState } from "VSSUI/Utilities/Filter";

export class BugBashStore extends BaseStore<BugBash[], BugBash, string> {
    private _allLoaded: boolean;
    private _itemsIdMap: IDictionaryStringTo<BugBash>;
    private _filteredItems: BugBash[];
    private _filterState: IFilterState;
    private _sortState: ISortState;
    private _newBugBash: BugBash;

    get filterState(): IFilterState {
        return this._filterState;
    }

    get sortState(): ISortState {
        return this._sortState;
    }

    constructor() {
        super();
        this._allLoaded = false;
        this._itemsIdMap = {};
        this._newBugBash = new BugBash();
    }

    public isLoaded(key?: string): boolean {
        if (key) {
            return super.isLoaded();
        }

        return this._allLoaded && super.isLoaded();
    }

    public getNewBugBash(): BugBash {
        return this._newBugBash;
    }

    public getItem(id: string): BugBash {
        return this._itemsIdMap[id.toLowerCase()];
    }

    public getFilteredItems(): BugBash[] {
        return this._filteredItems;
    }

    public getKey(): string {
        return "BugBashStore";
    }

    protected initializeActionListeners() {
        BugBashActionsHub.FireStoreChange.addListener(() => {
            this.emitChanged();
        });

        BugBashActionsHub.ApplyFilter.addListener((filterState: IFilterState) => {
            this._filterState = filterState;
            this._filteredItems = this._applyFilterAndSort(this.items);
            this.emitChanged();
        });

        BugBashActionsHub.ClearSortAndFilter.addListener(() => {
            this._filterState = null;
            this._sortState = null;
            this._filteredItems = this.items ? [...this.items] : null;
            this.emitChanged();
        });

        BugBashActionsHub.ApplySort.addListener((sortState: ISortState) => {
            this._sortState = sortState;
            this._filteredItems = this._applyFilterAndSort(this.items);
            this.emitChanged();
        });

        BugBashActionsHub.Clean.addListener(() => {
            const items = this.items || [];
            for (const item of items) {
                item.reset(false);
            }

            this._newBugBash.reset(false);

            this._filterState = null;
            this._sortState = null;
            this._filteredItems = this.items ? [...this.items] : null;
            this.emitChanged();
        });

        BugBashActionsHub.InitializeAllBugBashes.addListener((bugBashModels: IBugBash[]) => {
            this._refreshBugBashes(bugBashModels);
            this._allLoaded = true;
            this.emitChanged();
        });

        BugBashActionsHub.InitializeBugBash.addListener((bugBashModel: IBugBash) => {
            this._addOrUpdateBugBash(bugBashModel);
            this.emitChanged();
        });

        BugBashActionsHub.CreateBugBash.addListener((bugBashModel: IBugBash) => {
            this._newBugBash.reset(false);
            this._addOrUpdateBugBash(bugBashModel);
            this.emitChanged();
        });

        BugBashActionsHub.UpdateBugBash.addListener((bugBashModel: IBugBash) => {
            this._addOrUpdateBugBash(bugBashModel);
            this.emitChanged();
        });

        BugBashActionsHub.DeleteBugBash.addListener((bugBashId: string) => {
            this._removeBugBash(bugBashId);
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _applyFilterAndSort(bugBashes: BugBash[]): BugBash[] {
        if (bugBashes == null) {
            return null;
        }

        let filteredItems = [...bugBashes];
        if (this._filterState) {
            filteredItems = this.items.filter(b => b.matches(this._filterState));
        }

        if (this._sortState) {
            filteredItems.sort((b1, b2) => BugBash.compare(b1, b2, this._sortState));
        }

        return filteredItems;
    }

    private _refreshBugBashes(bugBashModels: IBugBash[]) {
        if (!bugBashModels) {
            return;
        }

        this.items = [];
        this._filteredItems = [];
        this._itemsIdMap = {};

        for (const bugBashModel of bugBashModels) {
            const bugBash = new BugBash(bugBashModel);
            this.items.push(bugBash);
            this._itemsIdMap[bugBashModel.id.toLowerCase()] = bugBash;
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
    }

    private _addOrUpdateBugBash(bugBashModel: IBugBash) {
        if (!bugBashModel) {
            return;
        }

        if (this.items == null) {
            this.items = [];
        }
        if (this._itemsIdMap == null) {
            this._itemsIdMap = {};
        }

        const bugBash = new BugBash(bugBashModel);
        this._itemsIdMap[bugBashModel.id.toLowerCase()] = bugBash;

        // add in all items
        const existingIndex = findIndex(this.items, (existingBugBash: BugBash) => stringEquals(bugBashModel.id, existingBugBash.id, true));
        if (existingIndex !== -1) {
            this.items[existingIndex] = bugBash;
        }
        else {
            this.items.push(bugBash);
        }

        this._filteredItems = this._applyFilterAndSort(this.items);
    }

    private _removeBugBash(bugBashId: string) {
        if (!bugBashId || this.items == null || this.items.length === 0) {
            return;
        }

        delete this._itemsIdMap[bugBashId.toLowerCase()];

        // remove from all items
        let existingIndex = findIndex(this.items, (existingBugBash: BugBash) => stringEquals(bugBashId, existingBugBash.id, true));
        if (existingIndex !== -1) {
            this.items.splice(existingIndex, 1);
        }

        // remove from filtered items
        existingIndex = findIndex(this._filteredItems || [], (existingBugBash: BugBash) => stringEquals(bugBashId, existingBugBash.id, true));
        if (existingIndex !== -1) {
            this._filteredItems.splice(existingIndex, 1);
        }
    }
}
