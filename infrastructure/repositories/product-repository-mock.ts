import { ProductRepository } from '@/domain/product/repositories/product/product-repository'
import { Product } from '@/domain/product/entities/product'
import { ProductImage } from '@/domain/product/entities/image'
import { Category } from '@/domain/product/entities/category'

const categories = {
    1: new Category({ id: 1, name: "camisas" }),
    2: new Category({ id: 2, name: "accesorios" }),
    3: new Category({ id: 3, name: "pantalones" }),
    4: new Category({ id: 4, name: "remeras" }),
}

const products = [
    new Product({
        id: 1,
        name: "Camisa Bershka",
        price: 56900,
        costPrice: 25000,
        images: [
            new ProductImage(1, "https://static.bershka.net/assets/public/4f73/65d2/2233423bb525/17fd06bca140/06268692060-p/06268692060-p.jpg?ts=1761034084930&w=563&f=auto", 1),
            new ProductImage(2, "https://http2.mlstatic.com/D_NQ_NP_985305-MLA98515778886_112025-O.webp", 1)
        ],
        category: categories[1],
        desc: "una camisa Bershka",
        brand: "Bershka",
        stock: 10,
        weight: 1250,
        rating: 2,
        sold: 6,
        oldPrice: 93525,
    }),

    new Product({
        id: 2,
        name: "Lentes Rayban",
        price: 125759,
        costPrice: 65000,
        images: [
            new ProductImage(3, "https://acdn-us.mitiendanube.com/stores/002/224/925/categories/copia-de-foto-238-73979eeda8610f5a6a16835113439778-640-0.jpg", 2),
            new ProductImage(4, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtO1wo-UaFzxRkn_V_OD_wh14yOnlkOvXnGQ&s", 2)
        ],
        category: categories[2],
        desc: "unos lentes de marca Rayban",
        brand: "Rayban",
        stock: 5,
        weight: 1250,
        rating: 4.5,
        sold: 6,
        oldPrice: 135629,
    }),

    new Product({
        id: 3,
        name: "Pantalon Gucci",
        price: 78948,
        costPrice: 24580,
        images: [
            new ProductImage(5, "https://http2.mlstatic.com/D_726749-MLA84464065015_052025-O.jpg", 3),
            new ProductImage(6, "https://cdna.lystit.com/300/375/c/photos/mytheresa/0e813f0b/gucci-beige-Gg-Wool-And-Cashmere-Blend-Wide-Leg-Pants.jpeg", 3)
        ],
        category: categories[3],
        desc: "Un pantalon de la marca Gucci",
        brand: "Gucci",
        stock: 3,
        weight: 1250,
        rating: 5,
        sold: 1,
        oldPrice: 125759,
    }),

    new Product({
        id: 4,
        name: "Remera LV elastizada buena calidad modelo 383bfj",
        price: 26999,
        costPrice: 10586,
        images: [
            new ProductImage(7, "https://es.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-camiseta-vuitton-paris--FPTB06OB0001_PM1_Cropped%20view.jpg", 4),
            new ProductImage(8, "https://i.pinimg.com/736x/58/68/3f/58683f2137016afcc1cb53203a6ec59f.jpg", 4)
        ],
        category: categories[4],
        desc: "una remera de luis voton, que va a ser?",
        brand: "Louis Vuitton",
        stock: 0,
        weight: 1250,
        rating: 4.2,
        sold: 12,
        oldPrice: 37585,
    })
]


export class ProductRepositoryMock implements ProductRepository {
    async findAll() {
        return products
    }

    async findById(id: number) {
        return products.find(p => p.id === id) ?? null
    }
    async findBySlug(slug: string): Promise<Product | null> {
        const product = products.find(p => p.slug === slug)
        return product ?? null
    }

    async addProduct(product: Product): Promise<void> {
        products.push(product)
    }

    async updateProduct(product: Product): Promise<void> {
        if (!products.find(p => p.id === product.id)) {
            throw new Error("Product not found")
        }

        const index = products.findIndex(p => p.id === product.id)
        products[index] = product
    }

    async deleteProduct(id: number): Promise<void> {
        const index = products.findIndex(p => p.id === id)
        products.splice(index, 1)
    }

    async findByCategory(category: Category): Promise<Product[]> {
        return products.filter(p => p.category === category)
    }

}



