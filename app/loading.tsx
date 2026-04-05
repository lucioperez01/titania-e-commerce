export default function Loading() {
    return (
        <div className="max-w-6xl mx-auto p-5">
            <div className="animate-pulse flex flex-col gap-4">

                <div className="h-6 bg-gray-700 rounded w-1/3" />

                <div className="flex gap-5">
                    <div className="w-96 h-96 bg-gray-700 rounded" />

                    <div className="flex flex-col gap-3 w-full">
                        <div className="h-6 bg-gray-700 rounded w-1/2" />
                        <div className="h-10 bg-gray-700 rounded w-1/3" />
                        <div className="h-4 bg-gray-700 rounded w-full" />
                        <div className="h-4 bg-gray-700 rounded w-5/6" />
                    </div>
                </div>

            </div>
        </div>
    )
}