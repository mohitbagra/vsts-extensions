
export interface IWorkItemChecklist {
    id: string;
    __etag?: number;
    checklistItems: IChecklistItem[];
}

export interface IChecklistItem {
    id: string;
    text: string;
    required?: boolean;
    state?: ChecklistItemState;
    isDefault?: boolean;
}

export enum ChecklistItemState {
    New = "New",
    InProgress = "In Progress",
    Blocked = "Blocked",
    NA = "N/A",
    Completed = "Completed"
}

export interface IChecklistItemState {
    name: ChecklistItemState;
    backgroundColor: string;
    foregroundColor: string;
}

export interface IWorkItemChecklists {
    personal: IWorkItemChecklist;
    shared: IWorkItemChecklist;
    witDefault: IWorkItemChecklist;
}

export enum ChecklistType {
    Personal = 0,
    Shared,
    WitDefault
}

export const ChecklistItemStates: IDictionaryStringTo<IChecklistItemState> = {
    [ChecklistItemState.New]: {
        name: ChecklistItemState.New,
        backgroundColor: "#ffb900",
        foregroundColor: "#222222"
    },
    [ChecklistItemState.InProgress]: {
        name: ChecklistItemState.InProgress,
        backgroundColor: "#cbe3f3",
        foregroundColor: "#007acc"
    },
    [ChecklistItemState.Blocked]: {
        name: ChecklistItemState.Blocked,
        backgroundColor: "#ebb4b4",
        foregroundColor: "#a80000"
    },
    [ChecklistItemState.NA]: {
        name: ChecklistItemState.NA,
        backgroundColor: "#eaeaea",
        foregroundColor: "#3c3c3c"
    },
    [ChecklistItemState.Completed]: {
        name: ChecklistItemState.Completed,
        backgroundColor: "#c0e5c0",
        foregroundColor: "#159715"
    }
};

export const DefaultError = "The current version of checklist doesn't match the version of checklist in this workitem. Please refresh the workitem or the checklist to get the latest Checklist data.";
export const DefaultWorkItemTypeError = "The current version of checklist doesn't match the version of checklist in this work item type. Please refresh the checklist to get the latest data.";
