import { useState } from 'react';
import { Heart, MessageSquare, Share2, Bookmark, ExternalLink, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface PostActionsProps {
  postId: string;
  likes: number;
  commentCount: number;
  hasLiked?: boolean;
  isBookmarked?: boolean;
  showComments?: boolean;
  compact?: boolean;
  onCommentClick?: () => void;
}

export default function PostActions({
  postId,
  likes,
  commentCount,
  hasLiked: initialHasLiked = false,
  isBookmarked: initialIsBookmarked = false,
  showComments = true,
  compact = false,
  onCommentClick,
}: PostActionsProps) {
  const { user } = useAuth();
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    const postRef = doc(db, 'posts', postId);
    const likeRef = doc(db, `posts/${postId}/likes/${user.uid}`);
    
    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likes: increment(-1),
          engagementScore: increment(-1),
        });
        setHasLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await setDoc(likeRef, { likedAt: serverTimestamp() });
        await updateDoc(postRef, {
          likes: increment(1),
          engagementScore: increment(1),
        });
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/likes`);
      toast.error('Failed to update like');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error('Please sign in to bookmark posts');
      return;
    }
    
    const bookmarkRef = doc(db, `users/${user.uid}/bookmarks/${postId}`);
    
    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        setIsBookmarked(false);
        toast.success('Removed from bookmarks');
      } else {
        await setDoc(bookmarkRef, {
          postId,
          bookmarkedAt: serverTimestamp(),
        });
        setIsBookmarked(true);
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/bookmarks`);
      toast.error('Failed to update bookmark');
    }
  };

  const shareUrl = `${window.location.origin}/post/${postId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent('Check out this post on Arthneeti');
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
    setShowShareMenu(false);
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
    setShowShareMenu(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[10px] text-text-muted">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${
            hasLiked ? 'text-coral-flame' : 'hover:text-coral-flame'
          }`}
        >
          <Heart size={12} fill={hasLiked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </button>
        {showComments && (
          <button
            onClick={onCommentClick}
            className="flex items-center gap-1 hover:text-mint-action transition-colors"
          >
            <MessageSquare size={12} />
            <span>{commentCount}</span>
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-1 hover:text-mint-action transition-colors"
          >
            <Share2 size={12} />
          </button>
          {showShareMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-blush-mist rounded-xl shadow-lg py-2 min-w-[140px] z-50">
              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2 text-left text-xs text-brandwood hover:bg-sunset-fade/50 flex items-center gap-2"
              >
                <ExternalLink size={12} /> Copy Link
              </button>
              <button
                onClick={handleShareTwitter}
                className="w-full px-3 py-2 text-left text-xs text-brandwood hover:bg-sunset-fade/50 flex items-center gap-2"
              >
                <Twitter size={12} /> Share on X
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="w-full px-3 py-2 text-left text-xs text-brandwood hover:bg-sunset-fade/50 flex items-center gap-2"
              >
                <Linkedin size={12} /> Share on LinkedIn
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleBookmark}
          className={`transition-colors ${isBookmarked ? 'text-mint-action' : 'hover:text-mint-action'}`}
        >
          <Bookmark size={12} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 pt-4 border-t border-blush-mist">
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 transition-colors ${
          hasLiked ? 'text-coral-flame' : 'text-text-muted hover:text-coral-flame'
        }`}
        disabled={!user}
      >
        <Heart size={16} fill={hasLiked ? 'currentColor' : 'none'} />
        <span className="text-xs font-bold">{likeCount}</span>
      </button>
      
      {showComments && (
        <button
          onClick={onCommentClick}
          className="flex items-center gap-2 text-text-muted hover:text-mint-action transition-colors"
        >
          <MessageSquare size={16} />
          <span className="text-xs font-bold">{commentCount}</span>
        </button>
      )}
      
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2 text-text-muted hover:text-mint-action transition-colors"
        >
          <Share2 size={16} />
          <span className="text-xs font-bold">Share</span>
        </button>
        
        {showShareMenu && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-blush-mist rounded-xl shadow-lg py-2 min-w-[180px] z-50">
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2 text-left text-xs text-brandwood hover:bg-sunset-fade/50 flex items-center gap-2"
            >
              <ExternalLink size={14} /> Copy Link
            </button>
            <button
              onClick={handleShareTwitter}
              className="w-full px-4 py-2 text-left text-xs text-brandwood hover:bg-sunset-fade/50 flex items-center gap-2"
            >
              <Twitter size={14} /> Share on X
            </button>
            <button
              onClick={handleShareLinkedIn}
              className="w-full px-4 py-2 text-left text-xs text-brandwood hover:bg-sunset-fade/50 flex items-center gap-2"
            >
              <Linkedin size={14} /> Share on LinkedIn
            </button>
          </div>
        )}
      </div>
      
      <button
        onClick={handleBookmark}
        className={`flex items-center gap-2 transition-colors ${
          isBookmarked ? 'text-mint-action' : 'text-text-muted hover:text-mint-action'
        }`}
        disabled={!user}
      >
        <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        <span className="text-xs font-bold">{isBookmarked ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  );
}
