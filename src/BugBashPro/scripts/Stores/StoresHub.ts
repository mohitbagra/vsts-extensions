import { BugBashItemCommentStore } from "BugBashPro/Stores/BugBashItemCommentStore";
import { BugBashItemStore } from "BugBashPro/Stores/BugBashItemStore";
import { BugBashSettingsStore } from "BugBashPro/Stores/BugBashSettingsStore";
import { BugBashStore } from "BugBashPro/Stores/BugBashStore";
import { LongTextStore } from "BugBashPro/Stores/LongTextStore";
import { UserSettingsStore } from "BugBashPro/Stores/UserSettingsStore";
import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { ErrorMessageStore } from "Library/Flux/Stores/ErrorMessageStore";
import { GitRepoStore } from "Library/Flux/Stores/GitRepoStore";
import { TeamFieldStore } from "Library/Flux/Stores/TeamFieldStore";
import { TeamStore } from "Library/Flux/Stores/TeamStore";
import { WorkItemFieldStore } from "Library/Flux/Stores/WorkItemFieldStore";
import { WorkItemStateItemStore } from "Library/Flux/Stores/WorkItemStateItemStore";
import { WorkItemStore } from "Library/Flux/Stores/WorkItemStore";
import { WorkItemTemplateItemStore } from "Library/Flux/Stores/WorkItemTemplateItemStore";
import { WorkItemTemplateStore } from "Library/Flux/Stores/WorkItemTemplateStore";
import { WorkItemTypeStore } from "Library/Flux/Stores/WorkItemTypeStore";

export namespace StoresHub {
    export const bugBashSettingsStore: BugBashSettingsStore = StoreFactory.getInstance<BugBashSettingsStore>(BugBashSettingsStore);
    export const userSettingsStore: UserSettingsStore = StoreFactory.getInstance<UserSettingsStore>(UserSettingsStore);
    export const bugBashStore: BugBashStore = StoreFactory.getInstance<BugBashStore>(BugBashStore);
    export const bugBashItemStore: BugBashItemStore = StoreFactory.getInstance<BugBashItemStore>(BugBashItemStore);
    export const bugBashItemCommentStore: BugBashItemCommentStore = StoreFactory.getInstance<BugBashItemCommentStore>(BugBashItemCommentStore);
    export const longTextStore: LongTextStore = StoreFactory.getInstance<LongTextStore>(LongTextStore);

    export const errorMessageStore: ErrorMessageStore = StoreFactory.getInstance<ErrorMessageStore>(ErrorMessageStore);
    export const workItemStore: WorkItemStore = StoreFactory.getInstance<WorkItemStore>(WorkItemStore);
    export const gitRepoStore: GitRepoStore = StoreFactory.getInstance<GitRepoStore>(GitRepoStore);
    export const teamStore: TeamStore = StoreFactory.getInstance<TeamStore>(TeamStore);
    export const teamFieldStore: TeamFieldStore = StoreFactory.getInstance<TeamFieldStore>(TeamFieldStore);
    export const workItemFieldStore: WorkItemFieldStore = StoreFactory.getInstance<WorkItemFieldStore>(WorkItemFieldStore);
    export const workItemTypeStore: WorkItemTypeStore = StoreFactory.getInstance<WorkItemTypeStore>(WorkItemTypeStore);
    export const workItemTemplateStore: WorkItemTemplateStore = StoreFactory.getInstance<WorkItemTemplateStore>(WorkItemTemplateStore);
    export const workItemTemplateItemStore: WorkItemTemplateItemStore = StoreFactory.getInstance<WorkItemTemplateItemStore>(WorkItemTemplateItemStore);
    export const workItemStateItemStore: WorkItemStateItemStore = StoreFactory.getInstance<WorkItemStateItemStore>(WorkItemStateItemStore);
}
