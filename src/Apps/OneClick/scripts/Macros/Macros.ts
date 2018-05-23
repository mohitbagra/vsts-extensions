import { getCurrentUserName } from "Common/Utilities/Identity";
import { isInteger } from "Common/Utilities/Number";
import { startsWith, toString } from "Common/Utilities/String";
import { getFormService, getWorkItemField } from "Common/Utilities/WorkItemFormHelpers";
import * as addDays from "date-fns/add_days";
import * as format from "date-fns/format";

export abstract class BaseMacro {
    public static getMacroType(macroStr: string): new() => BaseMacro {
        if (!macroStr) {
            return null;
        }

        let macroName = macroStr;
        let seperator = "";
        let seperatorIndex = 999999;
        for (const sep of BaseMacro.allowedSeparators) {
            const index =  macroStr.indexOf(sep);
            if (index !== -1 && index < seperatorIndex) {
                seperatorIndex = index;
                seperator = sep;
            }
        }

        if (seperator) {
            macroName = macroStr.substring(0, seperatorIndex);
        }

        return BaseMacro.registeredMacros[macroName.toUpperCase()] || BaseMacro.registeredMacros[macroStr.toUpperCase()];
    }

    public static registerMacro(macroName: string, macroType: new() => BaseMacro): void {
        BaseMacro.registeredMacros[macroName.toUpperCase()] = macroType;
    }

    public static isMacro(str: string): boolean {
        return startsWith(str, "@");
    }

    private static registeredMacros: IDictionaryStringTo<new() => BaseMacro> = {};
    private static allowedSeparators = ["=", "-", "+"];

    public abstract async translate(macroStr: string, typed?: boolean): Promise<string | any>;
    public abstract getName(): string;
}

export class MacroMe extends BaseMacro {
    public async translate(_macroStr: string, _typed?: boolean): Promise<string> {
        return getCurrentUserName();
    }

    public getName(): string {
        return "@Me";
    }
}
BaseMacro.registerMacro("@Me", MacroMe);

export class MacroToday extends BaseMacro {
    private _allowedOperands = ["-", "+"];

    public async translate(macroStr: string, typed?: boolean): Promise<string | Date> {
        const today = new Date();
        let returnValue = today;

        const operatorAndOperand = this._getOperatorAndOperand(macroStr);
        if (operatorAndOperand) {
            switch (operatorAndOperand[0]) {
                case "-":
                    returnValue = addDays(returnValue, -1 * operatorAndOperand[1]);
                    break;
                case "+":
                    returnValue = addDays(returnValue, operatorAndOperand[1]);
                    break;
                default:
                    // no op
            }
        }

        if (typed) {
            return returnValue;
        }
        else {
            return format(returnValue);
        }
    }

    public getName(): string {
        return "@Today";
    }

    private _getOperatorAndOperand(macroStr: string): any[] {
        let operator = "";
        let operatorIndex = -1;
        for (const sep of this._allowedOperands) {
            const index =  macroStr.indexOf(sep);
            if (index !== -1 && (operatorIndex === -1 || index < operatorIndex)) {
                operatorIndex = index;
                operator = sep;
            }
        }

        if (operator) {
            const operand = macroStr.substring(operatorIndex + 1);
            if (isInteger(operand)) {
                return [operator, parseInt(operand, 10)];
            }
        }

        return null;
    }
 }
BaseMacro.registerMacro("@Today", MacroToday);

export class MacroFieldValue extends BaseMacro {
    public async translate(macroStr: string, typed?: boolean): Promise<string | any> {
        const fieldName = macroStr.split("=")[1];
        if (!fieldName) {
            return macroStr;
        }
        else {
            try {
                const formService = await getFormService();
                const field = await getWorkItemField(fieldName);
                const fieldValue = await formService.getFieldValue(field.referenceName);

                return typed ? fieldValue : toString(fieldValue);
            }
            catch (e) {
                return macroStr;
            }
        }
    }

    public getName(): string {
        return "@FieldValue";
    }
}
BaseMacro.registerMacro("@FieldValue", MacroFieldValue);
