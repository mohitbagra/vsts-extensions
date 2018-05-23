import { BaseFluxComponent } from "Common/Components/Utilities/BaseFluxComponent";
import { throttledDelegate } from "Common/Utilities/Core";

export abstract class AutoResizableComponent<TP, TS> extends BaseFluxComponent<TP, TS> {
    private static WIDTH_DELTA: number = 10; // Minimum change in window width to react to

    private _windowResizeThrottleDelegate: any;
    private _bodyElement: HTMLBodyElement;
    private _windowWidth: number;

    constructor(props: TP, context?: any) {
        super(props, context);

        this._bodyElement = document.getElementsByTagName("body").item(0) as HTMLBodyElement;
        this._windowResizeThrottleDelegate = throttledDelegate(this, 50, () => {
            this._windowWidth = window.innerWidth;
            this.resize();
        });

        this._windowWidth = window.innerWidth;
        $(window).resize(() => {
            if (Math.abs(this._windowWidth - window.innerWidth) > AutoResizableComponent.WIDTH_DELTA) {
                this._windowResizeThrottleDelegate.call(this);
            }
        });
    }

    public componentDidMount() {
        super.componentDidMount();
        this._windowResizeThrottleDelegate.call(this);
    }

    public componentDidUpdate() {
        this._windowResizeThrottleDelegate.call(this);
    }

    protected resize() {
        VSS.resize(null, this._bodyElement.offsetHeight);
    }
}
