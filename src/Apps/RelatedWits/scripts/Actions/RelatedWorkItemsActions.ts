import { ActionsHub } from "RelatedWits/Actions/ActionsHub";
import { Constants, ISortState } from "RelatedWits/Models";
import { StoresHub } from "RelatedWits/Stores/StoresHub";
import { WorkItem, WorkItemErrorPolicy } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { IFilterState } from "VSSUI/Utilities/Filter";

export namespace RelatedWorkItemsActions {
    export function applyFilter(filterState: IFilterState) {
        ActionsHub.ApplyFilter.invoke(filterState);
    }

    export function clearSortAndFilter() {
        ActionsHub.ClearSortAndFilter.invoke(null);
    }

    export function applySort(sortState: ISortState) {
        ActionsHub.ApplySort.invoke(sortState);
    }

    export function clean() {
        ActionsHub.Clean.invoke(null);
    }

    export function updateWorkItemInStore(workItem: WorkItem) {
        ActionsHub.UpdateWorkItemInStore.invoke(workItem);
    }

    export async function refresh(query: {project: string, wiql: string}, top: number) {
        if (!StoresHub.relatedWorkItemsStore.isLoading()) {
            StoresHub.relatedWorkItemsStore.setLoading(true);

            let workItems: WorkItem[];
            const queryResult = await WitClient.getClient().queryByWiql({query: query.wiql}, query.project, null, false, top);
            if (queryResult.workItems && queryResult.workItems.length > 0) {
                workItems = await WitClient.getClient().getWorkItems(queryResult.workItems.map(w => w.id), Constants.DEFAULT_FIELDS_TO_RETRIEVE, null, null, WorkItemErrorPolicy.Omit);
            }
            else {
                workItems = [];
            }

            ActionsHub.Refresh.invoke(workItems);
            StoresHub.relatedWorkItemsStore.setLoading(false);
        }
    }
}
