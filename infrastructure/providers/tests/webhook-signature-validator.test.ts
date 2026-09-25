import { WebhookSignatureValidator } from "mercadopago";
import { WebhookSignatureValidatorWrapper } from "../webhook-signature-validator";

jest.mock("mercadopago", () => ({
    WebhookSignatureValidator: {
        validate: jest.fn(),
    },
}));

const mockValidate = WebhookSignatureValidator.validate as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
});

describe("WebhookSignatureValidatorWrapper", () => {
    const validOptions = {
        xSignature: "ts=1234567890,v1=abcdef",
        xRequestId: "req-123",
        dataId: "12345678",
        secret: "my-webhook-secret",
    };

    it("should call SDK validator with correct options", () => {
        WebhookSignatureValidatorWrapper.validate(validOptions);

        expect(mockValidate).toHaveBeenCalledWith({
            xSignature: validOptions.xSignature,
            xRequestId: validOptions.xRequestId,
            dataId: validOptions.dataId,
            secret: validOptions.secret,
            toleranceSeconds: 600,
        });
    });

    it("should pass through optional toleranceSeconds", () => {
        WebhookSignatureValidatorWrapper.validate({
            ...validOptions,
            toleranceSeconds: 300,
        });

        expect(mockValidate).toHaveBeenCalledWith(
            expect.objectContaining({
                toleranceSeconds: 300,
            })
        );
    });

    it("should throw if secret is empty string", () => {
        expect(() =>
            WebhookSignatureValidatorWrapper.validate({
                ...validOptions,
                secret: "",
            })
        ).toThrow(
            "MercadoPago webhook secret is not configured. Set MP_WEBHOOK_SECRET."
        );
        expect(mockValidate).not.toHaveBeenCalled();
    });

    it("should throw if secret is not configured", () => {
        expect(() =>
            WebhookSignatureValidatorWrapper.validate({
                ...validOptions,
                secret: undefined as unknown as string,
            })
        ).toThrow(
            "MercadoPago webhook secret is not configured. Set MP_WEBHOOK_SECRET."
        );
        expect(mockValidate).not.toHaveBeenCalled();
    });

    it("should propagate SDK validation errors", () => {
        mockValidate.mockImplementation(() => {
            const err = new Error("Invalid signature");
            (err as any).reason = "SignatureMismatch";
            throw err;
        });

        expect(() =>
            WebhookSignatureValidatorWrapper.validate(validOptions)
        ).toThrow("Invalid signature");
    });
});
