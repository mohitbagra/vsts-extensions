import * as React from "react";

import { SettingsActions } from "BugBashPro/Actions/SettingsActions";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { Loading } from "Library/Components/Loading";
import { IRichEditorProps, RichEditor } from "Library/Components/RichEditor";
import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";

export class RichEditorComponent extends BaseFluxComponent<IRichEditorProps, IBaseFluxComponentState> {
    public componentDidMount() {
        super.componentDidMount();
        if (!StoresHub.bugBashSettingsStore.isLoaded()) {
            SettingsActions.initializeBugBashSettings();
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }
        else {
            return <RichEditor {...this.props} />;
        }
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashSettingsStore];
    }

    protected initializeState() {
        this.state = {
            loading: !StoresHub.bugBashSettingsStore.isLoaded()
        };
    }

    protected getStoresState(): IBaseFluxComponentState {
        return {
            loading: StoresHub.bugBashSettingsStore.isLoading()
        };
    }
}
