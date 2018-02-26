import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";

let navigationService: HostNavigationService;

async function getNavigationService(): Promise<HostNavigationService> {
    if (!navigationService) {
        navigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
    }

    return navigationService;
}

export async function navigate(data?: IDictionaryStringTo<any>, replaceHistoryEntry?: boolean, mergeWithCurrentState?: boolean, windowTitle?: string, suppressNavigate?: boolean) {
    const navService = await getNavigationService();
    navService.updateHistoryEntry(null, data, replaceHistoryEntry, mergeWithCurrentState, windowTitle, suppressNavigate);
}

export function getQueryUrl(workItems: WorkItem[], fields: string[]) {
    const {collection, project} = VSS.getWebContext();

    const fieldStr = fields.join(",");
    const ids = (workItems).map(w => w.id).join(",");

    const wiql = `SELECT ${fieldStr}
                FROM WorkItems
                WHERE [System.ID] IN (${ids})`;

    return `${collection.uri}/${project.name}/_queries/query/?wiql=${encodeURIComponent(wiql)}`;
}

export function getWorkItemUrl(workItemId: number) {
    const {collection, project} = VSS.getWebContext();
    return `${collection.uri}/${project.name}/_workitems/edit/${workItemId}`;
}
