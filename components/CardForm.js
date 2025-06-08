"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";

export default function CardForm({ onCardAdded }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      toast.error("You must be logged in to add a credit card.");
      return;
    }

    const { error } = await supabase.from("credit_cards").insert([
      {
        name,
        balance: parseFloat(balance),
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("Insert error:", error.message);
      toast.error("Failed to add card.");
    } else {
      toast.success("Card added.");
      setName("");
      setBalance("");
      onCardAdded(); // trigger data refresh
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="text"
        placeholder="Card Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border px-2 py-1 rounded w-full"
      />
      <input
        type="number"
        placeholder="Balance"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        required
        className="border px-2 py-1 rounded w-full"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
        Add Card
      </button>
    </form>
  );
}
