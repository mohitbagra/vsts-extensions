import { ChecklistActionsHub } from "Checklist/Actions/ActionsHub";
import { ChecklistDataService } from "Checklist/DataServices/ChecklistDataService";
import {
    ChecklistType, DefaultError, DefaultWorkItemTypeError, IWorkItemChecklist
} from "Checklist/Interfaces";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";

export namespace ChecklistActions {
    export async function initializeChecklistForWorkItemType(workItemType: string, projectId?: string) {
        ErrorMessageActions.dismissErrorMessage("ChecklistError");

        if (!StoresHub.checklistStore.isLoading(workItemType)) {
            StoresHub.checklistStore.setLoading(true, workItemType);
            const model = await ChecklistDataService.loadChecklistForWorkItemType(workItemType, projectId);

            if (StoresHub.checklistStore.checkCurrentWorkItemType(workItemType)) {
                ChecklistActionsHub.InitializeChecklist.invoke({personal: null, shared: null, witDefault: model});
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
                        shared: null,
                        witDefault: updatedChecklist
                    });
                }
                StoresHub.checklistStore.setLoading(false, key);
                ErrorMessageActions.dismissErrorMessage("ChecklistError");
            }
            catch {
                ErrorMessageActions.showErrorMessage(DefaultWorkItemTypeError, "ChecklistError");
                StoresHub.checklistStore.setLoading(false, key);
            }
        }
    }

    export function initializeChecklists(workItemId: number, workItemType: string, projectId: string) {
        if (StoresHub.checklistStore.isLoaded(`${workItemId}`)) {
            ErrorMessageActions.dismissErrorMessage("ChecklistError");
            ChecklistActionsHub.InitializeChecklist.invoke(null);
        }
        else {
            refreshChecklists(workItemId, workItemType, projectId);
        }
    }

    export async function refreshChecklists(workItemId: number, workItemType: string, projectId: string) {
        const key = `${workItemId}`;

        ErrorMessageActions.dismissErrorMessage("ChecklistError");

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);

            const models = await ChecklistDataService.loadWorkItemChecklists(workItemId, workItemType, projectId);

            ChecklistActionsHub.InitializeChecklist.invoke({personal: models.personal, shared: models.shared, witDefault: models.witDefault});
            StoresHub.checklistStore.setLoading(false, key);
        }
    }

    export async function updateChecklist(checklist: IWorkItemChecklist, checklistType: ChecklistType) {
        const key = checklist.id;

        if (!StoresHub.checklistStore.isLoading(key)) {
            StoresHub.checklistStore.setLoading(true, key);
            try {
                if (checklistType === ChecklistType.WitDefault) {
                    const updatedChecklist = await ChecklistDataService.updateDefaultChecklistForWorkItem(checklist);

                    ChecklistActionsHub.UpdateChecklist.invoke({
                        personal: null,
                        shared: null,
                        witDefault: updatedChecklist
                    });
                }
                else {
                    const isPersonal = checklistType === ChecklistType.Personal;
                    const updatedChecklist = await ChecklistDataService.updateWorkItemChecklist(checklist, isPersonal);

                    ChecklistActionsHub.UpdateChecklist.invoke({
                        personal: isPersonal ? updatedChecklist : null,
                        shared: isPersonal ? null : updatedChecklist,
                        witDefault: null
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
}
