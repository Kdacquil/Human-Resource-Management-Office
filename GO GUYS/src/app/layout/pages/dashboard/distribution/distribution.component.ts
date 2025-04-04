import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { Router, NavigationEnd } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('onboardedChart') onboardedChartRef!: ElementRef;
  @ViewChild('offboardedChart') offboardedChartRef!: ElementRef;

  chartOnboarded: Chart | null = null;
  chartOffboarded: Chart | null = null;

  showContent = true;
  private routerSubscription!: Subscription;
  private dataSubscription!: Subscription;

  private departmentLabels = ['SBA', 'SEA', 'SOC', 'SAS', 'SNAMS', 'SED', 'SHTM', 'CCJEF'];

  constructor(private router: Router, private firestore: AngularFirestore) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showContent = this.router.url === '/dashboard/distribution';

        if (this.showContent) {
          setTimeout(() => {
            this.destroyCharts();
            this.subscribeToRealtimeData();
          }, 0);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.showContent) {
      this.subscribeToRealtimeData();
    }
  }

  subscribeToRealtimeData() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    this.dataSubscription = this.firestore.collection('employees').valueChanges().subscribe(data => {
      console.log("🔥 Firestore Employee Data:", data);
      this.updateOnboardedChart(data);
      this.updateOffboardedChart(data);
    });
  }

  updateOnboardedChart(data: any[]) {
    const onboardedCounts: { [key: string]: number } = {};
    this.departmentLabels.forEach(dept => onboardedCounts[dept] = 0);

    data.forEach((employee: any) => {
      const department = employee.department;
      if (this.departmentLabels.includes(department) && (employee.status?.toLowerCase() ?? 'onboarded') === 'onboarded') {
        onboardedCounts[department] += 1;
      }
    });

    const totalOnboarded = Object.values(onboardedCounts).reduce((a, b) => a + b, 0);
    const labels = this.departmentLabels.map(dept => {
      const count = onboardedCounts[dept];
      const percentage = totalOnboarded > 0 ? ((count / totalOnboarded) * 100).toFixed(1) : '0';
      return `${dept} (${percentage}%)`;
    });
    const values = this.departmentLabels.map(dept => onboardedCounts[dept]);

    this.renderOnboardedChart(labels, values, totalOnboarded);
  }

  renderOnboardedChart(labels: string[], values: number[], totalOnboarded: number) {
    if (this.chartOnboarded) {
      this.chartOnboarded.destroy();
    }

    if (this.onboardedChartRef?.nativeElement) {
      const ctx = this.onboardedChartRef.nativeElement as HTMLCanvasElement;
      this.chartOnboarded = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#cc9933', '#cc3300', '#FF9900', '#663333', '#006600', '#003366', '#cc3366', '#800080']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            title: { display: true, text: `Total Onboarded Employees: ${totalOnboarded}`,
              font: { size: 18 }}
          },
          onClick: (event: any) => this.handleChartClick(event, this.chartOnboarded, 'onboarded')
        }
      });
    }
  }

  updateOffboardedChart(data: any[]) {
    const offboardedCounts: { [key: string]: number } = {};
    this.departmentLabels.forEach(dept => offboardedCounts[dept] = 0);

    data.forEach((employee: any) => {
      const department = employee.department;
      if (this.departmentLabels.includes(department) && employee.status?.toLowerCase() === 'offboarded') {
        offboardedCounts[department] += 1;
      }
    });

    const totalOffboarded = Object.values(offboardedCounts).reduce((a, b) => a + b, 0);
    const labels = this.departmentLabels.map(dept => {
      const count = offboardedCounts[dept];
      const percentage = totalOffboarded > 0 ? ((count / totalOffboarded) * 100).toFixed(1) : '0';
      return `${dept} (${percentage}%)`;
    });
    const values = this.departmentLabels.map(dept => offboardedCounts[dept]);

    this.renderOffboardedChart(labels, values, totalOffboarded);
  }

  renderOffboardedChart(labels: string[], values: number[], totalOffboarded: number) {
    if (this.chartOffboarded) {
      this.chartOffboarded.destroy();
    }

    if (this.offboardedChartRef?.nativeElement) {
      const ctx = this.offboardedChartRef.nativeElement as HTMLCanvasElement;
      this.chartOffboarded = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#cc9933', '#cc3300', '#FF9900', '#663333', '#006600', '#003366', '#cc3366', '#800080']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
            title: { display: true, text: `Total Offboarded Employees: ${totalOffboarded}`,
            font: { size: 18 }
          }

          },
          onClick: (event: any) => this.handleChartClick(event, this.chartOffboarded, 'offboarded')
        }
      });
    }
  }

  handleChartClick(event: any, chart: Chart | null, status: 'onboarded' | 'offboarded') {
    if (!chart || !chart.data || !chart.data.labels || chart.data.labels.length === 0) {
      console.error('Chart data is empty or not initialized.');
      return;
    }

    const evt = event as unknown as Event;
    const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);

    if (points.length) {
      const index = points[0].index;
      const label = String(chart.data.labels?.[index] || '').split(' ')[0];
      if (label) {
        this.navigateToRoute(label, status);
      } else {
        console.error('Invalid label detected in chart.');
      }
    }
  }

  navigateToRoute(label: string, status: 'onboarded' | 'offboarded') {
    const routes: Record<string, string> = {
      'SBA': '/dashboard/distribution/sba',
      'SEA': '/dashboard/distribution/sea',
      'SOC': '/dashboard/distribution/soc',
      'SAS': '/dashboard/distribution/sas',
      'SNAMS': '/dashboard/distribution/snams',
      'SED': '/dashboard/distribution/sed',
      'SHTM': '/dashboard/distribution/shtm',
      'CCJEF': '/dashboard/distribution/ccjef'
    };

    if (routes[label]) {
      console.log(`🔵 Navigating to: ${routes[label]} with status: ${status}`);
      this.router.navigate([routes[label]], { queryParams: { status } });
    }
  }

  destroyCharts() {
    if (this.chartOnboarded) this.chartOnboarded.destroy();
    if (this.chartOffboarded) this.chartOffboarded.destroy();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
  }
}
