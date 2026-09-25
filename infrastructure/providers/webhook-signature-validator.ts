import { WebhookSignatureValidator } from "mercadopago";

export interface WebhookValidateOptions {
    xSignature: string | undefined | null;
    xRequestId: string | undefined | null;
    dataId: string | undefined | null;
    secret: string;
    toleranceSeconds?: number;
}

export class WebhookSignatureValidatorWrapper {
    static validate(options: WebhookValidateOptions): void {
        if (!options.secret) {
            throw new Error(
                "MercadoPago webhook secret is not configured. Set MP_WEBHOOK_SECRET."
            );
        }

        WebhookSignatureValidator.validate({
            xSignature: options.xSignature,
            xRequestId: options.xRequestId,
            dataId: options.dataId,
            secret: options.secret,
            toleranceSeconds: options.toleranceSeconds ?? 600,
        });
    }
}
