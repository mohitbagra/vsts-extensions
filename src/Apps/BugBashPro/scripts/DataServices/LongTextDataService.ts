import { ILongText } from "BugBashPro/Interfaces";
import * as ExtensionDataManager from "Common/Utilities/ExtensionDataManager";

export namespace LongTextDataService {
    export async function loadLongText(id: string): Promise<ILongText> {
        return ExtensionDataManager.readDocument<ILongText>(
            getCollectionKey(),
            id,
            {
                id: id,
                text: ""
            },
            false
        );
    }

    export async function addOrUpdateLongText(longText: ILongText): Promise<ILongText> {
        try {
            return await ExtensionDataManager.addOrUpdateDocument<ILongText>(getCollectionKey(), longText, false);
        } catch (e) {
            throw "This text has been modified by some one else. Please refresh the instance to get the latest version and try updating it again.";
        }
    }

    function getCollectionKey(): string {
        return "longtexts";
    }
}
