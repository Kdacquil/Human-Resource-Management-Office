import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

interface Employee {
employmentDate: any;
major: any;
middleName: any;
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  department?: string;
  employmentType?: string;
  status?: string; // ✅ "onboarded" | "offboarded" | undefined (assumed onboarded)
}

@Component({
  selector: 'app-shtm',
  templateUrl: './shtm.component.html',
  styleUrls: ['./shtm.component.scss']
})
export class ShtmComponent implements OnInit {
  filteredEmployees: Employee[] = [];
  statusFilter: string = 'onboarded';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.statusFilter = params['status'] || 'onboarded';
      console.log(`🟢 Status filter received: ${this.statusFilter}`);
      this.fetchEmployees();
    });
  }

  goBack() {
    this.router.navigateByUrl('/dashboard/distribution');
  }

  fetchEmployees() {
    this.firestore.collection<Employee>('employees').valueChanges({ idField: 'id' }).subscribe(employeeData => {
      console.log(`🟡 Raw Employee Data:`, employeeData); // ✅ Debugging

      if (!employeeData || employeeData.length === 0) {
        console.warn("⚠ No employees found in Firestore!");
        return;
      }

      this.filteredEmployees = employeeData.filter(emp =>
        emp.department?.toLowerCase() === 'shtm' && (emp.status?.toLowerCase() ?? 'onboarded') === this.statusFilter
      );

      console.log(`🔵 Filtered SHTM Employees (${this.statusFilter}):`, this.filteredEmployees); // ✅ Debugging

      this.cdr.detectChanges(); // ✅ Ensure UI updates
    });
  }
}
