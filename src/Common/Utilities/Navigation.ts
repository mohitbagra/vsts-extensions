import { HostNavigationService } from "VSS/SDK/Services/Navigation";

let hostNavigationService: HostNavigationService;

export async function getHostNavigationService(): Promise<HostNavigationService> {
    if (!hostNavigationService) {
        hostNavigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
    }

    return hostNavigationService;
}

// tslint:disable-next-line:export-name
export async function navigate(data?: IDictionaryStringTo<any>, replaceHistoryEntry?: boolean, mergeWithCurrentState?: boolean, windowTitle?: string, suppressNavigate?: boolean) {
    const navService = await getHostNavigationService();
    navService.updateHistoryEntry(null, data, replaceHistoryEntry, mergeWithCurrentState, windowTitle, suppressNavigate);
}

export async function reloadPage() {
    const navService = await getHostNavigationService();
    navService.reload();
}
