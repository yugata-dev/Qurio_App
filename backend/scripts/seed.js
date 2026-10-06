/**
 * Seeder demo Qurio (satu-satunya seeder).
 *
 *   npm run seed                 -> isi ulang data demo milik guru demo saja
 *   npm run seed:reset           -> KOSONGKAN SEMUA tabel aplikasi, lalu isi data demo
 *   node scripts/seed.js --dry-run   -> buat data di memori saja (tanpa database), cetak ringkasan
 *
 * Aturan data:
 *   - Sesi mode "quiz"        : hanya soal quiz berjawaban dinilai (is_correct terisi).
 *   - Sesi mode "interactive" : hanya polling, word cloud, dan tanya jawab (tanpa nilai).
 *   - Data deterministik: SEED yang sama menghasilkan isi yang sama (kecuali tanggal & UUID).
 */
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const RESET = args.has("--reset");
const CONFIRMED = args.has("--yes");

const SEED = Number(process.env.SEED ?? 20261005);
const CLASS_SIZE = 30;
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const TEACHER = {
    email: "guru@qurio.test",
    name: "Bu Sari",
    password: process.env.SEED_PASSWORD ?? "password123",
    role: "guru",
};

// Urutan = nomor absen (indeks + 1).
const STUDENT_NAMES = [
    "Budi Santoso", "Siti Nurhaliza", "Andi Wijaya", "Dewi Lestari", "Rizky Pratama",
    "Putri Maharani", "Fajar Nugroho", "Nadia Permata", "Dimas Saputra", "Ayu Wulandari",
    "Rafi Hidayat", "Intan Puspita", "Bagas Ramadhan", "Nabila Zahra", "Arif Kurniawan",
    "Citra Anggraini", "Ilham Maulana", "Maya Safitri", "Yoga Firmansyah", "Laras Kusuma",
    "Raka Setiawan", "Anisa Putri", "Farhan Akbar", "Tiara Amelia", "Dani Prakoso",
    "Vina Oktaviani", "Reza Pahlevi", "Melati Salsabila", "Gilang Permana", "Kirana Ayuningtyas",
];

// Profil siswa tertentu supaya dashboard punya contoh nyata untuk tiap kategori.
//  struggling     : hadir hampir selalu, nilai rendah             -> "Perlu Perhatian" (nilai)
//  frequentAbsent : nilai bagus, jarang hadir (25% sesi quiz)     -> "Perlu Perhatian" (kehadiran)
//  lateJoiner     : baru ikut 2 quiz terakhir, nilai rendah       -> 4 sesi quiz: "Perlu Dipantau"
//                                                                    8 sesi quiz: "Perlu Perhatian" (kehadiran 25%)
const PROFILES = {
    4: "struggling", 11: "struggling", 19: "struggling",
    8: "frequentAbsent", 25: "frequentAbsent",
    14: "lateJoiner", 27: "lateJoiner",
};

// Jumlah sesi quiz: 8 (data kaya) atau 4 (menampilkan kategori "Perlu Dipantau").
// Aturan analitik menghitung kehadiran dari SEMUA sesi quiz, jadi "Perlu Dipantau"
// (1-2 sesi, nilai rendah, kehadiran masih >= 50%) hanya bisa terjadi jika sesi quiz <= 4.
const QUIZ_COUNT = Number(process.env.QUIZ_SESSIONS ?? 8);
if (![4, 8].includes(QUIZ_COUNT)) throw new Error("QUIZ_SESSIONS harus 4 atau 8.");

// Urutan waktu sesi (tertua -> terbaru). Angka = hari ke belakang dari sekarang.
// Sesi interactive terakhir masih aktif.
const TIMELINE = QUIZ_COUNT === 8
    ? [
        ["quiz", 41], ["quiz", 37], ["interactive", 34], ["quiz", 31],
        ["quiz", 27], ["interactive", 24], ["quiz", 20], ["quiz", 17],
        ["interactive", 13], ["quiz", 9], ["quiz", 5], ["interactive", 0],
    ]
    : [
        ["quiz", 34], ["interactive", 29], ["quiz", 24], ["interactive", 19],
        ["quiz", 12], ["interactive", 7], ["quiz", 5], ["interactive", 0],
    ];

const QUIZ_TOPICS = [
    {
        title: "Matematika — Persamaan Kuadrat",
        questions: [
            ["Akar-akar dari x² - 5x + 6 = 0 adalah ...", ["2 dan 3", "1 dan 6", "-2 dan -3", "3 dan 6"]],
            ["Diskriminan persamaan x² + 4x + 4 = 0 adalah ...", ["0", "4", "8", "16"]],
            ["Bentuk faktorisasi x² - 9 adalah ...", ["(x - 3)(x + 3)", "(x - 9)(x + 1)", "(x - 3)²", "(x + 9)(x - 1)"]],
            ["Jika diskriminan persamaan kuadrat negatif, maka akarnya ...", ["Tidak real", "Selalu kembar", "Selalu positif", "Berjumlah nol"]],
            ["Titik puncak y = (x - 2)² + 3 adalah ...", ["(2, 3)", "(-2, 3)", "(2, -3)", "(3, 2)"]],
        ],
    },
    {
        title: "Bahasa Indonesia — Teks Eksposisi",
        questions: [
            ["Tujuan utama teks eksposisi adalah ...", ["Menjelaskan pendapat dengan argumen", "Menceritakan pengalaman pribadi", "Menghibur melalui tokoh", "Memberi petunjuk penggunaan"]],
            ["Bagian yang berisi pendapat awal penulis disebut ...", ["Tesis", "Orientasi", "Resolusi", "Koda"]],
            ["Kalimat yang didukung data disebut ...", ["Fakta", "Opini", "Saran", "Hipotesis"]],
            ["Urutan struktur teks eksposisi yang tepat adalah ...", ["Tesis, argumentasi, penegasan ulang", "Orientasi, komplikasi, resolusi", "Tujuan, bahan, langkah", "Pernyataan umum, sebab, akibat"]],
            ["Kata penghubung yang menyatakan sebab adalah ...", ["Karena", "Namun", "Kemudian", "Sebaliknya"]],
        ],
    },
    {
        title: "IPA — Sistem Tata Surya",
        questions: [
            ["Planet yang paling dekat dengan Matahari adalah ...", ["Merkurius", "Venus", "Bumi", "Mars"]],
            ["Planet terbesar di tata surya adalah ...", ["Jupiter", "Saturnus", "Neptunus", "Uranus"]],
            ["Peristiwa siang dan malam terjadi karena ...", ["Rotasi Bumi", "Revolusi Bumi", "Rotasi Bulan", "Revolusi Matahari"]],
            ["Waktu yang dibutuhkan Bumi untuk sekali mengelilingi Matahari sekitar ...", ["365¼ hari", "24 jam", "30 hari", "687 hari"]],
            ["Ekor komet selalu tampak menjauhi Matahari karena ...", ["Angin surya", "Gravitasi Bumi", "Rotasi komet", "Cahaya Bulan"]],
        ],
    },
    {
        title: "Sejarah — Kemerdekaan Indonesia",
        questions: [
            ["Proklamasi Kemerdekaan Indonesia dibacakan pada ...", ["17 Agustus 1945", "18 Agustus 1945", "1 Juni 1945", "10 November 1945"]],
            ["Tokoh yang mendampingi Soekarno menandatangani naskah proklamasi adalah ...", ["Mohammad Hatta", "Sutan Sjahrir", "Ahmad Soebardjo", "Ki Hajar Dewantara"]],
            ["Naskah proklamasi diketik oleh ...", ["Sayuti Melik", "Sukarni", "Wikana", "Mohammad Yamin"]],
            ["Proklamasi dibacakan di Jalan ...", ["Pegangsaan Timur No. 56", "Merdeka Selatan No. 1", "Imam Bonjol No. 1", "Diponegoro No. 10"]],
            ["PPKI mengesahkan UUD 1945 pada tanggal ...", ["18 Agustus 1945", "17 Agustus 1945", "19 September 1945", "10 November 1945"]],
        ],
    },
    {
        title: "Bahasa Inggris — Simple Past Tense",
        questions: [
            ["The past form of 'go' is ...", ["Went", "Goed", "Gone", "Going"]],
            ["Choose the correct sentence.", ["She visited her aunt yesterday.", "She visit her aunt yesterday.", "She visits her aunt yesterday.", "She visiting her aunt yesterday."]],
            ["The negative form of 'They played football' is ...", ["They did not play football.", "They did not played football.", "They do not played football.", "They were not play football."]],
            ["Complete: We ___ at school last Monday.", ["Were", "Are", "Was", "Be"]],
            ["Which is the past form of 'buy'?", ["Bought", "Buyed", "Buying", "Buys"]],
        ],
    },
    {
        title: "Matematika — Trigonometri Dasar",
        questions: [
            ["Nilai sin(30°) adalah ...", ["1/2", "√3/2", "1", "√2/2"]],
            ["Nilai cos(60°) adalah ...", ["1/2", "√3/2", "0", "1"]],
            ["Nilai tan(45°) adalah ...", ["1", "0", "√3", "1/2"]],
            ["Segitiga siku-siku memiliki sisi depan 6 dan hipotenusa 10. Nilai sinus sudutnya adalah ...", ["0,6", "0,8", "1,2", "1,67"]],
            ["Jika cos θ = 12/13 dan θ lancip, nilai sin θ adalah ...", ["5/13", "12/5", "13/5", "1/13"]],
        ],
    },
    {
        title: "IPA — Fotosintesis",
        questions: [
            ["Fotosintesis terutama berlangsung di bagian sel bernama ...", ["Kloroplas", "Mitokondria", "Nukleus", "Ribosom"]],
            ["Zat hijau daun yang menangkap energi cahaya adalah ...", ["Klorofil", "Hemoglobin", "Melanin", "Keratin"]],
            ["Gas yang diserap tumbuhan saat fotosintesis adalah ...", ["Karbon dioksida", "Oksigen", "Nitrogen", "Hidrogen"]],
            ["Persamaan ringkas fotosintesis yang setara menghasilkan ...", ["C₆H₁₂O₆ dan 6O₂", "6CO₂ dan 6H₂O", "C₆H₁₂O₆ dan 6CO₂", "6O₂ dan 6H₂O"]],
            ["Reaksi terang fotosintesis berlangsung pada membran ...", ["Tilakoid", "Membran inti", "Membran plasma", "Dinding sel"]],
        ],
    },
    {
        title: "IPS — Peta dan Skala",
        questions: [
            ["Skala 1:100.000 berarti 1 cm pada peta mewakili ...", ["1 km di lapangan", "100 km di lapangan", "100 m di lapangan", "10 km di lapangan"]],
            ["Keterangan simbol pada peta disebut ...", ["Legenda", "Inset", "Orientasi", "Garis astronomis"]],
            ["Alat untuk menunjukkan arah mata angin adalah ...", ["Kompas", "Barometer", "Termometer", "Higrometer"]],
            ["Jarak dua kota pada peta 4 cm dengan skala 1:250.000. Jarak sebenarnya adalah ...", ["10 km", "1 km", "100 km", "25 km"]],
            ["Garis pada peta yang menghubungkan tempat dengan ketinggian sama disebut ...", ["Garis kontur", "Garis bujur", "Garis lintang", "Garis batas"]],
        ],
    },
];

// Opsi pertama pada QUIZ_TOPICS adalah jawaban benar; urutan tampil diacak saat seed.
// Bobot kesulitan per soal: soal ke-4 paling sering salah, soal ke-5 sedang.
const QUESTION_DIFFICULTY_WEIGHTS = [1, 1, 1.5, 5, 2.5];

const INTERACTIVE_TOPICS = [
    {
        title: "Diskusi Kelas — Cara Belajar Favorit",
        focus: "cara belajar",
        poll: ["Metode belajar mana yang paling membantu kamu?", ["Diskusi kelompok", "Video pembelajaran", "Latihan soal", "Praktik langsung"]],
        wordPrompt: "Satu kata untuk menggambarkan pelajaran hari ini",
        words: ["seru", "paham", "cepat", "menarik", "sulit", "diskusi", "contoh", "latihan", "santai", "jelas", "bingung", "praktik", "kelompok", "materi", "tugas"],
    },
    {
        title: "Refleksi — Menjelang Ujian Tengah Semester",
        focus: "persiapan ujian",
        poll: ["Seberapa siap kamu menghadapi ujian tengah semester?", ["Sangat siap", "Cukup siap", "Kurang siap", "Belum siap"]],
        wordPrompt: "Satu kata tentang perasaanmu menjelang ujian",
        words: ["gugup", "siap", "tegang", "semangat", "belajar", "ragu", "tenang", "rumus", "hafalan", "latihan", "waktu", "target", "capek", "yakin", "nilai"],
    },
    {
        title: "Brainstorm — Proyek Akhir Semester",
        focus: "proyek akhir semester",
        poll: ["Tema proyek mana yang paling menarik untuk kelompokmu?", ["Lingkungan sekitar", "Teknologi sehari-hari", "Sejarah daerah", "Kesehatan remaja"]],
        wordPrompt: "Satu ide kata kunci untuk proyek kelompokmu",
        words: ["sampah", "energi", "budaya", "kesehatan", "aplikasi", "kreatif", "lingkungan", "daur", "sejarah", "komunitas", "inovasi", "riset", "video", "poster", "presentasi"],
    },
    {
        title: "Umpan Balik — Pelajaran Minggu Ini",
        focus: "pelajaran minggu ini",
        poll: ["Bagian mana dari pelajaran minggu ini yang paling jelas?", ["Penjelasan guru", "Contoh soal", "Diskusi kelas", "Latihan mandiri"]],
        wordPrompt: "Satu kata tentang pelajaran minggu ini",
        words: ["jelas", "cepat", "pelan", "paham", "contoh", "menarik", "banyak", "seru", "rumit", "mudah", "bagus", "tambah", "ulang", "tugas", "kelas"],
    },
];

const GENERAL_WORDS = ["belajar", "materi", "konsep", "penting", "guru", "kelas", "paham", "contoh"];

const QA_TEMPLATES = [
    "Bagaimana cara memahami {topic} dengan contoh yang sederhana?",
    "Mengapa {topic} penting untuk dipelajari?",
    "Bisakah guru memberi contoh penerapan {topic} dalam kehidupan sehari-hari?",
    "Bagian mana dari {topic} yang paling sering keliru dipahami?",
    "Adakah cara cepat untuk mengingat hal penting tentang {topic}?",
    "Apa hubungan {topic} dengan materi yang sudah dipelajari sebelumnya?",
    "Boleh dijelaskan kembali istilah penting dalam {topic}?",
    "Latihan seperti apa yang cocok untuk memperdalam {topic}?",
    "Apa kesalahan umum yang sering terjadi pada {topic}?",
    "Kapan {topic} digunakan di luar kelas?",
];

const QA_ANSWERS = [
    "Mulai dari konsep dasarnya, lalu periksa kembali setiap langkah.",
    "Perhatikan informasi yang diketahui dan hubungkan dengan konsep yang sesuai.",
    "Coba buat contoh sederhana agar hubungan antar konsep terlihat jelas.",
];

// ---------------------------------------------------------------- utilitas acak

function createRng(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const rng = createRng(SEED);
const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const chance = (p) => rng() < p;
const pick = (items) => items[int(0, items.length - 1)];

function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = int(0, i);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

const sample = (items, count) => shuffle(items).slice(0, Math.max(0, count));

function weightedPick(items, weights) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let ticket = rng() * total;
    for (let i = 0; i < items.length; i += 1) {
        ticket -= weights[i];
        if (ticket <= 0) return items[i];
    }
    return items[items.length - 1];
}

function weightedSampleWithoutReplacement(items, weights, count) {
    const pool = items.map((item, index) => ({ item, weight: weights[index] }));
    const chosen = [];
    while (chosen.length < count && pool.length > 0) {
        const picked = weightedPick(pool, pool.map((entry) => entry.weight));
        chosen.push(picked.item);
        pool.splice(pool.indexOf(picked), 1);
    }
    return chosen;
}

function ensureMinimum(flags, minimum) {
    const missing = flags.map((on, index) => (on ? -1 : index)).filter((index) => index >= 0);
    let present = flags.filter(Boolean).length;
    for (const index of shuffle(missing)) {
        if (present >= minimum) break;
        flags[index] = true;
        present += 1;
    }
    return flags;
}

// ------------------------------------------------------------ pembuat dataset

/** Kehadiran satu siswa pada seluruh sesi quiz (urut waktu). */
function quizAttendance(profile, quizCount) {
    if (profile === "frequentAbsent") {
        const attended = Math.max(1, Math.floor(quizCount / 4));
        const indexes = new Set(Array.from({ length: attended }, (_, j) => 1 + Math.floor((j * quizCount) / attended)));
        return Array.from({ length: quizCount }, (_, i) => indexes.has(i));
    }
    if (profile === "lateJoiner") {
        return Array.from({ length: quizCount }, (_, i) => i >= quizCount - 2);
    }
    if (profile === "struggling") {
        return ensureMinimum(Array.from({ length: quizCount }, () => chance(0.95)), Math.ceil(quizCount * 0.75));
    }
    return ensureMinimum(Array.from({ length: quizCount }, () => chance(0.88)), Math.ceil(quizCount * 0.6));
}

/** Jumlah jawaban benar (dari 5 soal) untuk satu siswa pada satu sesi quiz. */
function correctCountFor(profile) {
    if (profile === "struggling") return weightedPick([1, 2, 3], [0.25, 0.5, 0.25]);
    if (profile === "frequentAbsent") return weightedPick([4, 5], [0.5, 0.5]);
    if (profile === "lateJoiner") return weightedPick([1, 2], [0.5, 0.5]);
    return weightedPick([3, 4, 5], [0.2, 0.5, 0.3]);
}

function buildDataset({ teacherId, students, usedAccessCodes, now }) {
    const data = {
        sessions: [], participants: [], polls: [], options: [], responses: [],
        questions: [], votes: [], wordCounts: [], initializations: [],
    };

    const quizTotal = TIMELINE.filter(([kind]) => kind === "quiz").length;
    const quizTopics = QUIZ_COUNT === 8 ? QUIZ_TOPICS : [0, 2, 3, 5].map((i) => QUIZ_TOPICS[i]);
    const attendanceByStudent = new Map(
        students.map((student, index) => [student.id, quizAttendance(PROFILES[index], quizTotal)]),
    );
    const profileByStudent = new Map(students.map((student, index) => [student.id, PROFILES[index] ?? "normal"]));

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const newAccessCode = () => {
        let code;
        do { code = String(int(100000, 999999)); } while (usedAccessCodes.has(code));
        usedAccessCodes.add(code);
        return code;
    };

    let quizIndex = 0;
    let interactiveIndex = 0;

    TIMELINE.forEach(([mode, daysAgo], timelineIndex) => {
        const isActive = mode === "interactive" && daysAgo === 0;
        const createdAt = isActive
            ? new Date(now - 2 * 60 * MINUTE)
            : new Date(startOfToday.getTime() - daysAgo * DAY + (9 + (timelineIndex % 3) * 2) * 60 * MINUTE);
        const durationMinutes = int(45, 75);
        const endedAt = isActive ? null : new Date(createdAt.getTime() + durationMinutes * MINUTE);
        const capTime = (date) => new Date(Math.min(date.getTime(), now));
        const at = (minutesAfterStart) => capTime(new Date(createdAt.getTime() + minutesAfterStart * MINUTE));

        const topic = mode === "quiz" ? quizTopics[quizIndex] : INTERACTIVE_TOPICS[interactiveIndex];
        const present = students.filter((student, index) => {
            if (mode === "quiz") return attendanceByStudent.get(student.id)[quizIndex];
            return chance(PROFILES[index] === "frequentAbsent" ? 0.3 : 0.8);
        });

        const session = {
            id: randomUUID(), teacherId, title: topic.title, accessCode: newAccessCode(),
            mode, status: isActive ? "active" : "ended", classSize: CLASS_SIZE, createdAt, endedAt,
        };
        data.sessions.push(session);

        const participants = present.map((student) => ({
            id: randomUUID(),
            sessionId: session.id,
            name: student.name,
            absen: student.absen,
            joinedAt: at(int(1, 12)),
            profile: profileByStudent.get(student.id),
        }));
        data.participants.push(...participants);

        const pollStatus = isActive ? "published" : "closed";
        const closedAt = endedAt;
        const addPoll = (type, question, publishedAt) => {
            const poll = { id: randomUUID(), sessionId: session.id, type, question, status: pollStatus, createdAt: publishedAt, publishedAt, closedAt };
            data.polls.push(poll);
            return poll;
        };

        if (mode === "quiz") {
            const questions = topic.questions.map(([text, options], questionIndex) => {
                const poll = addPoll("quiz", text, at(2 + questionIndex * 6));
                const shuffled = shuffle(options.map((optionText, optionIndex) => ({ text: optionText, correct: optionIndex === 0 })));
                const optionRows = shuffled.map((option, order) => ({ id: randomUUID(), pollId: poll.id, text: option.text, correct: option.correct, order: order + 1 }));
                data.options.push(...optionRows);
                return { poll, options: optionRows, index: questionIndex };
            });

            for (const participant of participants) {
                const correctCount = correctCountFor(participant.profile);
                const wrongIndexes = new Set(weightedSampleWithoutReplacement(
                    questions.map((q) => q.index), QUESTION_DIFFICULTY_WEIGHTS, questions.length - correctCount,
                ));
                for (const question of questions) {
                    const isCorrect = !wrongIndexes.has(question.index);
                    const selected = pick(question.options.filter((option) => option.correct === isCorrect));
                    data.responses.push({
                        id: randomUUID(), pollId: question.poll.id, participantId: participant.id,
                        participantName: participant.name, answer: selected.text, optionId: selected.id,
                        isCorrect, submittedAt: capTime(new Date(question.poll.publishedAt.getTime() + int(1, 4) * MINUTE)),
                    });
                }
            }
        } else {
            // Polling (tanpa nilai)
            const [pollQuestion, pollOptions] = topic.poll;
            const poll = addPoll("polling", pollQuestion, at(3));
            const optionRows = pollOptions.map((text, order) => ({ id: randomUUID(), pollId: poll.id, text, correct: false, order: order + 1 }));
            data.options.push(...optionRows);
            const optionWeights = shuffle([4, 3, 2, 1]);
            for (const participant of participants.filter(() => chance(0.92))) {
                const selected = weightedPick(optionRows, optionWeights);
                data.responses.push({
                    id: randomUUID(), pollId: poll.id, participantId: participant.id, participantName: participant.name,
                    answer: selected.text, optionId: selected.id, isCorrect: null, submittedAt: at(int(4, 12)),
                });
            }

            // Word cloud
            const wordPoll = addPoll("wordcloud", topic.wordPrompt, at(14));
            const vocabulary = [...new Set([...topic.words, ...GENERAL_WORDS])];
            const wordWeights = vocabulary.map((_, rank) => 1 / (rank + 1) ** 1.1);
            const tally = new Map();
            for (const participant of participants.filter(() => chance(0.75))) {
                const word = weightedPick(vocabulary, wordWeights);
                tally.set(word, (tally.get(word) ?? 0) + 1);
                data.responses.push({
                    id: randomUUID(), pollId: wordPoll.id, participantId: participant.id, participantName: participant.name,
                    answer: word, optionId: null, isCorrect: null, submittedAt: at(int(15, 25)),
                });
            }
            for (const [word, count] of tally) data.wordCounts.push({ pollId: wordPoll.id, word, count });
            data.initializations.push({ pollId: wordPoll.id, initializedAt: wordPoll.publishedAt });

            // Tanya jawab
            addPoll("qa", `Tanya jawab: ${topic.focus}`, at(26));
            const askers = sample(participants, int(6, Math.min(12, participants.length)));
            for (const asker of askers) {
                const askedAt = at(int(27, 40));
                const answered = chance(0.35);
                const voters = sample(students, int(0, 10));
                const question = {
                    id: randomUUID(), sessionId: session.id, participantId: asker.id, studentName: asker.name,
                    text: pick(QA_TEMPLATES).replace("{topic}", topic.focus),
                    upvotes: voters.length, answered, answer: answered ? pick(QA_ANSWERS) : null,
                    createdAt: askedAt, answeredAt: answered ? capTime(new Date(askedAt.getTime() + int(2, 10) * MINUTE)) : null,
                };
                data.questions.push(question);
                for (const voter of voters) {
                    data.votes.push({ id: randomUUID(), questionId: question.id, studentId: voter.id, createdAt: askedAt });
                }
            }
        }

        if (mode === "quiz") quizIndex += 1;
        else interactiveIndex += 1;
    });

    return data;
}

// -------------------------------------------------------------------- database

async function insertRows(client, table, columns, rows) {
    const batchSize = 500;
    for (let offset = 0; offset < rows.length; offset += batchSize) {
        const batch = rows.slice(offset, offset + batchSize);
        const tuples = batch.map((row, r) =>
            `(${row.map((_, c) => `$${r * columns.length + c + 1}`).join(", ")})`);
        await client.query(`INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`, batch.flat());
    }
    return rows.length;
}

async function upsertUser(client, { name, email, passwordHash, role }) {
    const result = await client.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password
         WHERE users.role = EXCLUDED.role
         RETURNING id`,
        [name, email, passwordHash, role],
    );
    if (!result.rows[0]) throw new Error(`Akun ${email} sudah ada dengan role berbeda.`);
    return result.rows[0].id;
}

function describe(data) {
    const quiz = data.sessions.filter((s) => s.mode === "quiz");
    const interactive = data.sessions.filter((s) => s.mode === "interactive");
    const quizIds = new Set(quiz.map((s) => s.id));
    const quizPollIds = new Set(data.polls.filter((p) => quizIds.has(p.sessionId)).map((p) => p.id));
    const quizPollTypes = new Set(data.polls.filter((p) => quizIds.has(p.sessionId)).map((p) => p.type));
    const interactivePollTypes = new Set(data.polls.filter((p) => !quizIds.has(p.sessionId)).map((p) => p.type));
    const graded = data.responses.filter((r) => r.isCorrect !== null);
    return {
        sesi_quiz: quiz.length,
        sesi_interactive: interactive.length,
        tipe_poll_di_sesi_quiz: [...quizPollTypes].join(","),
        tipe_poll_di_sesi_interactive: [...interactivePollTypes].join(","),
        jawaban_dinilai: graded.length,
        jawaban_dinilai_di_luar_quiz: graded.filter((r) => !quizPollIds.has(r.pollId)).length,
        peserta: data.participants.length,
        respons_total: data.responses.length,
        pertanyaan_qa: data.questions.length,
        vote_qa: data.votes.length,
        kata_wordcloud: data.wordCounts.length,
    };
}

async function main() {
    if (DRY_RUN) {
        const students = STUDENT_NAMES.map((name, i) => ({ id: randomUUID(), name, absen: String(i + 1).padStart(2, "0") }));
        const data = buildDataset({ teacherId: randomUUID(), students, usedAccessCodes: new Set(), now: Date.now() });
        console.log("[seed:dry-run]", describe(data));
        return data;
    }

    const { default: dotenv } = await import("dotenv");
    dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env"), quiet: true });
    const { default: bcrypt } = await import("bcrypt");
    const { default: pool } = await import("../src/config/database/connection.js");

    const client = await pool.connect();
    let inTransaction = false;
    try {
        const info = await client.query("SELECT current_database() AS db");
        const host = (process.env.DATABASE_URL ?? "").match(/@([^/:?]+)/)?.[1] ?? process.env.DB_HOST ?? "?";
        console.log(`[seed] Target database: ${info.rows[0].db} @ ${host}`);

        if (RESET && !CONFIRMED) {
            console.error("[seed] --reset menghapus SEMUA data aplikasi. Jalankan ulang dengan: npm run seed:reset");
            process.exitCode = 1;
            return;
        }

        const passwordHash = await bcrypt.hash(TEACHER.password, 10);
        await client.query("BEGIN");
        inTransaction = true;

        if (RESET) {
            await client.query(
                `TRUNCATE TABLE question_votes, questions, wordcloud_count_initializations, wordcloud_word_counts,
                 responses, poll_options, polls, participants, sessions, users RESTART IDENTITY CASCADE`,
            );
            console.log("[seed] Semua tabel aplikasi dikosongkan (tabel _migrations tetap).");
        }

        const teacherId = await upsertUser(client, { ...TEACHER, passwordHash });
        const students = [];
        for (const [index, name] of STUDENT_NAMES.entries()) {
            const absen = String(index + 1).padStart(2, "0");
            const id = await upsertUser(client, { name, email: `siswa${absen}@qurio.test`, passwordHash, role: "siswa" });
            students.push({ id, name, absen });
        }

        if (!RESET) {
            const removed = await client.query("DELETE FROM sessions WHERE teacher_id = $1", [teacherId]);
            console.log(`[seed] ${removed.rowCount} sesi lama guru demo dihapus.`);
        }

        const used = await client.query("SELECT access_code FROM sessions");
        const data = buildDataset({
            teacherId, students, usedAccessCodes: new Set(used.rows.map((r) => r.access_code)), now: Date.now(),
        });

        await insertRows(client, "sessions",
            ["id", "teacher_id", "title", "access_code", "mode", "status", "class_size", "created_at", "ended_at"],
            data.sessions.map((s) => [s.id, s.teacherId, s.title, s.accessCode, s.mode, s.status, s.classSize, s.createdAt, s.endedAt]));
        await insertRows(client, "participants", ["id", "session_id", "name", "absen", "joined_at"],
            data.participants.map((p) => [p.id, p.sessionId, p.name, p.absen, p.joinedAt]));
        await insertRows(client, "polls",
            ["id", "session_id", "type", "question", "status", "created_at", "published_at", "closed_at"],
            data.polls.map((p) => [p.id, p.sessionId, p.type, p.question, p.status, p.createdAt, p.publishedAt, p.closedAt]));
        await insertRows(client, "poll_options", ["id", "poll_id", "option_text", "is_correct", "option_order"],
            data.options.map((o) => [o.id, o.pollId, o.text, o.correct, o.order]));
        await insertRows(client, "responses",
            ["id", "poll_id", "participant_id", "participant_name", "answer", "option_id", "is_correct", "submitted_at"],
            data.responses.map((r) => [r.id, r.pollId, r.participantId, r.participantName, r.answer, r.optionId, r.isCorrect, r.submittedAt]));
        await insertRows(client, "questions",
            ["id", "session_id", "participant_id", "student_name", "text", "upvotes", "answered", "answer", "created_at", "answered_at"],
            data.questions.map((q) => [q.id, q.sessionId, q.participantId, q.studentName, q.text, q.upvotes, q.answered, q.answer, q.createdAt, q.answeredAt]));
        await insertRows(client, "question_votes", ["id", "question_id", "student_id", "created_at"],
            data.votes.map((v) => [v.id, v.questionId, v.studentId, v.createdAt]));
        await insertRows(client, "wordcloud_word_counts", ["poll_id", "word", "count"],
            data.wordCounts.map((w) => [w.pollId, w.word, w.count]));
        await insertRows(client, "wordcloud_count_initializations", ["poll_id", "initialized_at"],
            data.initializations.map((i) => [i.pollId, i.initializedAt]));

        await client.query("COMMIT");
        inTransaction = false;
        console.log("[seed] Selesai.", describe(data));
        console.log(`[seed] Login demo guru: ${TEACHER.email} / ${TEACHER.password}`);
        console.log("[seed] Cek angka: npm run verify:metrics");
    } catch (error) {
        if (inTransaction) await client.query("ROLLBACK").catch(() => { });
        console.error("[seed] Gagal; semua perubahan dibatalkan:", error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();