const smpp = require('smpp');

const users = {
  "test": "123456" // - Test
}

const server = smpp.createServer(function(session) {

  session.on('bind_transceiver', function(pdu) {
    session.pause();
    var usercheck = (users[pdu.system_id] !== undefined) && (users[pdu.system_id] == pdu.password);
    if(!usercheck){
      session.send(pdu.response({
        command_status: smpp.ESME_RBINDFAIL
      }));
      session.close();
      console.error('Connection Error: ', pdu.system_id, "\n");
      return;
    }
    console.info('Connected: ', pdu.system_id, "\n");
    session.send(pdu.response({
      system_id: pdu.system_id
    }));
    session.resume();
  });

  session.on('submit_sm', function(pdu){
    var time = Math.floor(new Date() / 1000);
    var number = pdu.destination_addr + "";
    let msgid = Date.now()+""; // - Message ID
    var deliverable = true; // - Message is deliverable

    if(!deliverable){
      session.send(pdu.response({
        command_status: smpp.ESME_RINVDSTADR
      }));
      console.error('- SMS Error -');
      console.error('Sender: ', pdu.source_addr);
      console.error('Receiver: ', pdu.destination_addr);
      console.error('Message: ', pdu.short_message.message);
      console.log("- - -\n");
      return false;
    }
    console.log('- SMS Received -');
    console.log('ID: ', msgid);
    console.log('Sender: ', pdu.source_addr);
    console.log('Receiver: ', pdu.destination_addr);
    console.log('Message: ', pdu.short_message.message);
    console.log("- - -\n");

    session.send(pdu.response({
      sequence_number: pdu.sequence_number,
      message_id: msgid
    }));

    session.deliver_sm({
      command_id: 4,
    	command_status: '',
    	sequence_number: pdu.sequence_number,
      service_type: '',
      source_addr_ton: '',
      source_addr_npi: '',
      source_addr: "source",
      dest_addr_ton: 1,
      dest_addr_npi: 1,
      destination_addr: "dest",
      esm_class: 4,
      protocol_id: 1,
      priority_flag: 1,
      schedule_delivery_time: '',
      validity_period:'',
      registered_delivery: 1,
      replace_if_present_flag:'',
      sm_default_msg_id: '',
      short_message: {
      	message: 'id:'          + msgid
              + ' sub:'         + '001'
              + ' dlvrd:'       + (deliverable ? '001'     : '000'    )
              + ' submit date:' + time
              + ' done date:'   + time
              + ' stat:'        + (deliverable ? 'DELIVRD' : 'UNDELIV')
              + ' err:'         + (deliverable ? '000'     : '001'    )
              + ' text:'        + pdu.short_message.message.substr(0,20)
      }
    });
  });

  session.on('unbind', function(pdu){
    session.send(pdu.response());
    session.close();
  });

  session.on('enquire_link', function(pdu){
    session.send(pdu.response());
  });

});
server.listen(2775);
