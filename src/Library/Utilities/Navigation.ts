import { HostNavigationService } from "VSS/SDK/Services/Navigation";

let navigationService: HostNavigationService;

async function getNavigationService(): Promise<HostNavigationService> {
    if (!navigationService) {
        navigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
    }

    return navigationService;
}

// tslint:disable-next-line:export-name
export async function navigate(data?: IDictionaryStringTo<any>, replaceHistoryEntry?: boolean, mergeWithCurrentState?: boolean, windowTitle?: string, suppressNavigate?: boolean) {
    const navService = await getNavigationService();
    navService.updateHistoryEntry(null, data, replaceHistoryEntry, mergeWithCurrentState, windowTitle, suppressNavigate);
}
