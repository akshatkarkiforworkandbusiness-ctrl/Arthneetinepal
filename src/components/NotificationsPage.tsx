import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell, Heart, MessageSquare, UserPlus, Check } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  postId?: string;
  postTitle?: string;
  fromUserId: string;
  fromUserName: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qNotifications = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(qNotifications,
      (snapshot) => {
        const notifData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotifications(notifData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notifications`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notifId: string) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, `users/${user.uid}/notifications/${notifId}`), {
        read: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/notifications/${notifId}`);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadQuery = query(
        collection(db, `users/${user.uid}/notifications`),
        where('read', '==', false)
      );
      const unreadSnap = await getDocs(unreadQuery);
      
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      unreadSnap.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/notifications`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-brand-emerald" />;
      case 'comment': return <MessageSquare size={16} className="text-brand-emerald-light" />;
      case 'follow': return <UserPlus size={16} className="text-blue-500" />;
      default: return <Bell size={16} className="text-text-muted" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    }
  };

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
        <div className="text-center">
          <Bell size={48} className="mx-auto mb-4 text-text-muted" />
          <h1 className="text-2xl font-display font-medium text-brandwood mb-2">Notifications</h1>
          <p className="text-text-muted">Sign in to view your notifications</p>
        </div>
      </main>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-6 py-24 min-h-screen"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium text-brandwood mb-2">Notifications</h1>
          <p className="text-text-muted text-sm">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-emerald-light hover:bg-brand-emerald-light/10 rounded-xl transition-colors"
          >
            <Check size={14} />
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-full bg-white border border-blush-mist rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                notification.read
                  ? 'bg-white border-blush-mist hover:shadow-sm'
                  : 'bg-brand-emerald-light/5 border-brand-emerald-light/20 hover:shadow-card'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brandwood">
                    <span className="font-bold">{notification.fromUserName}</span>
                    {' '}{notification.message}
                  </p>
                  {notification.postTitle && (
                    <p className="text-xs text-text-muted mt-1 truncate">
                      in "{notification.postTitle}"
                    </p>
                  )}
                  <p className="text-[10px] text-text-muted mt-2">
                    {notification.createdAt?.toDate
                      ? new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(notification.createdAt.toDate())
                      : 'Recent'}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-emerald-light shrink-0 mt-2" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.main>
  );
}
