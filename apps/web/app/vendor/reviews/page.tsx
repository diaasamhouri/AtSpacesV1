"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { replyToReview, getVendorReviews } from "../../../lib/vendor";
import { format } from "date-fns";
import type { Review } from "../../../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function VendorReviewsPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        if (!token) return;
        loadReviews();
    }, [token]);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await getVendorReviews(token!);
            setReviews(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleReplySubmit = async (reviewId: string) => {
        if (!replyText.trim() || !token) return;
        try {
            const updatedReview = await replyToReview(token, reviewId, replyText);
            setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, ...updatedReview } : r));
            setReplyingTo(null);
            setReplyText("");
        } catch {
            toast("Failed to submit reply.", "error");
        }
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Reviews</h1>

            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-12 text-center shadow-float">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
                            <svg className="h-8 w-8 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No reviews yet</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            When customers leave reviews for your branches, they will appear here.
                        </p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="rounded-2xl bg-white dark:bg-dark-900 p-5 shadow-float border border-slate-200 dark:border-slate-800">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-dark-800">
                                        {review.user?.image ? (
                                            <img src={`${API}${review.user.image}`} alt={review.user.name ?? undefined} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-dark-800">
                                                {review.user?.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{review.user?.name || "Customer"}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-yellow-400 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i}>{i < review.rating ? "\u2605" : "\u2606"}</span>
                                                ))}
                                            </div>
                                            <span className="text-xs text-brand-500 font-medium bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">{review.branchName}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {review.comment && (
                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{review.comment}</p>
                            )}

                            {review.vendorReply ? (
                                <div className="mt-4 rounded-lg bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 p-4 relative">
                                    <div className="absolute -top-3 left-4 bg-slate-100 dark:bg-dark-800 px-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 rounded">
                                        Your Reply &bull; {review.replyCreatedAt && format(new Date(review.replyCreatedAt), "MMM d")}
                                    </div>
                                    <p className="text-sm text-gray-900 dark:text-white">{review.vendorReply}</p>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    {replyingTo === review.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500 bg-white dark:bg-dark-850 focus:bg-slate-50 dark:focus:bg-dark-900 transition-colors"
                                                placeholder="Write a public reply to this review..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setReplyingTo(null)}
                                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-100 dark:bg-dark-800 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReplySubmit(review.id)}
                                                    disabled={!replyText.trim()}
                                                    className="rounded-lg bg-brand-500 active:scale-95 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                                                >
                                                    Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setReplyingTo(review.id);
                                                setReplyText("");
                                            }}
                                            className="text-sm font-semibold text-brand-500 hover:text-brand-400 transition-colors"
                                        >
                                            Reply to review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
