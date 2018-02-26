import { WorkItemTemplateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { WorkItemTemplate } from "TFS/WorkItemTracking/Contracts";

export class WorkItemTemplateItemStore extends BaseStore<IDictionaryStringTo<WorkItemTemplate>, WorkItemTemplate, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(id: string): WorkItemTemplate {
        const key = (id || "").toLowerCase();
        return this.items[key];
    }

    public getKey(): string {
        return "WorkItemTemplateItemStore";
    }

    protected initializeActionListeners() {
        WorkItemTemplateItemActionsHub.InitializeWorkItemTemplateItem.addListener((template: WorkItemTemplate) => {
            if (template) {
                this.items[template.id.toLowerCase()] = template;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
