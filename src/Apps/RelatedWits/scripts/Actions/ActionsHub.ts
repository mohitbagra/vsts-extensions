import { Action } from "Common/Flux/Actions/Action";
import { ISortState } from "RelatedWits/Models";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { IFilterState } from "VSSUI/Utilities/Filter";

export namespace ActionsHub {
    export const Refresh = new Action<WorkItem[]>();
    export const ApplyFilter = new Action<IFilterState>();
    export const ClearSortAndFilter = new Action<void>();
    export const ApplySort = new Action<ISortState>();
    export const Clean = new Action<void>();
    export const UpdateWorkItemInStore = new Action<WorkItem>();
}
