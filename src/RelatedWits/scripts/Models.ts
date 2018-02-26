import * as WitContracts from "TFS/WorkItemTracking/Contracts";

export interface ISettings {
    fields: string[];
    sortByField: string;
    top?: number;
}

export enum WorkItemFieldNames {
    Title = "System.Title",
    ID = "System.ID",
    AssignedTo = "System.AssignedTo",
    State = "System.State",
    AreaPath = "System.AreaPath",
    WorkItemType = "System.WorkItemType"
}

export interface ISortState {
    sortKey: WorkItemFieldNames;
    isSortedDescending: boolean;
}

export namespace Constants {
    export const StorageKey = "rwf";
    export const UserScope = { scopeType: "User" };

    export const DEFAULT_SORT_BY_FIELD = "System.ChangedDate";
    export const DEFAULT_RESULT_SIZE = 20;

    export const DEFAULT_FIELDS_TO_RETRIEVE = [
        "System.ID",
        "System.WorkItemType",
        "System.Title",
        "System.AssignedTo",
        "System.AreaPath",
        "System.State",
    ];

    export const DEFAULT_FIELDS_TO_SEEK = [
        "System.WorkItemType",
        "System.Tags",
        "System.State",
        "System.AreaPath"
    ];

    export const DEFAULT_SETTINGS = {
        fields: Constants.DEFAULT_FIELDS_TO_SEEK,
        sortByField: Constants.DEFAULT_SORT_BY_FIELD,
        top: Constants.DEFAULT_RESULT_SIZE
    };

    export const QueryableFieldTypes = [
        WitContracts.FieldType.Boolean,
        WitContracts.FieldType.Double,
        WitContracts.FieldType.Integer,
        WitContracts.FieldType.String,
        WitContracts.FieldType.TreePath
    ];

    export const SortableFieldTypes = [
        WitContracts.FieldType.DateTime,
        WitContracts.FieldType.Double,
        WitContracts.FieldType.Integer,
        WitContracts.FieldType.String,
        WitContracts.FieldType.TreePath
    ];

    export const ExcludedFields = [
        "System.AttachedFiles",
        "System.AttachedFileCount",
        "System.ExternalLinkCount",
        "System.HyperLinkCount",
        "System.BISLinks",
        "System.LinkedFiles",
        "System.PersonId",
        "System.RelatedLinks",
        "System.RelatedLinkCount",
        "System.TeamProject",
        "System.Rev",
        "System.Watermark",
        "Microsoft.VSTS.Build.IntegrationBuild"
    ];
}
