export function delegate(instance: any, method: Function, data?: any): (...args: any[]) => any {
    // tslint:disable-next-line:no-function-expression
    return function () {
        if (data == null) {
            return method.apply(instance, arguments);
        }
        else {
            let args = <any[]>Array.prototype.slice.call(arguments, 0);

            if (data instanceof Array) {
                args = args.concat(data);
            }
            else {
                args.push(data);
            }

            return method.apply(instance, args);
        }
    };
}

export class DelayedFunction {
    private _interval: number;
    private _func: (...args: any[]) => any;
    private _timeoutHandle: number;

    constructor(instance: any, ms: number, method: Function, data?: any[]) {
        this._interval = ms;
        this._func = delegate(instance, method, data);
    }

    public dispose() {
        this.cancel();
        this._func = null;
    }

    public start() {
        if (!this._timeoutHandle) {
            this._timeoutHandle = window.setTimeout(
                () => {
                    delete this._timeoutHandle;
                    try {
                        this._invoke.call(this);
                    }
                    catch {
                        // eat up
                    }
                },
                this._interval);
        }
    }

    public reset() {
        this.cancel();
        this.start();
    }

    public cancel() {
        if (this._timeoutHandle) {
            window.clearTimeout(this._timeoutHandle);
            delete this._timeoutHandle;
        }
    }

    public invokeNow() {
        this.cancel();
        this._invoke();
    }

    public isPending(): boolean {
        return this._timeoutHandle ? true : false;
    }

    private _invoke() {
        this._func();
    }
}

let hostDialogService: IHostDialogService;

export async function getHostDialogService(): Promise<IHostDialogService> {
    if (!hostDialogService) {
        hostDialogService = await VSS.getService(VSS.ServiceIds.Dialog) as IHostDialogService;
    }

    return hostDialogService;
}

export function delay(instance: any, ms: number, method: Function, data?: any[]): DelayedFunction {
    const delayedFunc = new DelayedFunction(instance, ms, method, data);
    delayedFunc.start();
    return delayedFunc;
}

export function throttledDelegate(instance: any, ms: number, method: Function, data?: any[]): (...args: any[]) => any {
    const delayedFunc = new DelayedFunction(instance, ms, method, data);

    return delegate(delayedFunc, () => {
        delayedFunc.reset();
    });
}

export async function confirmAction(condition: boolean, msg: string): Promise<boolean> {
    if (condition) {
        const dialogService = await getHostDialogService();
        try {
            await dialogService.openMessageDialog(msg, { useBowtieStyle: true });
            return true;
        }
        catch (e) {
            // user selected "No"" in dialog
            return false;
        }
    }

    return true;
}

export async function showErrorDialog(message: string, reason?: any): Promise<void> {
    const reasonStr = typeof reason === "string" ? reason : reason && reason.message;
    const errorMsg = reasonStr ? `${message} Reason: ${reasonStr}` : message;

    const dialogService = await getHostDialogService();
    try {
        await dialogService.openMessageDialog(errorMsg, { useBowtieStyle: true });
    }
    catch (e) {
        // do nothing as pressing cancel on the dialog will throw an error here
    }
    return;
}
