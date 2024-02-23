const { MOBILE_NAIL_TECHNICIANS } = require("../helpers/buildPaymentDetails");

const convertInputTimeObjectToRequiredScheduleFormat = (input) => {
  const { value, startTime, endTime } = input;
  const [startHours, startMinutes] = startTime.split(":");
  const [endHours, endMinutes] = endTime.split(":");
  return {
    value,
    startTime: {
      hours: +startHours,
      minutes: +startMinutes,
    },
    endTime: {
      hours: +endHours,
      minutes: +endMinutes,
    },
  };
};

const getAmountForService = (name, payload) => {
  let amount = null;
  const { bookingEstimate, lutonVans, menRequired } = payload;
  switch (name) {
    case "removals": {
      amount = lutonVans.reduce((totalAmount, menInEachVan) => {
        if (+menInEachVan === 2) {
          return totalAmount + 70 * +bookingEstimate;
        }
        if (+menInEachVan === 3) {
          return totalAmount + 90 * +bookingEstimate;
        } else {
          return totalAmount;
        }
      }, 0);

      return amount;
    }

    case "deliveries": {
      amount = lutonVans.reduce((totalAmount, menInEachVan) => {
        if (+menInEachVan === 2) {
          return totalAmount + 70 * +bookingEstimate;
        }
        if (+menInEachVan === 3) {
          return totalAmount + 90 * +bookingEstimate;
        } else {
          return totalAmount;
        }
      }, 0);

      return amount;
    }

    case "man-and-van": {
      amount = lutonVans.reduce((totalAmount, menInEachVan) => {
        if (+menInEachVan === 2) {
          return totalAmount + 70 * +bookingEstimate;
        }
        if (+menInEachVan === 3) {
          return totalAmount + 90 * +bookingEstimate;
        } else {
          return totalAmount;
        }
      }, 0);

      return amount;
    }

    case "furniture-assembly": {
      if (+menRequired === 2) {
        amount = 60 * +bookingEstimate;
      }
      if (+menRequired === 3) {
        amount = 80 * +bookingEstimate;
      }

      return amount;
    }
    case "cleaning": {
      if (+menRequired === 2) {
        amount = 60 * +bookingEstimate;
      }
      if (+menRequired === 3) {
        amount = 70 * +bookingEstimate;
      }
      return amount;
    }
    case "shop-and-deliver": {
      if (+menRequired === 2) {
        amount = 50 * +bookingEstimate;
      }
      if (+menRequired === 3) {
        amount = 70 * +bookingEstimate;
      }
      return amount;
    }
    case "car-transport": {
      if (+menRequired === 2) {
        amount = 60 * +bookingEstimate;
      }
      if (+menRequired === 3) {
        amount = 80 * +bookingEstimate;
      }
      return amount;
    }

    case "mobile-barbers": {
      amount = 30 * +bookingEstimate;
      return amount;
    }

    case "mobile-hair-dressers": {
      amount = 60 * +bookingEstimate;
      return amount;
    }

    case "mobile-nail-technicians": {
      amount = +bookingEstimate * 50;
      return amount;
    }

    default: {
      return amount;
    }
  }
};

const averageOfArray = (arr) => {
  return (
    arr.reduce((total, currentVal) => {
      return total + currentVal;
    }, 0) / arr.length
  );
};

const buildPayloadObj = (params) => {
  if (!params) {
    return {
      totalEarnings: 0,
      history: [],
      withdrawen: 0,
      balance: 0,
    };
  }
  const { totalEarnings = 0, history = [], withdrawen = 0 } = params;
  return {
    totalEarnings,
    history,
    withdrawen,
    balance: totalEarnings - withdrawen,
  };
};

module.exports = {
  convertInputTimeObjectToRequiredScheduleFormat,
  getAmountForService,
  averageOfArray,
  buildPayloadObj,
};
