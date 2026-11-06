const events = require('./events');

function checkTransfer(sum, limit) {
    if (sum > limit) {
        events.emit('fraud-alert', sum);
    } else {
        events.emit('transfer', sum);
    }
}

module.exports = { checkTransfer };
