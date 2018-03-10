import { parseDateString } from "VSS/Utils/Date";

export function isInteger(value: string): boolean {
    return /^\d+$/.test(value);
}

export function isFloat(value: string): boolean {
    return /^\d+\.\d+$/.test(value);
}

export function isNumeric(value: string): boolean {
    return isInteger(value) || isFloat(value);
}

export function isDate(value: string): boolean {
    return parseDateString(value) !== null;
}
