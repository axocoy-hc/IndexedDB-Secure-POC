let notificationsWebSocket = null;
let reconnectionAttempts = 0;
let isMainThreadRunning = false;

addEventListener('message', event => {
  if (!!event.data) {
    switch (event.data.type) {
      case 'WebSocketConfig':
        connectWebSocket(event.data.data);
        break;
      case 'MAIN_THREAD_STATUS':
        updateMainThreadStatus(event.data.data);
        break;
    }
  }
});

/**
 * Check if we have a current WebSocket Object created and if it's open
 * @param ws {WebSocket}
 * @return {boolean}
 */
function isWebSocketConnected(ws) {
  return !!ws && ws.readyState === WebSocket.OPEN;
}

/**
 * Show device notifications
 *
 * @param notification {{context:{title: string, urlImage: string, message: string, focus: boolean, urlToOpen: string}}}
 * @return void
 */
async function createNotificationView(notification) {
  if (Notification.permission === 'granted' && !isMainThreadRunning) {
    const notificationContext = notification.context;
    await self.registration.showNotification(notificationContext.title, {
      icon: notificationContext.urlImage,
      body: notificationContext.message,
    });

    self.addEventListener('notificationclick', e => {
      e.notification.close();
      if (notificationContext.urlToOpen) {
        e.waitUntil(clients.openWindow(notificationContext.urlToOpen));
      }
      if (notificationContext.focus) {
        e.waitUntil(clients.openWindow(self.location.origin));
      }
    });
  }
}

/**
 * Connect to Azure PubSub Web Socket using config (WebSocket URL and protocol) sent by Main Thread
 *
 * @param wsConnectionConfig {{ url: string, protocol: string }}
 * @return void
 */
function connectWebSocket(wsConnectionConfig) {
  if (!isWebSocketConnected(notificationsWebSocket)) {
    notificationsWebSocket = new WebSocket(wsConnectionConfig.url, wsConnectionConfig.protocol);

    notificationsWebSocket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.type === 'message') {
        const notification = message.data;
        if (notification.type === 'PUSH_NOTIFICATION') {
          createNotificationView(notification);
        }
      }
    };

    notificationsWebSocket.onclose = () => {
      if (reconnectionAttempts < 3) {
        setTimeout(() => {
          console.warn('SW - WebSocket Reconnecting...');
          reconnectionAttempts++;
          connectWebSocket(wsConnectionConfig);
        }, 1000);
      } else {
        console.warn('SW - Connection lost');
        notificationsWebSocket = undefined;
        reconnectionAttempts = 0;
      }
    };
  }
}

/**
 * Update Main Thread Status
 * @var {isMainThreadRunning} true: a Tab with ARC is active and is working on Foreground
 * @var {isMainThreadRunning} false: Any Tab of ARC is active and is running on Background (self)
 *
 * @param data {{ status: boolean}}
 */
function updateMainThreadStatus(data) {
  isMainThreadRunning = data.status;
}
