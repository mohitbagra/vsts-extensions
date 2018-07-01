import * as React from "react";

import { IBaseFluxComponentProps } from "Common/Components/Utilities/BaseFluxComponent";
import { isIdentityRef, parseUniquefiedIdentityName } from "Common/Utilities/Identity";
import { Persona, PersonaSize } from "OfficeFabric/Persona";
import { css } from "OfficeFabric/Utilities";
import { IdentityRef } from "VSS/WebApi/Contracts";

export interface IIdentityViewProps extends IBaseFluxComponentProps {
    value: IdentityRef | string;
    size?: PersonaSize;
}

export const IdentityView: React.StatelessComponent<IIdentityViewProps> = (props: IIdentityViewProps): JSX.Element => {
    const { value } = props;
    let identityRef: IdentityRef;

    if (!isIdentityRef(value)) {
        identityRef = parseUniquefiedIdentityName(value);
    } else {
        identityRef = value;
    }

    if (!identityRef || !identityRef.displayName) {
        return null;
    }

    return (
        <Persona
            className={css("identity-view", props.className)}
            size={props.size || PersonaSize.extraExtraSmall}
            imageUrl={identityRef.imageUrl}
            primaryText={identityRef.displayName}
            secondaryText={identityRef.uniqueName}
        />
    );
};
