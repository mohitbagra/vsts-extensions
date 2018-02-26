import { IWorkItemChecklist } from "Checklist/Interfaces";
import { Action } from "Library/Flux/Actions/Action";

export interface IChecklistActionData {
    personal: IWorkItemChecklist;
    shared: IWorkItemChecklist;
}

export namespace ChecklistActionsHub {
    export const InitializeChecklist = new Action<IChecklistActionData>();
    export const UpdateChecklist = new Action<IChecklistActionData>();
}

export namespace SettingsActionsHub {
    export const InitializeSettings = new Action<void>();
    export const UpdateSettings = new Action<void>();
}
