import { WorkItemTypeFieldAllowedValuesActionsHub } from "Common/Flux/Actions/ActionsHub";
import { BaseStore } from "Common/Flux/Stores/BaseStore";

export class WorkItemTypeFieldAllowedValuesStore extends BaseStore<IDictionaryStringTo<string[]>, string[], string> {
    constructor() {
        super();
        this.items = {};
    }

    // key = "{workitemtype}_{fieldrefname}"
    public getItem(key: string): string[] {
        return this.items[key.toLowerCase()];
    }

    public getAllowedValues(workItemType: string, fieldRefName: string): string[] {
        const key = `${workItemType}_${fieldRefName}`;
        return this.items[key.toLowerCase()];
    }

    public getKey(): string {
        return "WorkItemTypeFieldAllowedValuesStore";
    }

    protected initializeActionListeners() {
        WorkItemTypeFieldAllowedValuesActionsHub.InitializeAllowedValues.addListener((data: {
            workItemType: string,
            fieldRefName: string,
            allowedValues: string[]
        }) => {
            if (data) {
                const key = `${data.workItemType}_${data.fieldRefName}`;
                this.items[key.toLowerCase()] = data.allowedValues;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
