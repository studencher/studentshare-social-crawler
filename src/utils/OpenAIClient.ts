import { Configuration, OpenAIApi} from "openai"
import {openAISecretKey} from "../secrets";

const configuration = new Configuration({
    apiKey: openAISecretKey
});

export class OpenAIClient{
    private client = new OpenAIApi(configuration);
    constructor() {}
    public async getResponse({ prompt }: { prompt: string }) {
        const response = await this.client.createCompletion({
            model: "gpt-3.5-turbo",
            prompt,
            temperature: 0.6,
        });
        return response.data.choices[0].text;

    }
}

export default new OpenAIClient();
