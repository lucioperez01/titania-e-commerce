import { ProductImage } from "@/domain/product/entities/image"
import { Category } from "./category"

type ProductProps = {
    id: number,
    name: string,
    price: number,
    costPrice: number,
    images: ProductImage[],
    category: Category,
    desc: string,
    brand: string,
    stock: number,
    weight: number,
    rating?: number,
    sold?: number,
    oldPrice?: number,
    comments?: Comment[],
    sizes?: string[],
    colors?: string[],
    gender?: string,
    measures?: string[],
    slug?: string,
}


export class Product {
    public readonly slug: string
    public readonly id: number
    public readonly name: string
    public price: number
    public costPrice: number
    public images: ProductImage[]
    public desc: string
    public brand: string
    public stock: number
    public weight: number
    public category: Category;
    public rating?: number
    public sold?: number
    public oldPrice?: number
    public comments?: Comment[]
    public sizes?: string[]
    public colors?: string[]
    public gender?: string
    public measures?: string[]

    constructor(
        props: ProductProps
    ) {

        this.id = props.id
        this.validate(props)
        this.name = props.name
        this.price = props.price
        this.costPrice = props.costPrice
        this.images = props.images
        this.category = props.category
        this.desc = props.desc
        this.brand = props.brand
        this.stock = props.stock
        this.weight = props.weight
        this.rating = props.rating
        this.sold = props.sold
        this.oldPrice = props.oldPrice
        this.comments = props.comments
        this.sizes = props.sizes
        this.colors = props.colors
        this.gender = props.gender
        this.measures = props.measures
        this.slug = props.slug ?? Product.toSlug(props.name)
    }

    private validate(props: ProductProps) {

        if (props.name.trim().length < 3) {
            throw new Error("El nombre debe tener al menos 3 caracteres.")
        }

        if (props.price <= 0) {
            throw new Error("El precio debe ser mayor a 0.")
        }

        if (props.costPrice <= 0) {
            throw new Error("El precio de costo debe ser mayor a 0.")
        }

        if (props.images.length === 0) {
            throw new Error("El producto debe tener al menos una imagen.")
        }

        if (!props.category) {
            throw new Error("El producto debe tener una categoría.")
        }

        if (props.desc.trim().length < 3) {
            throw new Error("La descripción debe tener al menos 3 caracteres.")
        }

        if (props.brand.trim().length < 3) {
            throw new Error("La marca debe tener al menos 3 caracteres.")
        }

        if (props.stock < 0) {
            throw new Error("El stock no puede ser negativo.")
        }

        if (props.weight <= 0) {
            throw new Error("El peso debe ser mayor a 0.")
        }

        if (props.costPrice > props.price) {
            throw new Error("El precio de venta no puede ser menor al costo.")
        }
    }

    static toSlug(name: string): string {
        return name
            .normalize("NFD")                   // decompose accented letters (á → a + ́)
            .replace(/[\u0300-\u036f]/g, "")    // strip accent marks
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")      // remove remaining special chars
            .replace(/\s+/g, "-")              // spaces → dashes
            .replace(/-+/g, "-")               // collapse multiple dashes
    }

    public decreaseStock(quantity: number) {
        if (this.stock < quantity) {
            throw new Error("Stock insuficiente")
        }

        this.stock -= quantity
    }

    public increaseStock(quantity: number) {
        this.stock += quantity
    }
}