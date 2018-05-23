import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import { TeamStore } from "Common/Flux/Stores/TeamStore";
import { WorkItemFieldStore } from "Common/Flux/Stores/WorkItemFieldStore";
import { WorkItemRelationTypeStore } from "Common/Flux/Stores/WorkItemRelationTypeStore";
import { WorkItemTemplateItemStore } from "Common/Flux/Stores/WorkItemTemplateItemStore";
import { WorkItemTemplateStore } from "Common/Flux/Stores/WorkItemTemplateStore";
import { WorkItemTypeStore } from "Common/Flux/Stores/WorkItemTypeStore";
import { RuleGroupStore } from "OneClick/Flux/Stores/RuleGroupStore";
import { RuleStore } from "OneClick/Flux/Stores/RuleStore";
import { SettingsStore } from "OneClick/Flux/Stores/SettingsStore";

export namespace StoresHub {
    export const ruleGroupStore: RuleGroupStore = StoreFactory.getInstance<RuleGroupStore>(RuleGroupStore);
    export const ruleStore: RuleStore = StoreFactory.getInstance<RuleStore>(RuleStore);
    export const settingsStore: SettingsStore = StoreFactory.getInstance<SettingsStore>(SettingsStore);

    export const workItemFieldStore: WorkItemFieldStore = StoreFactory.getInstance<WorkItemFieldStore>(WorkItemFieldStore);
    export const workItemTypeStore: WorkItemTypeStore = StoreFactory.getInstance<WorkItemTypeStore>(WorkItemTypeStore);
    export const workItemRelationTypeStore: WorkItemRelationTypeStore = StoreFactory.getInstance<WorkItemRelationTypeStore>(WorkItemRelationTypeStore);
    export const teamStore: TeamStore = StoreFactory.getInstance<TeamStore>(TeamStore);
    export const workItemTemplateStore: WorkItemTemplateStore = StoreFactory.getInstance<WorkItemTemplateStore>(WorkItemTemplateStore);
    export const workItemTemplateItemStore: WorkItemTemplateItemStore = StoreFactory.getInstance<WorkItemTemplateItemStore>(WorkItemTemplateItemStore);
}
