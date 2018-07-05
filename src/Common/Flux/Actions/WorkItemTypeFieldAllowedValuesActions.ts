import { WorkItemTypeFieldAllowedValuesActionsHub } from "Common/Flux/Actions/ActionsHub";
import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import {
    WorkItemTypeFieldAllowedValuesStore
} from "Common/Flux/Stores/WorkItemTypeFieldAllowedValuesStore";
import { getClient } from "Common/Utilities/WITRestClient";
import { WorkItemTypeFieldsExpandLevel } from "TFS/WorkItemTracking/Contracts";

export namespace WorkItemTypeFieldAllowedValuesActions {
    const workItemTypeFieldStore: WorkItemTypeFieldAllowedValuesStore = StoreFactory.getInstance<WorkItemTypeFieldAllowedValuesStore>(WorkItemTypeFieldAllowedValuesStore);

    export async function initializeAllowedValues(workItemType: string, fieldRefName: string) {
        const key = `${workItemType}_${fieldRefName}`;

        if (workItemTypeFieldStore.isLoaded(key)) {
            WorkItemTypeFieldAllowedValuesActionsHub.InitializeAllowedValues.invoke(null);
        } else if (!workItemTypeFieldStore.isLoading(key)) {
            workItemTypeFieldStore.setLoading(true, key);
            try {
                const workItemTypeField = await getClient().getWorkItemTypeFieldWithReferences(
                    VSS.getWebContext().project.id,
                    workItemType,
                    fieldRefName,
                    WorkItemTypeFieldsExpandLevel.AllowedValues
                );

                WorkItemTypeFieldAllowedValuesActionsHub.InitializeAllowedValues.invoke({
                    workItemType: workItemType,
                    fieldRefName: fieldRefName,
                    allowedValues: workItemTypeField.allowedValues || []
                });
                workItemTypeFieldStore.setLoading(false, key);
            } catch (e) {
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
