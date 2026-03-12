import apiClient from "../api/client";
import { urlBase64ToUint8Array } from "./vapidKey";

export default async function subscribeToPush() {
    try {
        console.log("subscribeToPush called");
        if (!("serviceWorker" in navigator)) return;
        console.log(1)
        if (!("PushManager" in window)) return;
        console.log(2)
        const registration = await navigator.serviceWorker.ready;
        console.log(3, registration)
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                import.meta.env.VITE_VAPID_PUBLIC_KEY
            ),
        });
        console.log(4)
        console.log("Subscription created:", subscription);

        await apiClient.post("/notifications/push/subscribe", subscription);

        console.log("Push subscription sent to backend");

    } catch (err) {
        console.error("Push subscription error:", err);
    }
}