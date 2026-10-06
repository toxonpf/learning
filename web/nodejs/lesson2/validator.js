function isPositive(count){
    return count > 0 ? true : false;
}

function isEven(count){
    return count < 0 ? true : false;
}

module.exports = {isPositive, isEven};