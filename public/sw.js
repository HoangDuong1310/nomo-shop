// Service Worker for Web Push Notifications
const CACHE_NAME = 'cloud-shop-push-v1';
const NOTIFICATION_TAG = 'cloud-shop-notification';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting(); // Force the waiting service worker to become active
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim()); // Take control of all open pages
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Cloud Shop',
    body: 'Bạn có thông báo mới',
    icon: '/images/logo-192.png',
    badge: '/images/badge-72.png',
    tag: NOTIFICATION_TAG,
    data: {},
    actions: [],
    requireInteraction: false,
    silent: false
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        tag: pushData.tag || notificationData.tag,
        data: pushData.data || {},
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false
      };

      // Add actions based on notification type
      switch (pushData.type) {
        case 'shop_status':
          notificationData.actions = [
            {
              action: 'view_shop',
              title: 'Xem cửa hàng',
              icon: '/images/action-view.png'
            }
          ];
          break;
        case 'order_update':
          notificationData.actions = [
            {
              action: 'view_order',
              title: 'Xem đơn hàng',
              icon: '/images/action-order.png'
            }
          ];
          break;
        case 'special_announcement':
          notificationData.actions = [
            {
              action: 'view_announcement',
              title: 'Xem chi tiết',
              icon: '/images/action-info.png'
            }
          ];
          break;
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
      timestamp: Date.now()
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;
  
  let urlToOpen = '/';

  // Determine URL based on action or notification type
  if (action === 'view_shop') {
    urlToOpen = '/menu';
  } else if (action === 'view_order' && notificationData.orderId) {
    urlToOpen = `/account/orders/${notificationData.orderId}`;
  } else if (action === 'view_announcement') {
    urlToOpen = '/';
  } else if (notificationData.url) {
    urlToOpen = notificationData.url;
  } else {
    // Default behavior based on notification type
    switch (notificationData.type) {
      case 'shop_status':
        urlToOpen = '/menu';
        break;
      case 'order_update':
        urlToOpen = notificationData.orderId ? `/account/orders/${notificationData.orderId}` : '/account/orders';
        break;
      case 'special_announcement':
        urlToOpen = '/';
        break;
    }
  }

  // Focus existing window or open new one
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    // Check if there's already a window open for this origin
    for (const client of clientList) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        // Navigate to the desired URL and focus the window
        client.navigate(urlToOpen);
        return client.focus();
      }
    }
    
    // If no window is open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  // Log notification click for analytics
  const logClick = fetch('/api/push/log-interaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'click',
      notificationId: notificationData.id,
      timestamp: Date.now()
    })
  }).catch(error => {
    console.error('Error logging notification click:', error);
  });

  event.waitUntil(Promise.all([promiseChain, logClick]));
});

// Notification close event - handle when user dismisses notification
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  const notificationData = event.notification.data || {};
  
  // Log notification close for analytics
  const logClose = fetch('/api/push/log-interaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'close',
      notificationId: notificationData.id,
      timestamp: Date.now()
    })
  }).catch(error => {
    console.error('Error logging notification close:', error);
  });

  event.waitUntil(logClose);
});

// Background sync event - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'push-subscription-update') {
    event.waitUntil(updatePushSubscription());
  }
});

// Function to update push subscription in the background
async function updatePushSubscription() {
  try {
    const registration = await self.registration;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          action: 'update'
        })
      });
      
      console.log('Push subscription updated successfully');
    }
  } catch (error) {
    console.error('Error updating push subscription:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
