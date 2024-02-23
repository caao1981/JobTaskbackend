const  securePin = require("secure-pin");

exports.generate =()=>{
    securePin.generatePin(6, (pin)=> {
        console.log("Pin: " + pin);
    })
}
