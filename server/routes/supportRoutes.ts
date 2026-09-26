import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  getDb,
  saveDatabase,
  getSupportMessages,
  addSupportMessage,
  updateSupportMessageStatus,
  SupportMessageRecord,
} from '../db';
import { supabaseServer } from '../supabase';
import { NotificationItem } from '../../src/types';

const router = Router();

// POST /api/support/messages - Submit a new support request / problem report
router.post('/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      country,
      subject,
      category,
      message,
      screenshotUrl,
      orderId,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Please provide your name.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Please enter your message or problem details.' });
      return;
    }

    const ticketId = `supp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket: SupportMessageRecord = {
      id: ticketId,
      ticketNumber,
      userId: req.user?.id || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone && typeof phone === 'string' ? phone.trim() : null,
      country: country || (req.user?.country || 'Bangladesh'),
      subject: subject && typeof subject === 'string' && subject.trim() ? subject.trim() : 'Customer Support Inquiry',
      category: category && typeof category === 'string' ? category.trim() : 'general',
      message: message.trim(),
      screenshotUrl: screenshotUrl && typeof screenshotUrl === 'string' && screenshotUrl.length > 5 ? screenshotUrl : null,
      orderId: orderId && typeof orderId === 'string' && orderId.trim() ? orderId.trim() : null,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local persistent database
    addSupportMessage(newTicket);

    // 2. Add customer account notification if logged in
    const db = getDb();
    if (req.user?.id) {
      try {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: req.user.id,
          title: `Support Ticket Received: #${ticketNumber}`,
          message: `Your inquiry "${newTicket.subject}" was received. Support will reply via ${newTicket.email} shortly.`,
          type: 'account',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.unshift(notif);
      } catch (notifErr) {
        console.warn('Could not create notification for support ticket:', notifErr);
      }
    }

    // Add notification for admin
    db.notifications.unshift({
      id: `notif-admin-${Date.now()}`,
      userId: 'admin',
      title: `New Support Ticket: #${ticketNumber}`,
      message: `${newTicket.name} (${newTicket.country || 'Global'}) submitted: "${newTicket.subject}".`,
      type: 'account',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    saveDatabase();

    // 3. Sync to Supabase support_tickets table
    try {
      const { data: supaTicketData, error: supaTicketErr } = await supabaseServer.from('support_tickets').insert({
        customer_id: newTicket.userId || null,
        customer_name: newTicket.name,
        customer_email: newTicket.email,
        customer_phone: newTicket.phone,
        country: newTicket.country,
        order_id: newTicket.orderId,
        subject: newTicket.subject,
        category: newTicket.category,
        priority: 'medium',
        status: 'open',
        description: newTicket.message,
        attachments: newTicket.screenshotUrl ? [newTicket.screenshotUrl] : [],
        created_at: newTicket.createdAt,
        updated_at: newTicket.updatedAt,
      }).select();

      if (!supaTicketErr && supaTicketData?.[0]) {
        newTicket.id = supaTicketData[0].id;
        if (supaTicketData[0].ticket_number) {
          newTicket.ticketNumber = supaTicketData[0].ticket_number;
        }
        saveDatabase();
        console.log('[Supabase Support Ticket Success]: Ticket stored as', newTicket.ticketNumber);
      } else if (supaTicketErr) {
        console.warn('[Supabase Support Ticket Note]:', supaTicketErr.message);
      }
    } catch (supaErr: any) {
      console.warn('[Supabase Support Ticket Error]:', supaErr.message);
    }

    // 4. Trigger Admin Notification in Supabase notifications table
    try {
      const adminTicketNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: `New Support Ticket: ${newTicket.ticketNumber}`,
        message: `${newTicket.name} submitted: "${newTicket.subject}".`,
        type: 'system_alert',
        recipient_type: 'all',
        target_country: newTicket.country,
        recipient_customer_id: newTicket.userId,
        recipient_customer_name: newTicket.name,
        link: '/admin',
        is_read: false,
        created_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      };
      await supabaseServer.from('notifications').insert(adminTicketNotif);
    } catch (notifErr: any) {
      console.warn('[Admin Notification for Support]:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully. Our team will review your report.',
      ticket: newTicket,
    });
  } catch (err: any) {
    console.error('Error submitting support message:', err);
    res.status(500).json({ error: err.message || 'Failed to submit support message.' });
  }
});

// GET /api/support/messages - Retrieve support tickets
router.get('/messages', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const localMessages = getSupportMessages();
    const messageMap = new Map<string, any>();

    // 1. Add local messages
    for (const msg of localMessages) {
      messageMap.set(msg.id, msg);
      if (msg.ticketNumber) messageMap.set(msg.ticketNumber, msg);
    }

    // 2. Fetch live tickets from Supabase support_tickets table
    try {
      const { data: supaTickets, error } = await supabaseServer
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(supaTickets)) {
        for (const row of supaTickets) {
          const mapped = {
            id: row.id,
            ticketNumber: row.ticket_number || row.id,
            userId: row.customer_id,
            name: row.customer_name || 'Customer',
            email: row.customer_email || '',
            phone: row.customer_phone || '',
            country: row.country || 'Global',
            subject: row.subject || 'Support Ticket',
            category: row.category || 'General Inquiry',
            priority: row.priority || 'medium',
            message: row.description || '',
            screenshotUrl: Array.isArray(row.attachments) && row.attachments.length > 0 ? row.attachments[0] : null,
            orderId: row.order_id || null,
            status: row.status || 'open',
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
          };
          messageMap.set(mapped.id, mapped);
        }
      }
    } catch (supaErr: any) {
      console.warn('[Supabase support fetch fallback]:', supaErr.message);
    }

    const allMessages = Array.from(new Set(messageMap.values()));
    const { email, orderId } = req.query;

    // If admin, return all
    if (req.user?.isAdmin) {
      res.json({ success: true, count: allMessages.length, messages: allMessages });
      return;
    }

    // If authenticated regular customer
    if (req.user?.id) {
      const userTickets = allMessages.filter(
        (m) => m.userId === req.user?.id || (req.user?.email && m.email.toLowerCase() === req.user.email.toLowerCase())
      );
      res.json({ success: true, count: userTickets.length, messages: userTickets });
      return;
    }

    // If query by email
    if (email && typeof email === 'string') {
      const emailTickets = allMessages.filter((m) => m.email.toLowerCase() === email.toLowerCase());
      res.json({ success: true, count: emailTickets.length, messages: emailTickets });
      return;
    }

    // If query by orderId
    if (orderId && typeof orderId === 'string') {
      const orderTickets = allMessages.filter((m) => m.orderId === orderId);
      res.json({ success: true, count: orderTickets.length, messages: orderTickets });
      return;
    }

    res.json({ success: true, count: allMessages.length, messages: allMessages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve support messages.' });
  }
});

// PATCH /api/support/messages/:id/status - Update status
router.patch('/messages/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }

    const updated = updateSupportMessageStatus(req.params.id, status);

    // Sync to Supabase support_tickets table
    try {
      await supabaseServer
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .or(`id.eq.${req.params.id},ticket_number.eq.${req.params.id}`);
    } catch (supaErr: any) {
      console.warn('[Supabase support status sync]:', supaErr.message);
    }

    res.json({ success: true, message: `Ticket status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update ticket status.' });
  }
});

export default router;
