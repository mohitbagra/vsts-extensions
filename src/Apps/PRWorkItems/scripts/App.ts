import { contains } from "Common/Utilities/Array";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { reloadPage } from "Common/Utilities/Navigation";
import { stringEquals } from "Common/Utilities/String";
import { getFormNavigationService } from "Common/Utilities/WorkItemFormHelpers";
import * as Q from "q";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";
import * as WitClient from "TFS/WorkItemTracking/RestClient";
import { JsonPatchDocument, JsonPatchOperation, Operation } from "VSS/WebApi/Contracts";

const extensionContext = VSS.getExtensionContext();
let configuredWorkItemTypes: WorkItemType[];

async function getChildItems(artifactId: string): Promise<IContributedMenuItem[]> {
    const [workItemNavSvc, witClient] = await Promise.all([getFormNavigationService(), WitClient.getClient()]);
    const projectId = VSS.getWebContext().project.id;

    if (!configuredWorkItemTypes) {
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
                            url: artifactId,
                            attributes: {
                                name: "Pull Request"
                            }
                        }
                    } as JsonPatchOperation
                ];
                try {
                    await witClient.updateWorkItem(patchDocument, workItem.id);
                    reloadPage();
                } catch (e) {
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
                const dialogService: IHostDialogService = <IHostDialogService>await VSS.getService(VSS.ServiceIds.Dialog);
                const extInfo = VSS.getExtensionContext();
                const dialogContributionId = `${extInfo.publisherId}.${extInfo.extensionId}.configure-dialog`;
                const dialogOptions: IHostDialogOptions = {
                    title: "Configure work item types",
                    width: 500,
                    height: 500,
                    modal: true,
                    buttons: {}
                };

                dialogService.openDialog(dialogContributionId, dialogOptions);
            }
        }
    );

    return childMenuItems;
}

VSS.register(`${extensionContext.publisherId}.${extensionContext.extensionId}.context-menu`, () => ({
    getMenuItems: actionContext => {
        if (actionContext && actionContext.pullRequest && actionContext.pullRequest.artifactId) {
            const deferred = Q.defer<IContributedMenuItem[]>();
            getChildItems(actionContext.pullRequest.artifactId).then(items => deferred.resolve(items));

            return [
                {
                    text: "Link to a new workitem",
                    title: "Create a new workitem and link to this Pull request",
                    icon: `${VSS.getExtensionContext().baseUri}/images/logo.png`,
                    childItems: deferred.promise
                }
            ];
        }
    }
}));
