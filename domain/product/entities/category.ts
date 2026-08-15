type CategoryProps = {
    id: number,
    name: string,
    image?: string,
    description?: string,
    showInNavbar?: boolean
}

export class Category {
    public readonly id: number
    public readonly name: string
    public readonly slug: string
    public readonly image?: string
    public readonly description?: string
    public readonly showInNavbar: boolean

    constructor(props: CategoryProps) {
        this.id = props.id
        this.name = props.name
        this.slug = Category.toSlug(props.name)
        this.image = props.image
        this.description = props.description
        this.showInNavbar = props.showInNavbar ?? false
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