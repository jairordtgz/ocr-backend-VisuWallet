export const runtime = "nodejs"; // o "nodejs"

export async function GET() {
  return new Response(
    JSON.stringify({
      message: "📡 API funcionando: envía un POST a /api/analyze-image con { imageBase64 }",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing imageBase64" }), {
        status: 400,
      });
    }

    const prompt = `
      Analiza esta imagen de un recibo.
      Devuelve un JSON con:
      - monto_total
      - 3 etiquetas que describan la imagen
      - texto_extraido
      Si ves USD, Total o similares, ese es el monto.
    `;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API KEY" }), {
        status: 500,
      });
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
                image_url: imageBase64,
              },
            ],
          },
        ],
        max_output_tokens: 500,
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
