"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { getBranchReviews, createReview, deleteReview } from "../../lib/reviews";
import { ConfirmDialog } from "./ui/confirm-dialog";

interface ReviewsSectionProps {
    branchId: string;
}

export function ReviewsSection({ branchId }: ReviewsSectionProps) {
    const { user, token } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, [branchId]);

    async function fetchReviews() {
        try {
            const data = await getBranchReviews(branchId);
            setReviews(data.reviews);
            setAvgRating(data.averageRating);
            setTotalReviews(data.totalReviews);
        } catch { }
    }

    const userHasReviewed = user && reviews.some((r: any) => r.user?.id === user.id);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;
        setSubmitting(true);
        setError("");
        try {
            await createReview(token, { branchId, rating, comment: comment.trim() || undefined });
            setComment("");
            setShowForm(false);
            await fetchReviews();
        } catch (err: any) {
            setError(err.message || "Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    }

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    function handleDeleteClick(reviewId: string) {
        setDeleteTargetId(reviewId);
        setDeleteConfirmOpen(true);
    }

    async function handleDeleteConfirm() {
        if (!token || !deleteTargetId) return;
        try {
            await deleteReview(token, deleteTargetId);
            await fetchReviews();
        } catch { }
        setDeleteConfirmOpen(false);
        setDeleteTargetId(null);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reviews</h2>
                    {totalReviews > 0 && (
                        <div className="mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <svg key={s} className={`h-5 w-5 ${s <= Math.round(avgRating) ? 'text-amber-400' : 'text-slate-600'}`}
                                        viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{avgRating}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                        </div>
                    )}
                </div>
                {user && !userHasReviewed && (
                    <button onClick={() => setShowForm(!showForm)}
                        className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600  transition-all">
                        Write a Review
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-dark-850 p-6 space-y-4">
                    {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</div>}
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button key={s} type="button" onClick={() => setRating(s)}
                                    className="focus:outline-none transition-transform hover:scale-110">
                                    <svg className={`h-8 w-8 ${s <= rating ? 'text-amber-400' : 'text-slate-600'}`}
                                        viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Comment (optional)</label>
                        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-900 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={submitting}
                            className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600  transition-all disabled:opacity-50">
                            {submitting ? "Submitting..." : "Submit Review"}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="rounded-xl bg-dark-800 px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-dark-700 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <p className="text-slate-500 text-sm">No reviews yet. Be the first to share your experience!</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review: any) => (
                        <div key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-dark-900 p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 font-bold text-sm">
                                        {review.user?.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{review.user?.name || "Anonymous"}</p>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <svg key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-amber-400' : 'text-slate-600'}`}
                                                    viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                            <span className="text-xs text-slate-500 ml-1">
                                                {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {user && review.user?.id === user.id && (
                                    <button onClick={() => handleDeleteClick(review.id)}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
                                )}
                            </div>
                            {review.comment && (
                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{review.comment}</p>
                            )}

                            {review.vendorReply && (
                                <div className="mt-4 rounded-xl bg-dark-850 border border-slate-200 dark:border-slate-800 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                                            Host Reply
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(review.replyCreatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{review.vendorReply}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => { setDeleteConfirmOpen(false); setDeleteTargetId(null); }}
                onConfirm={handleDeleteConfirm}
                title="Delete Review"
                message="Are you sure you want to delete your review?"
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
