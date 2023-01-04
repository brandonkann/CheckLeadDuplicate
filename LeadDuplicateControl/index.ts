import {IInputs, IOutputs} from "./generated/ManifestTypes";

export class LeadDuplicateControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private context: ComponentFramework.Context<IInputs>;
    private container: HTMLDivElement;
    private customInput : HTMLInputElement;
    private emailAddress : string;

    // Fields to autofill from lead:
    private _first_name: string;
    private _last_name: string;
    private _address_line_1: string;
    private _address_line_2: string;
    private _provincestate: string; 
    private _city: string; 
    private _postcode: string;
    private _country: string;

     // The callback function to call whenever your code has made a change to a bound or output property\
     private notifyOutputChanged: () => void;
    constructor()
    {

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
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = container;
        this.emailAddress = this.context.parameters.email_address.raw != null ? this.context.parameters.email_address.raw : ""
        this.containerInit();
    }

    private containerInit(): void {
        this.customInput = document.createElement("input");
        this.customInput.id = "email_address";
        this.customInput.type = "text";
        this.customInput.value = this.emailAddress;

        let timeout : any = null;

        this.customInput.addEventListener('keyup', (e)=> {
            clearTimeout(timeout)

            timeout = setTimeout(() => {
                this.checkLead(this.customInput.value)
            }, 1000)
        })

        this.container.appendChild(this.customInput);
    }

    private checkLead(email : string): void {
        try {
            let query =   "<fetch version ='1.0' output-format='xml-platform' mapping='logical' distinct='true'>"
                query +=  " <entity name='lead'>"  
                query +=  "  <attribute name='leadid'/>"   
                query +=  "  <attribute name='firstname'/>"  
                query +=  "  <attribute name='lastname'/>"  
                query +=  "  <attribute name='emailaddress1'/>"  
                query +=  "  <attribute name='address1_line1'/>"  
                query +=  "   <filter type='and'>"   
                query +=  `<condition attribute='emailaddress1' operator='eq' value='${email}' />`   
                query +=  "    </filter>"   
                query +=  " </entity>"   
                query +=  "</fetch>"; 
            
                console.log(query)

            this.context.webAPI.retrieveMultipleRecords("lead","?fetchXml=" +query).then(
                (response: ComponentFramework.WebApi.RetrieveMultipleResponse) => {
                    if (response.entities.length >= 1) {
                        this.showModal(response.entities[0]);
                    }
                    else {
                        alert("Unable to Locate Lead, please proceed with Contact creation")
                    }
                
                },
                function(errorResponse:any) {
                    console.log(errorResponse);
                }
            )
        } catch (error) {
            console.log(error)
        }
        
    }

    private showModal(leadObj : any) : void {
        const response = confirm("A lead has been found with the same Email Address. Do you want to populate contact with lead data")
        
        if (response) {
            console.log("Transferring data")
            console.log(leadObj)
            this._first_name = leadObj.firstname;
            this._last_name = leadObj.lastname;
            this._address_line_1 = leadObj.address1_line1
            this.notifyOutputChanged();
        }
        else {
            console.log("Manually enter data")
        }

    }


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        // Add code to update control view
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs
    {
        var output: { [k: string]: any } = {};

        output.firstname = this._first_name;
        output.lastname = this._last_name;
        output.address1_line1 = this._address_line_1

        return output;   
    
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
