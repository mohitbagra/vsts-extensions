import { IWorkItemChecklists } from "Checklist/Interfaces";
import { Action } from "Common/Flux/Actions/Action";

export namespace ChecklistActionsHub {
    export const InitializeChecklist = new Action<IWorkItemChecklists>();
    export const UpdateChecklist = new Action<IWorkItemChecklists>();
}

export namespace SettingsActionsHub {
    export const InitializeSettings = new Action<void>();
    export const UpdateSettings = new Action<void>();
}
