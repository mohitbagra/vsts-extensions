import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ITreeComboProps, TreeCombo } from "Common/Components/VssCombo/TreeCombo";
import { ClassificationNodeActions } from "Common/Flux/Actions/ClassificationNodeActions";
import { BaseStore, StoreFactory } from "Common/Flux/Stores/BaseStore";
import {
    ClassificationNodeKey, ClassificationNodeStore
} from "Common/Flux/Stores/ClassificationNodeStore";
import { isNullOrEmpty } from "Common/Utilities/String";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";
import { TreeNode } from "VSS/Controls/TreeView";

export interface IClassificationPickerProps extends ITreeComboProps {
    keyType: ClassificationNodeKey;
}

export interface IClassificationPickerState extends IBaseFluxComponentState {
    treeNode?: TreeNode;
    value?: string;
}

export class ClassificationPicker extends BaseFluxComponent<IClassificationPickerProps, IClassificationPickerState> {
    private _classificationNodeStore = StoreFactory.getInstance<ClassificationNodeStore>(ClassificationNodeStore);

    public componentDidMount() {
        super.componentDidMount();
        this._initializeNodes(this.props.keyType);
    }

    public componentWillReceiveProps(nextProps: IClassificationPickerProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        if (nextProps.value !== this.props.value) {
            this.setState({
                value: nextProps.value
            });
        }

        if (nextProps.keyType !== this.props.keyType) {
            this._initializeNodes(nextProps.keyType);
        }
    }

    public render(): JSX.Element {
        if (!this.state.treeNode) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const { value } = this.state;
        const error = this.props.error || this._getDefaultError();
        const props = {
            ...this.props,
            className: css("classification-picker", this.props.className),
            value: value,
            options: [this.state.treeNode],
            error: error,
            onChange: this._onChange
        } as ITreeComboProps;

        return <TreeCombo {...props} />;
    }

    protected getStoresState(): IClassificationPickerState {
        return {
            treeNode: this._getTreeNode(this._classificationNodeStore.getItem(this.props.keyType), null, 1)
        };
    }

    protected initializeState(): void {
        this.state = {
            value: this.props.value || ""
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._classificationNodeStore];
    }

    private _initializeNodes(keyType: ClassificationNodeKey) {
        if (this._classificationNodeStore.isLoaded(keyType)) {
            this.setState({
                treeNode: this._getTreeNode(this._classificationNodeStore.getItem(keyType), null, 1)
            });
        }
        else if (keyType === ClassificationNodeKey.Area) {
            ClassificationNodeActions.initializeAreaPaths();
        }
        else {
            ClassificationNodeActions.initializeIterationPaths();
        }
    }

    private _getTreeNode(node: WorkItemClassificationNode, uiNode: TreeNode, level: number): TreeNode {
        if (!node) {
            return null;
        }

        const nodes = node.children;
        let newUINode: TreeNode;
        const nodeName = node.name;

        // tslint:disable-next-line:no-parameter-reassignment
        level = level || 1;
        if (uiNode) {
            newUINode = TreeNode.create(nodeName);
            uiNode.add(newUINode);
            // tslint:disable-next-line:no-parameter-reassignment
            uiNode = newUINode;
        }
        else {
            // tslint:disable-next-line:no-parameter-reassignment
            uiNode = TreeNode.create(nodeName);
        }
        uiNode.expanded = level < 2;
        if (nodes) {
            for (const n of nodes) {
                this._getTreeNode(n, uiNode, level + 1);
            }
        }
        return uiNode;
    }

    private _getDefaultError(): string {
        const nodePath = this.state.value;
        if (isNullOrEmpty(nodePath)) {
            return this.props.required ? "A value is required." : null;
        }
        else if (this.props.keyType === ClassificationNodeKey.Area) {
            return !this._classificationNodeStore.getAreaPathNode(nodePath) ? "This area path doesn't exist in the current project" : null;
        }
        else if (this.props.keyType === ClassificationNodeKey.Iteration) {
            return !this._classificationNodeStore.getIterationPathNode(nodePath) ? "This iteration path doesn't exist in the current project" : null;
        }

        return null;
    }

    private _onChange = (value: string) => {
        this.setState({value: value}, () => {
            this.props.onChange(value);
        });
    }
}
