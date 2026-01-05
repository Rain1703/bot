// ================== IMPORT ==================
const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// ================== ENV ==================
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

// ================== DISCORD ==================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`🤖 Bot online: ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);

// ================== EXPRESS ==================
const app = express();
app.use(bodyParser.json());

// ================== HEALTH ==================
app.get("/", (req, res) => {
  res.send("OK");
});

// ================== SEPAY WEBHOOK ==================
app.post("/sepay", async (req, res) => {
  // ⚠️ TRẢ 200 NGAY – SEPAY KHÔNG TIMEOUT
  res.status(200).json({ status: "ok" });

  try {
    console.log("📩 RAW BODY:", JSON.stringify(req.body, null, 2));

    // ===== CHECK API KEY =====
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Apikey ")) return;

    const token = auth.slice(7).trim();
    if (token !== SEPAY_API_TOKEN) return;

    // ===== NỘI DUNG =====
    const description =
      req.body.description ||
      req.body.content ||
      req.body?.data?.description ||
      "";

    // ===== THỜI GIAN =====
    const time =
      req.body.transactionDate ||
      req.body.time ||
      new Date().toLocaleString("vi-VN");

    // ===== MÃ GD =====
    const reference =
      req.body.reference ||
      req.body.transId ||
      "N/A";

    // ===== SỐ TIỀN (MB BANK FIX) =====
    let amount =
      Number(
        req.body.amount ??
        req.body.transactionAmount ??
        req.body.amount_in ??
        req.body.money ??
        0
      ) || 0;

    // 🔥 MB BANK KHÔNG TRẢ AMOUNT → PARSE TỪ NỘI DUNG
    if (amount === 0 && description) {
      const match = description.match(/(\d{1,3}(?:[.,]\d{3})+)/);
      if (match) {
        amount = Number(match[1].replace(/[.,]/g, ""));
      }
    }

    // ===== BỎ QUA NẾU KHÔNG TÌM ĐƯỢC TIỀN =====
    if (amount === 0) {
      console.log("⚠️ Không detect được số tiền, bỏ qua");
      return;
    }

    // ===== SEND DISCORD =====
    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("💸 BIẾN ĐỘNG SỐ DƯ • Rain Shop")
      .setColor(0x6a5cff)
      .addFields(
        {
          name: "💰 Số tiền",
          value: `**${amount.toLocaleString("vi-VN")} VNĐ**`,
          inline: false
        },
        {
          name: "📝 Nội dung",
          value: description || "Không có",
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
      .setFooter({ text: "RAIN SHOP BANK AUTO • CHECK BILL" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log("✅ Đã gửi embed Discord");

  } catch (err) {
    console.error("❌ Lỗi webhook:", err);
  }
});

// ================== LISTEN (RENDER) ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook SePay running on port ${PORT}`);
});
