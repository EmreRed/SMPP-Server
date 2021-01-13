const smpp = require('smpp');
const server = smpp.createServer(function(session) {
  session.on('bind_transceiver', function(pdu) {
    session.pause();
    function checkAsyncUserPass(system_id, password, f) {
      console.log(system_id, password);
      f();
    }
    checkAsyncUserPass(pdu.system_id, pdu.password, function(err) {
      if (err) {
        session.send(pdu.response({
          command_status: smpp.ESME_RBINDFAIL
        }));
        session.close();
        return;
      }
      console.log((pdu));
      console.log((pdu.short_message));
      session.send(pdu.response());
      session.resume();
    });
  });
  session.on('submit_sm', function(pdu) {
    console.log(pdu);
    let msgid = "123456"; // Generate a message_id for this message.
    try {
      session.send(pdu.response({
        sequence_number: pdu.sequence_number,
        message_id: msgid
      }), (...d) => {
        console.log(d)
      });
    } catch (e) {
      console.log(e)
    }
  });
  session.on('unbind', function(pdu) {
    session.send(pdu.response());
    session.close();
  });

  session.on('enquire_link', function(pdu) {
    session.send(pdu.response());
  });
});
server.listen(2775);
