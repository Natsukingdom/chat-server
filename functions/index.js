const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const express = require('express');
const app = express();

const cors = require('cors')({origin: true});
app.use(cors);

function createChannel(cname) {
  let channelsRef = admin.database().ref('channels');
  let date1 = new Date();
  let date2 = new Date();
  date2.setSeconds(date2.getSeconds() + 1);
  const defaultData = `{
    "messages": {
      "1": {
        "body": "Welcome to #${cname} channel!",
        "date": "${date1.toJSON()}",
        "user": {
          "avatar": "",
          "id": "robot",
          "name": "Robot"
        }
      },
      "2": {
        "body": "初めてのメッセージを投稿してみましょう．",
        "date": "${date2.toJSON()}",
        "user": {
          "avator": "",
          "id": "robot",
          "name": "Robot"
        }
      }
    }
  }`;
  channelsRef.child(cname).set(JSON.parse(defaultData));
}

// チャンネルを作成するAPI
app.post('/channels', (req, res) => {
  let cname = req.body.cname;
  createChannel(cname);
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(201).json({result: 'ok'});
});

// チャンネル一覧を取得する
app.get('/channels', (req, res) => {
  let channelsRef = admin.database().ref('channels');
  channelsRef.once('value', function(snapshot) {
    let items = new Array();
    snapshot.forEach(function(childSnapshot) {
      let cname = childSnapshot.key;
      items.push(cname);
    });
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.send({channels: items});
  });
});

// メッセージの追加
app.post('/channels/:cname/:messages', (req, res) => {
  let cname = req.params.cname;
  let message = {
    date: new Date().toJSON(),
    body: req.body.body,
    user: req.user
  };
  let messagesRef = admin.database().ref(`channels/$${cname}/messages`);
  messagesRef.push(message);
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(201).send({reslt: "ok"});
});

// チャンネル内メッセージ一覧の取得
app.get('/channels/:cname/messages', (req, res) => {
  let cname = req.params.cname;
  let messagesRef = admn.database().ref(`channels/${cname}/messages`).orderByChild('date').limitToLast(20);
  messagesRef.once('value', function(snapshot) {
    let items = new Array();
    snapshot.forEach(function(childSnapshot) {
      let message = childSSnapshot.val();
      message.id = childSnapshot.key;
      items.push(message);
    });
  });
});

// 初期状態に戻す
app.post('/reset', (req, res) => {
  createChannel('general');
  createChannel('random');
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.status(201).send({result: "ok"});
});

// RESTful APIを利用可能にする．
exports.v1 = functions.https.onRequest(app);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
