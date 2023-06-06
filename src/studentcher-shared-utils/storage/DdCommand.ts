export class DdCommand{
    query: string;
    values: unknown[];

    constructor(query, values) {
        this.query = query;
        this.values = values;
    }
}
