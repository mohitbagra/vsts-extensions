import { WorkItemTypeFieldAllowedValuesActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import {
    WorkItemTypeFieldAllowedValuesStore
} from "Library/Flux/Stores/WorkItemTypeFieldAllowedValuesStore";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import * as VSS_Service from "VSS/Service";

export namespace WorkItemTypeFieldAllowedValuesActions {
    const workItemTypeFieldStore: WorkItemTypeFieldAllowedValuesStore = StoreFactory.getInstance<WorkItemTypeFieldAllowedValuesStore>(WorkItemTypeFieldAllowedValuesStore);

    export async function initializeAllowedValues(workItemType: string, fieldRefName: string) {
        const key = `${workItemType}_${fieldRefName}`;

        if (workItemTypeFieldStore.isLoaded(key)) {
            WorkItemTypeFieldAllowedValuesActionsHub.InitializeAllowedValues.invoke(null);
        }
        else if (!workItemTypeFieldStore.isLoading(key)) {
            workItemTypeFieldStore.setLoading(true, key);
            try {
                const client = await VSS_Service.getClient<WitClient.WorkItemTrackingHttpClient4_1>(WitClient.WorkItemTrackingHttpClient4_1);
                const workItemTypeField = await (client as any).getWorkItemTypeField(VSS.getWebContext().project.id, workItemType, fieldRefName, 1);

                WorkItemTypeFieldAllowedValuesActionsHub.InitializeAllowedValues.invoke({
                    workItemType: workItemType,
                    fieldRefName: fieldRefName,
                    allowedValues: workItemTypeField.allowedValues || []
                });
                workItemTypeFieldStore.setLoading(false, key);
            }
            catch (e) {
                WorkItemTypeFieldAllowedValuesActionsHub.InitializeAllowedValues.invoke({
                    workItemType: workItemType,
                    fieldRefName: fieldRefName,
                    allowedValues: []
                });
                workItemTypeFieldStore.setLoading(false, key);
            }
        }
    }
}
