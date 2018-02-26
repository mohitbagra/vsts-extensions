import { WorkItemRelationTypeActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemRelationTypeStore } from "Library/Flux/Stores/WorkItemRelationTypeStore";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";

export namespace WorkItemRelationTypeActions {
    const workItemRelationTypeStore: WorkItemRelationTypeStore = StoreFactory.getInstance<WorkItemRelationTypeStore>(WorkItemRelationTypeStore);

    export async function initializeWorkItemRelationTypes() {
        if (workItemRelationTypeStore.isLoaded()) {
            WorkItemRelationTypeActionsHub.InitializeWorkItemRelationTypes.invoke(null);
        }
        else if (!workItemRelationTypeStore.isLoading()) {
            workItemRelationTypeStore.setLoading(true);
            try {
                const workItemRelationTypes = await WitClient.getClient().getRelationTypes();
                workItemRelationTypes.sort((a: WorkItemRelationType, b: WorkItemRelationType) => localeIgnoreCaseComparer(a.name, b.name));

                WorkItemRelationTypeActionsHub.InitializeWorkItemRelationTypes.invoke(workItemRelationTypes);
                workItemRelationTypeStore.setLoading(false);
            }
            catch (e) {
                workItemRelationTypeStore.setLoading(false);
                throw e.message;
            }
        }
    }
}
