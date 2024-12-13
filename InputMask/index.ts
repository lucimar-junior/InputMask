import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface Utils {
    applyMask?: MaskingFunction;
    // Add other methods in the utils object as needed
    //^(\d{2})(9?\d{4})(\d{4})$
}

type MaskingFunction = (value: string) => { maskedValue: string, isValid: boolean };

export class InputMask implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _originalValue: string;
    private _regexPattern: string;
    private _maskTemplate: string;
    private _errorMessage: string = "Informação inválida";
    private _maskedValue: string;
    private _container: HTMLDivElement;
    private _notifyOutputChanged: () => void;
    private _inputElement: HTMLInputElement;
    private _errorElement: HTMLDivElement;
    private _objContext: ComponentFramework.Context<IInputs>;

    constructor()
    {
        this._originalValue = "";
        this._regexPattern = "";
        this._maskTemplate = "";
        this._maskedValue = "";
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void
    {
        this._notifyOutputChanged = notifyOutputChanged;
        this._originalValue = context.parameters.value.raw || "";
        this._regexPattern = context.parameters.regexPattern.raw || "";
        this._maskTemplate = context.parameters.maskTemplate.raw || "";
        this._errorMessage = context.parameters.errorMessage.raw || "Informação incorreta.";
        this._objContext = context;
        
        this._container = document.createElement("div");
        this._inputElement = document.createElement("input");
		
		// Apply mask for display
        this._maskedValue = this.applyMask(this._originalValue);

        this._inputElement.setAttribute("type", "text");
		this._inputElement.value = this._maskedValue;
		
        this._container.appendChild(this._inputElement);
        container.appendChild(this._container);

        this._inputElement.disabled = this._objContext.mode.isControlDisabled;

        this._objContext.mode.isControlDisabled ? 
            this._inputElement.classList.add("disabled") : this._inputElement.classList.remove("disabled");

        this._inputElement.addEventListener("blur", (event) => {
            this._originalValue = (event.target as HTMLInputElement).value.replace(/[^a-zA-Z0-9]/g, "");
            this._maskedValue = this.applyMask(this._originalValue);
            this._inputElement.value = this._maskedValue;  // Update display value with mask
            this._notifyOutputChanged();
        });
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        this._inputElement.disabled = this._objContext.mode.isControlDisabled;

        this._objContext.mode.isControlDisabled ? 
            this._inputElement.classList.add("disabled") : this._inputElement.classList.remove("disabled");
        // this._originalValue = context.parameters.value.raw || "";
        // this._regexPattern = context.parameters.regexPattern.raw || "";
        // this._errorMessage = context.parameters.errorMessage.raw || "Informação incorreta.";

        // // storing the latest context from the control
        // this._objContext = context;

        // // Update the displayed masked value
        // this._maskedValue = this.applyMask(this._originalValue);
        // alert(this._originalValue);
    }

    // ^(\d{2})(9?\d{4})(\d{4})$

    private applyMask(value: string): string {
        const regex = new RegExp(this._regexPattern);
        let formattedString = value;
        const match = regex.exec(value);

        if (value === "")
        {
            (<any>this._objContext.utils).clearNotification("validateMask");
            return formattedString;
        }
        
        if (!match && value !== "") {
            (<any>this._objContext.utils).setNotification(this._errorMessage, "validateMask");
            return formattedString;
        }

        if (match) {
            formattedString = this._maskTemplate;

            for (let i = 1; i < match.length; i++) {
                formattedString = formattedString.replace(`$${i}`, match[i]);
            }

            (<any>this._objContext.utils).clearNotification("validateMask");
        }

        return formattedString;
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs
    {
        return {
            value: this._originalValue  // Return the unmasked original value
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void
    {
        // Add code to cleanup control if necessary
    }
}
