import Link from "next/link"
import { Button } from "../ui/button"
import { text } from "stream/consumers";

type PriceProps = {
    value: number;
    oldValue?: number;
    sm?: boolean
}

export default function Price({ value, oldValue, sm }: PriceProps) {
    let textSize: string = "text-3xl"
    let textSize2: string = "text-xl"

    if (sm) {
        textSize = "text-sm lg:text-xs"
        textSize2 = "text-xs"
    }

    if (oldValue) {
        let discount = ((oldValue - value) * 100) / oldValue
        return (
            <div className="flex flex-col gap-1 ">

                <div className="flex flex-col">
                    <div className="">
                        <p className={`line-through font-primary text-slate-100/60 ${textSize2}`}>AR$ {oldValue}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className={`font-primary ${textSize}`}>AR$ {value}</p>
                        <p className={`bg-purple-300/30 p-[0.2rem] rounded-sm text-yellow-300 font-primary shadow-sm shadow-purple-200/50 ${textSize2}`}>{discount.toFixed(1)}% OFF</p>
                    </div>

                </div>


            </div>
        )
    }
    return (
        <div>
            <p className={`font-primary ${textSize}`}>AR$ {value}</p>
        </div>
    )
}