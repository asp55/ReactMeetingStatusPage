// config.js

const prod = {
  socket_url: `${window.location.protocol === "https:" ? "wss://" : "ws://"}${window.location.host}`
};
const dev = {
  socket_url: 'ws://localhost:8080'
};

export const config = process.env.NODE_ENV === 'development' ? dev : prod;