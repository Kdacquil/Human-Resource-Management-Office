import { Injectable } from '@angular/core';

declare var gapi: any; // ✅ Ensures gapi is recognized globally

// ✅ Declare global window property to fix TypeScript error
declare global {
  interface Window {
    gapiLoaded?: boolean;
  }
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private CLIENT_ID = '578364808712-qpir6v204qs7gerc4bb086glo6s9vick.apps.googleusercontent.com';
  private SCOPES = 'https://www.googleapis.com/auth/gmail.send';

  constructor() {
    this.waitForGapiLoad().then(() => this.initClient());
  }

  private async waitForGapiLoad(): Promise<void> {
    return new Promise((resolve) => {
      const checkGapi = setInterval(() => {
        if (window.gapiLoaded && gapi && gapi.client) {
          clearInterval(checkGapi);
          resolve();
        }
      }, 500);
    });
  }

  private async initClient() {
    try {
      await this.waitForGapiLoad();

      if (!gapi || !gapi.client) {
        console.error("❌ gapi is not loaded properly.");
        return;
      }

      await gapi.client.init({
        clientId: this.CLIENT_ID,
        scope: this.SCOPES
      });

      console.log("✅ Google API Initialized Successfully!");
    } catch (error) {
      console.error("❌ Error initializing Google API:", error);
    }
  }

  async sendEmail(to: string, subject: string, message: string) {
    await this.initClient();

    if (!gapi.client || !gapi.client.gmail) {
      console.error("❌ Google API is not ready. Cannot send email.");
      return;
    }

    const encodedMessage = this.encodeEmail(to, subject, message);

    try {
      const response = await gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: { raw: encodedMessage }
      });
      console.log("📧 Email sent successfully:", response);
    } catch (error) {
      console.error("❌ Error sending email:", error);
    }
  }

  private encodeEmail(to: string, subject: string, message: string): string {
    const email = `
      To: ${to}
      Subject: ${subject}
      MIME-Version: 1.0
      Content-Type: text/html; charset=UTF-8

      ${message}
    `;
    return btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
