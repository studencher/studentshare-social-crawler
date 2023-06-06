export type validationResponse = {
    result: boolean,
    message: string
}

export abstract class Validations {
    static isPasswordValid(value: string) :validationResponse {
        if(value == null)
            return {result: false, message: "Password must be provided"}
        if (value.includes(" "))
            return {result: false, message: "Password could not includes space"}

        const passwordRegex =  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/;
        if (!passwordRegex.test(value))
            return {result: false, message: "Password must contain capital and regular characters, numbers and must have at least 6 characters"}
        return {result: true, message: ""}
    }

    static isUrlValid(value :string) :validationResponse{
        if(value == null)
            return {result: false, message: "Url must be provided."};
        const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        const result = urlPattern.test(value);
        const message = result === true ? "" : "Invalid url."
        return {result, message}

    }

    static isPhoneNumberValid(value:string) :validationResponse{
        if(value == null)
            return {result: false, message: "Phone number must be provided."};
        const phonePattern = /\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$/;
        const result =  phonePattern.test(value);
        const message = result === true ? "" : "Invalid phone number."
        return {result, message}
    }

    static areFieldsProvided(neededProperties: string[], checkedObj: Record<string,any>) :validationResponse{
        const neededPropertiesIndex :Record<string, boolean> = neededProperties.reduce((accumulator, property)=> {
            return {...accumulator, [property]: false}
        }, {} );
        Object.entries(checkedObj).forEach(([key, value])=>{
            if (neededPropertiesIndex[key] != null && value != null && value !== "")
                neededPropertiesIndex[key] = true;
        })
        const unSatisfiedProperties =neededProperties.filter((property)=> !neededPropertiesIndex[property] )
        const result = unSatisfiedProperties.length === 0;
        const message = unSatisfiedProperties.length === 0 ? "" : `Properties: | ${unSatisfiedProperties.join(", ")} | must be provided.`
        return {result, message}
    }

    static isJsonValid(value: any) :boolean{
        try{
            JSON.parse(value);
            return true;
        }catch(err){
            return false;
        }
    }
}


