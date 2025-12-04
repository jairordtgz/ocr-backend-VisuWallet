import Tesseract from 'tesseract.js';

export default async function handler(req, res) {

  if (req.method === "GET") {
    // Mensaje de prueba para acceder a la URL principal
    return res.status(200).json({ message: "Backend OCR funcionando en Vercel 🚀" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { image } = req.body; // Base64 o URL
    if (!image) {
      return res.status(400).json({ error: 'Se requiere una imagen' });
    }

    const { data } = await Tesseract.recognize(image, 'spa', {
      logger: m => console.log(m),
    });

    return res.status(200).json({
      text: data.text,
    });

  } catch (err) {
    console.error('OCR Error:', err);
    return res.status(500).json({ error: 'Error procesando OCR' });
  }
}
