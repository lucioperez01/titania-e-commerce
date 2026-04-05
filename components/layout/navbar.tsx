import Link from "next/link";

export default function Navbar() {
    return (
        <div className="sticky top-0 w-full h-10 flex items-center justify-around px-5 bg-purple-500/40 text-white border-b border-gray-300/30 backdrop-blur-sm z-20">

            <div className="w-[85%] flex items-center justify-between text-md max-w-5xl lg:text-lg">
                <Link href="/"><h1 className="font-primary font-medium">Titania</h1></Link>

                <nav>
                    <ul className="flex gap-5 font-primary ">
                        <li>
                            <Link href="/shop" className="">Shop</Link>
                        </li>
                        <li>
                            <Link href="#" className="">Contact</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}