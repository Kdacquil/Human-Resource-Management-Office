import { Component, ElementRef, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AuditLogService } from '../../../../services/audit-log.service';
import { NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';

interface Employee {
  id: string;
  lastname: string;
  firstname: string;
  middlename: string;
  email: string;
  employmentDate: string;
  employmentType: string;
  department: string;
  major: string;
  profileImageUrl: string;
  onboardingseminar: string;
  schoolcredentials: string;
  trainingcertificate: string;
  certificateofemployment: string;
  research: string;
  nbiclearance: string;
  medicalcertificate: string;
  timestamp: string;
  status: "Successful" | "Failed";
}

@Component({
  selector: 'app-onboard',
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.scss'],
  standalone: false
})
export class OnboardComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  profileImage: string = 'picpro.jpg';
  employees: Employee[] = [];
  availableMajors: string[] = [];

  formData: Employee = {
    id: '',
    lastname: '',
    firstname: '',
    middlename: '',
    email: '',
    employmentDate: '',
    employmentType: '',
    department: '',
    major: '',
    profileImageUrl: '',
    onboardingseminar: '',
    schoolcredentials: '',
    trainingcertificate: '',
    certificateofemployment: '',
    research: '',
    nbiclearance: '',
    medicalcertificate: '',
    timestamp: new Date().toISOString(),
    status: "Successful"
  };

  constructor(
    private firestore: AngularFirestore,
    private storage: AngularFireStorage,
    private auditLogService: AuditLogService
  ) {
    this.fetchEmployees();
  }

  fetchEmployees() {
    this.firestore.collection<Employee>('employees', ref => ref.orderBy('timestamp'))
      .valueChanges()
      .subscribe(data => {
        this.employees = data;
      }, error => {
        console.error('Error fetching employees:', error);
      });
  }

  updateMajors() {
    const majorsByDepartment: { [key: string]: string[] } = {
      SOC: [
        'Bachelor of Science in Information Technology',
        'Bachelor of Science in Computer Science',
        'Bachelor of Science in Cybersecurity',
        'Master in Information Technology'
      ],
      SBA: [
        'Bachelor of Science in Business Administration',
        'Bachelor of Science in Accountancy',
        'Master of Business Administration'
      ],
      SEA: [
        'Bachelor of Science in Architecture',
        'Bachelor of Science in Civil Engineering',
        'Bachelor of Science in Mechanical Engineering'
      ],
      SHTM: [
        'Bachelor of Science in Hospitality Management',
        'Bachelor of Science in Tourism Management'
      ],
      SNAMS: [
        'Bachelor of Science in Nursing',
        'Bachelor of Science in Medical Technology'
      ],
      CCJEF: [
        'Bachelor of Science in Criminology',
        'Bachelor of Forensic Science'
      ],
      SED: [
        'Bachelor in Elementary Education',
        'Bachelor of Secondary Education Major in English'
      ],
      SAS: [
        'Bachelor of Arts in Communication',
        'Bachelor of Science in Psychology'
      ]
    };

    this.availableMajors = majorsByDepartment[this.formData.department] || [];
  }

  uploadImage(event: any) {
    const file = event.target.files[0];
    if (file) {
      const filePath = `profile-images/${new Date().getTime()}_${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            this.profileImage = url;
            this.formData.profileImageUrl = url;
          });
        })
      ).subscribe();
    }
  }

  async onSubmit(form: NgForm) {
    if (!form.valid) {
      alert('⚠️ Please fill out all required fields.');
      return;
    }

    try {
      if (this.formData.onboardingseminar !== "Yes") {
        await this.auditLogService.logAction(
          "ONBOARD_EMPLOYEE_FAILED",
          `Employee ${this.formData.firstname} ${this.formData.lastname} did not attend the onboarding seminar.`,
          "Failed"
        );
        alert("❌ Employee cannot be onboarded as they have not attended the onboarding seminar.");
        return;
      }

      // ✅ Group missing documents in one row
      const missingDocuments = [];
      if (this.formData.schoolcredentials !== "Yes") missingDocuments.push("School Credentials");
      if (this.formData.trainingcertificate !== "Yes") missingDocuments.push("Training Certificate");
      if (this.formData.certificateofemployment !== "Yes") missingDocuments.push("Certificate of Employment");
      if (this.formData.research !== "Yes") missingDocuments.push("Research");
      if (this.formData.nbiclearance !== "Yes") missingDocuments.push("NBI Clearance");
      if (this.formData.medicalcertificate !== "Yes") missingDocuments.push("Medical Certificate");

      this.formData.status = "Successful";

      await this.firestore.collection("employees").doc(this.formData.id).set({
        ...this.formData,
        timestamp: new Date().toISOString()
      });

      await this.auditLogService.logAction(
        "ONBOARD_EMPLOYEE",
        `Employee ${this.formData.firstname} ${this.formData.lastname} was onboarded.`,
        "Successful"
      );

      if (missingDocuments.length > 0) {
        // ✅ Log missing documents in one row
        await this.auditLogService.logAction(
          "MISSING_DOCUMENTS",
          `Employee ${this.formData.firstname} ${this.formData.lastname} is missing: ${missingDocuments.join(", ")}.`,
          "Failed"
        );

        // ✅ Send email with all missing documents
        await this.sendMissingDocumentsEmail(this.formData.email, this.formData.firstname, missingDocuments);
      }

      alert(`✅ Employee onboarded successfully!`);
      form.resetForm();
      this.profileImage = "picpro.jpg";
      this.fetchEmployees();

    } catch (error) {
      console.error("❌ Error:", error);
      alert("❌ Error saving employee data.");
    }
  }

  async sendMissingDocumentsEmail(email: string, firstname: string, missingDocuments: string[]) {
    try {
      const response = await fetch("https://us-central1-signuploginapp-e51b2.cloudfunctions.net/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, firstname, missingDocuments }),
        mode: "cors" // ✅ Fix CORS issue
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      }

      const result = await response.json();
      if (result?.success) {
        console.log(`📧 Email sent to ${email}`);
      } else {
        console.error("❌ Email not sent:", result?.error);
      }
    } catch (error) {
      console.error("❌ Error sending email:", error);
    }
  }
}
