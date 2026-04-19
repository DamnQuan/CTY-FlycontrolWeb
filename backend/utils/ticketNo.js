const Ticket = require('../models/Ticket');

// 生成工单编号
const generateTicketNo = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // 查找当天最后一个工单号
  const lastTicket = await Ticket.findOne({
    ticketNo: new RegExp(`^TK${dateStr}`)
  }).sort({ ticketNo: -1 });
  
  let sequence = 1;
  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketNo.slice(-4));
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = String(sequence).padStart(4, '0');
  return `TK${dateStr}${sequenceStr}`;
};

module.exports = {
  generateTicketNo
};
