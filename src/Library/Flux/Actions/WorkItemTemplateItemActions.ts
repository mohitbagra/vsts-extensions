import { WorkItemTemplateItemActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemTemplateItemStore } from "Library/Flux/Stores/WorkItemTemplateItemStore";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export namespace WorkItemTemplateItemActions {
    const workItemTemplateItemStore: WorkItemTemplateItemStore = StoreFactory.getInstance<WorkItemTemplateItemStore>(WorkItemTemplateItemStore);

    export async function initializeWorkItemTemplateItem(teamId: string, id: string, projectId?: string) {
        if (workItemTemplateItemStore.isLoaded(id)) {
            WorkItemTemplateItemActionsHub.InitializeWorkItemTemplateItem.invoke(null);
        }
        else if (!workItemTemplateItemStore.isLoading(id)) {
            workItemTemplateItemStore.setLoading(true, id);
            try {
                const workItemTemplate = await WitClient.getClient().getTemplate(projectId || VSS.getWebContext().project.id, teamId, id);
                WorkItemTemplateItemActionsHub.InitializeWorkItemTemplateItem.invoke(workItemTemplate);
                workItemTemplateItemStore.setLoading(false, id);
            }
            catch (e) {
                workItemTemplateItemStore.setLoading(false, id);
                throw e.message;
            }
        }
    }
}
