import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env"),
    quiet: true,
});

const { default: pool } = await import("../src/config/database/connection.js");

// Seed demo analytics data transactionally for one dedicated teacher account.
const TEACHER = {
    email: "guru@qurio.test",
    name: "Bu Sari",
    password: "password123",
    role: "guru",
};

const STUDENT_NAMES = [
    "Budi Santoso",
    "Siti Nurhaliza",
    "Andi Wijaya",
    "Dewi Lestari",
    "Rizky Pratama",
    "Putri Maharani",
    "Fajar Nugroho",
    "Nadia Permata",
    "Dimas Saputra",
    "Ayu Wulandari",
    "Rafi Hidayat",
    "Intan Puspita",
    "Bagas Ramadhan",
    "Nabila Zahra",
    "Arif Kurniawan",
    "Citra Anggraini",
    "Ilham Maulana",
    "Maya Safitri",
    "Yoga Firmansyah",
    "Laras Kusuma",
    "Raka Setiawan",
    "Anisa Putri",
    "Farhan Akbar",
    "Tiara Amelia",
    "Dani Prakoso",
    "Vina Oktaviani",
    "Reza Pahlevi",
    "Melati Salsabila",
    "Gilang Permana",
    "Kirana Ayuningtyas",
];

const GENERAL_WORDS = [
    "belajar", "materi", "konsep", "contoh", "latihan", "diskusi",
    "jawaban", "pertanyaan", "kelas", "siswa", "guru", "paham", "rumus",
    "teori", "proses", "hasil", "analisis", "data", "penting", "menarik",
    "mudah", "sulit", "tepat", "benar", "cara", "langkah", "kelompok",
    "penjelasan", "informasi", "kegiatan",
];

const TOPICS = [
    {
        title: "Matematika — Persamaan Kuadrat",
        prompt: "persamaan kuadrat",
        words: ["akar", "diskriminan", "koefisien", "faktorisasi", "parabola", "variabel", "aljabar", "grafik", "pangkat", "polinomial", "sumbu", "vertex", "kuadrat", "persamaan", "matematika"],
        questions: [
            ["Akar-akar dari x² - 5x + 6 = 0 adalah ...", ["2 dan 3", "1 dan 6", "-2 dan -3", "3 dan 6"], 0],
            ["Diskriminan persamaan x² + 4x + 4 = 0 adalah ...", ["0", "4", "8", "16"], 0],
            ["Bentuk faktorisasi x² - 9 adalah ...", ["(x - 3)(x + 3)", "(x - 9)(x + 1)", "(x - 3)²", "(x + 9)(x - 1)"], 0],
            ["Jika diskriminan persamaan kuadrat negatif, maka akarnya ...", ["Tidak real", "Selalu kembar", "Selalu positif", "Berjumlah nol"], 0],
            ["Titik puncak y = (x - 2)² + 3 adalah ...", ["(2, 3)", "(-2, 3)", "(2, -3)", "(3, 2)"], 0],
        ],
    },
    {
        title: "Bahasa Indonesia — Teks Eksposisi",
        prompt: "teks eksposisi",
        words: ["tesis", "argumen", "fakta", "opini", "penegasan", "paragraf", "gagasan", "bukti", "informasi", "struktur", "bahasa", "persuasif", "eksposisi", "literasi", "membaca"],
        questions: [
            ["Tujuan utama teks eksposisi adalah ...", ["Menjelaskan pendapat dengan argumen", "Menceritakan pengalaman pribadi", "Menghibur melalui tokoh", "Memberi petunjuk penggunaan"], 0],
            ["Bagian yang berisi pendapat awal penulis disebut ...", ["Tesis", "Orientasi", "Resolusi", "Koda"], 0],
            ["Kalimat yang didukung data disebut ...", ["Fakta", "Opini", "Saran", "Hipotesis"], 0],
            ["Urutan struktur teks eksposisi yang tepat adalah ...", ["Tesis, argumentasi, penegasan ulang", "Orientasi, komplikasi, resolusi", "Tujuan, bahan, langkah", "Pernyataan umum, sebab, akibat"], 0],
            ["Kata penghubung yang menyatakan sebab adalah ...", ["Karena", "Namun", "Kemudian", "Sebaliknya"], 0],
        ],
    },
    {
        title: "IPA — Sistem Tata Surya",
        prompt: "sistem tata surya",
        words: ["planet", "matahari", "orbit", "rotasi", "revolusi", "gravitasi", "bumi", "mars", "venus", "saturnus", "komet", "asteroid", "satelit", "gerhana", "astronomi"],
        questions: [
            ["Planet yang paling dekat dengan Matahari adalah ...", ["Merkurius", "Venus", "Bumi", "Mars"], 0],
            ["Planet terbesar di tata surya adalah ...", ["Jupiter", "Saturnus", "Neptunus", "Uranus"], 0],
            ["Peristiwa siang dan malam terjadi karena ...", ["Rotasi Bumi", "Revolusi Bumi", "Rotasi Bulan", "Revolusi Matahari"], 0],
            ["Waktu yang dibutuhkan Bumi untuk sekali mengelilingi Matahari sekitar ...", ["365¼ hari", "24 jam", "30 hari", "687 hari"], 0],
            ["Ekor komet selalu tampak menjauhi Matahari karena ...", ["Angin surya", "Gravitasi Bumi", "Rotasi komet", "Cahaya Bulan"], 0],
        ],
    },
    {
        title: "Sejarah — Kemerdekaan Indonesia",
        prompt: "kemerdekaan Indonesia",
        words: ["proklamasi", "kemerdekaan", "Soekarno", "Hatta", "Jakarta", "Agustus", "1945", "BPUPKI", "PPKI", "naskah", "bendera", "perjuangan", "republik", "rakyat", "sejarah"],
        questions: [
            ["Proklamasi Kemerdekaan Indonesia dibacakan pada ...", ["17 Agustus 1945", "18 Agustus 1945", "1 Juni 1945", "10 November 1945"], 0],
            ["Tokoh yang mendampingi Soekarno menandatangani naskah proklamasi adalah ...", ["Mohammad Hatta", "Sutan Sjahrir", "Ahmad Soebardjo", "Ki Hajar Dewantara"], 0],
            ["Naskah proklamasi diketik oleh ...", ["Sayuti Melik", "Sukarni", "Wikana", "Mohammad Yamin"], 0],
            ["Proklamasi dibacakan di Jalan ...", ["Pegangsaan Timur No. 56", "Merdeka Selatan No. 1", "Imam Bonjol No. 1", "Diponegoro No. 10"], 0],
            ["PPKI mengesahkan UUD 1945 pada tanggal ...", ["18 Agustus 1945", "17 Agustus 1945", "19 September 1945", "10 November 1945"], 0],
        ],
    },
    {
        title: "Bahasa Inggris — Simple Past Tense",
        prompt: "simple past tense",
        words: ["verb", "regular", "irregular", "yesterday", "visited", "played", "went", "did", "was", "were", "sentence", "grammar", "past", "time", "English"],
        questions: [
            ["The past form of 'go' is ...", ["Went", "Goed", "Gone", "Going"], 0],
            ["Choose the correct sentence.", ["She visited her aunt yesterday.", "She visit her aunt yesterday.", "She visits her aunt yesterday.", "She visiting her aunt yesterday."], 0],
            ["The negative form of 'They played football' is ...", ["They did not play football.", "They did not played football.", "They do not played football.", "They were not play football."], 0],
            ["Complete: We ___ at school last Monday.", ["Were", "Are", "Was", "Be"], 0],
            ["Which is the past form of 'buy'?", ["Bought", "Buyed", "Buying", "Buys"], 0],
        ],
    },
    {
        title: "Matematika — Trigonometri Dasar",
        prompt: "trigonometri dasar",
        words: ["sinus", "cosinus", "tangen", "sudut", "segitiga", "sisi", "miring", "derajat", "radian", "identitas", "opposite", "adjacent", "hipotenusa", "trigonometri", "matematika"],
        questions: [
            ["Nilai sin(30°) adalah ...", ["1/2", "√3/2", "1", "√2/2"], 0],
            ["Nilai cos(60°) adalah ...", ["1/2", "√3/2", "0", "1"], 0],
            ["Nilai tan(45°) adalah ...", ["1", "0", "√3", "1/2"], 0],
            ["Segitiga siku-siku memiliki sisi depan 6 dan hipotenusa 10. Nilai sinus sudutnya adalah ...", ["0,6", "0,8", "1,2", "1,67"], 0],
            ["Jika cos θ = 12/13 dan θ lancip, nilai sin θ adalah ...", ["5/13", "12/5", "13/5", "1/13"], 0],
        ],
    },
    {
        title: "IPA — Fotosintesis",
        prompt: "proses fotosintesis",
        words: ["fotosintesis", "klorofil", "kloroplas", "karbon", "oksigen", "glukosa", "cahaya", "daun", "air", "matahari", "stomata", "reaksi", "energi", "tumbuhan", "biologi"],
        questions: [
            ["Fotosintesis terutama berlangsung di bagian sel bernama ...", ["Kloroplas", "Mitokondria", "Nukleus", "Ribosom"], 0],
            ["Zat hijau daun yang menangkap energi cahaya adalah ...", ["Klorofil", "Hemoglobin", "Melanin", "Keratin"], 0],
            ["Gas yang diserap tumbuhan saat fotosintesis adalah ...", ["Karbon dioksida", "Oksigen", "Nitrogen", "Hidrogen"], 0],
            ["Persamaan ringkas fotosintesis yang setara menghasilkan ...", ["C₆H₁₂O₆ dan 6O₂", "6CO₂ dan 6H₂O", "C₆H₁₂O₆ dan 6CO₂", "6O₂ dan 6H₂O"], 0],
            ["Reaksi terang fotosintesis berlangsung pada membran ...", ["Tilakoid", "Membran inti", "Membran plasma", "Dinding sel"], 0],
        ],
    },
    {
        title: "IPS — Peta dan Skala",
        prompt: "peta dan skala",
        words: ["peta", "skala", "jarak", "legenda", "simbol", "arah", "kompas", "wilayah", "atlas", "koordinat", "kontur", "geografi", "kilometer", "sentimeter", "proyeksi"],
        questions: [
            ["Skala 1:100.000 berarti 1 cm pada peta mewakili ...", ["1 km di lapangan", "100 km di lapangan", "100 m di lapangan", "10 km di lapangan"], 0],
            ["Keterangan simbol pada peta disebut ...", ["Legenda", "Inset", "Orientasi", "Garis astronomis"], 0],
            ["Alat untuk menunjukkan arah mata angin adalah ...", ["Kompas", "Barometer", "Termometer", "Higrometer"], 0],
            ["Jarak dua kota pada peta 4 cm dengan skala 1:250.000. Jarak sebenarnya adalah ...", ["10 km", "1 km", "100 km", "25 km"], 0],
            ["Garis pada peta yang menghubungkan tempat dengan ketinggian sama disebut ...", ["Garis kontur", "Garis bujur", "Garis lintang", "Garis batas"], 0],
        ],
    },
];

const QA_TEMPLATES = [
    "Bagaimana cara memahami {topic} dengan contoh yang sederhana?",
    "Mengapa {topic} penting untuk dipelajari?",
    "Apa perbedaan konsep utama dalam {topic}?",
    "Bisakah guru memberi contoh penerapan {topic} dalam kehidupan sehari-hari?",
    "Bagian mana dari {topic} yang paling sering keliru dipahami?",
    "Bagaimana langkah pertama menyelesaikan soal tentang {topic}?",
    "Apakah ada cara cepat untuk mengingat materi {topic}?",
    "Apa hubungan {topic} dengan materi yang sudah dipelajari sebelumnya?",
    "Mengapa jawaban pada contoh {topic} bisa berbeda jika kondisinya berubah?",
    "Boleh dijelaskan kembali istilah penting dalam {topic}?",
    "Latihan seperti apa yang cocok untuk memperdalam {topic}?",
    "Apa kesalahan umum saat mengerjakan soal {topic}?",
    "Bagaimana cara memeriksa kembali hasil dari soal {topic}?",
    "Adakah contoh lain yang lebih menantang tentang {topic}?",
    "Kapan konsep {topic} digunakan di luar kelas?",
];

const QA_ANSWERS = [
    "Gunakan konsep dasarnya terlebih dahulu, lalu periksa kembali setiap langkah.",
    "Perhatikan informasi yang diketahui dan hubungkan dengan rumus yang sesuai.",
    "Coba buat contoh sederhana agar hubungan antar konsep terlihat jelas.",
];

const WORD_ANSWERS = [
    "konsep", "materi", "latihan", "diskusi", "contoh", "paham", "rumus",
    "proses", "analisis", "belajar", "jawaban", "penting", "menarik", "kelas",
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
    return items[randomInt(0, items.length - 1)];
}

function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(0, index);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function sample(items, count) {
    return shuffle(items).slice(0, count);
}

function randomDate(start, end) {
    return new Date(randomInt(start.getTime(), end.getTime()));
}

function gaussianScore() {
    const first = Math.max(Number.EPSILON, Math.random());
    const second = Math.random();
    const normal = Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
    return Math.max(0, Math.min(100, 75 + normal * 12));
}

function makeZipfWords(vocabulary, responseWords) {
    const sortedWords = [...vocabulary].sort();
    const counts = new Map();
    sortedWords.forEach((word, index) => {
        counts.set(word, Math.max(1, Math.round(80 / (index + 1) ** 0.82)));
    });
    for (const word of responseWords) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    return [...counts.entries()];
}

function weightedWord(vocabulary) {
    const ranked = [...vocabulary].sort();
    const weights = ranked.map((_, index) => 1 / (index + 1) ** 1.15);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let ticket = Math.random() * total;
    for (let index = 0; index < ranked.length; index += 1) {
        ticket -= weights[index];
        if (ticket <= 0) return ranked[index];
    }
    return ranked[0];
}

async function insertRows(client, table, columns, rows) {
    if (rows.length === 0) return 0;

    const batchSize = 500;
    for (let offset = 0; offset < rows.length; offset += batchSize) {
        const batch = rows.slice(offset, offset + batchSize);
        const values = batch.flat();
        const tuples = batch.map((row, rowIndex) => {
            const placeholders = row.map((_, columnIndex) =>
                `$${rowIndex * columns.length + columnIndex + 1}`,
            );
            return `(${placeholders.join(", ")})`;
        });

        await client.query(
            `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
            values,
        );
    }

    return rows.length;
}

async function ensureUser(client, { name, email, passwordHash, role }) {
    const inserted = await client.query(
        `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, role`,
        [name, email, passwordHash, role],
    );

    if (inserted.rows[0]) return { ...inserted.rows[0], inserted: true };

    const existing = await client.query(
        "SELECT id, name, role FROM users WHERE email = $1",
        [email],
    );
    if (!existing.rows[0] || existing.rows[0].role !== role) {
        throw new Error(`Akun ${email} sudah ada dengan role yang tidak sesuai.`);
    }

    return { ...existing.rows[0], inserted: false };
}

async function runSeed() {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const database = await client.query("SELECT current_database() AS name");
        console.log(`[seed] Database terhubung: ${database.rows[0].name}`);

        const passwordHash = await bcrypt.hash(TEACHER.password, 10);
        await client.query("BEGIN");
        transactionStarted = true;

        const teacher = await ensureUser(client, {
            ...TEACHER,
            passwordHash,
        });
        const students = [];
        let insertedStudents = 0;

        for (const [index, name] of STUDENT_NAMES.entries()) {
            const email = `siswa${String(index + 1).padStart(2, "0")}@qurio.test`;
            const student = await ensureUser(client, {
                name,
                email,
                passwordHash,
                role: "siswa",
            });
            if (student.inserted) insertedStudents += 1;
            students.push({ ...student, absen: String(index + 1).padStart(2, "0") });
        }
        console.log(
            `[seed] Akun guru siap (${teacher.inserted ? "baru" : "sudah ada"}); ${insertedStudents} akun siswa baru, ${students.length} tersedia.`,
        );

        const deletedSessions = await client.query(
            "DELETE FROM sessions WHERE teacher_id = $1 RETURNING id",
            [teacher.id],
        );
        console.log(
            `[seed] ${deletedSessions.rowCount} sesi lama milik ${TEACHER.email} dihapus beserta data turunannya.`,
        );

        const usedCodeResult = await client.query(
            "SELECT access_code FROM sessions",
        );
        const usedAccessCodes = new Set(
            usedCodeResult.rows.map((row) => row.access_code),
        );
        const createAccessCode = () => {
            let code;
            do {
                code = String(randomInt(100000, 999999));
            } while (usedAccessCodes.has(code));
            usedAccessCodes.add(code);
            return code;
        };

        const now = Date.now();
        const daysAgo = [28, 24, 20, 16, 12, 8, 4, 0.08];
        const sessions = TOPICS.map((topic, index) => {
            const createdAt = new Date(
                now - daysAgo[index] * 24 * 60 * 60 * 1000,
            );
            const durationMinutes = randomInt(55, 90);
            return {
                id: randomUUID(),
                teacherId: teacher.id,
                topic,
                mode: index < 4 ? "quiz" : "interactive",
                status: index < 4 ? "ended" : "active",
                createdAt,
                endedAt:
                    index < 4
                        ? new Date(createdAt.getTime() + durationMinutes * 60 * 1000)
                        : null,
                durationMinutes,
                classSize: 30,   // ← INI GANTI JADI: classSize: 30,
                participants: sample(students, randomInt(20, 28)).map((student) => ({
                    id: randomUUID(),
                    student,
                    joinedAt: new Date(
                        createdAt.getTime() + randomInt(2, 18) * 60 * 1000,
                    ),
                })),
                accessCode: createAccessCode(),
            };
        });

        await insertRows(
            client,
            "sessions",
            ["id", "teacher_id", "title", "access_code", "mode", "status", "class_size", "created_at", "ended_at"],
            sessions.map((session) => [
                session.id,
                session.teacherId,
                session.topic.title,
                session.accessCode,
                session.mode,
                session.status,
                session.classSize,
                session.createdAt,
                session.endedAt,
            ]),
        );
        console.log("[seed] 8 sesi dibuat; 4 ended dan 4 active.");

        const participantRows = sessions.flatMap((session) =>
            session.participants
                .filter((p) => p?.student?.name)
                .map((p) => [
                    p.id,
                    session.id,
                    p.student.name,
                    p.student.absen,
                    p.joinedAt,
                ]),
        );
        await insertRows(
            client,
            "participants",
            ["id", "session_id", "name", "absen", "joined_at"],
            participantRows,
        );
        console.log(`[seed] ${participantRows.length} peserta sesi dibuat.`);

        const pollRows = [];
        const optionRows = [];
        const quizEntriesBySession = new Map();
        const qaPollBySession = new Map();
        const wordcloudPollBySession = new Map();

        for (const session of sessions) {
            const quizEntries = [];
            const hardIndexes = new Set([3]);
            if (Math.random() < 0.5) hardIndexes.add(4);

            for (const [questionIndex, questionSpec] of session.topic.questions.entries()) {
                const pollId = randomUUID();
                const publishedAt = new Date(
                    session.createdAt.getTime() + (questionIndex + 1) * 60 * 1000,
                );
                pollRows.push([
                    pollId,
                    session.id,
                    "quiz",
                    questionSpec[0],
                    "published",
                    publishedAt,
                    publishedAt,
                    null,
                ]);

                const optionSpecs = questionSpec[1].map((optionText, optionIndex) => {
                    const optionId = randomUUID();
                    optionRows.push([
                        optionId,
                        pollId,
                        optionText,
                        optionIndex === questionSpec[2],
                        optionIndex + 1,
                    ]);
                    return {
                        id: optionId,
                        text: optionText,
                        correct: optionIndex === questionSpec[2],
                    };
                });

                quizEntries.push({
                    id: pollId,
                    options: optionSpecs,
                    hard: hardIndexes.has(questionIndex),
                });
            }
            quizEntriesBySession.set(session.id, quizEntries);

            const qaPollId = randomUUID();
            pollRows.push([
                qaPollId,
                session.id,
                "qa",
                `Tanya jawab: ${session.topic.prompt}`,
                "published",
                session.createdAt,
                session.createdAt,
                null,
            ]);
            qaPollBySession.set(session.id, qaPollId);

            const wordcloudPollId = randomUUID();
            pollRows.push([
                wordcloudPollId,
                session.id,
                "wordcloud",
                `Kata kunci: ${session.topic.prompt}`,
                "published",
                session.createdAt,
                session.createdAt,
                null,
            ]);
            wordcloudPollBySession.set(session.id, wordcloudPollId);
        }

        await insertRows(
            client,
            "polls",
            ["id", "session_id", "type", "question", "status", "created_at", "published_at", "closed_at"],
            pollRows,
        );
        await insertRows(
            client,
            "poll_options",
            ["id", "poll_id", "option_text", "is_correct", "option_order"],
            optionRows,
        );
        console.log(
            `[seed] ${pollRows.length} poll dibuat (40 quiz, 8 Q&A, 8 wordcloud) beserta ${optionRows.length} opsi.`,
        );

        const responseRows = [];
        for (const session of sessions) {
            const quizEntries = quizEntriesBySession.get(session.id);
            const attendanceByPoll = new Map();
            const correctnessByPoll = new Map();

            for (const entry of quizEntries) {
                const attendanceRate = randomInt(70, 90) / 100;
                const attendeeCount = Math.max(
                    1,
                    Math.round(session.participants.length * attendanceRate),
                );
                const attendees = sample(session.participants, attendeeCount);
                attendanceByPoll.set(entry.id, attendees);

                if (entry.hard) {
                    const wrongRate = randomInt(60, 80) / 100;
                    const wrongCount = Math.round(attendees.length * wrongRate);
                    const wrongIds = new Set(
                        sample(attendees, wrongCount).map((participant) => participant.id),
                    );
                    correctnessByPoll.set(
                        entry.id,
                        new Map(
                            attendees.map((participant) => [
                                participant.id,
                                !wrongIds.has(participant.id),
                            ]),
                        ),
                    );
                }
            }

            const quizScoreTargets = new Map(
                session.participants.map((participant) => [
                    participant.id,
                    gaussianScore(),
                ]),
            );

            for (const participant of session.participants) {
                const answeredEntries = quizEntries.filter((entry) =>
                    attendanceByPoll.get(entry.id).some((item) => item.id === participant.id),
                );
                const hardEntries = answeredEntries.filter((entry) => entry.hard);
                const easyEntries = answeredEntries.filter((entry) => !entry.hard);
                const hardCorrectCount = hardEntries.filter(
                    (entry) => correctnessByPoll.get(entry.id).get(participant.id),
                ).length;
                const targetCorrectCount = Math.round(
                    (quizScoreTargets.get(participant.id) / 100) * answeredEntries.length,
                );
                const easyCorrectCount = Math.max(
                    0,
                    Math.min(easyEntries.length, targetCorrectCount - hardCorrectCount),
                );
                const correctEasyIds = new Set(
                    sample(easyEntries, easyCorrectCount).map((entry) => entry.id),
                );

                for (const entry of answeredEntries) {
                    const isCorrect = entry.hard
                        ? correctnessByPoll.get(entry.id).get(participant.id)
                        : correctEasyIds.has(entry.id);
                    const candidateOptions = entry.options.filter(
                        (option) => option.correct === isCorrect,
                    );
                    const selectedOption = pick(candidateOptions);
                    const submittedAt = randomDate(
                        session.createdAt,
                        new Date(
                            session.createdAt.getTime() + session.durationMinutes * 60 * 1000,
                        ),
                    );
                    responseRows.push([
                        randomUUID(),
                        entry.id,
                        null,
                        selectedOption.text,
                        selectedOption.id,
                        isCorrect,
                        submittedAt,
                        participant.id,
                    ]);
                }
            }

            const qaPollId = qaPollBySession.get(session.id);
            const qaResponseCount = Math.round(
                session.participants.length * (randomInt(30, 50) / 100),
            );
            for (const participant of sample(session.participants, qaResponseCount)) {
                responseRows.push([
                    randomUUID(),
                    qaPollId,
                    null,
                    pick(QA_ANSWERS),
                    null,
                    null,
                    randomDate(session.createdAt, new Date()),
                    participant.id,
                ]);
            }
        }

        await insertRows(
            client,
            "responses",
            ["id", "poll_id", "student_id", "answer", "option_id", "is_correct", "submitted_at", "participant_id"],
            responseRows,
        );
        console.log(`[seed] ${responseRows.length} respons quiz dan Q&A dibuat.`);

        const questionRows = [];
        const voteRows = [];
        for (const session of sessions) {
            const questionCount = randomInt(5, 15);
            const askedBy = sample(
                session.participants,
                Math.min(questionCount, session.participants.length),
            );
            for (let index = 0; index < questionCount; index += 1) {
                const participant = askedBy[index % askedBy.length];
                const createdAt = randomDate(
                    session.createdAt,
                    new Date(
                        session.createdAt.getTime() + session.durationMinutes * 60 * 1000,
                    ),
                );
                const answered = Math.random() < 0.3;
                const questionId = randomUUID();
                questionRows.push([
                    questionId,
                    session.id,
                    null,
                    participant.id,
                    participant.student.name,
                    pick(QA_TEMPLATES).replace("{topic}", session.topic.prompt),
                    randomInt(0, 20),
                    answered,
                    answered ? pick(QA_ANSWERS) : null,
                    createdAt,
                    answered
                        ? new Date(createdAt.getTime() + randomInt(2, 15) * 60 * 1000)
                        : null,
                ]);

                if (Math.random() < 0.5) {
                    const voters = sample(students, randomInt(0, 10));
                    for (const voter of voters) {
                        voteRows.push([randomUUID(), questionId, voter.id, createdAt]);
                    }
                }
            }
        }

        await insertRows(
            client,
            "questions",
            ["id", "session_id", "student_id", "participant_id", "student_name", "text", "upvotes", "answered", "answer", "created_at", "answered_at"],
            questionRows,
        );
        await insertRows(
            client,
            "question_votes",
            ["id", "question_id", "student_id", "created_at"],
            voteRows,
        );
        console.log(
            `[seed] ${questionRows.length} pertanyaan Q&A dan ${voteRows.length} vote dibuat.`,
        );

        const wordResponseRows = [];
        const wordCountRows = [];
        const initializationRows = [];
        for (const session of sessions) {
            const pollId = wordcloudPollBySession.get(session.id);
            const vocabulary = [
                ...new Set([...session.topic.words, ...GENERAL_WORDS]),
            ].slice(0, 50);
            const responseCount = Math.round(
                session.participants.length * (randomInt(60, 80) / 100),
            );
            const responseWords = [];

            for (const participant of sample(session.participants, responseCount)) {
                const word = weightedWord(vocabulary);
                responseWords.push(word);
                wordResponseRows.push([
                    randomUUID(),
                    pollId,
                    null,
                    word,
                    null,
                    null,
                    randomDate(session.createdAt, new Date()),
                    participant.id,
                ]);
            }

            for (const [word, count] of makeZipfWords(vocabulary, responseWords)) {
                wordCountRows.push([pollId, word, count]);
            }
            initializationRows.push([pollId, session.createdAt]);
        }

        await insertRows(
            client,
            "responses",
            ["id", "poll_id", "student_id", "answer", "option_id", "is_correct", "submitted_at", "participant_id"],
            wordResponseRows,
        );
        await insertRows(
            client,
            "wordcloud_word_counts",
            ["poll_id", "word", "count"],
            wordCountRows,
        );
        await insertRows(
            client,
            "wordcloud_count_initializations",
            ["poll_id", "initialized_at"],
            initializationRows,
        );
        console.log(
            `[seed] ${wordResponseRows.length} respons wordcloud dan ${wordCountRows.length} kata Zipf dibuat.`,
        );

        const demoEmails = [
            TEACHER.email,
            ...STUDENT_NAMES.map((_, index) =>
                `siswa${String(index + 1).padStart(2, "0")}@qurio.test`,
            ),
        ];
        const counts = await client.query(
            `SELECT
                 (SELECT COUNT(*)::int FROM users WHERE email = ANY($2::text[])) AS demo_users,
         (SELECT COUNT(*)::int FROM sessions WHERE teacher_id = $1) AS sessions,
         (SELECT COUNT(*)::int FROM polls WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1)) AS polls,
         (SELECT COUNT(*)::int FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1))) AS poll_options,
         (SELECT COUNT(*)::int FROM participants WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1)) AS participants,
         (SELECT COUNT(*)::int FROM responses WHERE poll_id IN (SELECT id FROM polls WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1))) AS responses,
         (SELECT COUNT(*)::int FROM questions WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1)) AS questions,
         (SELECT COUNT(*)::int FROM question_votes WHERE question_id IN (SELECT id FROM questions WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1))) AS question_votes,
         (SELECT COUNT(*)::int FROM wordcloud_word_counts WHERE poll_id IN (SELECT id FROM polls WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1))) AS wordcloud_word_counts,
         (SELECT COUNT(*)::int FROM wordcloud_count_initializations WHERE poll_id IN (SELECT id FROM polls WHERE session_id IN (SELECT id FROM sessions WHERE teacher_id = $1))) AS wordcloud_count_initializations`,
            [teacher.id, demoEmails],
        );

        await client.query("COMMIT");
        transactionStarted = false;
        console.log("[seed] Seed selesai dan transaksi berhasil di-commit.");
        console.log("[seed] Jumlah data per tabel:", counts.rows[0]);
        console.log(`[seed] Login demo guru: ${TEACHER.email} / ${TEACHER.password}`);
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK").catch(() => { });
        }
        console.error("[seed] Gagal; seluruh perubahan transaksi dibatalkan:", error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

runSeed();
