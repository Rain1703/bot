export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
  const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

  // ===== VERIFY API KEY =====
  if (req.headers.authorization !== `Apikey ${SEPAY_API_KEY}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const d = req.body || {};

  // ===== SEPAY DATA =====
  const amount = d.transferAmount || 0;
  if (amount <= 0) {
    return res.json({ ignored: true });
  }

  const embed = {
    title: "📥 SEPAY LOG (KÊNH ẨN)",
    color: 0x5865f2,
    fields: [
      {
        name: "💰 Số tiền",
        value: `+${amount.toLocaleString("vi-VN")} VNĐ`,
        inline: false
      },
      {
        name: "🏦 Ngân hàng",
        value: d.gateway || "N/A",
        inline: true
      },
      {
        name: "⏰ Thời gian",
        value: d.transactionDate || "N/A",
        inline: true
      },
      {
        name: "🔖 Mã tham chiếu",
        value: d.referenceCode || "N/A",
        inline: false
      },
      {
        name: "📝 Nội dung",
        value: d.content || "Không có nội dung",
        inline: false
      }
    ],
    footer: {
      text: "SePay → Vercel → Discord"
    },
    timestamp: new Date().toISOString()
  };

  // ===== SEND TO DISCORD WEBHOOK =====
  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] })
  });

  return res.json({ success: true });
}
