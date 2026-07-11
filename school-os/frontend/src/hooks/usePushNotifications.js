import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { App } from "@capacitor/app";
import { useNavigate } from "react-router-dom";

export function usePushNotifications() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;

    const setupPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn("User denied push notifications");
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', (token) => {
          console.log("Push registration success, token: ", token.value);
          // TODO: Send token to backend
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error("Error on push registration: ", error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log("Push received: ", notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log("Push action performed: ", notification);
          const data = notification.notification.data;
          
          if (data && data.url) {
            // Handle deep linking based on push payload
            navigate(data.url);
          }
        });

        // Handle generic app deep links (e.g. schoolos://)
        App.addListener('appUrlOpen', (event) => {
          console.log("App URL Open", event.url);
          const url = new URL(event.url);
          if (url.pathname) {
            navigate(url.pathname);
          }
        });
      } catch (error) {
        console.error("Push Notification Setup Failed:", error);
      }
    };

    setupPush();

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
        App.removeAllListeners();
      }
      isMounted = false;
    };
  }, [navigate]);
}
