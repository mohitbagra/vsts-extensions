import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { BaseComponent, IBaseProps } from "OfficeFabric/Utilities";

export interface IBaseFluxComponentProps extends IBaseProps {
    className?: string;
}

export interface IBaseFluxComponentState {
    loading?: boolean;
}

export class BaseFluxComponent<TProps extends IBaseFluxComponentProps, TState extends IBaseFluxComponentState> extends BaseComponent<TProps, TState> {
    private _isMounted: boolean = false;

    constructor(props: TProps, context?: any) {
        super(props, context);
        this.state = this.getInitialState(props);
    }

    public componentDidMount() {
        super.componentDidMount();
        this._isMounted = true;
        for (const store of this.getStores()) {
            store.addChangedListener(this._onStoreChanged);
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._isMounted = false;
        for (const store of this.getStores()) {
            store.removeChangedListener(this._onStoreChanged);
        }
    }

    public setState<K extends keyof TState>(newState: Pick<TState, K>, callback?: () => void) {
        if (this._isMounted) {
            super.setState(newState, callback);
        }
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [];
    }

    protected getStoresState(): TState {
        return {} as TState;
    }

    protected getInitialState(_props: TProps): TState {
        return {} as TState;
    }

    private _onStoreChanged = () => {
        const newStoreState = this.getStoresState();
        this.setState(newStoreState);
    };
}
