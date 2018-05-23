import { UrlActions } from "BugBashPro/Constants";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { GitPush, ItemContentType, VersionControlChangeType } from "TFS/VersionControl/Contracts";
import * as GitClient from "TFS/VersionControl/GitRestClient";

export function getBugBashUrl(bugBashId: string, action: UrlActions): string {
    const extensionId = `${VSS.getExtensionContext().publisherId}.${VSS.getExtensionContext().extensionId}`;
    let url = `${getProjectUri()}/_apps/hub/${extensionId}.bugbash-hub?view=${action}`;

    if (bugBashId) {
        url += `&id=${bugBashId}`;
    }

    return url;
}

export async function copyImageToGitRepo(imageData: any, gitFolderSuffix: string): Promise<string> {
    const settings = StoresHub.bugBashSettingsStore.getAll();
    if (settings && settings.gitMediaRepo) {
        const dataStartIndex = imageData.indexOf(",") + 1;
        const metaPart = imageData.substring(5, dataStartIndex - 1);
        const dataPart = imageData.substring(dataStartIndex);

        const extension = metaPart.split(";")[0].split("/").pop();
        const fileName = `pastedImage_${Date.now().toString()}.${extension}`;
        const gitPath = `BugBash_${gitFolderSuffix}/pastedImages/${fileName}`;
        const projectId = VSS.getWebContext().project.id;

        try {
            const gitClient = GitClient.getClient();
            const gitItem = await gitClient.getItem(settings.gitMediaRepo, "/", projectId);
            const pushModel = buildGitPush(gitPath, gitItem.commitId, VersionControlChangeType.Add, dataPart, ItemContentType.Base64Encoded);
            await gitClient.createPush(pushModel, settings.gitMediaRepo, projectId);

            return `${getProjectUri()}/_api/_versioncontrol/itemContent?repositoryId=${settings.gitMediaRepo}&path=${encodeURIComponent(gitPath)}&version=GBmaster&contentOnly=true`;
        }
        catch (e) {
            throw `Image copy failed: ${e.message}`;
        }
    }
    else {
        throw "Image copy failed. No Git repo is setup yet to store image files. Please setup a git repo in Bug Bash settings to store media and attachments.";
    }
}

export function getProjectUri(): string {
    const webContext = VSS.getWebContext();
    return `${webContext.collection.uri}/${webContext.project.id}`;
}

function buildGitPush(path: string, oldObjectId: string, changeType: VersionControlChangeType, content: string, contentType: ItemContentType): GitPush {
    const commits = [{
    comment: "Adding new image from bug bash pro extension",
    changes: [
        {
        changeType,
        item: {path},
        newContent: content !== undefined ? {
            content,
            contentType,
        } : undefined,
        }],
    }];

    return {
        refUpdates: [{
            name: "refs/heads/master",
            oldObjectId: oldObjectId,
        }],
        commits,
    } as GitPush;
}
