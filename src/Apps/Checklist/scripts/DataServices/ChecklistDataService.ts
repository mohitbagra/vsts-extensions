import {
    ChecklistItemState, IChecklistItem, IWorkItemChecklist, IWorkItemChecklists
} from "Checklist/Interfaces";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { isNullOrWhiteSpace } from "Common/Utilities/String";

export namespace ChecklistDataService {
    export async function loadChecklistForWorkItemType(workItemType: string, projectId?: string): Promise<IWorkItemChecklist> {
        const project = projectId || VSS.getWebContext().project.id;
        const model = await ExtensionDataManager.readDocument<IWorkItemChecklist>(`dcwit_${project}`, workItemType, {id: workItemType, checklistItems: []}, false);
        preprocessChecklist(model);
        return model;
    }

    export async function updateChecklistForWorkItemType(checklist: IWorkItemChecklist): Promise<IWorkItemChecklist> {
        const updatedChecklist = await ExtensionDataManager.addOrUpdateDocument<IWorkItemChecklist>(`dcwit_${VSS.getWebContext().project.id}`, checklist, false);
        preprocessChecklist(updatedChecklist);
        return updatedChecklist;
    }

    export async function loadDefaultChecklistForWorkItem(workItemId: number): Promise<IWorkItemChecklist> {
        const key = `${workItemId}`;
        const model = await ExtensionDataManager.readDocument<IWorkItemChecklist>("DefaultCheckList", key, {id: key, checklistItems: []}, false);
        preprocessChecklist(model);
        return model;
    }

    export async function updateDefaultChecklistForWorkItem(checklist: IWorkItemChecklist): Promise<IWorkItemChecklist> {
        const updatedChecklist = await ExtensionDataManager.addOrUpdateDocument<IWorkItemChecklist>("DefaultCheckList", checklist, false);
        preprocessChecklist(updatedChecklist);
        return updatedChecklist;
    }

    export async function loadWorkItemChecklists(workItemId: number, workItemType: string, projectId: string): Promise<IWorkItemChecklists> {
        const key = `${workItemId}`;

        const models: IWorkItemChecklist[] = await Promise.all([
            loadChecklistForWorkItemType(workItemType, projectId),
            loadDefaultChecklistForWorkItem(workItemId),
            ExtensionDataManager.readDocument<IWorkItemChecklist>("CheckListItems", key, {id: key, checklistItems: []}, true),
            ExtensionDataManager.readDocument<IWorkItemChecklist>("CheckListItems", key, {id: key, checklistItems: []}, false)
        ]);
        preprocessChecklist(models[2]);
        preprocessChecklist(models[3]);

        return {
            personal: models[2],
            shared: models[3],
            witDefault: mergeDefaultChecklists(models[0], models[1])
        };
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

    function mergeDefaultChecklists(workItemTypeChecklist: IWorkItemChecklist, workItemChecklist: IWorkItemChecklist): IWorkItemChecklist {
        const mergedChecklist: IWorkItemChecklist = {...workItemChecklist, checklistItems: []};

        const workItemChecklistItemsMap: IDictionaryStringTo<IChecklistItem> = {};
        for (const checklistItem of workItemChecklist.checklistItems) {
            workItemChecklistItemsMap[checklistItem.id.toLowerCase()] = checklistItem;
        }

        for (const checklistItem of workItemTypeChecklist.checklistItems) {
            const key = checklistItem.id.toLowerCase();
            if (workItemChecklistItemsMap[key] == null) {
                mergedChecklist.checklistItems.push(checklistItem);
            }
            else {
                const workItemChecklistItem = workItemChecklistItemsMap[key];
                mergedChecklist.checklistItems.push({...workItemChecklistItem, text: checklistItem.text, required: checklistItem.required});
            }
        }

        return mergedChecklist;
    }
}
