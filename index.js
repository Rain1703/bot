// ====== IMPORT ======
const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// ====== ENV ======
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

// ====== DISCORD BOT ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);

// ====== EXPRESS ======
const app = express();
app.use(bodyParser.json());

// ====== HEALTH CHECK ======
app.get("/", (req, res) => {
  res.send("OK");
});

// ====== SEPAY WEBHOOK ======
app.post("/sepay", async (req, res) => {
  // ✅ TRẢ 200 NGAY – TRÁNH TIMEOUT
  res.status(200).json({ status: "ok" });

  try {
    console.log("📩 Nhận webhook SePay:", req.body);

    // ====== CHECK API KEY ======
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Apikey ")) return;

    const token = auth.slice(7).trim();
    if (token !== SEPAY_API_TOKEN) return;

    // ====== DATA ======
    const amount = req.body.amount || 0;
    const description = req.body.description || "Không có nội dung";
    const time =
      req.body.transactionDate ||
      new Date().toLocaleString("vi-VN");
    const reference = req.body.reference || "N/A";

    // ====== SEND DISCORD EMBED ======
    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("💸 BIẾN ĐỘNG SỐ DƯ • SEPAY")
      .setColor(0x6a5cff)
      .addFields(
        {
          name: "💰 Số tiền",
          value: `**${Number(amount).toLocaleString("vi-VN")} VNĐ**`,
          inline: false
        },
        {
          name: "📝 Nội dung",
          value: description,
          inline: false
        },
        {
          name: "🏦 Ngân hàng",
          value: "MBBANK",
          inline: false
        },
        {
          name: "⏰ Thời gian",
          value: time,
          inline: false
        },
        {
          name: "🔖 Mã giao dịch",
          value: reference,
          inline: false
        }
      )
      .setFooter({ text: "BIRUY BANK AUTO • CHECK BILL" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log("✅ Đã gửi embed Discord");

  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err);
  }
});

// ====== LISTEN (BẮT BUỘC CHO RENDER) ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook SePay running on port ${PORT}`);
});
