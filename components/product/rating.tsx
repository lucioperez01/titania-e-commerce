import { Star } from "lucide-react"

export function Rating({ value }: { value: number }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const isFull = value >= star
                const isHalf = value >= star - 0.5 && value < star
                const size = 15

                return (
                    <div key={star} className="relative">
                        <Star size={size} className="text-gray-300" />

                        {isFull && (
                            <Star
                                size={size}
                                className="absolute top-0 left-0 fill-purple-400 text-purple-200/10"
                            />
                        )}

                        {isHalf && (
                            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                <Star
                                    size={size}
                                    className="fill-purple-400 text-purple-400"
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
