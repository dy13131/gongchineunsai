self.addEventListener('push', function(event){
  var d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch(e){ d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || '공치는사이 🎾', {
    body: d.body || '', icon: 'icon.png', badge: 'icon.png', tag: 'gongchineunsai'
  }));
});
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
    for (var i = 0; i < list.length; i++){ if ('focus' in list[i]) return list[i].focus(); }
    if (clients.openWindow) return clients.openWindow('./');
  }));
});
