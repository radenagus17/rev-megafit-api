module.exports = {
  getWeek(date) {
    var currentDate = new Date(date);
    var startDate = new Date(currentDate.getFullYear(), 0, 1);
    var days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));

    var weekNumber = Math.ceil(days / 7);

    // Display the calculated result
    return weekNumber;
  },
};
