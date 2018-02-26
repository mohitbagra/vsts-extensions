import { WorkItemStateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export class WorkItemStateItemStore extends BaseStore<IDictionaryStringTo<WorkItemStateColor[]>, WorkItemStateColor[], string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(witName: string): WorkItemStateColor[] {
        return this.items[witName.toLowerCase()];
    }

    public getKey(): string {
        return "WorkItemStateItemStore";
    }

    protected initializeActionListeners() {
        WorkItemStateItemActionsHub.InitializeWorkItemStateItems.addListener((stateItems: {witName: string, states: WorkItemStateColor[]}) => {
            if (stateItems) {
                this.items[stateItems.witName.toLowerCase()] = stateItems.states;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
