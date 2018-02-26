import { Action } from "Library/Flux/Actions/Action";
import { WebApiTagDefinition, WebApiTeam } from "TFS/Core/Contracts";
import { GitRepository } from "TFS/VersionControl/Contracts";
import { TeamFieldValues } from "TFS/Work/Contracts";
import {
    WorkItem, WorkItemClassificationNode, WorkItemField, WorkItemRelationType, WorkItemStateColor,
    WorkItemTemplate, WorkItemTemplateReference, WorkItemType
} from "TFS/WorkItemTracking/Contracts";

export namespace WorkItemTypeActionsHub {
    export const InitializeWorkItemTypes = new Action<WorkItemType[]>();
}

export namespace WorkItemRelationTypeActionsHub {
    export const InitializeWorkItemRelationTypes = new Action<WorkItemRelationType[]>();
}

export namespace WorkItemFieldActionsHub {
    export const InitializeWorkItemFields = new Action<WorkItemField[]>();
}

export namespace WorkItemTemplateActionsHub {
    export const InitializeWorkItemTemplates = new Action<{teamId: string, templates: WorkItemTemplateReference[]}>();
}

export namespace WorkItemTemplateItemActionsHub {
    export const InitializeWorkItemTemplateItem = new Action<WorkItemTemplate>();
}

export namespace WorkItemStateItemActionsHub {
    export const InitializeWorkItemStateItems = new Action<{witName: string, states: WorkItemStateColor[]}>();
}

export namespace TeamActionsHub {
    export const InitializeTeams = new Action<WebApiTeam[]>();
}

export namespace WorkItemTagActionsHub {
    export const InitializeTags = new Action<WebApiTagDefinition[]>();
}

export namespace GitRepoActionsHub {
    export const InitializeGitRepos = new Action<GitRepository[]>();
}

export namespace TeamFieldActionsHub {
    export const InitializeTeamFieldItem = new Action<{teamId: string, teamFieldValues: TeamFieldValues}>();
}

export namespace WorkItemTypeFieldAllowedValuesActionsHub {
    export const InitializeAllowedValues = new Action<{workItemType: string, fieldRefName: string, allowedValues: string[]}>();
}

export namespace WorkItemActionsHub {
    export const AddOrUpdateWorkItems = new Action<WorkItem[]>();
    export const DeleteWorkItems = new Action<number[]>();
    export const ClearWorkItems = new Action();
}

export namespace ErrorMessageActionsHub {
    export const PushErrorMessage = new Action<{errorMessage: string, errorKey: string}>();
    export const DismissErrorMessage = new Action<string>();
    export const DismissAllErrorMessages = new Action<void>();
}

export namespace ClassificationNodeActionsHub {
    export const InitializeAreaPaths = new Action<WorkItemClassificationNode>();
    export const InitializeIterationPaths = new Action<WorkItemClassificationNode>();
}
