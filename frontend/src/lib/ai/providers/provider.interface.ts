export interface AIProvider {
  name: string;
  createStream(messages: any[], modelOverride?: string): Promise<Response>;
}
