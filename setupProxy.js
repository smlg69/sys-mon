// setupProxy.js (в корне проекта, рядом с package.json)
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/rest",
    createProxyMiddleware({
      target: "https://91.240.87.214:8443",
      changeOrigin: true,
      secure: false, // Отключаем проверку SSL для самоподписанных сертификатов
      logLevel: "debug",
      onProxyReq: (proxyReq, req, res) => {
        console.log("🔄 Проксирование запроса:", req.method, req.originalUrl);
        // Добавляем заголовки если нужно
        proxyReq.setHeader("X-Forwarded-Proto", "https");
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log("✅ Ответ от сервера:", proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error("❌ Ошибка прокси:", err.message);
      },
    })
  );
};
