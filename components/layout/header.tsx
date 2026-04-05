import Image from "next/image";
import Link from "next/link"
import { Button } from "../ui/button";

export default function Header() {
        let ctaText: string = "Ver colección"
        let shopHref: string = "/shop"

        return(
            <div className="flex flex-col w-full text-slate-200 justify-center items-center">
                <div className="relative 
                w-full h-110
                flex flex-col justify-center items-start  
                ">

                    {/* Overlay oscuro */}
                    <div className="absolute w-full inset-0 bg-[url('/header-img.jpg')] bg-top 2xl:bg-top-right opacity-70 "></div>

                        {/* Contenido */}
                        <div className="w-full h-full bg-linear-to-t from-purple-600/80 via-purple-400/10 to-transparent relative z-10 text-slate-200 flex flex-col  p-10 items-start justify-center">

                            <div className="flex flex-col min-w-[52%] lg:min-w-[43%] self-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-5xl lg:text-6xl font-bold ">
                                        Titania Shop
                                    </h1>

                                    <p className="font-secondary text-lg lg:text-xl font-light">
                                    Indumentaria y Accesorios de calidad accesible, con envío rápido y garantía.
                                    </p>
                                </div>
                                

                                <Link href={shopHref}>
                                    <Button
                                        variant="ghost"
                                        className="border-b px-2 border-white 
                                                hover:bg-white 
                                                hover:text-black 
                                                transition-all cursor-pointer animate-pulse hover:animate-none font-primary shadow-xl rounded-xs xl:text-lg">
                                        ♦ Ver catálogo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
            </div>
        )
        }
