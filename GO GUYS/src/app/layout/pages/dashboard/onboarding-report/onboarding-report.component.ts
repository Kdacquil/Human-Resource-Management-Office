import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { OnboardingReportService } from '../../../../services/onboarding-report.service';

@Component({
  selector: 'app-onboarding-report',
  templateUrl: './onboarding-report.component.html',
  styleUrls: ['./onboarding-report.component.scss'],
})
export class OnboardingReportComponent implements OnInit {
  searchQuery: string = ''; // 🔍 Search input for last name or ID
  selectedDepartment: string = ''; // 🔽 Selected department for filtering
  fromDate: string = ''; // 📅 Start date for filtering
  toDate: string = ''; // 📅 End date for filtering
  employees: any[] = [];
  filteredEmployees: any[] = [];

  constructor(
    private onboardingReportService: OnboardingReportService,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    this.fetchEmployees();
  }

  /** 🔹 Fetch only Active Employees (Not Offboarded) */
  fetchEmployees() {
    this.onboardingReportService.getEmployees().subscribe(data => {
      this.employees = data.filter(emp => emp.status !== 'Offboarded'); // ✅ Show only active employees
      this.filteredEmployees = [...this.employees];
    });
  }

  /** 🔍 **Search by Last Name (First Letter) & Employee ID** */
  searchEmployee() {
    const lowerQuery = this.searchQuery.toLowerCase().trim();
    this.filteredEmployees = this.employees.filter(emp =>
      emp.lastname?.toLowerCase().startsWith(lowerQuery) || emp.id?.toLowerCase().includes(lowerQuery)
    );
    this.applyFilters();
  }

  /** 🔽 **Filter Employees by Selected Department** */
  filterByDepartment() {
    this.applyFilters();
  }

  /** 📅 **Filter Employees by Date Range** */
  filterByDate() {
    this.applyFilters();
  }

  /** ✅ **Apply All Filters (Department, Date, Search) Together** */
  applyFilters() {
    this.filteredEmployees = this.employees.filter(emp => {
      // 🔹 Check Department Filter
      const departmentMatch = this.selectedDepartment ? emp.department === this.selectedDepartment : true;

      // 🔹 Check Name or ID Filter
      const lowerQuery = this.searchQuery.toLowerCase().trim();
      const nameOrIdMatch = !this.searchQuery || emp.lastname?.toLowerCase().startsWith(lowerQuery) || emp.id?.toLowerCase().includes(lowerQuery);

      // 🔹 Check Date Range Filter
      let dateMatch = true;
      if (this.fromDate || this.toDate) {
        const empDate = new Date(emp.employmentDate).toISOString().split('T')[0]; // Convert date to YYYY-MM-DD format

        if (this.fromDate && empDate < this.fromDate) dateMatch = false;
        if (this.toDate && empDate > this.toDate) dateMatch = false;
      }

      return departmentMatch && nameOrIdMatch && dateMatch;
    });
  }
}
