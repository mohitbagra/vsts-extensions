import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";
import { hashCode } from "Common/Utilities/String";

export namespace SettingsDataService {
    export async function loadSetting<T>(key: string, defaultValue: T, workItemTypeName: string, projectId: string, isPrivate: boolean): Promise<T> {
        return ExtensionDataManager.readSetting<T>(
            getSettingCollectionKey(key, workItemTypeName, projectId),
            defaultValue,
            isPrivate);
    }

    export async function updateSetting<T>(key: string, value: T, workItemTypeName: string, projectId: string, isPrivate: boolean): Promise<T> {
        try {
            return await ExtensionDataManager.writeSetting<T>(getSettingCollectionKey(key, workItemTypeName, projectId), value, isPrivate);
        }
        catch (e) {
            throw e.message;
        }
    }

    export function updateCacheStamp(workItemTypeName: string, projectId: string) {
        updateSetting<number>("cs", Date.now(), workItemTypeName, projectId, false);
    }

    export async function readCacheStamp(workItemTypeName: string, projectId: string): Promise<number> {
        return loadSetting<number>("cs", 0, workItemTypeName, projectId, false);
    }

    function getSettingCollectionKey(settingKey: string, workItemTypeName: string, projectId: string): string {
        const key = `${projectId}_${workItemTypeName}`.toLowerCase();
        const suffix = hashCode(key).toString();
        return `${settingKey}_${suffix}`;
    }
}
