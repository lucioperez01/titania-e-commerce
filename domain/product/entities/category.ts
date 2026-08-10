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
        this.slug = Category.toSlug(props.name)
        this.image = props.image
    }

    static toSlug(name: string): string {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
    }
}