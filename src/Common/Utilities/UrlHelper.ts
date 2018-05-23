import { WorkItem } from "TFS/WorkItemTracking/Contracts";

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

export function getWorkItemTypeSettingsUrl(witName: string, projectNameOrId?: string): string {
    const {collection, project} = VSS.getWebContext();
    const extensionId = `${VSS.getExtensionContext().publisherId}.${VSS.getExtensionContext().extensionId}`;
    return `${collection.uri}/${projectNameOrId || project.name}/_apps/hub/${extensionId}.settings-hub?witName=${witName}`;
}

export function getMarketplaceUrl(): string {
    const extensionId = `${VSS.getExtensionContext().publisherId}.${VSS.getExtensionContext().extensionId}`;
    return `https://marketplace.visualstudio.com/items?itemName=${extensionId}`;
}
