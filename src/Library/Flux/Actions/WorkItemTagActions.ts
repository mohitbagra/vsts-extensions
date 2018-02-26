import { WorkItemTagActionsHub } from "Library/Flux/Actions/ActionsHub";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemTagStore } from "Library/Flux/Stores/WorkItemTagStore";
import { localeIgnoreCaseComparer } from "Library/Utilities/String";
import { WebApiTagDefinition } from "TFS/Core/Contracts";
import * as Auth from "VSS/Authentication/Services";

export namespace WorkItemTagActions {
    const tagsStore: WorkItemTagStore = StoreFactory.getInstance<WorkItemTagStore>(WorkItemTagStore);

    export async function initializeTags() {
        if (tagsStore.isLoaded()) {
            WorkItemTagActionsHub.InitializeTags.invoke(null);
        }
        else if (!tagsStore.isLoading()) {
            tagsStore.setLoading(true);
            try {
                const tags = await getTags();
                tags.sort((a: WebApiTagDefinition, b: WebApiTagDefinition) => localeIgnoreCaseComparer(a.name, b.name));
                WorkItemTagActionsHub.InitializeTags.invoke(tags);
                tagsStore.setLoading(false);
            }
            catch (e) {
                WorkItemTagActionsHub.InitializeTags.invoke([]);
                tagsStore.setLoading(false);
            }
        }
    }

    async function getTags(): Promise<WebApiTagDefinition[]> {
        const webContext = VSS.getWebContext();
        const accessToken = await VSS.getAccessToken();
        const authHeader = Auth.authTokenManager.getAuthorizationHeader(accessToken);
        const url = `${webContext.collection.uri}/_apis/tagging/scopes/${webContext.project.id}/tags`;

        const ajaxOptions = {
            url: url,
            method: "GET",
            data: null,
            beforeSend: (req) => {
                req.setRequestHeader("Authorization", authHeader);
                req.setRequestHeader("Accept", "application/json");
            }
        };

        const data = await $.ajax(ajaxOptions);
        return data.value;
    }
}
