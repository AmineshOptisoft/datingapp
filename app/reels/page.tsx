"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Eye,
  Send,
  X,
  ChevronUp,
  ChevronDown,
  Bookmark,
  MoreHorizontal,
  ArrowLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Comment {
  _id: string;
  userId: string;
  username: string;
  avatar: string | null;
  text: string;
  createdAt: string;
}

interface Reel {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isLiked: boolean;
  poster: {
    _id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

function ReelViewer({
  reel,
  token,
  onLikeToggle,
  onCommentIncrease,
  onReelRemoved,
}: {
  reel: Reel;
  token: string | null;
  onLikeToggle: (id: string, liked: boolean, count: number) => void;
  onCommentIncrease: (id: string, count: number) => void;
  onReelRemoved: (id: string) => void;
}) {
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };
  const [likesCount, setLikesCount] = useState(reel.likesCount);
  const [viewsCount, setViewsCount] = useState(reel.viewsCount);
  const [commentsCount, setCommentsCount] = useState(reel.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Track view + autoplay using IntersectionObserver
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            videoRef.current?.play().catch(() => {});
            if (!viewTracked) {
              timer = setTimeout(() => {
                setViewTracked(true);
                fetch(`/api/reels/${reel._id}/view`, {
                  method: "POST",
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                })
                  .then((r) => r.json())
                  .then((d) => { if (d.success) setViewsCount(d.viewsCount); })
                  .catch(() => {});
              }, 2000); // 2-second watch time requirement
            }
          } else {
            videoRef.current?.pause();
            if (timer) clearTimeout(timer); // Cancel if they scroll away before 2s
          }
        });
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [reel._id, token, viewTracked]);

  // Real-time polling: DISABLED for now — uncomment when needed
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (document.hidden) return;
  //     try {
  //       const res = await fetch(`/api/reels/${reel._id}/stats`, {
  //         headers: token ? { Authorization: `Bearer ${token}` } : {},
  //       });
  //       if (res.status === 404) {
  //         clearInterval(interval);
  //         onReelRemoved(reel._id);
  //         return;
  //       }
  //       const data = await res.json();
  //       if (data.success) {
  //         setLikesCount(data.likesCount);
  //         setViewsCount(data.viewsCount);
  //         setCommentsCount(data.commentsCount);
  //         setIsLiked(data.isLiked);
  //         onLikeToggle(reel._id, data.isLiked, data.likesCount);
  //         onCommentIncrease(reel._id, data.commentsCount);
  //       }
  //     } catch {}
  //   }, 15000);
  //   return () => clearInterval(interval);
  // }, [reel._id, token]);

  const handleLike = async () => {
    if (!token) { toast.error("Please login to like reels"); return; }
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newLiked);
    setLikesCount(newCount);
    onLikeToggle(reel._id, newLiked, newCount);
    try {
      const res = await fetch(`/api/reels/${reel._id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
        onLikeToggle(reel._id, data.liked, data.likesCount);
      }
    } catch {
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/reels/${reel._id}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.comments);
    } catch { toast.error("Failed to load comments"); }
    finally { setLoadingComments(false); }
  };

  const openComments = () => { setShowComments(true); loadComments(); };

  const submitComment = async () => {
    if (!token) { toast.error("Please login to comment"); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/reels/${reel._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((p) => [...p, data.comment]);
        setCommentsCount(data.commentsCount);
        onCommentIncrease(reel._id, data.commentsCount);
        setCommentText("");
      } else { toast.error(data.error || "Failed to post comment"); }
    } catch { toast.error("Error posting comment"); }
    finally { setSubmittingComment(false); }
  };

  const posterName = reel.poster?.username || reel.poster?.name || "User";

  return (
    <div
      ref={cardRef}
      className="relative flex items-center justify-center w-full max-w-[540px]"
    >
      {/* Reel Card */}
      <div
        className="relative flex-1 rounded-2xl overflow-hidden bg-black shadow-[0_0_60px_rgba(0,0,0,0.75)] max-h-[85vh]"
        style={{ aspectRatio: "9/16" }}
      >
        {/* Media */}
        {reel.mediaType === "video" ? (
          <div className="absolute inset-0 w-full h-full cursor-pointer" onClick={toggleMute}>
            <video
              ref={videoRef}
              src={reel.mediaUrl}
              className="absolute inset-0 w-full h-full object-cover"
              loop muted={isMuted} playsInline
            />
            <div className="absolute top-4 right-4 z-20 bg-black/40 p-2 rounded-full backdrop-blur-sm transition-transform active:scale-95">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        ) : (
          <img
            src={reel.mediaUrl}
            alt={reel.caption || "Reel"}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

        {/* Bottom — username + follow + caption (Instagram style) */}
        <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
          {/* Username + Follow */}
          <div className="flex items-center justify-between">
            <Link
              href={`/user/${reel.poster?._id}`}
              className="flex items-center gap-2 group/poster"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover/poster:ring-2 group-hover/poster:ring-white/60 transition-all">
                {reel.poster?.avatar ? (
                  <img src={reel.poster.avatar} alt={posterName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{posterName[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className="text-white font-semibold text-sm drop-shadow group-hover/poster:underline underline-offset-2">
                @{posterName}
              </span>
            </Link>
            <button className="px-4 py-1.5 border border-white rounded-lg text-white text-xs font-semibold hover:bg-white/20 transition">
              Follow
            </button>
          </div>

          {/* Caption */}
          {reel.caption && (
            <p className="text-white text-sm drop-shadow line-clamp-2 leading-relaxed">{reel.caption}</p>
          )}
        </div>
      </div>

      {/* Right Action Column (overlay, Instagram-style) */}
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border ${
            isLiked
              ? "bg-red-500/15 border-red-500/30"
              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
          }`}>
            <Heart className={`w-6 h-6 transition-all duration-200 ${isLiked ? "fill-red-500 text-red-500" : "text-zinc-700 dark:text-zinc-300"}`} />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}
          </span>
        </button>

        {/* Comments */}
        <button onClick={openComments} className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-all">
            <MessageCircle className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {commentsCount >= 1000 ? `${(commentsCount / 1000).toFixed(1)}K` : commentsCount}
          </span>
        </button>

        {/* Views */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
            <Eye className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {viewsCount >= 1000 ? `${(viewsCount / 1000).toFixed(1)}K` : viewsCount}
          </span>
        </div>

        {/* Save */}
        <button onClick={() => setIsSaved((s) => !s)} className="flex flex-col items-center gap-1 group">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
            isSaved
              ? "bg-yellow-500/15 border-yellow-500/30"
              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700"
          }`}>
            <Bookmark className={`w-6 h-6 transition-all ${isSaved ? "fill-yellow-500 text-yellow-500" : "text-zinc-700 dark:text-zinc-300"}`} />
          </div>
        </button>

        {/* More */}
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 flex items-center justify-center transition-all">
            <MoreHorizontal className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          </div>
        </button>
      </div>

      {/* Comments Panel - slides over the card */}
      {showComments && (
        <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center px-4 py-4" onClick={() => setShowComments(false)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-zinc-900 dark:text-white font-semibold">
                Comments {commentsCount > 0 && <span className="text-zinc-400 font-normal text-sm">({commentsCount})</span>}
              </h3>
              <button onClick={() => setShowComments(false)} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {loadingComments ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-zinc-400 text-sm">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No comments yet</p>
                  <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-1">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.avatar
                        ? <img src={c.avatar} alt={c.username} className="w-full h-full object-cover" />
                        : <span className="text-white text-xs font-bold">{c.username[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                      <p className="text-zinc-900 dark:text-white font-semibold text-xs">{c.username}</p>
                      <p className="text-zinc-700 dark:text-zinc-300 text-sm mt-0.5">{c.text}</p>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                placeholder="Write a comment..."
                maxLength={500}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-pink-500 transition"
              />
              <button
                onClick={submitComment}
                disabled={submittingComment || !commentText.trim()}
                className="w-9 h-9 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center disabled:opacity-40 transition active:scale-95 flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    fetchReels(t, null);
  }, []);

  const fetchReels = async (t: string | null, cursor: string | null = null) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const url = cursor ? `/api/reels?cursor=${cursor}` : "/api/reels";
      const res = await fetch(url, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setReels((prev) => (cursor ? [...prev, ...data.reels] : data.reels));
        setNextCursor(data.nextCursor);
      }
    } catch { toast.error("Failed to load reels"); }
    finally {
      if (cursor) setLoadingMore(false);
      else setLoading(false);
    }
  };

  const handleLikeToggle = useCallback((id: string, liked: boolean, count: number) => {
    setReels((prev) => prev.map((r) => r._id === id ? { ...r, isLiked: liked, likesCount: count } : r));
  }, []);

  const handleCommentIncrease = useCallback((id: string, count: number) => {
    setReels((prev) => prev.map((r) => r._id === id ? { ...r, commentsCount: count } : r));
  }, []);

  const handleReelRemoved = useCallback((id: string) => {
    setReels((prev) => prev.filter((r) => r._id !== id));
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex((i) => i + 1);
      // Fetch more when 3 reels away from the end
      if (currentIndex >= reels.length - 3 && nextCursor && !loadingMore) {
        fetchReels(token, nextCursor);
      }
    }
  };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex((i) => i - 1); };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, reels.length]);

  // Mouse wheel scroll navigation
  const scrollCooldown = useRef(false);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (scrollCooldown.current) return;
      scrollCooldown.current = true;

      if (e.deltaY > 0) goNext();
      else if (e.deltaY < 0) goPrev();

      setTimeout(() => { scrollCooldown.current = false; }, 400);
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentIndex, reels.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading Reels...</p>
        </div>
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="max-h-screen h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-6 pt-16">
        <div className="text-center space-y-3 px-6">
          <div className="text-7xl mb-4">🎬</div>
          <h2 className="text-zinc-900 dark:text-white text-2xl font-bold">No Reels Yet</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No one has posted a reel yet.</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs max-w-xs mx-auto">
            Go to your Profile → Scenes tab and click "Post as Reel" on any scene!
          </p>
        </div>
        <Link
          href="/profile"
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-pink-500/25"
        >
          Go to Profile
        </Link>
        <Link href="/" className="text-zinc-400 dark:text-zinc-500 text-sm hover:text-zinc-600 dark:hover:text-zinc-300 transition flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div className="max-h-screen h-[calc(100vh-10vh)] bg-white dark:bg-zinc-950 flex items-center justify-center transition-colors">
      {/* Main Viewer */}
      <div className="relative w-full max-w-5xl px-4 flex flex-col items-center gap-4">
        {/* Up / Down Navigation */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronUp className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === reels.length - 1}
            className="w-10 h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronDown className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>

        {/* Reel Card */}
        <ReelViewer
          key={currentReel._id}
          reel={currentReel}
          token={token}
          onLikeToggle={handleLikeToggle}
          onCommentIncrease={handleCommentIncrease}
          onReelRemoved={handleReelRemoved}
        />

        {/* Dot indicators */}
        {reels.length > 1 && reels.length <= 15 && (
          <div className="flex items-center gap-1.5 mt-2">
            {reels.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5 h-2 bg-pink-500"
                    : "w-2 h-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
