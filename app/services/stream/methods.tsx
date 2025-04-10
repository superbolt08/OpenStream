const highContrastColors = [
  "#00FF00", // Lime
  "#FF00FF", // Magenta
  "#FFFF00", // Yellow
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  // "#FF4500", // Orange Red
  "#ADFF2F", // Green Yellow
  "#7CFC00", // Lawn Green
];

export const getColor = (): string => {
  const randomIndex = Math.floor(Math.random() * highContrastColors.length);
  return highContrastColors[randomIndex];
};

export const formatDuration = (secs: number) => {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
