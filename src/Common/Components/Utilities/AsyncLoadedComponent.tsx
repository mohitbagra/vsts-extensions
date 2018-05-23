import * as React from "react";

export type ModuleComponentSelector<TProps> = (...modules: any[]) => React.ComponentClass<TProps> | React.StatelessComponent<TProps>;

interface IAsyncLoadedComponentProps<TProps> {
    modules: string[];
    moduleComponentSelector: ModuleComponentSelector<TProps>;
    props: TProps;
    componentWhileLoading?(): JSX.Element;
}

interface IAsyncLoadedComponentState<TProps> {
    isLoading: boolean;
    componentType: React.ComponentClass<TProps> | React.StatelessComponent<TProps>;
}

class AsyncLoadedComponent<TProps> extends React.Component<IAsyncLoadedComponentProps<TProps>, IAsyncLoadedComponentState<TProps>> {
    private _isMounted: boolean = false;

    constructor(props?: IAsyncLoadedComponentProps<TProps>, context?: any) {
        super(props, context);

        this.state = {
            isLoading: false,
            componentType: null
        };
    }

    public render(): JSX.Element {
        if (!this.state.componentType) {
            if (this.props.componentWhileLoading) {
                return this.props.componentWhileLoading();
            }

            return null;
        }

        return React.createElement(this.state.componentType, this.props.props);
    }

    public componentDidMount(): void {
        this._isMounted = true;

        if (!this.state.componentType && !this.state.isLoading) {
            this.setState({
                isLoading: true,
                componentType: null
            });

            VSS.require(this.props.modules, (...modules) => {
                if (this._isMounted) {
                    this.setState({
                        isLoading: false,
                        componentType: this.props.moduleComponentSelector(...modules)
                    });
                }
            });
        }
    }

    public componentWillUnmount(): void {
        if (this.state.isLoading) {
            this.setState({
                isLoading: false,
                componentType: null
            });
        }

        this._isMounted = false;
    }
}

export function getAsyncLoadedComponent<TProps = {}>
    (modules: string[],
     moduleComponentSelector: ModuleComponentSelector<TProps>,
     componentWhileLoading?: () => JSX.Element): (props: TProps) => JSX.Element {

    return (props: TProps) => React.createElement(
        AsyncLoadedComponent,
        {
            modules,
            moduleComponentSelector,
            componentWhileLoading,
            props,
        } as IAsyncLoadedComponentProps<TProps>);
}
