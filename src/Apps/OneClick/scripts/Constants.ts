import { getCurrentUser } from "Common/Utilities/Identity";
import { IRuleGroup } from "OneClick/Interfaces";

export namespace CoreFieldRefNames {
    export const AreaId = "System.AreaId";
    export const AttachedFileCount = "System.AttachedFileCount";
    export const AuthorizedAs = "System.AuthorizedAs";
    export const AuthorizedDate = "System.AuthorizedDate";
    export const BoardColumn = "System.BoardColumn";
    export const BoardColumnDone = "System.BoardColumnDone";
    export const BoardLane = "System.BoardLane";
    export const ChangedBy = "System.ChangedBy";
    export const ChangedDate = "System.ChangedDate";
    export const CreatedBy = "System.CreatedBy";
    export const CreatedDate = "System.CreatedDate";
    export const ExternalLinkCount = "System.ExternalLinkCount";
    export const History = "System.History";
    export const HyperLinkCount = "System.HyperLinkCount";
    export const Id = "System.Id";
    export const IterationId = "System.IterationId";
    export const LinkType = "System.Links.LinkType";
    export const NodeName = "System.NodeName";
    export const RelatedLinkCount = "System.RelatedLinkCount";
    export const Rev = "System.Rev";
    export const RevisedDate = "System.RevisedDate";
    export const TeamProject = "System.TeamProject";
    export const WorkItemType = "System.WorkItemType";
    export const Watermark = "System.Watermark";
    export const IsDeconsted = "System.IsDeconsted";
    export const Tags = "System.Tags";
    export const AreaPath = "System.AreaPath";
    export const IterationPath = "System.IterationPath";
    export const AttachedFiles = "System.AttachedFiles";
    export const BISLinks = "System.BISLinks";
    export const LinkedFiles = "System.LinkedFiles";
    export const RelatedLinks = "System.RelatedLinks";
    export const IntegrationBuild = "Microsoft.VSTS.Build.IntegrationBuild";
}

export const ExcludedFields = [
    CoreFieldRefNames.AreaId,
    CoreFieldRefNames.AttachedFileCount,
    CoreFieldRefNames.AuthorizedAs,
    CoreFieldRefNames.AuthorizedDate,
    CoreFieldRefNames.BoardColumn,
    CoreFieldRefNames.BoardLane,
    CoreFieldRefNames.BoardColumnDone,
    CoreFieldRefNames.ChangedBy,
    CoreFieldRefNames.ChangedDate,
    CoreFieldRefNames.CreatedBy,
    CoreFieldRefNames.CreatedDate,
    CoreFieldRefNames.ExternalLinkCount,
    CoreFieldRefNames.History,
    CoreFieldRefNames.HyperLinkCount,
    CoreFieldRefNames.Id,
    CoreFieldRefNames.IterationId,
    CoreFieldRefNames.LinkedFiles,
    CoreFieldRefNames.LinkType,
    CoreFieldRefNames.NodeName,
    CoreFieldRefNames.RelatedLinkCount,
    CoreFieldRefNames.Rev,
    CoreFieldRefNames.RevisedDate,
    CoreFieldRefNames.TeamProject,
    CoreFieldRefNames.WorkItemType,
    CoreFieldRefNames.Watermark,
    CoreFieldRefNames.IsDeconsted,
    CoreFieldRefNames.AttachedFiles,
    CoreFieldRefNames.BISLinks,
    CoreFieldRefNames.RelatedLinks,
    CoreFieldRefNames.IntegrationBuild
];

export namespace Constants {
    export const PersonalRuleGroupId = "personal";
    export const GlobalRuleGroupId = "global";
    export const StorageKey = "witoneclickactions";
    export const UserScope = { scopeType: "User" };
    export const AnyMacro = "@any";
}

export namespace SizeLimits {
    export const TitleMaxLength = 128;
    export const DescriptionMaxLength = 512;
}

export enum FormEvents {
    onLoaded = "onLoaded",
    onFieldChanged = "onFieldChanged",
    onSaved = "onSaved",
    onRefreshed = "onRefreshed",
    onReset = "onReset",
    onUnloaded = "onUnloaded",
}

export enum RuleGroupFieldNames {
    ID = "id",
    Version = "__etag",
    Name = "name",
    Description = "description",
    Disabled = "disabled",
    CreatedBy = "createdBy",
    LastUpdatedBy = "lastUpdatedBy"
}

export enum RuleFieldNames {
    ID = "id",
    Version = "__etag",
    Name = "name",
    Description = "description",
    Disabled = "disabled",
    HideOnForm = "hideOnForm",
    Color = "color",
    CreatedBy = "createdBy",
    LastUpdatedBy = "lastUpdatedBy",
    ProjectId = "projectId",
    WorkItemType = "workItemType"
}

export enum ErrorKeys {
    RuleGroupErrorKey = "RuleGroupError",
    RuleErrorKey = "RuleError"
}

export const PersonalRuleGroup: IRuleGroup = {
    id: Constants.PersonalRuleGroupId,
    name: "Personal",
    description: "This is your own personal rule group. Any rule created in this group would only be accessible to you.",
    createdBy: getCurrentUser(),
    workItemType: "",
    projectId: VSS.getWebContext().project && VSS.getWebContext().project.id,
    lastUpdatedBy: getCurrentUser()
};

export const GlobalRuleGroup: IRuleGroup = {
    id: Constants.GlobalRuleGroupId,
    name: "Global",
    description: "This is the globally shared rule group. Any rule created in this group would be accessible to everyone in the account.",
    createdBy: null,
    workItemType: "",
    projectId: VSS.getWebContext().project && VSS.getWebContext().project.id,
    lastUpdatedBy: null
};

export enum SettingKey {
    UserSubscriptions = "usub",
    PersonalRulesEnabled = "gsp",
    GlobalRulesEnabled = "gsg",
    WorkItemTypeEnabled = "gsw",
    UserRulesOrdering = "uro"
}
