import { SettingKey } from "OneClick/Constants";
import { SettingsDataService } from "OneClick/DataServices/SettingsDataService";
import { SettingsActionsHub } from "OneClick/Flux/Actions/ActionsHub";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";

export namespace SettingsActions {
    const store = StoresHub.settingsStore;

    export async function initializeSetting<T>(workItemTypeName: string, key: SettingKey, isPrivate: boolean, defaultValue?: T) {
        const storeKey = getStoreKey(workItemTypeName, key);

        if (!store.isLoading(storeKey)) {
            store.setLoading(true, storeKey);

            const value = await SettingsDataService.loadSetting<T>(
                key,
                defaultValue,
                workItemTypeName,
                VSS.getWebContext().project.id,
                isPrivate);

            if (store.checkCurrentWorkItemType(workItemTypeName)) {
                SettingsActionsHub.InitializeSetting.invoke({key: key, value: value});
            }

            store.setLoading(false, storeKey);
        }
    }

    export async function updateSetting<T>(workItemTypeName: string, key: SettingKey, value: T, isPrivate: boolean) {
        const storeKey = getStoreKey(workItemTypeName, key);

        if (!store.isLoading(storeKey)) {
            store.setLoading(true, storeKey);

            const newValue = await SettingsDataService.updateSetting<T>(
                key,
                value,
                workItemTypeName,
                VSS.getWebContext().project.id,
                isPrivate);

            if (store.checkCurrentWorkItemType(workItemTypeName)) {
                SettingsActionsHub.UpdateSetting.invoke({key: key, value: newValue});
            }

            store.setLoading(false, storeKey);
            SettingsDataService.updateCacheStamp(workItemTypeName, VSS.getWebContext().project.id);
        }
    }

    function getStoreKey(workItemTypeName: string, key: SettingKey): string {
        return `${workItemTypeName}_${key}`;
    }
}
