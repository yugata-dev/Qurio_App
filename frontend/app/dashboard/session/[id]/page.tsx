"use client"
import { useAuth } from "@/context/AuthContext";
import { getDataSession } from "@/lib/api";
import { useEffect, useState } from "react"; // Tambahkan hook ini

interface PageProps {
  params: Promise<{ id: string }>; 
}

interface SessionData {
    id: string;
    title: string;
}

// LAKUKAN INI: Tangkap { params } di dalam tanda kurung fungsi komponen utama
function SessionPage({ params }: PageProps) {
    const { token } = useAuth();
    const [sessionData, setSessionData] = useState<SessionData | null>(null);

    useEffect(() => {
        if (!token) return;

        const getData = async () => {
            try {
                const { id: sessionId } = await params;
                const response = await getDataSession(sessionId, token);
                setSessionData(response.data);
            } catch (error) {
                console.error("Get data detail:", error);
                alert("Sesi tidak ditemukan atau sudah tidak tersedia.");
            }
        };

        void getData();
    }, [params, token]);

    return (
        <div>
            <h1>ID Sesi saat ini: {sessionData?.id}</h1>
            <p>**Hub/control panel** sesi: kode akses, tabel semua soal...</p>
        </div>
    );
}

export default SessionPage;
