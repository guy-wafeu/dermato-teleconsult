// Le SDK officiel Africa's Talking ne publie pas de types (pas de paquet
// @types/africastalking) — déclaration minimale limitée à ce que services/sms.ts
// utilise réellement.
declare module "africastalking" {
  interface SendSmsParams {
    to: string | string[];
    message: string;
    from?: string;
  }

  interface SmsClient {
    send(params: SendSmsParams): Promise<unknown>;
  }

  interface AfricasTalkingClient {
    SMS: SmsClient;
  }

  interface AfricasTalkingOptions {
    apiKey: string;
    username: string;
    format?: "json" | "xml";
  }

  function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingClient;

  export default AfricasTalking;
}
