import { first } from "Library/Utilities/Array";
import { stringEquals } from "Library/Utilities/String";
import { WorkItem, WorkItemField } from "TFS/WorkItemTracking/Contracts";
import {
    IWorkItemFormService, WorkItemFormNavigationService, WorkItemFormService
} from "TFS/WorkItemTracking/Services";

let workItemFormService: IWorkItemFormService;

async function getFormService(): Promise<IWorkItemFormService> {
    if (!workItemFormService) {
        workItemFormService = await WorkItemFormService.getService();
    }

    return workItemFormService;
}

export async function openWorkItemDialog(e: React.MouseEvent<HTMLElement>, item: WorkItem): Promise<WorkItem> {
    const newTab = e ? e.ctrlKey : false;
    const workItemNavSvc = await WorkItemFormNavigationService.getService();
    return await workItemNavSvc.openWorkItem(item.id, newTab);
}

export async function getWorkItemAllowedFieldValues(fieldRefName: string): Promise<string[]> {
    const formService = await getFormService();
    return await formService.getAllowedFieldValues(fieldRefName) as string[];
}

export async function getWorkItemFieldValue(fieldName: string, original?: boolean): Promise<Object> {
    const formService = await getFormService();
    return await formService.getFieldValue(fieldName, original);
}

export async function getWorkItemFieldValues(fieldNames: string[], original?: boolean): Promise<IDictionaryStringTo<Object>> {
    const formService = await getFormService();
    return await formService.getFieldValues(fieldNames, original);
}

export async function getWorkItemFields(): Promise<WorkItemField[]> {
    const formService = await getFormService();
    return await formService.getFields();
}

export async function getWorkItemField(fieldName: string): Promise<WorkItemField> {
    const fields = await getWorkItemFields();
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

export async function setWorkItemFieldValue(fieldRefName: string, value: Object): Promise<boolean> {
    const formService = await getFormService();
    return await formService.setFieldValue(fieldRefName, value);
}

export async function setWorkItemFieldValues(fieldToValueMap: IDictionaryStringTo<Object>): Promise<IDictionaryStringTo<boolean>> {
    const formService = await getFormService();
    return await formService.setFieldValues(fieldToValueMap);
}

export async function saveWorkItem(successCallback: () => void, errorCallback: () => void): Promise<void> {
    const formService = await getFormService();
    return await formService.beginSaveWorkItem(successCallback, errorCallback);
}
