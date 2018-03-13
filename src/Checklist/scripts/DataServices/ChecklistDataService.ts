import { ChecklistItemState, IChecklistItem, IWorkItemChecklist } from "Checklist/Interfaces";
import { subtract } from "Library/Utilities/Array";
import * as ExtensionDataManager from "Library/Utilities/ExtensionDataManager";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";

export namespace ChecklistDataService {
    export async function loadChecklistForWorkItemType(workItemType: string, projectId?: string): Promise<IWorkItemChecklist> {
        const project = projectId || VSS.getWebContext().project.id;
        const model = await ExtensionDataManager.readDocument<IWorkItemChecklist>(`dc_${project}`, workItemType, {id: workItemType, checklistItems: []}, false);
        preprocessChecklist(model);
        return model;
    }

    export async function updateChecklistForWorkItemType(checklist: IWorkItemChecklist): Promise<IWorkItemChecklist> {
        const updatedChecklist = await ExtensionDataManager.addOrUpdateDocument<IWorkItemChecklist>(`dc_${VSS.getWebContext().project.id}`, checklist, false);
        preprocessChecklist(updatedChecklist);
        return updatedChecklist;
    }

    export async function loadWorkItemChecklist(workItemId: number, workItemType: string, projectId: string): Promise<IWorkItemChecklist[]> {
        const key = `${workItemId}`;

        const defaultChecklist = await loadChecklistForWorkItemType(workItemType, projectId);

        const models: IWorkItemChecklist[] = await Promise.all([
            ExtensionDataManager.readDocument<IWorkItemChecklist>("CheckListItems", key, {id: key, checklistItems: []}, true),
            ExtensionDataManager.readDocument<IWorkItemChecklist>("CheckListItems", key, {id: key, checklistItems: []}, false)
        ]);
        preprocessChecklist(models[0]);
        preprocessChecklist(models[1]);

        models[1].checklistItems = mergeChecklist(models[1].checklistItems, defaultChecklist.checklistItems);

        return models;
    }

    export async function updateWorkItemChecklist(checklist: IWorkItemChecklist, isPersonal: boolean): Promise<IWorkItemChecklist> {
        const updatedChecklist = await ExtensionDataManager.addOrUpdateDocument<IWorkItemChecklist>("CheckListItems", checklist, isPersonal);
        preprocessChecklist(updatedChecklist);
        return updatedChecklist;
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

    function mergeChecklist(workItemChecklistItems: IChecklistItem[], defaultChecklistItems: IChecklistItem[]): IChecklistItem[] {
        const defaultItemsInWorkItemChecklist = workItemChecklistItems.filter(i => i.isDefault);
        const itemsToAdd = subtract(defaultChecklistItems, workItemChecklistItems, (i1, i2) => stringEquals(i1.id, i2.id, true));
        const itemsToRemove = subtract(defaultItemsInWorkItemChecklist, defaultChecklistItems, (i1, i2) => stringEquals(i1.id, i2.id, true));

        const final = subtract(workItemChecklistItems, itemsToRemove, (i1, i2) => stringEquals(i1.id, i2.id, true));
        return itemsToAdd.concat(final);
    }
}
