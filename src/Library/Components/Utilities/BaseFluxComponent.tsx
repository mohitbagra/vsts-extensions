import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { autobind, BaseComponent, IBaseProps } from "OfficeFabric/Utilities";

export interface IBaseFluxComponentProps extends IBaseProps {
    className?: string;
}

export interface IBaseFluxComponentState {
    loading?: boolean;
}

export class BaseFluxComponent<TProps extends IBaseFluxComponentProps, TState extends IBaseFluxComponentState> extends BaseComponent<TProps, TState> {
    constructor(props: TProps, context?: any) {
        super(props, context);
        this.initializeState();
    }

    public componentDidMount() {
        super.componentDidMount();
        for (const store of this.getStores()) {
            store.addChangedListener(this._onStoreChanged);
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        for (const store of this.getStores()) {
            store.removeChangedListener(this._onStoreChanged);
        }
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [];
    }

    protected getStoresState(): TState {
        return {} as TState;
    }

    protected initializeState(): void {
        this.state = {} as TState;
    }

    @autobind
    private _onStoreChanged(): void {
        const newStoreState = this.getStoresState();
        this.setState(newStoreState);
    }
}
