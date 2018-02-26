import { WorkItemStateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemStateItemStore } from "Library/Flux/Stores/WorkItemStateItemStore";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export namespace WorkItemStateItemActions {
    const workItemStateItemStore: WorkItemStateItemStore = StoreFactory.getInstance<WorkItemStateItemStore>(WorkItemStateItemStore);

    export async function initializeWorkItemStates(workItemTypeName: string) {
        if (workItemStateItemStore.isLoaded(workItemTypeName)) {
            WorkItemStateItemActionsHub.InitializeWorkItemStateItems.invoke(null);
        }
        else if (!workItemStateItemStore.isLoading(workItemTypeName)) {
            workItemStateItemStore.setLoading(true, workItemTypeName);
            try {
                const workItemTypeStates = await WitClient.getClient().getWorkItemTypeStates(VSS.getWebContext().project.id, workItemTypeName);
                WorkItemStateItemActionsHub.InitializeWorkItemStateItems.invoke({witName: workItemTypeName, states: workItemTypeStates});
                workItemStateItemStore.setLoading(false, workItemTypeName);
            }
            catch (e) {
                workItemStateItemStore.setLoading(false, workItemTypeName);
                throw e.message;
            }
        }
    }
}
