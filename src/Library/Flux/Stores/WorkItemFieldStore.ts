import { WorkItemFieldActionsHub } from "Library/Flux/Actions/ActionsHub";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

export class WorkItemFieldStore extends BaseStore<WorkItemField[], WorkItemField, string> {
    private _itemsRefNameMap: IDictionaryStringTo<WorkItemField>;
    private _itemsNameMap: IDictionaryStringTo<WorkItemField>;

    constructor() {
        super();
        this._itemsRefNameMap = {};
        this._itemsNameMap = {};
    }

    public getItem(fieldRefName: string): WorkItemField {
        const key = (fieldRefName || "").toLowerCase();
        return this._itemsRefNameMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "WorkItemFieldStore";
    }

    protected initializeActionListeners() {
        WorkItemFieldActionsHub.InitializeWorkItemFields.addListener((fields: WorkItemField[]) => {
            if (fields) {
                this.items = fields;
                this._itemsRefNameMap = {};
                this._itemsNameMap = {};

                for (const item of this.items) {
                    this._itemsRefNameMap[item.referenceName.toLowerCase()] = item;
                    this._itemsNameMap[item.name.toLowerCase()] = item;
                }
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
