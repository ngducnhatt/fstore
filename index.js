const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const payOS = require("./utils/payos");

const app = express();
const PORT = process.env.PORT || 3030;
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", express.static("public"));
app.use("/payment", require("./controllers/payment-controller"));
app.use("/order", require("./controllers/order-controller"));

app.post("/create-payment-link", async (req, res) => {
  const YOUR_DOMAIN = "http://localhost:3030";
  const { productId, price, email } = req.body;

  // Validate dữ liệu đầu vào
  if (!productId || !price || !email) {
    return res.status(400).json({
      error: 1,
      message: "Thiếu thông tin sản phẩm hoặc email",
    });
  }

  // Tạo mô tả dựa trên sản phẩm
  let description = "";
  switch (productId) {
    case "lol-pbe":
      description = "Thanh toán tài khoản League of Legends PBE";
      break;
    case "valorant":
      description = "Thanh toán tài khoản Valorant";
      break;
    default:
      return res.status(400).json({
        error: 1,
        message: "Sản phẩm không hợp lệ",
      });
  }

  const body = {
    orderCode: Number(String(Date.now()).slice(-6)),
    amount: Number(price),
    description: description,
    returnUrl: `${YOUR_DOMAIN}/success.html`,
    cancelUrl: `${YOUR_DOMAIN}/cancel.html`,
    expiredAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Link hết hạn sau 24h
    buyerEmail: email,
    buyerName: email.split("@")[0], // Tạm thời lấy tên từ email
    buyerPhone: "0123456789", // Có thể thêm trường này vào form nếu cần
    items: [
      {
        name: description,
        quantity: 1,
        price: Number(price),
      },
    ],
  };

  try {
    console.log("Creating payment link with data:", body);
    const paymentLinkResponse = await payOS.createPaymentLink(body);
    console.log(
      "Payment link created successfully:",
      paymentLinkResponse.checkoutUrl
    );
    res.redirect(paymentLinkResponse.checkoutUrl);
  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(500).json({
      error: 1,
      message: "Có lỗi xảy ra khi tạo link thanh toán",
    });
  }
});

app.listen(PORT, function () {
  console.log(`Server is listening on port ${PORT}`);
});
