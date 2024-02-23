module.exports = (h) => {
  return h <= 12 ? `${h}am` : `${h - 12}pm`;
};
