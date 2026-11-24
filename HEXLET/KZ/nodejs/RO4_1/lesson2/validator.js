function isPositive(count){
    return count > 0 ? true : false;
}

function isEven(count){
    return count % 2 === 0;
}

module.exports = {isPositive, isEven};
