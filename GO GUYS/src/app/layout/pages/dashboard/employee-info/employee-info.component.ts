import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuditLogService } from '../../../../services/audit-log.service';

interface Employee {
  id: string;
  firstname?: string;
  middlename?: string;
  lastname?: string;
  fullName?: string;
  email?: string;
  personalEmail?: string;
  employmentDate?: string;
  employmentType?: string;
  department?: string;
  major?: string;
  profileImageUrl?: string;
  status?: string;
  effectiveDate?: string;
  medicalcertificate?: string;
  nbiclearance?: string;
  research?: string;
  certificateofemployment?: string;
  trainingcertificate?: string;
  schoolcredentials?: string;
}

@Component({
  selector: 'app-employee-info',
  templateUrl: './employee-info.component.html',
  styleUrls: ['./employee-info.component.scss']
})
export class EmployeeInfoComponent implements OnInit {
  searchQuery: string = '';
  departmentFilter: string = ''; // Separate field for department search
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isEditing: boolean = false;
  availableMajors: string[] = [];

  /** ✅ Departments Object */
  departments: Record<string, string> = {
    "SOC": "School Of Computing",
    "SBA": "School Of Business and Accountancy",
    "SEA": "School Of Engineering and Architecture",
    "SAS": "School Of Arts and Sciences",
    "SHTM": "School Of Hospitality and Tourism Management",
    "SED": "School Of Education",
    "SNAMS": "School Of Nursing and Allied Medical Sciences",
    "CCJEF": "College of Criminal Justice Education and Forensics"
  };

  departmentKeys = Object.keys(this.departments);
selectedDepartment: any;

  constructor(private firestore: AngularFirestore, private auditLogService: AuditLogService) {}

  ngOnInit() {
    this.selectedDepartment = ''; // ✅ Default to "All Schools"
    this.loadEmployees();
  }

  /** ✅ Load Employees from Firestore */
  loadEmployees() {
    this.firestore.collection<Employee>('employees').valueChanges({ idField: 'id' }).subscribe(data => {
      this.firestore.collection<Employee>('offboarding').valueChanges({ idField: 'id' }).subscribe(offboardingData => {
        this.employees = data.map(emp => {
          const offboardDetails = offboardingData.find(off => off.id === emp.id) || {
            status: 'Active',
            effectiveDate: 'N/A'
          };

          return {
            ...emp,
            status: offboardDetails.status,
            effectiveDate: offboardDetails.effectiveDate
          };
        });

        this.filteredEmployees = [...this.employees];
      });
    });
  }

  /** 🔍 **Search by First Letter of Last Name or Employee ID** */
  searchEmployee() {
    const lowerQuery = this.searchQuery.toLowerCase().trim();

    this.filteredEmployees = this.employees.filter(emp => {
      // ✅ **Check if query is exactly one character (only first letter search)**
      const matchesLastName = emp.lastname && lowerQuery.length === 1 && emp.lastname.toLowerCase().startsWith(lowerQuery);
      const matchesID = emp.id && emp.id.toLowerCase().includes(lowerQuery);

      return matchesLastName || matchesID;
    });
  }

  /** 🔍 **Filter by Department** */
  filterByDepartment() {
    if (this.selectedDepartment === '') {
      // ✅ Show all employees when "All Schools" is selected
      this.filteredEmployees = [...this.employees];
    } else {
      // ✅ Show only employees in the selected department
      this.filteredEmployees = this.employees.filter(emp =>
        emp.department && emp.department.toLowerCase() === this.selectedDepartment.toLowerCase()
      );
    }

    console.log("🏛️ Filtered by Department:", this.filteredEmployees);
  }

  openModal(employee: Employee) {
    this.selectedEmployee = { ...employee };
    this.updateMajors();
  }

  closeModal() {
    this.selectedEmployee = null;
    this.isEditing = false;
  }

  enableEditing() {
    this.isEditing = true;
  }

  /** ✅ Update Major Options Based on Selected Department */
  updateMajors() {
    if (this.selectedEmployee?.department) {
      this.availableMajors = this.majorsByDepartment[this.selectedEmployee.department] || [];
    } else {
      this.availableMajors = [];
    }
  }

  /** ✅ Save Employee Updates and Log Changes in Audit Logs */
  async saveUpdate() {
    if (!this.selectedEmployee) {
      alert("No employee selected.");
      return;
    }

    try {
      const employeeRef = this.firestore.collection('employees').doc(this.selectedEmployee.id);

      // Get old data before update
      const employeeSnapshot = await employeeRef.get().toPromise();
      const oldData: Partial<Employee> = employeeSnapshot?.data() || {};

      // New updated data
      const newData: Partial<Employee> = { ...this.selectedEmployee };

      // Identify changes
      const changes: string[] = [];
      Object.keys(newData).forEach((key) => {
        const oldValue = oldData[key as keyof Employee] || "N/A";
        const newValue = newData[key as keyof Employee] || "N/A";

        if (typeof oldValue !== "object" && typeof newValue !== "object" && oldValue !== newValue) {
          changes.push(`Updated ${key}: '${oldValue}' → '${newValue}'`);
        }
      });

      if (changes.length === 0) {
        alert("No changes were made.");
        this.isEditing = false;
        return;
      }

      // ✅ Log update action in `auditlogs`
      const employeeName = `${this.selectedEmployee.firstname} ${this.selectedEmployee.lastname}`;
      const logDetails = `Employee ${employeeName} was updated. Changes: ${changes.join(", ")}`;

      await this.auditLogService.logAction('UPDATED_EMPLOYEE', logDetails, 'Successful');

      alert("✅ Employee information updated successfully!");
      this.isEditing = false;
      this.loadEmployees();
    } catch (error) {
      alert("❌ Failed to update employee details.");
    }
  }

  /** ✅ Majors Per Department */
  majorsByDepartment: Record<string, string[]> = {
    "SOC": [
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Cybersecurity",
      "Bachelor of Science in Entertainment and Multimedia Computing (Digital Animation)",
      "Master in Information Technology",
      "Professional Science Master’s in Cybersecurity"
    ],
    "SBA": [
      "Bachelor of Science in Business Administration",
      "Bachelor of Science in Accountancy",
      "Bachelor of Science in Internal Auditing",
      "Bachelor of Science in Management Accounting",
      "Bachelor of Science in Aviation Management",
      "Master of Business Administration",
      "Doctor of Business Administration",
      "Green MBA in Leadership for a Sustainable Economy",
      "Master in Public Administration",
      "Master of Science in Accountancy"
    ],
    "SEA": [
      "Bachelor of Science in Aeronautical Engineering",
      "Bachelor of Science in Architecture",
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Mechanical Engineering",
      "Bachelor of Science in Computer Engineering",
      "Bachelor of Science in Electronics and Communications Engineering",
      "Bachelor of Science in Industrial Engineering"
    ],
    "SHTM": [
      "Bachelor of Science in Hospitality Management - Accommodations & Lodging Operations",
      "Bachelor of Science in Tourism Management - Travel & Tour Operations",
      "Bachelor of Science in International Gastronomy"
    ],
    "SNAMS": [
      "Bachelor of Science in Nursing",
      "Bachelor of Science in Radiologic Technology",
      "Bachelor of Science in Medical Technology"
    ],
    "CCJEF": [
      "Bachelor of Science in Criminology",
      "Bachelor of Forensic Science"
    ],
    "SED": [
      "Bachelor in Elementary Education (BEED)",
      "Bachelor of Special Needs Education (BSNED)",
      "Bachelor of Physical Education (BPEd)",
      "Bachelor of Secondary Education Major in English"
    ],
    "SAS": [
      "Bachelor of Arts in Communication",
      "Bachelor of Science in Psychology",
      "Communication Arts"
    ]
  };
}
