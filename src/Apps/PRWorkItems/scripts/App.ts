import { reloadPage } from "Common/Utilities/Navigation";
import { getFormNavigationService } from "Common/Utilities/WorkItemFormHelpers";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "VSS/WebApi/Contracts";

const extensionContext = VSS.getExtensionContext();

VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.context-menu`, () => ({
    execute: async (actionContext) => {
        if (actionContext && actionContext.pullRequest && actionContext.pullRequest.artifactId) {
            const workItemNavSvc = await getFormNavigationService();
            const workItem = await workItemNavSvc.openNewWorkItem("Bug");

            if (workItem && workItem.id) {
                const witClient = WitClient.getClient();
                const patchDocument: JsonPatchDocument & JsonPatchOperation[] = [
                    {
                        op: Operation.Add,
                        path: "/relations/-",
                        value: {
                            rel: "ArtifactLink",
                            url: actionContext.pullRequest.artifactId,
                            attributes: {
                                name: "Pull Request"
                            }
                        }
                    } as JsonPatchOperation
                ];
                try {
                    await witClient.updateWorkItem(patchDocument, workItem.id);
                    reloadPage();
                }
                catch (e) {
                    console.warn(`Cannot create workitem: ${e.message}`);
                }
            }
        }
    }
}));
