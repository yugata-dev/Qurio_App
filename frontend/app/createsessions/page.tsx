"use client"
import { useState } from "react"
import { createPolls } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

interface pollOption {
    option_text: string
    is_correct: boolean
    option_order: number
}

interface formPolls {
    type: string
    question: string
    option: pollOption[]
    sessionId: string
}

interface AnswerOption {
    id: string
    text: string
}

interface Question {
    id: string;
    questionText?: string;
    option?: AnswerOption[];
}

function CreateSessionsPage() {
    const { user } = useAuth()
    const [inputAppears, setInputAppears] = useState<boolean>(true)

    const onSubmitPolls = async (dataPolls: formPolls) => {
        if (!user) return alert("Anda harus login terlebih dahulu...")
        try {
            const response = await createPolls(
                dataPolls.type,
                dataPolls.question,
                dataPolls.option,
                dataPolls.sessionId
            )
            if (response.success) {
                alert("Soal yang Guru, berhasil terkirim secara live!")
            }

            console.log("hasil data:", response)
        } catch (error: any) {
            console.error("login error:", error)
        }
    }

    const handleAppears = (e: React.MouseEvent, status: boolean) => {
        e.stopPropagation
        setInputAppears(status)
    }

    const questions: Question = {
        id: "q-1",
        questionText: "test",
        option: [
            { id: "A", text: "test1" },
            { id: "B", text: "test2" },
            { id: "C", text: "test3" },
            { id: "D", text: "test4" }
        ]
    }

    console.log(inputAppears)

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-2xl font-bold">Buat Sesi</h1>
            <div className="flex text-2xl rounded-2xl p-2 flex-col w-4xl h-auto bg-amber-50">
                <form className="text-gray-400 flex flex-col">
                    <div>
                        <label className="font-bold" >TIPE :</label>
                        <select className="m-1 border-2 border-black rounded-[5px] p-1" name="" id="">
                            <option value="">Pilih Tipe Soal</option>
                            <option value="quiz">Quiz</option>
                            <option value="wordcloud">Wordcloud</option>
                            <option value="qa">Tanya Jawab</option>
                        </select>
                    </div>
                    <label className="font-bold text-[1.2rem] mt-2">Pertanyaan Anda:</label>
                    <textarea className="w-full text-black bg-white rounded border border-gray-txt  h-32 text-base outline-none text-gray-txt py-1 px-3 resize-none"></textarea>
                    <label className="font-bold text-[1.2rem] mt-2">Opsi Jawaban:</label>
                    <div className="grid grid-cols-2 gap-4 w-full border-2 border-amber-600 mx-auto p-4 ">
                        {
                            questions.option?.map((options) => (
                                <div key={options.id} className="p-2 gap-2 justify-between flex border-2 border-amber-600">
                                    <label htmlFor=""> <span className="bg-amber-300 p-1 rounded-lg font-extrabold">{options.id}</span> <span className="font-bold">{options.text}</span> </label>
                                    <input type="radio" />
                                </div>
                            ))
                        }
                    </div>
                    <div>
                        <button type="button" className="flex justify-start m-4 text-blue-500 font-extrabold" onClick={(e) => handleAppears(e, false)} >
                            + Tambah Opsi
                        </button>
                        {
                            inputAppears ? null :
                                <div>
                                    <label htmlFor="" className="p-2">SOAL:</label>
                                    <input type="text" className="rounded border border-gray-txt bg-white p-2 text-black" />
                                </div>
                        }
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateSessionsPage