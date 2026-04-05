export class Address {
    constructor(
        public readonly id: number,
            public readonly userId: number | null,
            public readonly fullName: string,
            public readonly phone: string,
            public readonly line1: string,
            public readonly line2: string | null,
            public readonly city: string,
            public readonly province: string,
            public readonly postalCode: string,
            public readonly country: string,
            public readonly isDefault: boolean,
            public readonly createdAt: Date,
            public readonly updatedAt: Date
    ){}
}