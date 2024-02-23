module.exports = (data = []) => {
  let html = "";
  data.forEach((item) => {
    html += item?.value+", ";
  });
  return html;
};
