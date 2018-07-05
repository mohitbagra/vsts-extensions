import { WorkItemTrackingHttpClient5 } from "TFS/WorkItemTracking/RestClient";
import * as VSS_Service from "VSS/Service";

export function getClient(): WorkItemTrackingHttpClient5 {
    return VSS_Service.getClient<WorkItemTrackingHttpClient5>(WorkItemTrackingHttpClient5);
}
