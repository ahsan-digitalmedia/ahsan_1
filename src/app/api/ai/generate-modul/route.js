import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { topic, chapter, goal, approach, teacherInfo } = await req.json();
        const apiKey = (process.env.GEMINI_API_KEY || "").trim();

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key Gemini belum ditemukan. Silakan tambahkan GEMINI_API_KEY di file .env.local Anda." },
                { status: 500 }
            );
        }

        const isDeepLearning = approach === "Deep Learning";

        const prompt = `
            Anda adalah asisten pendidikan ahli Kurikulum Merdeka di Indonesia. 
            DATA INPUT:
            - Mata Pelajaran: ${teacherInfo.subject || '-'}
            - Fase: ${teacherInfo.fase || '-'}
            - Kelas: ${teacherInfo.class}
            - Topik Utama: ${topic}
            - Bab: ${chapter}
            - Tujuan Awal Guru: ${goal}
            - Pendekatan: ${approach}

            INSTRUKSI PENTING:
            1. Respon HARUS dalam format JSON murni.
            2. JANGAN sertakan teks pembuka/penutup.
            3. Pastikan semua field terisi dengan konten pendidikan berkualitas.
            4. Pilih maksimal 4 item untuk "modul_p5" HANYA dari daftar ini: ["Keimanan & Ketakwaan", "Kewargaan", "Penalaran Kritis", "Kreativitas", "Kolaborasi", "Kemandirian", "Kesehatan", "Komunikasi"].

            STRUKTUR JSON:
            {
                "modul_teacher_name": "${teacherInfo.name}",
                "modul_school_name": "${teacherInfo.school_name}",
                "modul_class": "${teacherInfo.class}",
                "modul_topic": "${topic}",
                "modul_jp": "2",
                "modul_semester": "${teacherInfo.semester || '1'}",
                "modul_academic_year": "${teacherInfo.academic_year || '2024/2025'}",
                "modul_comp_initial": "...",
                "modul_tp": "...",
                "modul_meaningful": "...",
                "modul_method": "...",
                "modul_trigger_questions": "...",
                "modul_activity_pre": "...",
                "modul_activity_core": "...",
                "modul_activity_post": "...",
                "modul_ass_diag": "...",
                "modul_ass_form": "...",
                "modul_ass_sum": "...",
                "modul_lkpd": "...",
                "modul_media": "...",
                "modul_glosarium": "...",
                "modul_bibliography": "...",
                "modul_p5": ["Item 1", "Item 2"]${isDeepLearning ? `,
                "modul_cp": "...",
                "modul_cross_disciplinary": "..."` : ''}
            }
        `;

        // Detect API Provider
        const isOpenRouter = apiKey.startsWith("sk-or-");
        const modelName = isOpenRouter ? "google/gemini-2.0-flash-001" : "gemini-2.0-flash";

        let apiUrl, fetchOptions;

        if (isOpenRouter) {
            console.log(`Calling OpenRouter API with ${modelName}...`);
            apiUrl = "https://openrouter.ai/api/v1/chat/completions";
            fetchOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://aplikasi-guru.vercel.app', // Optional for OpenRouter
                    'X-Title': 'Aplikasi Guru'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2048,
                    response_format: { type: "json_object" }
                })
            };
        } else {
            console.log(`Calling Gemini API v1beta with ${modelName}...`);
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        responseMimeType: "application/json"
                    }
                })
            };
        }

        const apiResponse = await fetch(apiUrl, fetchOptions);
        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`${isOpenRouter ? "OpenRouter" : "Gemini"} API Error Detail:`, JSON.stringify(result, null, 2));

            if (apiResponse.status === 429) {
                return NextResponse.json(
                    { error: "Kuota AI Habis: Batas limit tercapai. Silakan tunggu 1 menit." },
                    { status: 429 }
                );
            }

            const errorMessage = isOpenRouter
                ? result.error?.message || "Gagal menghubungi OpenRouter"
                : result.error?.message || "Gagal menghubungi Google AI";

            throw new Error(errorMessage);
        }

        // Extract text based on provider
        let aiText = "";
        if (isOpenRouter) {
            aiText = result.choices?.[0]?.message?.content;
        } else {
            aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        if (!aiText) {
            throw new Error("AI tidak memberikan respon teks. Silakan coba lagi.");
        }

        // Extremely robust JSON extraction
        let extractedJson = aiText.trim();

        // Remove markdown code blocks if present
        if (extractedJson.includes("```json")) {
            extractedJson = extractedJson.split("```json")[1].split("```")[0].trim();
        } else if (extractedJson.includes("```")) {
            extractedJson = extractedJson.split("```")[1].split("```")[0].trim();
        } else {
            // Find the first { and last }
            const firstBrace = extractedJson.indexOf('{');
            const lastBrace = extractedJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                extractedJson = extractedJson.substring(firstBrace, lastBrace + 1);
            }
        }

        try {
            const data = JSON.parse(extractedJson);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error("JSON Parse Error. Raw text:", aiText);
            return NextResponse.json({
                error: "Format data AI tidak valid. Silakan coba sekali lagi.",
                debug: extractedJson.substring(0, 100)
            }, { status: 500 });
        }

    } catch (error) {
        console.error("AI Route Exception:", error);
        return NextResponse.json({ error: "Terjadi kesalahan: " + error.message }, { status: 500 });
    }
}
