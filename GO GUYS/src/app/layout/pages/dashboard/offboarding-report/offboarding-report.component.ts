import { Component, OnInit } from '@angular/core';
import { OffboardingReportService } from '../../../../services/offboard-report.service';

@Component({
  selector: 'app-offboarding-report',
  templateUrl: './offboarding-report.component.html',
  styleUrls: ['./offboarding-report.component.scss']
})
export class OffboardingReportComponent implements OnInit {
  searchQuery: string = ''; // 🔍 Search input for last name or ID
  selectedDepartment: string = ''; // 🔽 Dropdown department filter
  fromDate: string = ''; // 📅 Start date
  toDate: string = ''; // 📅 End date
  employees: any[] = [];
  filteredEmployees: any[] = [];

  constructor(private offboardingReportService: OffboardingReportService) {}

  ngOnInit() {
    this.fetchOffboardingEmployees();
  }

  /** 🔹 Fetch only Offboarded Employees */
  fetchOffboardingEmployees() {
    this.offboardingReportService.getEmployees().subscribe(
      (data) => {
        console.log("🔍 Raw Firestore Data:", data);

        this.employees = data
          .filter(emp => emp.status === 'Offboarded')
          .map(emp => ({
            ...emp,
            firstname: emp.employeeName?.split(" ")[0] || "Unknown",
            middleName: emp.employeeName?.split(" ")[1] || "",
            lastname: emp.employeeName?.split(" ")[2] || emp.employeeName?.split(" ")[1] || "",
            fullName: emp.employeeName || "Unknown",
            department: emp.department || "N/A",
            offboardingReason: emp.offboardingReason || 'N/A',
            effectiveDate: emp.effectiveDate || '' // ✅ Ensure effectiveDate is available
          }));

        console.log("✅ Processed Employees:", this.employees);
        this.filteredEmployees = [...this.employees];
      },
      (error) => {
        console.error('❌ Error fetching offboarding records:', error);
      }
    );
  }

  /** 🔍 **Search by Last Name (First Letter) & Employee ID** */
  searchEmployee() {
    const lowerQuery = this.searchQuery.toLowerCase().trim();

    this.filteredEmployees = this.employees.filter(emp => {
      const lastNameMatch = emp.lastname?.toLowerCase().startsWith(lowerQuery);
      const idMatch = emp.employeeId?.toString().includes(lowerQuery);
      return lastNameMatch || idMatch;
    });

    console.log("🔍 Filtered Employees:", this.filteredEmployees);
  }

  /** 🔍 **Filter by Department** */
  filterByDepartment() {
    this.filteredEmployees = this.selectedDepartment
      ? this.employees.filter(emp => emp.department === this.selectedDepartment)
      : [...this.employees];

    console.log("🏛️ Filtered by Department:", this.filteredEmployees);
  }

  /** 📅 **Filter by Effective Date Range** */
  filterByDate() {
    if (!this.fromDate || !this.toDate) {
      this.filteredEmployees = [...this.employees]; // If no dates are selected, show all employees
      return;
    }

    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);
    to.setHours(23, 59, 59, 999); // Include the entire day

    this.filteredEmployees = this.employees.filter(emp => {
      const empDate = new Date(emp.effectiveDate);
      return empDate >= from && empDate <= to;
    });

    console.log("📅 Filtered by Date Range:", this.filteredEmployees);
  }
}
