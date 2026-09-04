"use client"
import { useState } from "react"

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
    const handleSelectOption = (optionId: string) => {
        console.log("user memilih:", optionId)
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
                        <label className="font-bold" >JAM :</label>
                        <select className="m-1 border-2 border-black rounded-[5px] p-1" name="" id="">
                            <option value="">Pilih Tipe Soal</option>
                            <option value="quiz">Quiz</option>
                            <option value="wordcloud">Wordcloud</option>
                            <option value="qa">Tanya Jawab</option>
                        </select>
                        <label className="font-bold" >POIN :</label>
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
                                <div className="p-2 gap-2 justify-between flex border-2 border-amber-600">
                                    <label htmlFor=""  >{options.id} <span>{options.text}</span> </label>
                                    <input type="radio" />
                                </div>
                            ))
                        }
                    </div>
                    <div>
                        <button className="flex justify-start m-4 text-blue-500 font-extrabold">
                            + Tambah Opsi
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateSessionsPage