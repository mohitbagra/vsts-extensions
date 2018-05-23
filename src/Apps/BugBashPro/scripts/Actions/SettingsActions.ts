import { SettingsActionsHub } from "BugBashPro/Actions/ActionsHub";
import { ErrorKeys } from "BugBashPro/Constants";
import { SettingsDataService } from "BugBashPro/DataServices/SettingsDataService";
import { IBugBashSettings, IUserSettings } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";

export namespace SettingsActions {
    export async function initializeBugBashSettings() {
        if (StoresHub.bugBashSettingsStore.isLoaded()) {
            SettingsActionsHub.InitializeBugBashSettings.invoke(null);
        }
        else if (!StoresHub.bugBashSettingsStore.isLoading()) {
            StoresHub.bugBashSettingsStore.setLoading(true);
            const settings = await SettingsDataService.loadSetting(`bugBashProSettings_${VSS.getWebContext().project.id}`, {} as IBugBashSettings, false);
            SettingsActionsHub.InitializeBugBashSettings.invoke(settings);
            StoresHub.bugBashSettingsStore.setLoading(false);
        }
    }

    export async function updateBugBashSettings(settings: IBugBashSettings) {
        try {
            const updatedSettings = await SettingsDataService.updateSetting<IBugBashSettings>(`bugBashProSettings_${VSS.getWebContext().project.id}`, settings, false);
            SettingsActionsHub.UpdateBugBashSettings.invoke(updatedSettings);
            ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashSettingsError);
        }
        catch (e) {
            ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashSettingsError);
        }
    }

    export async function initializeUserSettings() {
        if (StoresHub.userSettingsStore.isLoaded()) {
            SettingsActionsHub.InitializeUserSettings.invoke(null);
        }
        else if (!StoresHub.userSettingsStore.isLoading()) {
            StoresHub.userSettingsStore.setLoading(true);
            const settings = await ExtensionDataManager.readDocuments<IUserSettings>(`UserSettings_${VSS.getWebContext().project.id}`, false);
            SettingsActionsHub.InitializeUserSettings.invoke(settings);
            StoresHub.userSettingsStore.setLoading(false);
        }
    }

    export async function updateUserSettings(settings: IUserSettings) {
        try {
            const updatedSettings = await ExtensionDataManager.addOrUpdateDocument<IUserSettings>(`UserSettings_${VSS.getWebContext().project.id}`, settings, false);
            SettingsActionsHub.UpdateUserSettings.invoke(updatedSettings);
            ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashSettingsError);
        }
        catch (e) {
            ErrorMessageActions.showErrorMessage(
                "Settings could not be saved due to an unknown error. Please refresh the page and try again.",
                ErrorKeys.BugBashSettingsError
            );
        }
    }
}
