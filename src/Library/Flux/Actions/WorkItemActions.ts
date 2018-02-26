import { WorkItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemStore } from "Library/Flux/Stores/WorkItemStore";
import { WorkItem, WorkItemErrorPolicy } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "VSS/WebApi/Contracts";

export namespace WorkItemActions {
    const workItemStore: WorkItemStore = StoreFactory.getInstance<WorkItemStore>(WorkItemStore);

    export async function initializeWorkItems(ids: number[]) {
        if (!ids || ids.length === 0) {
            WorkItemActionsHub.AddOrUpdateWorkItems.invoke(null);
        }
        else if (!workItemStore.isLoading()) {
            const idsToFetch: number[] = [];
            for (const id of ids) {
                if (!workItemStore.isLoaded(id)) {
                    idsToFetch.push(id);
                }
            }

            if (idsToFetch.length === 0) {
                WorkItemActionsHub.AddOrUpdateWorkItems.invoke(null);
                return;
            }

            workItemStore.setLoading(true);

            try {
                const workItems = await WitClient.getClient().getWorkItems(idsToFetch, null, null, null, WorkItemErrorPolicy.Omit);

                WorkItemActionsHub.AddOrUpdateWorkItems.invoke(filterNullWorkItems(workItems, idsToFetch));
                workItemStore.setLoading(false);
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export async function refreshWorkItems(ids: number[]) {
        if (!ids || ids.length === 0) {
            WorkItemActionsHub.AddOrUpdateWorkItems.invoke(null);
        }
        else if (!workItemStore.isLoading()) {
            workItemStore.setLoading(true);

            try {
                const workItems = await WitClient.getClient().getWorkItems(ids, null, null, null, WorkItemErrorPolicy.Omit);
                WorkItemActionsHub.AddOrUpdateWorkItems.invoke(filterNullWorkItems(workItems, ids));
                workItemStore.setLoading(false);
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export async function initializeWorkItem(id: number) {
        if (!workItemStore.isLoaded(id)) {
            WorkItemActionsHub.AddOrUpdateWorkItems.invoke(null);
        }
        else if (!workItemStore.isLoading()) {
            workItemStore.setLoading(true);

            try {
                const workItem = await WitClient.getClient().getWorkItem(id);
                WorkItemActionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                workItemStore.setLoading(false);
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export async function refreshWorkItem(id: number) {
        if (!workItemStore.isLoading()) {
            workItemStore.setLoading(true);

            try {
                const workItem = await WitClient.getClient().getWorkItem(id);
                WorkItemActionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                workItemStore.setLoading(false);
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export async function createWorkItem(workItemType: string, fieldValues: IDictionaryStringTo<string>): Promise<WorkItem> {
        if (!workItemStore.isLoading()) {
            workItemStore.setLoading(true);

            const patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
            for (const fieldRefName of Object.keys(fieldValues)) {
                patchDocument.push({
                    op: Operation.Add,
                    path: `/fields/${fieldRefName}`,
                    value: fieldValues[fieldRefName]
                } as JsonPatchOperation);
            }

            try {
                const workItem = await WitClient.getClient().createWorkItem(patchDocument, VSS.getWebContext().project.id, workItemType);
                WorkItemActionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                workItemStore.setLoading(false);
                return workItem;
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export async function updateWorkItem(workItemId: number, fieldValues: IDictionaryStringTo<string>): Promise<WorkItem> {
        if (!workItemStore.isLoading()) {
            workItemStore.setLoading(true);

            const patchDocument: JsonPatchDocument & JsonPatchOperation[] = [];
            for (const fieldRefName of Object.keys(fieldValues)) {
                patchDocument.push({
                    op: Operation.Add,
                    path: `/fields/${fieldRefName}`,
                    value: fieldValues[fieldRefName]
                } as JsonPatchOperation);
            }

            try {
                const workItem = await WitClient.getClient().updateWorkItem(patchDocument, workItemId);
                WorkItemActionsHub.AddOrUpdateWorkItems.invoke([workItem]);
                workItemStore.setLoading(false);
                return workItem;
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export async function deleteWorkItem(workItemId: number, destroy?: boolean): Promise<void> {
        if (!workItemStore.isLoading()) {
            workItemStore.setLoading(true);

            try {
                await WitClient.getClient().deleteWorkItem(workItemId, destroy);
                WorkItemActionsHub.DeleteWorkItems.invoke([workItemId]);
                workItemStore.setLoading(false);
            }
            catch (e) {
                workItemStore.setLoading(false);
                throw e.message;
            }
        }
    }

    export function refreshWorkItemInStore(workItems: WorkItem[]) {
        WorkItemActionsHub.AddOrUpdateWorkItems.invoke(workItems);
    }

    export function clearWorkItemsCache() {
        WorkItemActionsHub.ClearWorkItems.invoke(null);
    }

    function filterNullWorkItems(workItems: WorkItem[], idsToFetch: number[]): WorkItem[] {
        const workItemsMap = {};
        for (const workItem of workItems) {
            if (workItem) {
                workItemsMap[workItem.id] = workItem;
            }
        }

        const filteredWorkItems: WorkItem[] = [];
        for (const witId of idsToFetch) {
            if (!workItemsMap[witId]) {
                filteredWorkItems.push({
                    id: witId,
                    fields: {},
                    relations: [],
                    rev: -1,
                    _links: null,
                    url: null
                });
            }
            else {
                filteredWorkItems.push(workItemsMap[witId]);
            }
        }

        return filteredWorkItems;
    }
}
