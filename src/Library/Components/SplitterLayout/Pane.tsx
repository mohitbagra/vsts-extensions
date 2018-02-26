import * as React from "react";

export interface IPanelProps {
    vertical: boolean;
    primary: boolean;
    size: number;
    percentage: boolean;
    children: React.ReactNode[] | React.ReactNode;
}

export const Pane: React.StatelessComponent<IPanelProps> =
    (props: IPanelProps): JSX.Element => {
        const size = props.size || 0;
        const unit = props.percentage ? "%" : "px";
        let classes = "layout-pane";
        const style: any = {};
        if (!props.primary) {
            if (props.vertical) {
                style.height = `${size}${unit}`;
            } else {
                style.width = `${size}${unit}`;
            }
        } else {
            classes += " layout-pane-primary";
        }

        return <div className={classes} style={style}>{props.children}</div>;
};
