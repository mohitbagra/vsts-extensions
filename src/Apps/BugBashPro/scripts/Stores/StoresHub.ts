import { BugBashItemCommentStore } from "BugBashPro/Stores/BugBashItemCommentStore";
import { BugBashItemStore } from "BugBashPro/Stores/BugBashItemStore";
import { BugBashSettingsStore } from "BugBashPro/Stores/BugBashSettingsStore";
import { BugBashStore } from "BugBashPro/Stores/BugBashStore";
import { LongTextStore } from "BugBashPro/Stores/LongTextStore";
import { UserSettingsStore } from "BugBashPro/Stores/UserSettingsStore";
import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import { ErrorMessageStore } from "Common/Flux/Stores/ErrorMessageStore";
import { GitRepoStore } from "Common/Flux/Stores/GitRepoStore";
import { TeamFieldStore } from "Common/Flux/Stores/TeamFieldStore";
import { TeamStore } from "Common/Flux/Stores/TeamStore";
import { WorkItemFieldStore } from "Common/Flux/Stores/WorkItemFieldStore";
import { WorkItemStateItemStore } from "Common/Flux/Stores/WorkItemStateItemStore";
import { WorkItemStore } from "Common/Flux/Stores/WorkItemStore";
import { WorkItemTemplateItemStore } from "Common/Flux/Stores/WorkItemTemplateItemStore";
import { WorkItemTemplateStore } from "Common/Flux/Stores/WorkItemTemplateStore";
import { WorkItemTypeStore } from "Common/Flux/Stores/WorkItemTypeStore";

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
