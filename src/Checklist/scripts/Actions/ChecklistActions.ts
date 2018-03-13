import { ChecklistActionsHub } from "Checklist/Actions/ActionsHub";
import { ChecklistDataService } from "Checklist/DataServices/ChecklistDataService";
import { DefaultError, IWorkItemChecklist } from "Checklist/Interfaces";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { ErrorMessageActions } from "Library/Flux/Actions/ErrorMessageActions";

export namespace ChecklistActions {
    export async function initializeChecklistForWorkItemType(workItemType: string, projectId?: string) {
        ErrorMessageActions.dismissErrorMessage("ChecklistError");

        if (!StoresHub.checklistStore.isLoading(workItemType)) {
            StoresHub.checklistStore.setLoading(true, workItemType);
            const model = await ChecklistDataService.loadChecklistForWorkItemType(workItemType, projectId);

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
                const updatedChecklist = await ChecklistDataService.updateChecklistForWorkItemType(checklist);

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

    export async function initializeChecklist(workItemId: number, workItemType: string, projectId: string) {
        if (StoresHub.checklistStore.isLoaded(`${workItemId}`)) {
            ErrorMessageActions.dismissErrorMessage("ChecklistError");
            ChecklistActionsHub.InitializeChecklist.invoke(null);
        }
        else {
            refreshChecklist(workItemId, workItemType, projectId);
        }
    }

    export async function refreshChecklist(workItemId: number, workItemType: string, projectId: string) {
        const key = `${workItemId}`;

        ErrorMessageActions.dismissErrorMessage("ChecklistError");

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);

            const models: IWorkItemChecklist[] = await ChecklistDataService.loadWorkItemChecklist(workItemId, workItemType, projectId);

            ChecklistActionsHub.InitializeChecklist.invoke({personal: models[0], shared: models[1]});
            StoresHub.checklistStore.setLoading(false, key);
        }
    }

    export async function updateChecklist(checklist: IWorkItemChecklist, isPersonal: boolean) {
        const key = checklist.id;

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);
            try {
                const updatedChecklist = await ChecklistDataService.updateWorkItemChecklist(checklist, isPersonal);

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
}
