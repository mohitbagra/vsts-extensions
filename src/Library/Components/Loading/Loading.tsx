import "./Loading.scss";

import * as React from "react";

import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";

export const Loading: React.StatelessComponent<any> = (): JSX.Element => {
    return (
        <div className="content-loading">
            <Spinner className="loading-spinner" size={SpinnerSize.large} />
        </div>
    );
};
