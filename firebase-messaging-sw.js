importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAfHaWv7juz1w1YVhhuryjkr_bfbGzWLME",
  authDomain: "tennis-534af.firebaseapp.com",
  projectId: "tennis-534af",
  storageBucket: "tennis-534af.firebasestorage.app",
  messagingSenderId: "435063918858",
  appId: "1:435063918858:web:87d8c32c3ca2a46ec42af3"
});

var messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload){
  var d = (payload && (payload.data || payload.notification)) || {};
  self.registration.showNotification(d.title || "공치는사이 🎾", {
    body: d.body || "",
    icon: "icon.png",
    badge: "icon.png",
    tag: "gongchineunsai"
  });
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){ if('focus' in list[i]) return list[i].focus(); }
    if(clients.openWindow) return clients.openWindow('./');
  }));
});
