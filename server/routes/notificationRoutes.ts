import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware';
import { getDb, saveDatabase } from '../db';
import { supabaseServer } from '../supabase';
import { NotificationItem } from '../../src/types';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const db = getDb();
    let notifs: NotificationItem[] = db.notifications.filter((n) => n.userId === user.id);

    try {
      const { data, error } = await supabaseServer
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        notifs = data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          message: row.message,
          type: row.type || 'info',
          isRead: Boolean(row.is_read),
          orderId: row.order_id,
          createdAt: row.created_at,
        }));
      }
    } catch {
      // Graceful local store fallback
    }

    notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = notifs.filter((n) => !n.isRead).length;

    res.json({ notifications: notifs, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load notifications' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const db = getDb();
    const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === user.id);

    if (notif) {
      notif.isRead = true;
      saveDatabase();
    }

    try {
      await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('id', req.params.id)
        .eq('user_id', user.id);
    } catch {
      // Ignore
    }

    res.json({ message: 'Marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const db = getDb();
    db.notifications
      .filter((n) => n.userId === user.id)
      .forEach((n) => {
        n.isRead = true;
      });

    saveDatabase();

    try {
      await supabaseServer
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);
    } catch {
      // Ignore
    }

    res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notifications' });
  }
});

export default router;
