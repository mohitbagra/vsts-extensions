import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";

export namespace SettingsDataService {
    export async function loadSetting<T>(key: string, defaultValue: T, isPrivate: boolean): Promise<T> {
        return ExtensionDataManager.readSetting<T>(
            key,
            defaultValue,
            isPrivate);
    }

    export async function updateSetting<T>(key: string, value: T, isPrivate: boolean): Promise<T> {
        try {
            return await ExtensionDataManager.writeSetting<T>(key, value, isPrivate);
        }
        catch (e) {
            throw e.message;
        }
    }
}
