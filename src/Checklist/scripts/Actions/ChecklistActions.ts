import { ChecklistActionsHub } from "Checklist/Actions/ActionsHub";
import { ChecklistItemState, DefaultError, IWorkItemChecklist } from "Checklist/Interfaces";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { ErrorMessageActions } from "Library/Flux/Actions/ErrorMessageActions";
import * as ExtensionDataManager from "Library/Utilities/ExtensionDataManager";
import { isNullOrWhiteSpace } from "Library/Utilities/String";

export namespace ChecklistActions {
    export async function initializeChecklistForWorkItemType(workItemType: string, projectId?: string) {
        ErrorMessageActions.dismissErrorMessage("ChecklistError");

        if (!StoresHub.checklistStore.isLoading(workItemType)) {
            StoresHub.checklistStore.setLoading(true, workItemType);
            const project = projectId || VSS.getWebContext().project.id;

            const model = await ExtensionDataManager.readDocument<IWorkItemChecklist>(`dc_${project}`, workItemType, {id: workItemType, checklistItems: []}, false);
            preprocessChecklist(model);

            if (StoresHub.checklistStore.checkCurrentWorkItemType(workItemType)) {
                ChecklistActionsHub.InitializeChecklist.invoke({personal: null, shared: model});
            }

            StoresHub.checklistStore.setLoading(false, workItemType);
        }
    }

    export async function updateChecklistForWorkItemType(checklist: IWorkItemChecklist) {
        const key = checklist.id;

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);
            try {
                const updatedChecklist = await ExtensionDataManager.addOrUpdateDocument<IWorkItemChecklist>(`dc_${VSS.getWebContext().project.id}`, checklist, false);
                preprocessChecklist(updatedChecklist);

                if (StoresHub.checklistStore.checkCurrentWorkItemType(key)) {
                    ChecklistActionsHub.UpdateChecklist.invoke({
                        personal: null,
                        shared: updatedChecklist
                    });
                }
                StoresHub.checklistStore.setLoading(false, key);
                ErrorMessageActions.dismissErrorMessage("ChecklistError");
            }
            catch {
                ErrorMessageActions.showErrorMessage(DefaultError, "ChecklistError");
                StoresHub.checklistStore.setLoading(false, key);
            }
        }
    }

    export async function initializeChecklist(workItemId: number) {
        if (StoresHub.checklistStore.isLoaded(`${workItemId}`)) {
            ErrorMessageActions.dismissErrorMessage("ChecklistError");
            ChecklistActionsHub.InitializeChecklist.invoke(null);
        }
        else {
            refreshChecklist(workItemId);
        }
    }

    export async function refreshChecklist(workItemId: number) {
        const key = `${workItemId}`;

        ErrorMessageActions.dismissErrorMessage("ChecklistError");

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);

            const models: IWorkItemChecklist[] = await Promise.all([
                ExtensionDataManager.readDocument<IWorkItemChecklist>("CheckListItems", key, {id: key, checklistItems: []}, true),
                ExtensionDataManager.readDocument<IWorkItemChecklist>("CheckListItems", key, {id: key, checklistItems: []}, false)
            ]);
            preprocessChecklist(models[0]);
            preprocessChecklist(models[1]);

            ChecklistActionsHub.InitializeChecklist.invoke({personal: models[0], shared: models[1]});
            StoresHub.checklistStore.setLoading(false, key);
        }
    }

    export async function updateChecklist(checklist: IWorkItemChecklist, isPersonal: boolean) {
        const key = checklist.id;

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);
            try {
                const updatedChecklist = await ExtensionDataManager.addOrUpdateDocument<IWorkItemChecklist>("CheckListItems", checklist, isPersonal);
                preprocessChecklist(updatedChecklist);

                ChecklistActionsHub.UpdateChecklist.invoke({
                    personal: isPersonal ? updatedChecklist : null,
                    shared: isPersonal ? null : updatedChecklist
                });
                StoresHub.checklistStore.setLoading(false, key);
                ErrorMessageActions.dismissErrorMessage("ChecklistError");
            }
            catch {
                ErrorMessageActions.showErrorMessage(DefaultError, "ChecklistError");
                StoresHub.checklistStore.setLoading(false, key);
            }
        }
    }

    function preprocessChecklist(checklist: IWorkItemChecklist) {
        if (checklist && checklist.checklistItems) {
            for (const checklistItem of checklist.checklistItems) {
                if (isNullOrWhiteSpace(checklistItem.state)) {
                    if (checklistItem["checked"]) {
                        checklistItem.state = ChecklistItemState.Completed;
                    }
                    else {
                        checklistItem.state = ChecklistItemState.New;
                    }
                }
            }
        }
    }
}
