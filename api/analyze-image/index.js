/*

// api/analyze-image/index.js
import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // GET → Mostrar mensaje de bienvenida
  if (req.method === "GET") {
    return res.status(200).json({
      message:
        "📡 API funcionando: envía un POST con { imageBase64 } a /api/analyze-image",
    });
  }

  // POST → Procesar imagen
  if (req.method === "POST") {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      // Subir imagen a Cloudinary
      const uploadResult = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${imageBase64}`,
        { folder: "visu_wallet_receipts" }
      );
      const imageUrl = uploadResult.secure_url;

      const prompt = `
         Analiza esta imagen de un recibo.
         Devuelve un JSON con:
         - monto_total, solo el valor y separando los centavos con punto
         - 3 etiquetas que describan la imagen
         - una breve descripcion de la imagen (en maximo 10 palabras)
         Si ves USD, Total o similares, ese es el monto_total.
      `;

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing API KEY" });
      }

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-vision",
          input: [
            { role: "user", content: prompt },
            {
              role: "user",
              content: [
                {
                  type: "input_image",
                  image_url: imageUrl, // ahora enviamos URL
                },
              ],
            },
          ],
          max_output_tokens: 500,
        }),
      });

      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Cualquier otro método
  return res.status(405).json({ error: "Method not allowed" });
}

*/

// api/analyze-image/index.js
export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      message:
        "📡 API funcionando: envía un POST con { imageBase64 } a /api/analyze-image",
    });
  }

  if (req.method === "POST") {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64" });
      }

      const HF_API_KEY = process.env.HF_API_KEY;
      if (!HF_API_KEY) {
        return res.status(500).json({ error: "Missing Hugging Face API Key" });
      }

      // Convertir base64 a buffer
      const imageBuffer = Buffer.from(imageBase64, "base64");

      // Enviar a Hugging Face BLIP-2
      const response = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip2-flan-t5-xl",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/octet-stream",
          },
          body: imageBuffer,
        }
      );

      if (!response.ok) {
        const txt = await response.text();
        console.error("HF response error:", response.status, txt);
        throw new Error(`Hugging Face error: ${response.status}`);
      }

      const rawText = await response.text();
      console.log("HF model output:", rawText);

      // Extraer datos del recibo (simple parsing)
      const montoMatch = rawText.match(/(\d+[.,]?\d{0,2})\s*(USD|\$)?/i);
      const monto_total = montoMatch ? montoMatch[1].replace(",", ".") : null;

      const etiquetas =
        rawText
          .toLowerCase()
          .match(/\b(total|recibo|factura|pago|usd|compra|producto|servicio)\b/g) ||
        [];

      const descripcion = rawText.slice(0, 50); // breve descripción (primeras 50 letras)

      const ocrDataForForm = {
        amount: monto_total ? parseFloat(monto_total) : null,
        labels: Array.isArray(etiquetas) ? etiquetas : [etiquetas],
        rawText: descripcion,
      };

      return res.status(200).json(ocrDataForForm);
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

