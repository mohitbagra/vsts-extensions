import { ChecklistStore } from "Checklist/Stores/ChecklistStore";
import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import { ErrorMessageStore } from "Common/Flux/Stores/ErrorMessageStore";
import { WorkItemTypeStore } from "Common/Flux/Stores/WorkItemTypeStore";

export namespace StoresHub {
    export const checklistStore: ChecklistStore = StoreFactory.getInstance<ChecklistStore>(ChecklistStore);
    export const errorMessageStore: ErrorMessageStore = StoreFactory.getInstance<ErrorMessageStore>(ErrorMessageStore);
    export const workItemTypeStore: WorkItemTypeStore = StoreFactory.getInstance<WorkItemTypeStore>(WorkItemTypeStore);
}
