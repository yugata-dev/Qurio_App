"use client";

/* 
format sukses
{
  "success": true,
  "data": {
    "user": {
      "id": "d9d37142-2d94-447b-91cc-6dc0a792ce5a",
      "name": "User Testing",
      "role": "guru",
      "email": "user.test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ5ZDM3MTQyLTJkOTQtNDQ3Yi05MWNjLTZkYzBhNzkyY2U1YSIsInJvbGUiOiJndXJ1IiwibmFtZSI6IlVzZXIgVGVzdGluZyIsImVtYWlsIjoidXNlci50ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzg4ODU2MzUwLCJleHAiOjE3ODk0NjExNTB9.LzuFPF74R3qDFrHx0DM7NFfGvdMscm-8SgQpPiiTc3o"
  }
}
*/

/* 
format gagal
{
  "success": false,
  "message": "Email atau password salah"
}

*/

interface loginUserSuccess {
  success: boolean;
  data: {
    user: { id: string; name: string; role: string; email: string };
    token: string;
  };
}

interface loginUserFailed {
  success: boolean;
  message: string;
}

type loginUser = loginUserSuccess | loginUserFailed;

interface registerUser {
  success: boolean;
  data: {
    user: { id: string; name: string; role: string; email: string };
    token: string;
  };
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const fetchUserLogin = async (
  email: string,
  password: string,
  role: "guru" | "siswa",
): Promise<loginUser> => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login Error");
    }

    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// DIPERBAIKI: Urutan parameter disamakan -> (name, email, password, role)
const fetchUserRegister = async (
  name: string,
  email: string,
  password: string,
  role: string,
): Promise<registerUser> => {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || errorData.error || "Register failed";
      console.error("Backend error detail:", errorData);
      throw new Error(errorMessage);
    }

    // DIPERBAIKI: Cukup gunakan response.json() saja (jangan panggil response.text() sebelumnya)
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

export { fetchUserLogin, fetchUserRegister };
