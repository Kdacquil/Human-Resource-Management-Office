import { Component, OnInit } from '@angular/core';
import { AuditLogService } from '../../../../services/audit-log.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  logs: any[] = [];
  filteredLogs: any[] = [];
  searchQuery: string = '';
  actionFilter: string = ''; // Dropdown filter (Onboard, Update, Offboard)
  fromDate: string = ''; // Start Date for Filtering
  toDate: string = ''; // End Date for Filtering

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit() {
    this.fetchLogs();
  }

  /** ✅ Fetch All Logs */
  fetchLogs() {
    this.auditLogService.getAuditLogs().subscribe(data => {
      this.logs = data;
      this.filteredLogs = [...this.logs]; // ✅ Initially show all logs
    });
  }

  /** 🔍 Filter Logs by Email, Action, and Date Range */
  filterLogs() {
    const lowerQuery = this.searchQuery.toLowerCase().trim();
    const selectedAction = this.actionFilter.trim().toLowerCase();
    const from = this.fromDate ? new Date(this.fromDate).setHours(0, 0, 0, 0) : null;
    const to = this.toDate ? new Date(this.toDate).setHours(23, 59, 59, 999) : null;

    this.filteredLogs = this.logs.filter(log => {
      const emailMatch = log.email.toLowerCase().includes(lowerQuery);
      const actionMatch = selectedAction ? log.action.toLowerCase().includes(selectedAction) : true;
      const logDate = log.timestamp?.toDate(); // Convert Firestore timestamp to JavaScript Date

      let dateMatch = true;
      if (from && to) {
        dateMatch = logDate >= new Date(from) && logDate <= new Date(to);
      } else if (from) {
        dateMatch = logDate >= new Date(from);
      } else if (to) {
        dateMatch = logDate <= new Date(to);
      }

      return emailMatch && actionMatch && dateMatch;
    });
  }
}
