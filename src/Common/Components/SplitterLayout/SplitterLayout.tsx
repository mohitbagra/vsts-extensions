import "./SplitterLayout.scss";

import * as React from "react";

import { Pane } from "Common/Components/SplitterLayout/Pane";

function clearSelection() {
    if (window.getSelection) {
        if (window.getSelection().empty) {
            window.getSelection().empty();
        }
        else if (window.getSelection().removeAllRanges) {
            window.getSelection().removeAllRanges();
        }
    }
    else if ((document as any).selection) {
        (document as any).selection.empty();
    }
}

const DEFAULT_SPLITTER_SIZE = 4;

export interface ISplitterLayoutProps {
    customClassName?: string;
    vertical?: boolean;
    percentage?: boolean;
    primaryIndex: number;
    primaryMinSize: number;
    secondaryInitialSize: number;
    secondaryMinSize: number;
    children: React.ReactNode[];
    onChange(secondaryPaneSize: number): void;
}

export interface ISplitterLayoutState {
    secondaryPaneSize: number;
    resizing: boolean;
}

export class SplitterLayout extends React.Component<ISplitterLayoutProps, ISplitterLayoutState> {
    private _splitterElement: HTMLDivElement;
    private _containerElement: HTMLDivElement;

    constructor(props: ISplitterLayoutProps) {
        super(props);
        this.state = {
            secondaryPaneSize: 0,
            resizing: false
        };
    }

    public componentDidMount() {
        window.addEventListener("resize", this._handleResize);
        document.addEventListener("mouseup", this._handleMouseUp);
        document.addEventListener("mousemove", this._handleMouseMove);

        let secondaryPaneSize = this.props.secondaryInitialSize;
        if (secondaryPaneSize == null) {
            const containerRect = this._containerElement.getBoundingClientRect();
            let splitRect: ClientRect;
            if (this._splitterElement) {
                splitRect = this._splitterElement.getBoundingClientRect();
            }
            else {
                // Simulate a split
                splitRect = { width: DEFAULT_SPLITTER_SIZE, height: DEFAULT_SPLITTER_SIZE } as ClientRect;
            }
            secondaryPaneSize = this._getSecondaryPaneSize(
                containerRect,
                splitRect,
                {
                    left: containerRect.left + ((containerRect.width - splitRect.width) / 2),
                    top: containerRect.top + ((containerRect.height - splitRect.height) / 2)
                },
                false);
        }

        this.setState({ secondaryPaneSize: secondaryPaneSize });
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this._handleResize);
        document.removeEventListener("mouseup", this._handleMouseUp);
        document.removeEventListener("mousemove", this._handleMouseMove);
    }

    public render() {
        let containerClasses = "split-layout";
        if (this.props.customClassName) {
            containerClasses += ` ${this.props.customClassName}`;
        }
        if (this.props.vertical) {
            containerClasses += " split-layout-vertical";
        }
        if (this.state.resizing) {
            containerClasses += " layout-changing";
        }

        const children = React.Children.toArray(this.props.children).slice(0, 2);
        if (children.length === 0) {
            children.push(<div />);
        }
        const wrappedChildren: React.ReactNode[] = [];
        const primaryIndex = (this.props.primaryIndex !== 0 && this.props.primaryIndex !== 1) ? 0 : this.props.primaryIndex;

        for (let i = 0; i < children.length; ++i) {
            let primary = true;
            let size: number;
            if (children.length > 1 && i !== primaryIndex) {
                primary = false;
                size = this.state.secondaryPaneSize;
            }
            wrappedChildren.push(
                <Pane vertical={this.props.vertical} percentage={this.props.percentage} primary={primary} size={size}>
                    {children[i]}
                </Pane>
            );
        }

        return (
            <div className={containerClasses} ref={(c) => { this._containerElement = c; }}>
                {wrappedChildren[0]}
                {wrappedChildren.length > 1 &&
                    <div
                        className="layout-split"
                        ref={(c) => { this._splitterElement = c; }}
                        onMouseDown={this._handleSplitterMouseDown}
                    />
                }
                {wrappedChildren.length > 1 && wrappedChildren[1]}
            </div>
        );
    }

    private _getSecondaryPaneSize(containerRect: ClientRect, splitRect: ClientRect, clientPosition: {left: number, top: number}, offsetMouse: boolean) {
        let totalSize: number;
        let splitSize: number;
        let offset: number;

        if (this.props.vertical) {
            totalSize = containerRect.height;
            splitSize = splitRect.height;
            offset = clientPosition.top - containerRect.top;
        }
        else {
            totalSize = containerRect.width;
            splitSize = splitRect.width;
            offset = clientPosition.left - containerRect.left;
        }
        if (offsetMouse) {
            offset -= splitSize / 2;
        }
        if (offset < 0) {
            offset = 0;
        }
        else if (offset > totalSize - splitSize) {
            offset = totalSize - splitSize;
        }

        let secondaryPaneSize: number;
        if (this.props.primaryIndex === 1) {
            secondaryPaneSize = offset;
        }
        else {
            secondaryPaneSize = totalSize - splitSize - offset;
        }
        let primaryPaneSize = totalSize - splitSize - secondaryPaneSize;
        if (this.props.percentage) {
            secondaryPaneSize = (secondaryPaneSize * 100) / totalSize;
            primaryPaneSize = (primaryPaneSize * 100) / totalSize;
            splitSize = (splitSize * 100) / totalSize;
            totalSize = 100;
        }

        if (primaryPaneSize < this.props.primaryMinSize) {
            secondaryPaneSize = Math.max(secondaryPaneSize - (this.props.primaryMinSize - primaryPaneSize), 0);
        }
        else if (secondaryPaneSize < this.props.secondaryMinSize) {
            secondaryPaneSize = Math.min(totalSize - splitSize - this.props.primaryMinSize, this.props.secondaryMinSize);
        }

        return secondaryPaneSize;
    }

    private _handleResize = () => {
        if (this._splitterElement && !this.props.percentage) {
            const containerRect = this._containerElement.getBoundingClientRect();
            const splitRect = this._splitterElement.getBoundingClientRect();
            const secondaryPaneSize = this._getSecondaryPaneSize(
                containerRect, splitRect,
                {
                    left: splitRect.left,
                    top: splitRect.top
                },
                false);

            this.setState({ secondaryPaneSize: secondaryPaneSize });
        }
    }

    private _handleMouseMove = (e: MouseEvent) => {
        if (this.state.resizing) {
            const containerRect = this._containerElement.getBoundingClientRect();
            const splitRect = this._splitterElement.getBoundingClientRect();
            const secondaryPaneSize = this._getSecondaryPaneSize(
                containerRect,
                splitRect,
                {
                    left: e.clientX,
                    top: e.clientY
                },
                true);

            clearSelection();
            this.setState({ secondaryPaneSize: secondaryPaneSize });
            if (this.props.onChange) {
                this.props.onChange(secondaryPaneSize);
            }
        }
    }

    private _handleSplitterMouseDown = () => {
        clearSelection();
        this.setState({ resizing: true });
    }

    private _handleMouseUp = () => {
        if (this.state.resizing) {
            this.setState({ resizing: false });
        }
    }
}
