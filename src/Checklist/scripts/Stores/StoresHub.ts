import { ChecklistStore } from "Checklist/Stores/ChecklistStore";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { ErrorMessageStore } from "Library/Flux/Stores/ErrorMessageStore";

export namespace StoresHub {
    export const checklistStore: ChecklistStore = StoreFactory.getInstance<ChecklistStore>(ChecklistStore);
    export const errorMessageStore: ErrorMessageStore = StoreFactory.getInstance<ErrorMessageStore>(ErrorMessageStore);
}
