import { GitRepoActionsHub } from "Common/Flux/Actions/ActionsHub";
import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import { GitRepoStore } from "Common/Flux/Stores/GitRepoStore";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { GitRepository } from "TFS/VersionControl/Contracts";
import * as GitClient from "TFS/VersionControl/GitRestClient";

export namespace GitRepoActions {
    const gitRepoStore: GitRepoStore = StoreFactory.getInstance<GitRepoStore>(GitRepoStore);

    export async function initializeGitRepos() {
        if (gitRepoStore.isLoaded()) {
            GitRepoActionsHub.InitializeGitRepos.invoke(null);
        }
        else if (!gitRepoStore.isLoading()) {
            gitRepoStore.setLoading(true);
            try {
                const gitRepos =  await GitClient.getClient().getRepositories(VSS.getWebContext().project.id);
                gitRepos.sort((a: GitRepository, b: GitRepository) => localeIgnoreCaseComparer(a.name, b.name));
                GitRepoActionsHub.InitializeGitRepos.invoke(gitRepos);
                gitRepoStore.setLoading(false);
            }
            catch (e) {
                gitRepoStore.setLoading(false);
                throw e.message;
            }
        }
    }
}
