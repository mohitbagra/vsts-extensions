import { ClassificationNodeActionsHub } from "Common/Flux/Actions/ActionsHub";
import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import {
    ClassificationNodeKey, ClassificationNodeStore
} from "Common/Flux/Stores/ClassificationNodeStore";
import { getClient } from "Common/Utilities/WITRestClient";
import { TreeStructureGroup, WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";

export namespace ClassificationNodeActions {
    const classificationNodeStore: ClassificationNodeStore = StoreFactory.getInstance<ClassificationNodeStore>(ClassificationNodeStore);

    export async function initializeAreaPaths() {
        if (classificationNodeStore.isLoaded(ClassificationNodeKey.Area)) {
            ClassificationNodeActionsHub.InitializeAreaPaths.invoke(null);
        } else if (!classificationNodeStore.isLoading(ClassificationNodeKey.Area)) {
            classificationNodeStore.setLoading(true, ClassificationNodeKey.Area);
            try {
                const rootNode: WorkItemClassificationNode = await getClient().getClassificationNode(VSS.getWebContext().project.id, TreeStructureGroup.Areas, null, 5);
                ClassificationNodeActionsHub.InitializeAreaPaths.invoke(rootNode);
                classificationNodeStore.setLoading(false, ClassificationNodeKey.Area);
            } catch (e) {
                classificationNodeStore.setLoading(false, ClassificationNodeKey.Area);
                throw e.message;
            }
        }
    }

    export async function initializeIterationPaths() {
        if (classificationNodeStore.isLoaded(ClassificationNodeKey.Iteration)) {
            ClassificationNodeActionsHub.InitializeIterationPaths.invoke(null);
        } else if (!classificationNodeStore.isLoading(ClassificationNodeKey.Iteration)) {
            classificationNodeStore.setLoading(true, ClassificationNodeKey.Iteration);
            try {
                const rootNode: WorkItemClassificationNode = await getClient().getClassificationNode(VSS.getWebContext().project.id, TreeStructureGroup.Iterations, null, 5);
                ClassificationNodeActionsHub.InitializeIterationPaths.invoke(rootNode);
                classificationNodeStore.setLoading(false, ClassificationNodeKey.Iteration);
            } catch (e) {
                classificationNodeStore.setLoading(false, ClassificationNodeKey.Iteration);
                throw e.message;
            }
        }
    }
}
