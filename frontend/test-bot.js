import { io } from "socket.io-client"

const API_URL = "https://qurioapp-production.up.railway.app"
const SESSION_ID = "b0a9e926-51a1-4ced-a27b-64073f0b0485"

async function getActivePoll() {
  // ini endpoint yang dipakai QuizView.tsx kamu
  const res = await fetch(`${API_URL}/api/polls/current?session_id=${SESSION_ID}`)
  // kalau 404 coba endpoint ini:
  // const res = await fetch(`${API_URL}/api/sessions/${SESSION_ID}/current-poll`)

  const data = await res.json()
  console.log("Poll aktif:", data)
  return data.data || data
}

async function fakeStudent(i) {
  try {
    const poll = await getActivePoll()
    if (!poll || !poll.id) {
      console.log("Gak ada poll yang published di session ini. Publish dulu dari dashboard guru!")
      return
    }

    console.log(`Bot ${i} nemu poll aktif: ${poll.id} type: ${poll.type}`)

    // 1. JOIN
    const joinRes = await fetch(`${API_URL}/api/sessions/${SESSION_ID}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Bot ${i}` })
    })
    const joinData = await joinRes.json()
    const participantId = joinData.data?.id || joinData.id
    console.log(`Bot ${i} participant_id: ${participantId}`)

    // 2. KIRIM SESUAI TYPE POLL AKTIF
    let url = "", body = {}
    if (poll.type === "quiz") {
      const optionId = poll.options?.[0]?.id
      url = `${API_URL}/api/responses/${poll.id}/responses`
      body = { participant_id: participantId, option_id: optionId }
    } else if (poll.type === "qa") {
      url = `${API_URL}/api/questions`
      body = { poll_id: poll.id, participant_id: participantId, question_text: `Pertanyaan bot ${i}` }
    } else if (poll.type === "wordcloud") {
      url = `${API_URL}/api/wordcloud/responses`
      body = { poll_id: poll.id, participant_id: participantId, word: ["React", "Vue", "NextJS"][i % 3] }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    console.log(`Bot ${i} kirim -> ${res.status}:`, (await res.text()).slice(0, 200))

  } catch (e) {
    console.error(`Bot ${i} error:`, e.message)
  }
}

async function run() {
  const poll = await getActivePoll()
  if (!poll?.id) return

  for (let i = 1; i <= 5; i++) {
    setTimeout(() => fakeStudent(i), i * 500)
  }
}

run()