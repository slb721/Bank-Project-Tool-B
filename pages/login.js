import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const redirectUrl = "https://bank-project-tool-b.vercel.app/dashboard";

    const { error } = await supabase.auth.signInWithOtp({
      email: 'user@example.com',
      options: {
        emailRedirectTo: 'https://bank-project-tool-b.vercel.app/dashboard',
      },
    });

    if (error) {
      setMessage("Login error: " + error.message);
    } else {
      setMessage("Check your email for the magic link.");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send Magic Link</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
