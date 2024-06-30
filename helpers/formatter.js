const phoneNumberFormatter = function (number) {
  let formatted = number.replace(/\D/g, "");

  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substr(1);
  } else if (formatted.startsWith("8")) {
    formatted = "62" + formatted;
  }

  if (!formatted.endsWith("@c.us")) {
    formatted += "@c.us";
  }

  return formatted;
};

function convertToLocalTime(timestamp) {
  if (timestamp) {
    // Convert timestamp to local time
    const localTime = new Date(timestamp * 1000);

    // Format local time as dd/MM/yyyy : HH:mm
    return localTime.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return ''
  }

}

module.exports = {
  phoneNumberFormatter,
  convertToLocalTime
};
