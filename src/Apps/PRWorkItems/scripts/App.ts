import { contains } from "Common/Utilities/Array";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { reloadPage } from "Common/Utilities/Navigation";
import { stringEquals } from "Common/Utilities/String";
import { getFormNavigationService } from "Common/Utilities/WorkItemFormHelpers";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "VSS/WebApi/Contracts";

const extensionContext = VSS.getExtensionContext();
let configuredWorkItemTypes: WorkItemType[];

VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.context-menu`, () => ({
    getMenuItems: async (actionContext) => {
        if (actionContext && actionContext.pullRequest && actionContext.pullRequest.artifactId) {
            const [workItemNavSvc, witClient] = await Promise.all([
                getFormNavigationService(),
                WitClient.getClient()
            ]);
            if (!configuredWorkItemTypes) {
                const projectId = VSS.getWebContext().project.id;
                const [configuredWorkItemTypesSetting, allWorkItemTypes] = await Promise.all([
                    ExtensionDataManager.readSetting(`wits_${projectId}`, ["Bug", "User Story"], false),
                    witClient.getWorkItemTypes(projectId)
                ]);

                configuredWorkItemTypes = allWorkItemTypes.filter(w => contains(configuredWorkItemTypesSetting, w.name, (w1, w2) => stringEquals(w1, w2, true)));
            }

            const childMenuItems: IContributedMenuItem[] = configuredWorkItemTypes.map(w => ({
                text: w.name,
                title: w.name,
                action: async () => {
                    const workItem = await workItemNavSvc.openNewWorkItem(w.name);
                    if (workItem && workItem.id) {
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
            }));
            childMenuItems.push(
                {
                    separator: true
                },
                {
                    text: "Configure",
                    title: "Configure Work item types",
                    action: async () => {
                        // open dialog
                    }
                }
            );

            return [{
                text: "Link to a new workitem",
                title: "Create a new workitem and link to this Pull request",
                icon: `${VSS.getExtensionContext().baseUri}/images/logo.png`,
                childItems: childMenuItems
            }];
        }
    }
}));
