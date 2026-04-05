"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"

type Comment = {
    id: number
    author: string
    rating: number
    text: string
    date: string
}

const MOCK_COMMENTS: Comment[] = [
    {
        id: 1,
        author: "Valentina G.",
        rating: 5,
        text: "Excelente calidad, llegó super rápido y el empaque era perfecto. Lo recomiendo 100%.",
        date: "15 feb 2026",
    },
    {
        id: 2,
        author: "Matías R.",
        rating: 4,
        text: "Muy buena compra, el material es de calidad. Le saco una estrella porque el color difiere un poco de la foto.",
        date: "10 feb 2026",
    },
    {
        id: 3,
        author: "Lucía P.",
        rating: 5,
        text: "Hermoso producto, justo lo que buscaba. Definitivamente volvería a comprar.",
        date: "3 feb 2026",
    },
]

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0)

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
                >
                    <Star
                        size={22}
                        className={
                            (hovered || value) >= star
                                ? "fill-purple-800 text-purple-300"
                                : "text-gray-300"
                        }
                    />
                </button>
            ))}
        </div>
    )
}

function CommentCard({ comment }: { comment: Comment }) {
    return (
        <div className="flex flex-col gap-2 bg-linear-to-tr from-purple-900/20 to-pink-300/10 border border-white/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">

                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {comment.author[0]}
                    </div>

                    <span className="text-white font-primary font-medium text-sm">{comment.author}</span>
                </div>

                <span className="text-slate-200 text-xs">{comment.date}</span>
            </div>

            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={13}
                        className={
                            comment.rating >= star
                                ? "fill-purple-300 text-purple-100"
                                : "text-gray-600"
                        }
                    />
                ))}
            </div>



            <p className="text-gray-200 text-sm font-secondary leading-relaxed">{comment.text}</p>
        </div>
    )
}

export default function ProductComments() {
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS)
    const [author, setAuthor] = useState("")
    const [rating, setRating] = useState(0)
    const [text, setText] = useState("")
    const [error, setError] = useState("")

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!author.trim() || !text.trim() || rating === 0) {
            setError("Por favor completá todos los campos y elegí una puntuación.")
            return
        }
        setError("")

        const newComment: Comment = {
            id: Date.now(),
            author: author.trim(),
            rating,
            text: text.trim(),
            date: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }),
        }
        setComments((prev) => [newComment, ...prev])
        setAuthor("")
        setRating(0)
        setText("")
    }

    return (
        <section className="w-full max-w-5xl px-5 pb-12 flex flex-col gap-6">
            <h2 className="text-white text-xl font-primary font-semibold">Reseñas del producto</h2>

            {/* Existing comments */}
            <div className="flex flex-col gap-3">
                {comments.map((c) => (
                    <CommentCard key={c.id} comment={c} />
                ))}
            </div>

            {/* New comment form */}
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-lg p-5"
            >
                <h3 className="text-white font-primary font-medium text-base">Dejá tu reseña</h3>

                <div className="flex flex-col gap-1">
                    <label className="text-slate-200 text-sm font-secondary">Tu nombre</label>
                    <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Ej: Juan P."
                        className="bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white text-sm placeholder:text-gray-200/30 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-gray-300 text-sm font-secondary">Puntuación</label>
                    <StarPicker value={rating} onChange={setRating} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-gray-300 text-sm font-secondary">Comentario</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Contanos tu experiencia con el producto..."
                        rows={3}
                        className="bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white text-sm placeholder:text-gray-200/30 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    />
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <Button
                    type="submit"
                    variant="outline"
                    className="self-start bg-purple-700/40 hover:bg-purple-600/60 border-purple-500/50 text-white cursor-pointer font-primary"
                >
                    Publicar reseña
                </Button>
            </form>
        </section>
    )
}
