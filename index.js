const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

// ===== CONFIG FROM ENV =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;
const FIXED_BANK = "MBBANK";

// ===== DISCORD =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);

// ===== EXPRESS =====
const app = express();
app.use(express.json());

app.post("/sepay", async (req, res) => {
  try {
    console.log("📩 Webhook nhận:", req.body);

    // 🔐 CHECK API KEY (SePay dùng Apikey)
    const auth = req.headers.authorization || "";
    const token = auth.replace("Apikey ", "");

    if (token !== SEPAY_API_TOKEN) {
      return res.status(403).json({ status: "unauthorized" });
    }

    const amount = req.body.amount || 0;
    const description = req.body.description || "Không có nội dung";
    const time =
      req.body.transactionDate ||
      new Date().toLocaleString("vi-VN");
    const reference = req.body.reference || "N/A";

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("💸 BIẾN ĐỘNG SỐ DƯ • SEPAY")
      .setColor(0x6a5cff)
      .addFields(
        { name: "💰 Số tiền", value: `**${Number(amount).toLocaleString("vi-VN")} VNĐ**` },
        { name: "📝 Nội dung", value: description },
        { name: "🏦 Ngân hàng", value: FIXED_BANK },
        { name: "⏰ Thời gian", value: time },
        { name: "🔖 Mã giao dịch", value: reference }
      )
      .setFooter({ text: "BIRUY BANK AUTO • CHECK BILL" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    return res.status(200).json({ status: "ok" });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ status: "error" });
  }
});

// ⚠️ Render BẮT BUỘC dùng process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook SePay running on port ${PORT}`);
});