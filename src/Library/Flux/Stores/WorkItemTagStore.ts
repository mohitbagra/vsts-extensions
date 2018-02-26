import { WorkItemTagActionsHub } from "Library/Flux/Actions/ActionsHub";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { WebApiTagDefinition } from "TFS/Core/Contracts";

export class WorkItemTagStore extends BaseStore<WebApiTagDefinition[], WebApiTagDefinition, string> {
    private _itemsIdMap: IDictionaryStringTo<WebApiTagDefinition>;
    private _itemsNameMap: IDictionaryStringTo<WebApiTagDefinition>;

    constructor() {
        super();
        this._itemsIdMap = {};
        this._itemsNameMap = {};
    }

    public getItem(idOrName: string): WebApiTagDefinition {
        const key = (idOrName || "").toLowerCase();
        return this._itemsIdMap[key] || this._itemsNameMap[key];
    }

    public getKey(): string {
        return "WorkItemTagStore";
    }

    protected initializeActionListeners() {
        WorkItemTagActionsHub.InitializeTags.addListener((tags: WebApiTagDefinition[]) => {
            if (tags) {
                this.items = tags;
                this._itemsIdMap = {};
                this._itemsNameMap = {};

                for (const item of this.items) {
                    this._itemsIdMap[item.id.toLowerCase()] = item;
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
