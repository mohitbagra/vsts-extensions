import { ChecklistActionsHub, IChecklistActionData } from "Checklist/Actions/ActionsHub";
import { IWorkItemChecklist } from "Checklist/Interfaces";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { isNullOrWhiteSpace } from "Library/Utilities/String";

export class ChecklistStore extends BaseStore<IDictionaryStringTo<IChecklistActionData>, IChecklistActionData, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(id: string): IChecklistActionData {
        if (isNullOrWhiteSpace(id)) {
            return null;
        }
        return this.items[id.toLowerCase()];
    }

    public getKey(): string {
        return "ChecklistStore";
    }

    protected initializeActionListeners() {
        ChecklistActionsHub.InitializeChecklist.addListener((checklistData: IChecklistActionData) => {
            if (checklistData) {
                this._updateChecklist(checklistData.personal, true);
                this._updateChecklist(checklistData.shared, false);
            }
            this.emitChanged();
        });

        ChecklistActionsHub.UpdateChecklist.addListener((checklistData: IChecklistActionData) => {
            if (checklistData) {
                this._updateChecklist(checklistData.personal, true);
                this._updateChecklist(checklistData.shared, false);
            }
            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }

    private _updateChecklist(checklist: IWorkItemChecklist, isPersonal: boolean) {
        if (checklist) {
            const key = checklist.id.toLowerCase();
            if (this.items[key] == null) {
                this.items[key] = {personal: null, shared: null};
            }
            if (isPersonal) {
                this.items[key].personal = checklist;
            }
            else {
                this.items[key].shared = checklist;
            }
        }
    }
}
