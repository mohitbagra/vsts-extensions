import { first } from "Common/Utilities/Array";
import { stringEquals } from "Common/Utilities/String";
import { WorkItem, WorkItemField } from "TFS/WorkItemTracking/Contracts";
import {
    IWorkItemFormNavigationService, IWorkItemFormService, WorkItemFormNavigationService,
    WorkItemFormService
} from "TFS/WorkItemTracking/Services";

let workItemFormService: IWorkItemFormService;
let workItemFormNavigationService: IWorkItemFormNavigationService;

export async function getFormService(): Promise<IWorkItemFormService> {
    if (!workItemFormService) {
        workItemFormService = await WorkItemFormService.getService();
    }

    return workItemFormService;
}

export async function getFormNavigationService(): Promise<IWorkItemFormNavigationService> {
    if (!workItemFormNavigationService) {
        workItemFormNavigationService = await WorkItemFormNavigationService.getService();
    }

    return workItemFormNavigationService;
}

export async function openWorkItemDialog(e: React.MouseEvent<HTMLElement>, item: WorkItem): Promise<WorkItem> {
    const newTab = e ? e.ctrlKey : false;
    const workItemNavSvc = await WorkItemFormNavigationService.getService();
    return await workItemNavSvc.openWorkItem(item.id, newTab);
}

export async function getWorkItemType(): Promise<string> {
    const formService = await getFormService();
    return await formService.getFieldValue("System.WorkItemType", true) as string;
}

export async function getWorkItemProject(): Promise<string> {
    const formService = await getFormService();
    return await formService.getFieldValue("System.TeamProject", true) as string;
}

export async function getWorkItemField(fieldName: string): Promise<WorkItemField> {
    const service = await getFormService();
    const fields = await service.getFields();
    const field = first(fields, (f: WorkItemField) => {
        return stringEquals(f.name, fieldName, true) || stringEquals(f.referenceName, fieldName, true);
    });

    if (field) {
        return field;
    }
    else {
        throw `Field '${fieldName}' does not exist in this work item type`;
    }
}
