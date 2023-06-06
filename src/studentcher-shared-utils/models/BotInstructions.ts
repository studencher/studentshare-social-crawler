
export class BotInstructions {
    type: string;
    data: unknown;

    constructor(type: string, data: unknown = {}) {
        this.type = type;
        this.data = data;
    }
}


