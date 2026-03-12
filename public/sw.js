// public/sw.js

self.addEventListener("push", function (event) {
    const data = event.data.json();

    self.registration.showNotification(data.title, {
        body: data.message,
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: data,
    });
});

// Handle clicking the notification
self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window" }).then(windowClients => {
            for (let client of windowClients) {
                if (client.url === url && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});