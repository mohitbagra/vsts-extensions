import { WorkItemTemplateActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemTemplateStore } from "Library/Flux/Stores/WorkItemTemplateStore";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemTemplateReference } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export namespace WorkItemTemplateActions {
    const workItemTemplateStore: WorkItemTemplateStore = StoreFactory.getInstance<WorkItemTemplateStore>(WorkItemTemplateStore);

    export async function initializeWorkItemTemplates(teamId: string) {
        if (workItemTemplateStore.isLoaded(teamId)) {
            WorkItemTemplateActionsHub.InitializeWorkItemTemplates.invoke(null);
        }
        else if (!workItemTemplateStore.isLoading(teamId)) {
            workItemTemplateStore.setLoading(true, teamId);
            try {
                const workItemTemplates = await WitClient.getClient().getTemplates(VSS.getWebContext().project.id, teamId);
                workItemTemplates.sort((a: WorkItemTemplateReference, b: WorkItemTemplateReference) => localeIgnoreCaseComparer(a.name, b.name));

                WorkItemTemplateActionsHub.InitializeWorkItemTemplates.invoke({teamId: teamId, templates: workItemTemplates});
                workItemTemplateStore.setLoading(false, teamId);
            }
            catch (e) {
                workItemTemplateStore.setLoading(false, teamId);
                throw e.message;
            }
        }
    }
}
