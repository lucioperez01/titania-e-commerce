type CategoryProps = {
    id: number,
    name: string,
    image?: string
}

export class Category {
    public readonly id: number
    public readonly name: string
    public readonly slug: string
    public readonly image?: string

    constructor(props: CategoryProps) {
        this.id = props.id
        this.name = props.name
        this.slug = props.name.toLowerCase().replace(/\s/g, "-")
        this.image = props.image
    }
}