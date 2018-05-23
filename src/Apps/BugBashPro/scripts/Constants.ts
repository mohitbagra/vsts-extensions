export const ChangelogMajorVersion = "3.3";

export enum UrlActions {
    ACTION_ALL = "all",
    ACTION_RESULTS = "results",
    ACTION_EDIT = "edit",
    ACTION_CHARTS = "charts",
    ACTION_DETAILS = "details"
}

export enum BugBashViewActions {
    AllItems = "All Items",
    PendingItemsOnly = "Pending Items",
    RejectedItemsOnly = "Rejected Items",
    AcceptedItemsOnly = "Accepted Items"
}

export enum ErrorKeys {
    DirectoryPageError = "DirectoryPageError",
    BugBashError = "BugBashError",
    BugBashDetailsError = "BugBashDetailsError",
    BugBashItemError = "BugBashItemError",
    BugBashSettingsError = "BugBashSettingsError"
}

export enum BugBashFieldNames {
    ID = "id",
    Version = "__etag",
    Title = "title",
    WorkItemType = "workItemType",
    ProjectId = "projectId",
    ItemDescriptionField = "itemDescriptionField",
    AutoAccept = "autoAccept",
    StartTime = "startTime",
    EndTime = "endTime",
    DefaultTeam = "defaultTeam",
    AcceptTemplateTeam = "acceptTemplateTeam",
    AcceptTemplateId = "acceptTemplateId"
}

export enum BugBashItemFieldNames {
    ID = "id",
    Version = "__etag",
    Title = "title",
    Description = "description",
    BugBashId = "bugBashId",
    WorkItemId = "workItemId",
    TeamId = "teamId",
    CreatedDate = "createdDate",
    CreatedBy = "createdBy",
    Rejected = "rejected",
    RejectReason = "rejectReason",
    RejectedBy = "rejectedBy",
    Status = "status"
}

export enum WorkItemFieldNames {
    Title = "System.Title",
    ID = "System.ID",
    AssignedTo = "System.AssignedTo",
    State = "System.State",
    AreaPath = "System.AreaPath",
    WorkItemType = "System.WorkItemType"
}

export namespace SizeLimits {
    export const TitleFieldMaxLength = 255;
    export const RejectFieldMaxLength = 128;
}

export enum DirectoryPagePivotKeys {
    Ongoing = "ongoing",
    Upcoming = "upcoming",
    Past = "past"
}

export enum BugBashViewPivotKeys {
    Results = "results",
    Edit = "edit",
    Charts = "charts",
    Details = "details"
}

export namespace HubKeys {
    export const BugBashViewOptionsKey = "bugbash-viewoption";
}
