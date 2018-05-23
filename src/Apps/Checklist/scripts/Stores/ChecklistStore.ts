import { ChecklistActionsHub } from "Checklist/Actions/ActionsHub";
import { ChecklistType, IWorkItemChecklist, IWorkItemChecklists } from "Checklist/Interfaces";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";

export class ChecklistStore extends BaseStore<IDictionaryStringTo<IWorkItemChecklists>, IWorkItemChecklists, string> {
    private _workItemTypeName: string;

    constructor() {
        super();
        this.items = {};
    }

    public getItem(id: string): IWorkItemChecklists {
        if (isNullOrWhiteSpace(id)) {
            return null;
        }
        return this.items[id.toLowerCase()];
    }

    public getKey(): string {
        return "ChecklistStore";
    }

    public setCurrentWorkItemType(workItemTypeName: string) {
        this._workItemTypeName = workItemTypeName;
    }

    public checkCurrentWorkItemType(workItemTypeName: string): boolean {
        return stringEquals(this._workItemTypeName, workItemTypeName, true);
    }

    public clear() {
        this.items = {};
        this._workItemTypeName = null;
    }

    protected initializeActionListeners() {
        ChecklistActionsHub.InitializeChecklist.addListener((checklistData: IWorkItemChecklists) => {
            if (checklistData) {
                this._updateChecklist(checklistData.personal, ChecklistType.Personal);
                this._updateChecklist(checklistData.shared, ChecklistType.Shared);
                this._updateChecklist(checklistData.witDefault, ChecklistType.WitDefault);
            }
            this.emitChanged();
        });

        ChecklistActionsHub.UpdateChecklist.addListener((checklistData: IWorkItemChecklists) => {
            if (checklistData) {
                this._updateChecklist(checklistData.personal, ChecklistType.Personal);
                this._updateChecklist(checklistData.shared, ChecklistType.Shared);
                this._updateChecklist(checklistData.witDefault, ChecklistType.WitDefault);
            }
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _updateChecklist(checklist: IWorkItemChecklist, checklistType: ChecklistType) {
        if (checklist) {
            const key = checklist.id.toLowerCase();
            if (this.items[key] == null) {
                this.items[key] = {personal: null, shared: null, witDefault: null};
            }

            switch (checklistType) {
                case ChecklistType.Personal:
                    this.items[key].personal = checklist;
                    break;
                case ChecklistType.Shared:
                    this.items[key].shared = checklist;
                    break;
                default:
                    this.items[key].witDefault = checklist;
            }
        }
    }
}
