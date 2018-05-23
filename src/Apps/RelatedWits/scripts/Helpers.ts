import { defaultDateComparer } from "Common/Utilities/Date";
import {
    caseInsensitiveContains, ignoreCaseComparer, isNullOrEmpty, stringEquals
} from "Common/Utilities/String";
import { ISortState, WorkItemFieldNames } from "RelatedWits/Models";
import { WorkItem } from "TFS/WorkItemTracking/Contracts";
import { IFilterState } from "VSSUI/Utilities/Filter";

const KeyTypes = {
    [WorkItemFieldNames.AreaPath]: "string",
    [WorkItemFieldNames.AssignedTo]: "string",
    [WorkItemFieldNames.Title]: "string",
    [WorkItemFieldNames.State]: "string",
    [WorkItemFieldNames.WorkItemType]: "string",
    [WorkItemFieldNames.ID]: "number",
};

export function workItemMatchesFilter(workItem: WorkItem, filterState: IFilterState): boolean {
    if (filterState == null) {
        return true;
    }

    // filter by keyword : title (all items) and reject reason
    const keyword = filterState["keyword"] && filterState["keyword"].value;
    if (!isNullOrEmpty(keyword)) {
        const title = workItem.fields[WorkItemFieldNames.Title];
        if (!caseInsensitiveContains(title, keyword)) {
            return false;
        }
    }

    // filter by work item state
    const states = filterState[WorkItemFieldNames.State] && filterState[WorkItemFieldNames.State].value;
    if (states && states.length > 0) {
        if (states.filter(v => stringEquals(v, workItem.fields[WorkItemFieldNames.State], true)).length === 0) {
            return false;
        }
    }

    // filter by work item assigned to
    const assignedTos = filterState[WorkItemFieldNames.AssignedTo] && filterState[WorkItemFieldNames.AssignedTo].value;
    if (assignedTos && assignedTos.length > 0) {
        if (assignedTos.filter(v => stringEquals(v, workItem.fields[WorkItemFieldNames.AssignedTo] || "Unassigned", true)).length === 0) {
            return false;
        }
    }

    // filter by work item area path
    const areaPaths = filterState[WorkItemFieldNames.AreaPath] && filterState[WorkItemFieldNames.AreaPath].value;
    if (areaPaths && areaPaths.length > 0) {
        if (areaPaths.filter(v => stringEquals(v, workItem.fields[WorkItemFieldNames.AreaPath], true)).length === 0) {
            return false;
        }
    }

    // filter by work item area path
    const workItemTypes = filterState[WorkItemFieldNames.WorkItemType] && filterState[WorkItemFieldNames.WorkItemType].value;
    if (workItemTypes && workItemTypes.length > 0) {
        if (workItemTypes.filter(v => stringEquals(v, workItem.fields[WorkItemFieldNames.WorkItemType], true)).length === 0) {
            return false;
        }
    }

    return true;
}

export function workItemComparer(workItem1: WorkItem, workItem2: WorkItem, sortState: ISortState): number {
    const sortKey = sortState.sortKey;
    const isSortedDescending = sortState.isSortedDescending;
    let compareValue: number = 0;

    const v1: string | Date | number | boolean = sortKey === WorkItemFieldNames.ID ? workItem1.id : workItem1.fields[sortKey];
    const v2: string | Date | number | boolean = sortKey === WorkItemFieldNames.ID ? workItem2.id : workItem2.fields[sortKey];

    if (v1 == null && v2 == null) {
        compareValue = 0;
    }
    else if (v1 == null && v2 != null) {
        compareValue = -1;
    }
    else if (v1 != null && v2 == null) {
        compareValue = 1;
    }
    else if (KeyTypes[sortKey] === "string") {
        compareValue = ignoreCaseComparer(v1 as string, v2 as string);
    }
    else if (KeyTypes[sortKey] === "date") {
        compareValue = defaultDateComparer(v1 as Date, v2 as Date);
    }
    else if (KeyTypes[sortKey] === "boolean") {
        const b1 = !v1 ? "False" : "True";
        const b2 = !v2 ? "False" : "True";
        compareValue = ignoreCaseComparer(b1, b2);
    }
    else if (KeyTypes[sortKey] === "number") {
        compareValue = (v1 > v2) ? 1 : -1;
    }

    return isSortedDescending ? -1 * compareValue : compareValue;
}
