"use client"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"



function DashboardPage() {
    const { logout, user } = useAuth()
    return (
        <section>
            <button onClick={logout} className="px-4 py-2 bg-black text-white rounded-lg font-bold">
                <Link href="/">
                    Logout
                </Link>
            </button>
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-2xl font-bold">Selamat Datang di Qurio App</h1>
                {
                    user?.role.toLowerCase() !== "siswa" && (<div className="flex gap-4">
                        <Link
                            href="/dashboard/createsessions"
                            className="px-4 py-2 bg-black text-white rounded-lg font-bold"
                        >
                            BUAT SESI
                        </Link>
                    </div>)
                }
            </div>
        </section>
    )
}

export default DashboardPage