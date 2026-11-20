import { AdminService } from '../services/admin.service.js';
import { AnalyticsService } from '../services/analytics.service.js';

export class AdminController {
  // System Health
  static async getSystemHealth(req, res, next) {
    try {
      const health = await AdminService.getSystemHealth();
      res.status(200).json({ success: true, data: health });
    } catch (err) {
      next(err);
    }
  }

  // Dashboard & Analytics
  static async getDashboardKPIs(req, res, next) {
    try {
      const kpis = await AnalyticsService.getDashboardKPIs();
      res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      next(err);
    }
  }

  static async getDonationTrends(req, res, next) {
    try {
      const trends = await AnalyticsService.getDonationTrends(req.query.period);
      res.status(200).json({ success: true, data: trends });
    } catch (err) {
      next(err);
    }
  }

  static async getTopDonors(req, res, next) {
    try {
      const donors = await AnalyticsService.getTopDonors(req.query.limit);
      res.status(200).json({ success: true, data: donors });
    } catch (err) {
      next(err);
    }
  }

  static async getReports(req, res, next) {
    try {
      const reports = await AnalyticsService.getReportsData();
      res.status(200).json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }

  // Users Management
  static async listUsers(req, res, next) {
    try {
      const result = await AdminService.listUsers(req.query);
      res.status(200).json({ success: true, data: result.users, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const updated = await AdminService.updateUserStatus(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const result = await AdminService.deleteUser(req.params.id, req.user.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Verification Center
  static async listVerifications(req, res, next) {
    try {
      const result = await AdminService.listVerifications(req.query);
      res.status(200).json({ success: true, data: result.verifications, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  static async reviewVerification(req, res, next) {
    try {
      const reviewed = await AdminService.reviewVerification(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, message: 'Verification updated successfully', data: reviewed });
    } catch (err) {
      next(err);
    }
  }

  // Withdrawals
  static async listWithdrawals(req, res, next) {
    try {
      const result = await AdminService.listWithdrawals(req.query);
      res.status(200).json({ success: true, data: result.withdrawals, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  static async reviewWithdrawal(req, res, next) {
    try {
      const reviewed = await AdminService.reviewWithdrawal(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, message: 'Withdrawal updated successfully', data: reviewed });
    } catch (err) {
      next(err);
    }
  }

  // Support Tickets
  static async listSupportTickets(req, res, next) {
    try {
      const result = await AdminService.listSupportTickets(req.query);
      res.status(200).json({ success: true, data: result.tickets, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  static async updateSupportTicket(req, res, next) {
    try {
      const payload = {
        ...req.body,
        assignedAdminId: req.body.assignedAdminId || req.user?.id,
      };
      const updated = await AdminService.updateSupportTicket(req.params.id, payload);
      res.status(200).json({ success: true, message: 'Support ticket updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  static async deleteSupportTicket(req, res, next) {
    try {
      await AdminService.deleteSupportTicket(req.params.id);
      res.status(200).json({ success: true, message: 'Support ticket deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Audit Logs
  static async listAuditLogs(req, res, next) {
    try {
      const result = await AdminService.listAuditLogs(req.query);
      res.status(200).json({ success: true, data: result.logs, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  }

  // System Settings
  static async getSettings(req, res, next) {
    try {
      const settings = await AdminService.getSettings();
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  static async updateSetting(req, res, next) {
    try {
      const updated = await AdminService.updateSetting(req.params.key, req.body);
      res.status(200).json({ success: true, message: 'Setting saved', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // Broadcast Notifications
  static async sendBroadcastNotification(req, res, next) {
    try {
      const result = await AdminService.sendBroadcastNotification({
        ...req.body,
        actorId: req.user?.id,
      });
      res.status(200).json({
        success: true,
        message: result.message,
        count: result.count,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getBroadcastHistory(req, res, next) {
    try {
      const history = await AdminService.getRecentBroadcasts();
      res.status(200).json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  // --- ADMINISTRATORS ---
  static async listAdministrators(req, res, next) {
    try {
      const data = await AdminService.listAdministrators();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createAdministrator(req, res, next) {
    try {
      const data = await AdminService.createAdministrator(req.body);
      res.status(201).json({ success: true, message: 'Administrator created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  static async updateAdministrator(req, res, next) {
    try {
      const data = await AdminService.updateAdministrator(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Administrator updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAdministrator(req, res, next) {
    try {
      await AdminService.deleteAdministrator(req.params.id);
      res.status(200).json({ success: true, message: 'Administrator deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- AUDIT LOGS ---
  static async deleteAuditLog(req, res, next) {
    try {
      await AdminService.deleteAuditLog(req.params.id);
      res.status(200).json({ success: true, message: 'Audit log entry deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async clearAuditLogs(req, res, next) {
    try {
      await AdminService.clearAuditLogs();
      res.status(200).json({ success: true, message: 'Audit logs cleared successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- SETTINGS ---
  static async deleteSetting(req, res, next) {
    try {
      await AdminService.deleteSetting(req.params.key);
      res.status(200).json({ success: true, message: 'Setting reset/deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // --- SECURITY ALERTS ---
  static async getSecurityAlerts(req, res, next) {
    try {
      const data = await AdminService.getSecurityAlerts();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateSecurityAlert(req, res, next) {
    try {
      const result = await AdminService.updateSecurityAlert(req.params.id, req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async deleteSecurityAlert(req, res, next) {
    try {
      const result = await AdminService.deleteSecurityAlert(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async createSecurityAlert(req, res, next) {
    try {
      const data = await AdminService.createSecurityAlert(req.body);
      res.status(201).json({ success: true, message: 'Security alert created', data });
    } catch (err) {
      next(err);
    }
  }
}
